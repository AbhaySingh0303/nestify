const express = require('express');
const router = express.Router();
const { createPG, joinPG, getMyPG, getMyPGs, getPGById, leavePG, deletePG } = require('../controllers/pgController');
const { protect } = require('../middleware/authMiddleware');

router.route('/create')
  .post(protect, createPG);

router.route('/join')
  .post(protect, joinPG);

router.route('/me')
  .get(protect, getMyPG);

router.route('/my')
  .get(protect, getMyPGs);

router.route('/leave')
  .post(protect, leavePG);

router.route('/:id')
  .get(protect, getPGById)
  .delete(protect, deletePG);

module.exports = router;
