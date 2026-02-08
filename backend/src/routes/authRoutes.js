const express = require('express');
const router = express.Router();
const { login, updateProfile, getUsers, updateUser, seedUsers, getSettings, updateSettings, registerUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/login', login);
router.post('/seed', seedUsers);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getUsers);
router.post('/users', protect, registerUser);
router.put('/users/:id', protect, updateUser);
router.get('/settings', getSettings);
router.put('/settings', protect, upload.single('logo'), updateSettings);

module.exports = router;
