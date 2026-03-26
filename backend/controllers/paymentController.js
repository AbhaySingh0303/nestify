const Payment = require('../models/Payment');


exports.getPayments = async (req, res) => {
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
    const payments = await Payment.find({ pg: pgId })
      .populate('user', 'name email')
      .populate({
        path: 'tenant',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    console.log(`Fetched ${payments.length} payments successfully.`);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    console.log(`Fetched ${payments.length} payments for user ${req.user._id}`);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    
    // Auto-resolve user if tenant is provided
    let userId = req.body.user;
    if (req.body.tenant && !userId) {
      const tenant = await Tenant.findById(req.body.tenant);
      if (tenant) userId = tenant.user;
    }
    
    const payment = await Payment.create({ 
      ...req.body, 
      user: userId,
      pg: req.user.pg 
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (payment) {
      payment.status = req.body.status || payment.status;
      if (payment.status === 'paid') {
        payment.paymentDate = Date.now();
      }
      const updatedPayment = await payment.save();
      res.json(updatedPayment);
    } else {
      res.status(404).json({ message: 'Payment not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.simulatePayment = async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const Payment = require('../models/Payment');
    
    // Find the tenant and their assigned room to get rent
    const tenant = await Tenant.findOne({ user: req.user._id }).populate('room');

    if (!tenant || !tenant.room) {
      return res.status(400).json({ message: 'No room assigned to calculate rent' });
    }

    const rent = tenant.room.rent;
    if (!rent || rent <= 0) {
      return res.status(400).json({ message: 'Invalid or missing rent amount' });
    }

    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    // Create a paid payment record simulating instant success
    const payment = await Payment.create({
      user: req.user._id,
      tenant: tenant._id,
      pg: req.user.pg,
      amount: rent,
      month,
      status: 'paid',
      paymentDate: Date.now(),
      stripeSessionId: `sim_${Date.now()}` // Mock ID
    });

    console.log("Simulated payment success for:", req.user.email);
    res.json({ success: true, payment });
  } catch (error) {
    console.error("Simulation Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
