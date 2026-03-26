require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const kycRoutes = require('./routes/kycRoutes');
const userRoutes = require('./routes/userRoutes');
const pgRoutes = require('./routes/pgRoutes');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pg', pgRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Nestify API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running');
  console.log(`Listening on port ${PORT}`);
});
