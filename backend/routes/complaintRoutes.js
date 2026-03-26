const express = require('express');
const router = express.Router();
const { getComplaints, getMyComplaints, createComplaint, resolveComplaint } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, adminOnly, getComplaints)
  .post(protect, createComplaint); // Tenant creates

router.get('/my', protect, getMyComplaints); // Tenant views own

router.route('/:id/resolve')
  .put(protect, adminOnly, resolveComplaint); // Admin resolves

module.exports = router;
