const notificationRepository = require("../repositories/notification.repository");
const socketManager = require("../../../sockets/socket.manager");
const logger = require("../../../config/logger");

class NotificationService {
  async createNotification(data) {
    const notification = await notificationRepository.create(data);
    
    // Emit real-time notification via Socket.io
    socketManager.toUser(data.userId, "notification:received", notification);

    // Send email notification asynchronously based on user preferences
    (async () => {
      try {
        const User = require("../../auth/models/user.model");
        const user = await User.findById(data.userId);
        if (!user || !user.email) return;

        const emailService = require("../../../shared/services/email.service");
        const settings = user.notificationSettings || {
          taskAssigned: { email: true, inApp: true },
          commentMention: { email: true, inApp: true },
          wikiUpdated: { email: false, inApp: true }
        };

        let shouldSendEmail = false;
        if (data.type === "assignment" && settings.taskAssigned?.email !== false) {
          shouldSendEmail = true;
        } else if (data.type === "comment" && settings.commentMention?.email !== false) {
          shouldSendEmail = true;
        } else if (data.type === "wiki" && settings.wikiUpdated?.email === true) {
          shouldSendEmail = true;
        }

        if (shouldSendEmail) {
          if (data.type === "assignment") {
            const projectRepository = require("../../project/repositories/project.repository");
            const projectId = data.metadata?.projectId || data.link?.split("/projects/")[1]?.split("/")[0];
            let projName = "Smart Project";
            if (projectId) {
              const project = await projectRepository.findById(projectId);
              if (project) projName = project.name;
            }
            
            const taskTitle = data.content.match(/"([^"]+)"/)?.[1] || data.content;
            
            await emailService.sendTaskAssignmentEmail(
              user.email,
              user.name,
              taskTitle,
              projName,
              data.link
            );
          } else if (data.type === "comment") {
            const author = data.content.split(" commented on ")[0] || "Someone";
            const taskName = data.content.match(/"([^"]+)"/)?.[1] || "your task";
            const commentBody = data.content.split("commented on")[1]?.split(": \"")?.[1]?.replace(/"\s*\.*\s*$/, "") || data.content;

            await emailService.sendCommentNotificationEmail(
              user.email,
              author,
              taskName,
              commentBody,
              data.link
            );
          } else if (data.type === "wiki") {
            const orgRepository = require("../../org/repositories/organization.repository");
            const orgId = data.metadata?.orgId || data.link?.split("/orgs/")[1]?.split("/")[0];
            let orgName = "Smart Org";
            if (orgId) {
              const org = await orgRepository.findById(orgId);
              if (org) orgName = org.name;
            }

            const wikiTitle = data.content.match(/"([^"]+)"/)?.[1] || data.content;
            const author = data.content.split(" updated ")[0] || "Someone";

            await emailService.sendWikiUpdateEmail(
              user.email,
              wikiTitle,
              author,
              orgName,
              data.link
            );
          }
        }
      } catch (err) {
        logger.error(`Error sending notification email: ${err.message}`);
      }
    })();

    return notification;
  }

  async getNotifications(userId, page, limit) {
    return notificationRepository.findByUserId(userId, page, limit);
  }

  async getUnreadCount(userId) {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  }

  async markAllRead(userId) {
    await notificationRepository.markAllRead(userId);
    return { success: true };
  }

  async markRead(id, userId) {
    const notification = await notificationRepository.markRead(id, userId);
    return notification;
  }
}

module.exports = new NotificationService();
