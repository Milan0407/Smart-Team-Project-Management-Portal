const Task = require("../../modules/task/models/task.model");
const notificationService = require("../../modules/notification/services/notification.service");
const emailService = require("./email.service");
const logger = require("../../config/logger");

class ReminderService {
  constructor() {
    this.intervalId = null;
  }

  start() {
    logger.info("Initializing automated task deadline reminder background service...");
    
    // Run initial scan on boot (delayed slightly to allow DB to fully connect)
    setTimeout(() => {
      this.scanDueTasks().catch((err) => {
        logger.error(`Error in startup deadline reminder scan: ${err.message}`);
      });
    }, 10000);

    // Run scan every 1 hour
    this.intervalId = setInterval(() => {
      this.scanDueTasks().catch((err) => {
        logger.error(`Error in periodic deadline reminder scan: ${err.message}`);
      });
    }, 60 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async scanDueTasks() {
    logger.info("Starting automated task deadline reminders database scan...");
    
    const now = new Date();
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      isActive: true,
      status: { $nin: ["done", "cancelled"] },
      dueDate: { $ne: null, $gte: now, $lte: twentyFourHoursFromNow },
      reminderSent: { $ne: true },
      assigneeId: { $ne: null }
    }).populate("assigneeId").populate("projectId");

    logger.info(`Found ${tasks.length} tasks approaching deadline without reminders sent.`);

    for (const task of tasks) {
      try {
        const assignee = task.assigneeId;
        const project = task.projectId;
        if (!assignee) continue;

        const link = `/orgs/${project.orgId}/projects/${project._id}/boards/${task.boardId}`;

        // 1. Dispatch in-app notification
        await notificationService.createNotification({
          userId: assignee._id,
          actorId: assignee._id, // System action represented by self
          title: "Task Deadline Approaching",
          content: `Your assigned task "${task.title}" is due on ${new Date(task.dueDate).toLocaleString()}`,
          type: "assignment",
          link,
          metadata: { taskId: task._id, projectId: project._id },
        });

        // 2. Dispatch email notification
        if (assignee.email) {
          await emailService.sendDeadlineReminderEmail(
            assignee.email,
            assignee.name,
            task.title,
            task.dueDate,
            link
          );
        }

        // 3. Mark reminder as sent
        task.reminderSent = true;
        await task.save();
        
        logger.info(`Successfully dispatched deadline reminder for task: "${task.title}" to user: ${assignee.email}`);
      } catch (err) {
        logger.error(`Error processing reminder for task ID ${task._id}: ${err.message}`);
      }
    }
    
    logger.info("Automated task deadline reminders database scan complete.");
  }
}

module.exports = new ReminderService();
