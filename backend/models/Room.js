const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  occupied: { type: Number, default: 0 },
  rent: { type: Number, default: 0 },
  amenities: [{ type: String }],
  pgId: { type: mongoose.Schema.Types.ObjectId, ref: 'PG', required: true }
}, { timestamps: true });

roomSchema.index({ roomNumber: 1, pgId: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
