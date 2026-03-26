const Kyc = require('../models/Kyc');

exports.submitKyc = async (req, res) => {
  try {
    const { tenantId, idType, idNumber, documentUrl } = req.body;
    let kyc = await Kyc.findOne({ tenantId, pg: req.user.pg });

    if (kyc) {
      kyc.idType = idType || kyc.idType;
      kyc.idNumber = idNumber || kyc.idNumber;
      kyc.documentUrl = documentUrl || kyc.documentUrl;
      kyc.status = 'Pending';
      await kyc.save();
    } else {
      kyc = await Kyc.create({ tenantId, idType, idNumber, documentUrl, pg: req.user.pg });
    }

    res.status(201).json(kyc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllKyc = async (req, res) => {
  try {
    if (!req.user.pg) return res.json([]);
    const kycs = await Kyc.find({ pg: req.user.pg }).populate({
      path: 'tenantId',
      populate: { path: 'user' }
    });
    res.json(kycs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTenantKyc = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ tenantId: req.params.tenantId, pg: req.user.pg });
    res.json(kyc || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateKycStatus = async (req, res) => {
  try {
    const kyc = await Kyc.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });
    res.json(kyc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
