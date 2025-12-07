const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { initializeSocket } = require('./server/socket/socketConfig');
// const rateLimit = require('express-rate-limit'); // Disabled for development
require('dotenv').config();

const authRoutes = require('./server/routes/auth');
const voterRoutes = require('./server/routes/voter');
const adminRoutes = require('./server/routes/admin');
const votingRoutes = require('./server/routes/voting');
const boothRoutes = require('./server/routes/booth');
const candidateRoutes = require('./server/routes/candidate');
const analyticsRoutes = require('./server/routes/analytics');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(server);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting - temporarily disabled for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000 // limit each IP to 1000 requests per windowMs (increased for testing)
// });
// app.use(limiter);

// CORS configuration - simplified for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.CLIENT_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['x-auth-token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusvote')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Handle preflight requests explicitly
app.options('*', cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/voter', voterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/booth', boothRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CampusVote server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`CampusVote server running on port ${PORT}`);
  console.log('Socket.IO server initialized');
});
