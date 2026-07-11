const Activity = require("../models/activity.model");

/*
|--------------------------------------------------------------------------
| Activity Repository
|--------------------------------------------------------------------------
*/

const create = async (data) => {
  return Activity.create(data);
};

const findByTaskId = async (taskId, limit = 50) => {
  return Activity.find({ taskId })
    .populate("actorId", "name email avatar")
    .sort({ createdAt: -1 })
    .limit(limit);
};

const findByProjectId = async (projectId, limit = 100) => {
  return Activity.find({ projectId })
    .populate("actorId", "name email avatar")
    .populate("taskId", "title")
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  create,
  findByTaskId,
  findByProjectId,
};
