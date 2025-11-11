const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
const BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '1mb';
app.use(bodyParser.json({ limit: BODY_LIMIT }));
app.use(bodyParser.urlencoded({ extended: true, limit: BODY_LIMIT }));

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
  })
  .catch((error) => {
    console.error('❌ MongoDB 연결 실패:', error);
  });

// Import routes
const apiRoutes = require('./routes');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shopping Mall Demo Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;

