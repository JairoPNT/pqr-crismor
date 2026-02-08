const express = require('express');
const router = express.Router();
const { login, updateProfile, getUsers, updateUser, seedUsers, getSettings, updateSettings, registerUser, getActiveManagers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/login', login);
router.post('/seed', seedUsers);
router.get('/active-managers', getActiveManagers); // Ruta pública para el Home
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.get('/users', protect, getUsers);
router.post('/users', protect, upload.single('avatar'), registerUser);
router.put('/users/:id', protect, upload.single('avatar'), updateUser);
router.get('/settings', getSettings);
router.put('/settings', protect, upload.single('logo'), updateSettings);

module.exports = router;
