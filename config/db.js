const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Add additional debug output for connection string (hide sensitive info)
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/inty_interior_design';
    console.log(`Attempting to connect to MongoDB at: ${connectionString.split('@')[0].includes('://') ? 
      connectionString.split('://')[0] + '://' + '***:***@' + connectionString.split('@')[1] : 
      connectionString}`);

    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
    
    // Log collections to verify database structure
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    
    // More informative error handling
    if (error.name === 'MongoNetworkError') {
      console.error('Network error - check if MongoDB is running and accessible');
    } else if (error.name === 'MongoParseError') {
      console.error('Invalid MongoDB connection string format');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;