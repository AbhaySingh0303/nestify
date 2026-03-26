const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  contactNumber: { type: String },
  emergencyContact: { type: String },
  joiningDate: { type: Date, default: Date.now },
  idProof: { type: String },
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' },
  status: { type: String, enum: ['active', 'left'], default: 'active' }
}, { timestamps: true });

tenantSchema.virtual('kyc', {
  ref: 'Kyc',
  localField: '_id',
  foreignField: 'tenantId',
  justOne: true
});

tenantSchema.set('toObject', { virtuals: true });
tenantSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tenant', tenantSchema);
