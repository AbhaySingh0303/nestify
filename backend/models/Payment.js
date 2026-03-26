const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  paymentDate: { type: Date },
  stripeSessionId: { type: String },
  stripePaymentIntentId: { type: String },
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
