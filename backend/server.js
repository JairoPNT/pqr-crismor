const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

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
    'https://pqr-crismor-pqr-frontend.tcnjej.easypanel.host',
    'https://pqr.nariionline.cloud'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if the origin matches any of our allowed patterns
        const isAllowed = allowedOrigins.includes(origin) ||
            origin.includes('nariionline.cloud') ||
            origin.includes('pqr-frontend') ||
            origin.includes('localhost');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS Blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes middleware
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

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
