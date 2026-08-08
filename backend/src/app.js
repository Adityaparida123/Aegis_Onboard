const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const taskRoutes = require('./routes/taskRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const auditRoutes = require('./routes/auditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hrisRoutes = require('./routes/hrisRoutes');
const policyRoutes = require('./routes/policyRoutes');
const chatRoutes = require('./routes/chatRoutes');
const supportRequestRoutes = require('./routes/supportRequestRoutes');
const employeeContextRoutes = require('./routes/employeeContextRoutes');

const app = express();

const allowedOrigins = require('./config/env').allowedOrigins;

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    }
  })
);
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'API request');
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload-offer', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hris', hrisRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/support', supportRequestRoutes);
app.use('/api/employee', employeeContextRoutes);

app.use(errorHandler);

module.exports = app;
