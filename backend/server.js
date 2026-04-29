const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { MongoStore } = require('connect-mongo');
require('dotenv').config();

// Load Jobs
require('./jobs/dailyMCQJob');
require('./jobs/weeklyRankingJob');
require('./jobs/dailyBlogJob');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Reflect the request origin for maximum compatibility
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// REDIS INITIALIZATION (WITH GRACEFUL FALLBACK)
const redis = require('redis');
const RedisStore = require('connect-redis').default;
let redisClient;
let isRedisConnected = false;

(async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      socket: { 
        connectTimeout: 2000,
        reconnectStrategy: false 
      }
    });

    redisClient.on('error', (err) => {
      if (!isRedisConnected) console.log('ℹ️ Redis not found. Scaling features disabled (Falling back to MongoDB).');
      isRedisConnected = false;
    });

    await redisClient.connect();
    isRedisConnected = true;
    console.log('🚀 Redis Connected: Scaling features enabled!');
  } catch (err) {
    isRedisConnected = false;
  }
})();

// SESSION MIDDLEWARE
app.use(session({
  secret: process.env.SESSION_SECRET || 'jkssb-secret-2024',
  resave: false, 
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: false, // Must be false for local HTTP
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax', // Needed for cross-port localhost
  }
}));

// Add a debug middleware to track session issues
app.use((req, res, next) => {
  console.log(`🌐 [REQUEST] ${req.method} ${req.path} | Auth: ${req.session?.isAuth} | UID: ${req.session?.userId}`);
  next();
});

// Export redisClient for caching in controllers
app.set('getRedis', () => isRedisConnected ? redisClient : null);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mcq', require('./routes/mcq'));
app.use('/api/admin/mcq', require('./routes/admin/adminMCQ'));
app.use('/api/admin/blog', require('./routes/admin/adminBlog'));
app.use('/api/admin/prize', require('./routes/admin/adminPrize'));
app.use('/api/admin/subject', require('./routes/admin/adminSubject'));
app.use('/api/admin/stats', require('./routes/admin/adminStats'));
app.use('/api/blogs', require('./routes/blog'));

app.get('/', (req, res) => {
  res.json({ message: 'JKSSB PrepMaster API is running' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🚀 Connected to MongoDB');
    const { initScheduler } = require('./services/SchedulerService');
    initScheduler();

    app.listen(PORT, () => {
      console.log(`📡 Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));
