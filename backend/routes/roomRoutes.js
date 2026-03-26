const express = require('express');
const router = express.Router();
const { getRooms, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getRooms)
  .post(protect, adminOnly, createRoom);

router.route('/:id')
  .put(protect, adminOnly, updateRoom)
  .delete(protect, adminOnly, deleteRoom);

module.exports = router;
