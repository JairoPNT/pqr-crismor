const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Easypanel/Nginx)
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow loading images from our own server
}));

// Rate Limiting: General
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
});
app.use('/api/', generalLimiter);

// Logging Middleware simple
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://criisapp-frontend.tcnjej.easypanel.host',
    'https://criisapp.nariionline.cloud'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            console.log('CORS: Request with no origin (e.g., local script or direct access)');
            return callback(null, true);
        }
        const isAllowed = allowedOrigins.includes(origin) ||
            origin.includes('criisapp') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS: Blocked for origin:', origin);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/pictures', express.static('pictures'));

const trainingRoutes = require('./src/routes/trainingRoutes');
// ...
// Routes middleware
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/training', trainingRoutes);

app.get('/', (req, res) => {
    res.send('CriisApp Backend is running');
});

// Health check to verify DB connection
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$connect();
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
