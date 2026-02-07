const express = require('express');
const router = express.Router();
const { login, seedUsers } = require('../controllers/authController');

router.post('/login', login);
router.post('/seed', seedUsers);

module.exports = router;
