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
    max: 1000, // Aumentado para evitar bloqueos en uso normal/dev
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
app.get('/api/diag-google', async (req, res) => {
    try {
        const { google } = require('googleapis');
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        if (!process.env.GOOGLE_REFRESH_TOKEN) throw new Error('Refresh Token faltante');

        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Intento de conexión real
        const response = await calendar.calendarList.list({ maxResults: 1 });

        res.json({
            status: 'success',
            env_vars: {
                CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
                SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
                REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
                CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID
            },
            connection: 'OK',
            calendar_sample: response.data.items?.[0]?.id || 'No calendars found'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            env_debug: {
                CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 5) + '...' : 'MISSING',
                REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN ? process.env.GOOGLE_REFRESH_TOKEN.substring(0, 5) + '...' : 'MISSING'
            }
        });
    }
});
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
