const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  idType: { type: String, enum: ['Aadhar', 'PAN', 'Passport'], required: true },
  idNumber: { type: String, required: true },
  documentUrl: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' }
}, { timestamps: true });

module.exports = mongoose.model('Kyc', kycSchema);
