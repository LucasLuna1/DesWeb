const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Configuración de middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto-seguro-aqui',
    resave: false,
    saveUninitialized: true
}));

// Configuración de EJS y layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../..', 'frontend/src/views'));
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, '../..', 'frontend/src/public')));

// Middleware para pasar userId a todas las vistas
app.use((req, res, next) => {
    res.locals.userId = req.session.userId;
    next();
});

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-reservas-medicas';
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

// Rutas
app.get('/', (req, res) => {
    res.render('index');
});

// Importar y usar rutas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
========================================
 Servidor iniciado

 URL: http://localhost:${PORT}
========================================
    `);
}); 