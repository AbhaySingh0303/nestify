const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  resolvedAt: { type: Date },
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
