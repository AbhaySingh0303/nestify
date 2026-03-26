const express = require('express');
const router = express.Router();
const { submitKyc, getAllKyc, getTenantKyc, updateKycStatus } = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, submitKyc)
  .get(protect, adminOnly, getAllKyc);

router.route('/:tenantId')
  .get(protect, getTenantKyc);

router.route('/:id')
  .put(protect, adminOnly, updateKycStatus);

module.exports = router;
