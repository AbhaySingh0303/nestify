const express = require('express');
const router = express.Router();
const { getPayments, getMyPayments, createPayment, updatePaymentStatus, simulatePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, adminOnly, getPayments)
  .post(protect, adminOnly, createPayment);

router.get('/my', protect, getMyPayments);

router.route('/:id')
  .put(protect, updatePaymentStatus); // Both admin and tenant can update

router.post('/simulate', protect, simulatePayment);

module.exports = router;
