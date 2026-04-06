import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/routes.js';
import healthRoutes from './modules/health/routes.js';
import userRoutes from './modules/users/routes.js';
import followRoutes from './modules/follows/routes.js';
import bookmarkRoutes from './modules/bookmarks/routes.js';
import postRoutes from './modules/posts/routes.js';
import feedRoutes from './modules/feed/routes.js';
import searchRoutes from './modules/search/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import adminRoutes from './modules/admin/routes.js';
import messagesRoutes from './modules/messages/routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/health', healthRoutes);
app.use('/users/me/bookmarks', bookmarkRoutes);
app.use('/users/:userId/follow', followRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/feed', feedRoutes);
app.use('/search', searchRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);
app.use('/conversations', messagesRoutes);

app.use(errorHandler);
export default app;
