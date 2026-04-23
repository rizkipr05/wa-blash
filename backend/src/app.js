const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const financeRoutes = require('./routes/financeRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const adminRoutes = require('./routes/adminRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Wain Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});