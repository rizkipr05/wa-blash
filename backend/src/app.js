const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const financeRoutes = require('./routes/financeRoutes');
const path = require('path');
const { bootstrapConnectedDevices } = require('./services/whatsappService');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const adminRoutes = require('./routes/adminRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/admin', adminRoutes);

// Backward-compatible aliases for clients still calling endpoints without /api prefix.
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Wain Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  if (process.env.NODE_ENV === 'production' && !process.env.WA_SESSION_DIR) {
    console.warn('WA_SESSION_DIR is not set. Set it to a protected path outside public web directories.');
  }
  bootstrapConnectedDevices().catch((error) => {
    console.error('Failed to bootstrap WhatsApp sessions:', error.message);
  });
});
