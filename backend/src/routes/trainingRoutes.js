const express = require('express');
const router = express.Router();
const { getAvailability, bookTraining, getAllTrainings, deleteTraining } = require('../controllers/trainingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/availability', getAvailability);
router.post('/book', bookTraining);

// Protected Admin routes
router.get('/', protect, getAllTrainings);
router.delete('/:id', protect, deleteTraining);

module.exports = router;
