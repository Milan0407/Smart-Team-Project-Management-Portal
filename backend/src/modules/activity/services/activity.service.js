const activityRepository = require("../repositories/activity.repository");

/*
|--------------------------------------------------------------------------
| Activity Service
|--------------------------------------------------------------------------
*/

class ActivityService {
  /**
   * Log a task activity event.
   * @param {string} taskId
   * @param {string} projectId
   * @param {string} actorId
   * @param {string} action - one of the enum values
   * @param {object} meta - optional context data
   */
  async logActivity(taskId, projectId, actorId, action, meta = {}) {
    return activityRepository.create({
      taskId,
      projectId,
      actorId,
      action,
      meta,
    });
  }

  async getActivitiesByTask(taskId) {
    return activityRepository.findByTaskId(taskId);
  }

  async getActivitiesByProject(projectId) {
    return activityRepository.findByProjectId(projectId);
  }
}

module.exports = new ActivityService();
