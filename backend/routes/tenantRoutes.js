const express = require('express');
const router = express.Router();
const { getTenants, createTenant, updateTenant, deleteTenant, getTenantByUserId, getMyTenantRecord } = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, adminOnly, getTenants)
  .post(protect, adminOnly, createTenant);

router.route('/:id')
  .put(protect, adminOnly, updateTenant)
  .delete(protect, adminOnly, deleteTenant);

router.get('/user/:userId', protect, getTenantByUserId);
router.get('/me', protect, getMyTenantRecord);

module.exports = router;
