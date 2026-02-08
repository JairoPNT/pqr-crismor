const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, updateProfile, getUsers, updateUser, seedUsers, getSettings, updateSettings, registerUser, getActiveManagers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Limitar intentos de login para prevenir fuerza bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Máximo 10 intentos
    message: 'Demasiados intentos de acceso sospechosos. Por favor espera 15 minutos.'
});

router.post('/login', loginLimiter, login);
router.post('/seed', seedUsers);
router.get('/active-managers', getActiveManagers); // Ruta pública para el Home
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.get('/users', protect, getUsers);
router.post('/users', protect, upload.single('avatar'), registerUser);
router.put('/users/:id', protect, upload.single('avatar'), updateUser);
router.get('/settings', getSettings);
router.put('/settings', protect, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), updateSettings);

module.exports = router;
