// routes/importRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csvtojson');
const path = require('path');
const fs = require('fs');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `import_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        // Accept only CSV files
        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    }
});

// Utility function for cleaning data
const cleanData = (data) => {
    const cleanedData = {};
    
    // Process each field
    Object.keys(data).forEach(key => {
        const value = data[key];
        
        // Handle stringified arrays/objects
        if (typeof value === 'string' && 
            ((value.startsWith('[') && value.endsWith(']')) || 
             (value.startsWith('{') && value.endsWith('}')))
        ) {
            try {
                cleanedData[key] = JSON.parse(value);
            } catch (e) {
                // If parsing fails, keep original value
                cleanedData[key] = value;
            }
        } 
        // Convert "true"/"false" strings to booleans
        else if (value === 'true' || value === 'false') {
            cleanedData[key] = value === 'true';
        }
        // Handle MongoDB ObjectIds
        else if (key === '_id' || key.endsWith('Id') || key === 'id') {
            try {
                if (mongoose.Types.ObjectId.isValid(value)) {
                    cleanedData[key] = mongoose.Types.ObjectId(value);
                } else {
                    cleanedData[key] = value;
                }
            } catch (e) {
                cleanedData[key] = value;
            }
        }
        // Keep null values as null
        else if (value === 'null' || value === '') {
            cleanedData[key] = null;
        }
        // Handle numeric values
        else if (!isNaN(value) && value !== '') {
            cleanedData[key] = Number(value);
        }
        // Default: keep value as is
        else {
            cleanedData[key] = value;
        }
    });
    
    return cleanedData;
};

// Import companies data
router.post('/companies', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`Processing companies import: ${req.file.originalname}`);
        
        // Convert CSV to JSON
        const jsonArray = await csv().fromFile(req.file.path);
        
        if (jsonArray.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty' });
        }
        
        console.log(`Found ${jsonArray.length} companies to import`);
        
        // Prepare batch operations
        const operations = [];
        let importedCount = 0;
        
        // Get the Company model schema fields for validation
        const CompanyModel = mongoose.model('Company');
        const companySchema = CompanyModel.schema.obj;
        const validFields = Object.keys(companySchema);
        
        // Process each company entry
        for (const item of jsonArray) {
            // Clean the data and transform values
            const cleanedData = cleanData(item);
            
            // Filter to include only valid fields from schema
            const filteredData = {};
            Object.keys(cleanedData).forEach(key => {
                if (validFields.includes(key) || key === '_id') {
                    filteredData[key] = cleanedData[key];
                }
            });
            
            // If _id exists, update; otherwise insert
            if (filteredData._id) {
                operations.push({
                    updateOne: {
                        filter: { _id: filteredData._id },
                        update: { $set: filteredData },
                        upsert: true
                    }
                });
            } else {
                operations.push({
                    insertOne: {
                        document: filteredData
                    }
                });
            }
        }
        
        // Execute bulk operations if any
        if (operations.length > 0) {
            const result = await CompanyModel.bulkWrite(operations);
            importedCount = 
                (result.insertedCount || 0) +
                (result.modifiedCount || 0) +
                (result.upsertedCount || 0);
            
            console.log(`Company import complete. Result:`, result);
        }
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ 
            message: 'Companies imported successfully',
            importedCount
        });
        
    } catch (error) {
        console.error('Error importing companies:', error);
        
        // Clean up the temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            message: 'Failed to import companies', 
            error: error.message 
        });
    }
});

// Import designers data
router.post('/designers', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`Processing designers import: ${req.file.originalname}`);
        
        // Convert CSV to JSON
        const jsonArray = await csv().fromFile(req.file.path);
        
        if (jsonArray.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty' });
        }
        
        console.log(`Found ${jsonArray.length} designers to import`);
        
        // Prepare batch operations
        const operations = [];
        let importedCount = 0;
        
        // Get the Designer model schema fields for validation
        const DesignerModel = mongoose.model('Designer');
        const designerSchema = DesignerModel.schema.obj;
        const validFields = Object.keys(designerSchema);
        
        // Process each designer entry
        for (const item of jsonArray) {
            // Clean the data and transform values
            const cleanedData = cleanData(item);
            
            // Filter to include only valid fields from schema
            const filteredData = {};
            Object.keys(cleanedData).forEach(key => {
                if (validFields.includes(key) || key === '_id') {
                    filteredData[key] = cleanedData[key];
                }
            });
            
            // If _id exists, update; otherwise insert
            if (filteredData._id) {
                operations.push({
                    updateOne: {
                        filter: { _id: filteredData._id },
                        update: { $set: filteredData },
                        upsert: true
                    }
                });
            } else {
                operations.push({
                    insertOne: {
                        document: filteredData
                    }
                });
            }
        }
        
        // Execute bulk operations if any
        if (operations.length > 0) {
            const result = await DesignerModel.bulkWrite(operations);
            importedCount = 
                (result.insertedCount || 0) +
                (result.modifiedCount || 0) +
                (result.upsertedCount || 0);
            
            console.log(`Designer import complete. Result:`, result);
        }
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ 
            message: 'Designers imported successfully',
            importedCount
        });
        
    } catch (error) {
        console.error('Error importing designers:', error);
        
        // Clean up the temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            message: 'Failed to import designers', 
            error: error.message 
        });
    }
});

// Import craftsmen data
router.post('/craftsmen', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`Processing craftsmen import: ${req.file.originalname}`);
        
        // Convert CSV to JSON
        const jsonArray = await csv().fromFile(req.file.path);
        
        if (jsonArray.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty' });
        }
        
        console.log(`Found ${jsonArray.length} craftsmen to import`);
        
        // Prepare batch operations
        const operations = [];
        let importedCount = 0;
        
        // Get the Craftsman model schema fields for validation
        const CraftsmanModel = mongoose.model('Craftsman');
        const craftsmanSchema = CraftsmanModel.schema.obj;
        const validFields = Object.keys(craftsmanSchema);
        
        // Process each craftsman entry
        for (const item of jsonArray) {
            // Clean the data and transform values
            const cleanedData = cleanData(item);
            
            // Filter to include only valid fields from schema
            const filteredData = {};
            Object.keys(cleanedData).forEach(key => {
                if (validFields.includes(key) || key === '_id') {
                    filteredData[key] = cleanedData[key];
                }
            });
            
            // If _id exists, update; otherwise insert
            if (filteredData._id) {
                operations.push({
                    updateOne: {
                        filter: { _id: filteredData._id },
                        update: { $set: filteredData },
                        upsert: true
                    }
                });
            } else {
                operations.push({
                    insertOne: {
                        document: filteredData
                    }
                });
            }
        }
        
        // Execute bulk operations if any
        if (operations.length > 0) {
            const result = await CraftsmanModel.bulkWrite(operations);
            importedCount = 
                (result.insertedCount || 0) +
                (result.modifiedCount || 0) +
                (result.upsertedCount || 0);
            
            console.log(`Craftsman import complete. Result:`, result);
        }
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ 
            message: 'Craftsmen imported successfully',
            importedCount
        });
        
    } catch (error) {
        console.error('Error importing craftsmen:', error);
        
        // Clean up the temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            message: 'Failed to import craftsmen', 
            error: error.message 
        });
    }
});

// Handle errors for multer uploads
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File is too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        // An unknown error occurred
        console.error('Unknown error during file upload:', err);
        return res.status(500).json({
            message: `Server error during file upload: ${err.message}`
        });
    }
    
    // If no error, continue to next middleware
    next();
});

module.exports = router;