const mongoose = require('mongoose');

const pgSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uniqueCode: { type: String, unique: true },
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PG', pgSchema);
