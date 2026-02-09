const express = require('express');
const router = express.Router();
const { getAvailability, bookTraining } = require('../controllers/trainingController');

router.get('/availability', getAvailability);
router.post('/book', bookTraining);

module.exports = router;
