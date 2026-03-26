const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    let pgId = req.pgId || req.user.pg; // tenant path

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
    const rooms = await Room.find({ pgId });
    console.log(`Fetched ${rooms.length} rooms successfully.`);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const pgId = req.body.pgId || req.pgId || req.user.pg;
    const { roomNumber } = req.body;
    
    // Explicit tenant-scoped validation
    if (roomNumber && pgId) {
      const existing = await Room.findOne({ roomNumber, pgId });
      if (existing) {
        return res.status(400).json({ message: 'Room number already exists in this PG' });
      }
    }

    console.log("Creating room with data:", req.body);
    const room = await Room.create({ ...req.body, pgId });
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, pgId } = req.body;
    
    const roomToUpdate = await Room.findById(id);
    if (!roomToUpdate) return res.status(404).json({ message: 'Room not found' });
    
    const checkPgId = pgId || roomToUpdate.pgId;

    // Explicit patch boundary duplication check
    if (roomNumber) {
      const existing = await Room.findOne({ roomNumber, pgId: checkPgId, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Room number already exists in this PG' });
      }
    }

    const room = await Room.findByIdAndUpdate(id, { ...req.body, pgId: checkPgId }, { new: true });
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
