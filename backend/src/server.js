const http = require("http");
const app = require("./app");

const env = require("./config/env");
const connectDB = require("./config/database");
const logger = require("./config/logger");
const socketManager = require("./sockets/socket.manager");
const reminderService = require("./shared/services/reminder.service");

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    
    // Initialize Socket.io
    socketManager.initialize(server);

    // Initialize task deadline reminders scheduler
    reminderService.start();

    server.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });

    process.on("SIGTERM", () => {
      logger.warn("SIGTERM received. Shutting down.");

      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

startServer();