const Tenant = require('../models/Tenant');
const Room = require('../models/Room');

exports.getTenants = async (req, res) => {
  try {
    let pgId = req.user.pg; // works for tenants

    if (req.user.role === 'owner') {
      const PG = require('../models/PG');
      if (req.query.pgId) {
        // Validate ownership — owner can only access their own PGs
        const pg = await PG.findOne({ _id: req.query.pgId, owner: req.user._id });
        if (!pg) return res.status(403).json({ message: 'Not authorized to access this PG' });
        pgId = pg._id;
      } else {
        // Fall back to first PG owned by this user
        const pg = await PG.findOne({ owner: req.user._id });
        if (!pg) return res.json([]);
        pgId = pg._id;
      }
    }

    if (!pgId) return res.json([]);
    const tenants = await Tenant.find({ pg: pgId }).populate('user', '-password').populate('room').populate('kyc').lean({ virtuals: true });
    console.log(`Fetched ${tenants.length} tenants for pg ${pgId} successfully.`);
    res.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const { userId, roomId, contactNumber, emergencyContact, idProof } = req.body;
    const tenant = await Tenant.create({ user: userId, room: roomId, contactNumber, emergencyContact, idProof, pg: req.user.pg });

    if (roomId) {
      await Room.findByIdAndUpdate(roomId, { $inc: { occupied: 1 } });
    }

    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // Handle room occupancy swap logic
    const oldRoomId = tenant.room ? tenant.room.toString() : null;
    const newRoomId = req.body.roomId ? req.body.roomId.toString() : null;

    if (oldRoomId !== newRoomId) {
      if (oldRoomId) await Room.findByIdAndUpdate(oldRoomId, { $inc: { occupied: -1 } });
      if (newRoomId) await Room.findByIdAndUpdate(newRoomId, { $inc: { occupied: 1 } });
    }

    if (req.body.roomId) tenant.room = req.body.roomId;
    if (req.body.userId) tenant.user = req.body.userId;
    if (req.body.contactNumber) tenant.contactNumber = req.body.contactNumber;
    if (req.body.emergencyContact) tenant.emergencyContact = req.body.emergencyContact;

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    if (tenant.room) {
      const Room = require('../models/Room');
      await Room.findByIdAndUpdate(tenant.room, { $inc: { occupied: -1 } });
    }

    const Complaint = require('../models/Complaint');
    await Complaint.deleteMany({ tenantId: req.params.id });

    // Also clear the pg reference on the User document and remove from PG tenants array
    const User = require('../models/User');
    const PG = require('../models/PG');

    if (tenant.user) {
      await User.findByIdAndUpdate(tenant.user, { $set: { pg: null } });
      await PG.findByIdAndUpdate(tenant.pg, { $pull: { tenants: tenant.user } });
    }

    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tenant removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTenantByUserId = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ user: req.params.userId, pg: req.user.pg }).populate('room').populate('kyc').lean({ virtuals: true });
    console.log(`Fetched tenant for user ${req.params.userId}`);
    res.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant by user ID:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.getMyTenantRecord = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ user: req.user._id, pg: req.user.pg }).populate('room', 'roomNumber rent amenities');
    if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
