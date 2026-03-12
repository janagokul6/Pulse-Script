require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const feedRoutes = require('./routes/feed');
const commentRoutes = require('./routes/comments');
const bookmarkRoutes = require('./routes/bookmarks');
const followRoutes = require('./routes/follows');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/users/me/bookmarks', bookmarkRoutes);
app.use('/users/:userId/follow', followRoutes);
app.use('/search', searchRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
