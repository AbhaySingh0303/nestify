const Complaint = require('../models/Complaint');

exports.getComplaints = async (req, res) => {
  try {
    let pgId = req.user.pg; // tenant path

    if (req.user.role === 'owner') {
      const PG = require('../models/PG');
      if (req.query.pgId) {
        const pg = await PG.findOne({ _id: req.query.pgId, owner: req.user._id });
        if (!pg) return res.status(403).json({ message: 'Not authorized to access this PG' });
        pgId = pg._id;
      } else {
        const pg = await PG.findOne({ owner: req.user._id });
        if (!pg) return res.json([]);
        pgId = pg._id;
      }
    }

    if (!pgId) return res.json([]);
    const complaints = await Complaint.find({ pg: pgId })
      .populate({ path: 'tenantId', populate: [{ path: 'user', select: 'name email' }, { path: 'room', select: 'roomNumber' }] })
      .populate('user', 'name email')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    console.log(`Fetched ${complaints.length} complaints successfully.`);
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findOne({ user: req.user._id, pg: req.user.pg });
    if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });

    const complaints = await Complaint.find({ tenantId: tenant._id, pg: req.user.pg });
    console.log(`Fetched ${complaints.length} complaints for tenant ${tenant._id}`);
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching user complaints:", error);
    res.status(500).json({ message: error.message });
  }
};

  exports.createComplaint = async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findOne({ user: req.user._id, pg: req.user.pg }).populate('room', 'roomNumber');
    if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });

    const complaint = await Complaint.create({
      ...req.body,
      tenantId: tenant._id,
      user: req.user._id,
      room: tenant.room?._id || tenant.room || null,
      pg: req.user.pg
    });
    res.status(201).json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (complaint) {
      complaint.status = 'Resolved';
      complaint.resolvedAt = Date.now();
      const updatedComplaint = await complaint.save();
      res.json(updatedComplaint);
    } else {
      res.status(404).json({ message: 'Complaint not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
