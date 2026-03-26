const PG = require('../models/PG');
const User = require('../models/User');

exports.createPG = async (req, res) => {
  try {
    const { name, location } = req.body;

    // Generate 6-char random alphanumeric string
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const pg = new PG({
      name,
      location: location || '',
      owner: req.user._id,
      uniqueCode
    });
    
    await pg.save();

    // Upgrade role to owner and add this PG to their pgs array
    req.user.role = 'owner';
    req.user.pg = pg._id; // also store as primary for backward compat
    if (!req.user.pgs) req.user.pgs = [];
    if (!req.user.pgs.map(id => id.toString()).includes(pg._id.toString())) {
      req.user.pgs.push(pg._id);
    }
    await req.user.save();

    res.status(201).json({ ...pg.toJSON(), assignedRole: 'owner' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinPG = async (req, res) => {
  try {
    const { uniqueCode } = req.body;
    
    if (req.user.pg) {
      return res.status(400).json({ message: 'You have already joined a PG' });
    }

    const pg = await PG.findOne({ uniqueCode: uniqueCode.toUpperCase() });
    
    if (!pg) {
      return res.status(404).json({ message: 'Invalid PG code' });
    }

    // Assign pg and set role to tenant
    req.user.pg = pg._id;
    req.user.role = 'tenant';
    await req.user.save();

    // Also push this user into the PG's tenants array
    if (!pg.tenants.map(id => id.toString()).includes(req.user._id.toString())) {
      pg.tenants.push(req.user._id);
      await pg.save();
    }

    // Create Tenant record if one doesn't exist already
    const Tenant = require('../models/Tenant');
    const existingTenant = await Tenant.findOne({ user: req.user._id, pg: pg._id });
    if (!existingTenant) {
      await Tenant.create({
        user: req.user._id,
        pg: pg._id
      });
    }

    res.json({ ...pg.toJSON(), assignedRole: 'tenant' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyPG = async (req, res) => {
  try {
    if (!req.user.pg) {
      return res.status(404).json({ message: 'No PG assigned' });
    }
    const pg = await PG.findOne({ _id: req.user.pg, isDeleted: false });
    if (!pg) {
      // PG was soft-deleted — clear user's pg reference
      req.user.pg = null;
      await req.user.save();
      return res.status(404).json({ message: 'PG no longer exists' });
    }
    res.json(pg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyPGs = async (req, res) => {
  try {
    // Exclude soft-deleted PGs
    const pgs = await PG.find({ owner: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
    res.json(pgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPGById = async (req, res) => {
  try {
    const pg = await PG.findOne({ _id: req.params.id, isDeleted: false });
    if (!pg) return res.status(404).json({ message: 'PG not found' });
    if (req.user.role === 'owner' && pg.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this PG' });
    }
    res.json(pg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tenant: Leave PG
exports.leavePG = async (req, res) => {
  try {
    const user = req.user;
    if (!user.pg) return res.status(400).json({ message: 'You are not in any PG' });

    const pg = await PG.findById(user.pg);
    if (!pg) {
      user.pg = null;
      await user.save();
      return res.json({ message: 'Left PG' });
    }

    const Tenant = require('../models/Tenant');
    const Room = require('../models/Room');
    const tenantRecord = await Tenant.findOne({ user: user._id, pg: pg._id });
    
    if (tenantRecord && tenantRecord.room) {
      // Decrement room occupancy
      await Room.findByIdAndUpdate(tenantRecord.room, { $inc: { occupied: -1 } });
    }

    if (tenantRecord) {
      const Complaint = require('../models/Complaint');
      await Complaint.deleteMany({ tenantId: tenantRecord._id });
    }

    // Mark tenant record as left
    await Tenant.updateOne(
      { user: user._id, pg: pg._id },
      { status: 'left', room: null }
    );

    // Remove user from pg.tenants array
    pg.tenants = pg.tenants.filter(t => t.toString() !== user._id.toString());
    await pg.save();

    // Clear pg reference on the User
    user.pg = null;
    await user.save();

    res.json({ message: 'Successfully left the PG' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: Soft-delete PG
exports.deletePG = async (req, res) => {
  try {
    const pg = await PG.findOne({ _id: req.params.id, owner: req.user._id });
    if (!pg) return res.status(404).json({ message: 'PG not found or not authorized' });
    if (pg.isDeleted) return res.status(400).json({ message: 'PG already deleted' });

    // Soft delete
    pg.isDeleted = true;
    await pg.save();

    const Tenant = require('../models/Tenant');
    const Room = require('../models/Room');
    const User = require('../models/User');
    const Complaint = require('../models/Complaint');

    // Delete all complaints in this PG
    await Complaint.deleteMany({ pg: pg._id });

    // Get all active tenants in this PG to reset their rooms
    const activeTenants = await Tenant.find({ pg: pg._id, status: 'active' });
    const roomIds = activeTenants.map(t => t.room).filter(id => id);
    
    // Reset occupancy for all rooms in this PG (since it's deleted)
    if (roomIds.length > 0) {
      await Room.updateMany({ _id: { $in: roomIds } }, { occupied: 0 });
    }

    // Mark all tenants as left
    await Tenant.updateMany({ pg: pg._id }, { status: 'left', room: null });

    // Clear pg reference for all users
    await User.updateMany({ pg: pg._id }, { pg: null });

    res.json({ message: `PG "${pg.name}" has been deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
