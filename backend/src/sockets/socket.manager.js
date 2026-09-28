const { Server } = require("socket.io");
const socketAuthMiddleware = require("./socketAuth.middleware");
const projectRepository = require("../modules/project/repositories/project.repository");
const logger = require("../config/logger");
const { socketCorsOptions } = require("../config/security");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

class SocketManager {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: socketCorsOptions,
    });

    // Attach authentication middleware
    this.io.use(socketAuthMiddleware);

    this.io.on("connection", (socket) => {
      const userId = socket.user.id;
      logger.info(`User connected to socket: ${socket.user.email} (ID: ${userId}), socket: ${socket.id}`);

      // Join user's personal room for direct notifications
      socket.join(`user:${userId}`);

      // Join project room
      socket.on("room:join", async ({ projectId }, callback) => {
        try {
          if (!projectId) {
            if (callback) callback({ success: false, message: "Project ID is required" });
            return;
          }

          const hasAccess = await this.validateProjectAccess(projectId, userId);
          if (!hasAccess) {
            logger.warn(`User ${userId} attempted unauthorized access to project room: ${projectId}`);
            if (callback) callback({ success: false, message: "Unauthorized access to project" });
            return;
          }

          socket.join(`project:${projectId}`);
          logger.info(`Socket ${socket.id} (User: ${userId}) joined room: project:${projectId}`);
          if (callback) callback({ success: true, message: `Joined project:${projectId}` });
        } catch (err) {
          logger.error(`Error joining room: ${err.message}`);
          if (callback) callback({ success: false, message: "Server error joining room" });
        }
      });

      // Leave project room
      socket.on("room:leave", ({ projectId }, callback) => {
        if (projectId) {
          socket.leave(`project:${projectId}`);
          logger.info(`Socket ${socket.id} left room: project:${projectId}`);
          if (callback) callback({ success: true, message: `Left project:${projectId}` });
        } else {
          if (callback) callback({ success: false, message: "Project ID is required" });
        }
      });

      // Relay typing indicator to other users in the project room
      socket.on("chat:typing", ({ projectId, isTyping }) => {
        if (projectId) {
          socket.to(`project:${projectId}`).emit("chat:typing", {
            userId,
            userName: socket.user.name,
            isTyping: Boolean(isTyping),
            projectId,
          });
        }
      });

      // Relay DM typing indicator to the other participant's personal room
      socket.on("dm:typing", ({ conversationId, targetUserId, isTyping }) => {
        if (targetUserId) {
          this.toUser(targetUserId, "dm:typing", {
            userId,
            userName: socket.user.name,
            conversationId,
            isTyping: Boolean(isTyping),
          });
        }
      });

      socket.on("disconnect", () => {
        logger.info(`User disconnected from socket: ${socket.user.email}, socket: ${socket.id}`);
      });
    });
  }

  /**
   * Helper to check project membership
   */
  async validateProjectAccess(projectId, userId) {
    try {
      const project = await projectRepository.findById(projectId);
      if (!project) return false;

      // Project Lead is owner/admin of the project
      const leadIdStr = toIdString(project.leadId);

      if (leadIdStr === userId.toString()) {
        return true;
      }

      // Check project members array
      return project.members.some(
        (m) => toIdString(m.userId) === userId.toString()
      );
    } catch (err) {
      logger.error(`Error validating project access for socket room: ${err.message}`);
      return false;
    }
  }

  /**
   * Send a direct notification to a specific user
   */
  toUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  /**
   * Send an update to all sockets in a project room
   */
  toProject(projectId, event, data, excludeSocketId = null) {
    if (this.io) {
      const room = `project:${projectId}`;
      if (excludeSocketId) {
        this.io.to(room).except(excludeSocketId).emit(event, data);
      } else {
        this.io.to(room).emit(event, data);
      }
    }
  }
}

module.exports = new SocketManager();
