const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Enable debug mode
        mongoose.set('debug', true);
        
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('MongoDB URI:', process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        
        // Test database operations
        const collections = await connection.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// Add event listeners for connection issues
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

module.exports = connectDB; 