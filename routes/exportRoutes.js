// routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Get list of all collections in database
router.get('/collections', async (req, res) => {
  try {
    console.log('Fetching all collections from database');
    
    // Get all collections from the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionsList = collections.map(collection => ({
      id: collection.name,
      name: collection.name.charAt(0).toUpperCase() + collection.name.slice(1)
    }));
    
    res.json(collectionsList);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export a specific collection as CSV
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { startDate, endDate } = req.query;
    console.log(`Exporting collection: ${collection}`);
    
    // Prepare query with date filtering if provided
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
      console.log(`Applied date filter: ${startDate} to ${endDate}`);
    }
    
    // Get documents from the collection with applied filter
    const data = await mongoose.connection.db.collection(collection).find(query).toArray();
    
    if (data.length === 0) {
      return res.status(404).json({ message: 'No data found in this collection' });
    }
    
    // Get fields from the first document
    const fields = Object.keys(data[0]);
    
    // Flatten nested objects and arrays
    const flattenedData = data.map(item => {
      const flatItem = {};
      fields.forEach(field => {
        if (Array.isArray(item[field])) {
          flatItem[field] = JSON.stringify(item[field]);
        } else if (typeof item[field] === 'object' && item[field] !== null) {
          flatItem[field] = JSON.stringify(item[field]);
        } else {
          flatItem[field] = item[field];
        }
      });
      return flatItem;
    });
    
    // Generate CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(flattenedData);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${collection}_${Date.now()}.csv`);
    
    res.send(csv);
  } catch (error) {
    console.error(`Error exporting ${req.params.collection}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export ALL collections as a ZIP file containing multiple CSVs
router.get('/full/database', async (req, res) => {
  try {
    console.log('Starting full database export');
    const { startDate, endDate } = req.query;
    
    // Create a temp directory for our files
    const tempDir = path.join(os.tmpdir(), 'db_export_' + Date.now());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Prepare date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      console.log(`Applied date filter: ${startDate} to ${endDate}`);
    }
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to export`);
    
    // Process each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Processing collection: ${collectionName}`);
      
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        console.log(`Skipping system collection: ${collectionName}`);
        continue;
      }
      
      // Get all documents from the collection with date filter
      const data = await mongoose.connection.db.collection(collectionName).find(dateFilter).toArray();
      
      if (data.length === 0) {
        console.log(`Collection ${collectionName} is empty, creating empty file`);
        fs.writeFileSync(path.join(tempDir, `${collectionName}.csv`), '');
        continue;
      }
      
      // Get fields from the first document
      const fields = Object.keys(data[0]);
      
      // Flatten nested objects and arrays
      const flattenedData = data.map(item => {
        const flatItem = {};
        fields.forEach(field => {
          if (Array.isArray(item[field])) {
            flatItem[field] = JSON.stringify(item[field]);
          } else if (typeof item[field] === 'object' && item[field] !== null) {
            flatItem[field] = JSON.stringify(item[field]);
          } else {
            flatItem[field] = item[field];
          }
        });
        return flatItem;
      });
      
      // Generate CSV
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(flattenedData);
      
      // Write CSV to temp file
      fs.writeFileSync(path.join(tempDir, `${collectionName}.csv`), csv);
      console.log(`Successfully exported ${collectionName} (${data.length} records)`);
    }
    
    // Create a zip file containing all CSVs
    const zipFilePath = path.join(tempDir, 'full_database_export.zip');
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression level
    });
    
    // Archive is finalized and pipes are closed
    output.on('close', function() {
      console.log(`ZIP archive created: ${archive.pointer()} total bytes`);
      
      // Set filename with optional date range
      let filename = 'full_database_export';
      if (startDate && endDate) {
        filename += `_${startDate}_to_${endDate}`;
      }
      filename += '.zip';
      
      // Send the zip file
      res.download(zipFilePath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
        
        // Cleanup temp files
        try {
          fs.readdirSync(tempDir).forEach(file => {
            fs.unlinkSync(path.join(tempDir, file));
          });
          fs.rmdirSync(tempDir);
          console.log('Temporary files cleaned up');
        } catch (cleanupErr) {
          console.error('Error cleaning up temp files:', cleanupErr);
        }
      });
    });
    
    // Error handling
    archive.on('error', function(err) {
      console.error('Archive error:', err);
      res.status(500).json({ message: 'Error creating archive', error: err.message });
    });
    
    // Pipe archive data to the output file
    archive.pipe(output);
    
    // Add all files from tempDir to the archive
    const files = fs.readdirSync(tempDir).filter(file => file.endsWith('.csv'));
    for (const file of files) {
      archive.file(path.join(tempDir, file), { name: file });
    }
    
    // Finalize the archive
    archive.finalize();
    
  } catch (error) {
    console.error('Error exporting full database:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export the entire database as a JSON file (alternative format)
router.get('/full/json', async (req, res) => {
  try {
    console.log('Starting full database JSON export');
    const { startDate, endDate } = req.query;
    
    // Prepare date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      console.log(`Applied date filter: ${startDate} to ${endDate}`);
    }
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to export as JSON`);
    
    // Prepare the database object
    const database = {};
    
    // Process each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        console.log(`Skipping system collection: ${collectionName}`);
        continue;
      }
      
      console.log(`Processing collection: ${collectionName}`);
      
      // Get all documents from the collection with date filter
      const data = await mongoose.connection.db.collection(collectionName).find(dateFilter).toArray();
      
      // Add to database object
      database[collectionName] = data;
      
      console.log(`Successfully added ${collectionName} to JSON export (${data.length} records)`);
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    
    // Include date range in filename if applicable
    let filename = 'full_database';
    if (startDate && endDate) {
      filename += `_${startDate}_to_${endDate}`;
    }
    filename += `_${Date.now()}.json`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send the JSON data
    res.json(database);
    
  } catch (error) {
    console.error('Error exporting full database as JSON:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;