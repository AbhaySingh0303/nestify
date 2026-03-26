const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as owner' });
  }
};

module.exports = { adminOnly };
