const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    if (!req.user.pg) return res.json([]);
    const users = await User.find({ pg: req.user.pg, role: 'tenant' }).select('name email _id');
    console.log(`Fetched ${users.length} users successfully.`);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: error.message });
  }
};
