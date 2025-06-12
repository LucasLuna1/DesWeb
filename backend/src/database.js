const mongoose = require('mongoose');
require('dotenv').config();

// Conexión a MongoDB Atlas
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority'
        });
        console.log('Conectado a MongoDB Atlas');
    } catch (err) {
        console.error('Error de conexión a MongoDB:', err);
        process.exit(1);
    }
};

module.exports = connectDB; 