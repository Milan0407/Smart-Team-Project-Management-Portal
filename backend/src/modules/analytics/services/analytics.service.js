const mongoose = require("mongoose");
const Task = require("../../task/models/task.model");
const Project = require("../../project/models/project.model");
const Organization = require("../../org/models/organization.model");
const Department = require("../../department/models/department.model");
const Team = require("../../team/models/team.model");
const NotFoundError = require("../../../shared/errors/NotFoundError");

/*
|--------------------------------------------------------------------------
| AnalyticsService
| All queries use MongoDB aggregation pipelines for efficiency.
| No N+1 queries — all data fetched in a single pipeline where possible.
|--------------------------------------------------------------------------
*/
class AnalyticsService {
  /**
   * Org-level KPI overview.
   */
  async getOrgStats(orgId) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    const [organization, projectStats, departmentCount, teamCount, taskStats] = await Promise.all([
      Organization.findById(orgObjectId).select("members isActive"),

      // Project counts by status
      Project.aggregate([
        { $match: { orgId: orgObjectId, isActive: true } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Department.countDocuments({ orgId: orgObjectId, isActive: true }),

      Team.countDocuments({ orgId: orgObjectId, isActive: true }),

      // Task stats across all org projects
      Task.aggregate([
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $match: {
            "project.orgId": orgObjectId,
            "project.isActive": true,
            isActive: true,
          },
        },
        {
          $facet: {
            byStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } },
            ],
            overdue: [
              {
                $match: {
                  dueDate: { $lt: new Date() },
                  status: { $nin: ["done", "cancelled"] },
                },
              },
              { $count: "total" },
            ],
            total: [{ $count: "total" }],
          },
        },
      ]),
    ]);

    if (!organization || organization.isActive === false) {
      throw new NotFoundError("Organization not found");
    }

    // Restructure project stats
    const projectsByStatus = { active: 0, completed: 0, archived: 0, total: 0 };
    projectStats.forEach(({ _id, count }) => {
      projectsByStatus[_id] = count;
      projectsByStatus.total += count;
    });

    // Restructure task stats
    const tasks = taskStats[0] || {};
    const tasksByStatus = {};
    (tasks.byStatus || []).forEach(({ _id, count }) => {
      tasksByStatus[_id] = count;
    });
    const totalTasks = tasks.total?.[0]?.total || 0;
    const overdueTasks = tasks.overdue?.[0]?.total || 0;
    const doneTasks = tasksByStatus["done"] || 0;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const membersByRole = {};
    (organization.members || []).forEach((member) => {
      membersByRole[member.role] = (membersByRole[member.role] || 0) + 1;
    });

    return {
      projects: projectsByStatus,
      members: {
        total: organization.members?.length || 0,
        byRole: membersByRole,
      },
      departments: {
        total: departmentCount,
      },
      teams: {
        total: teamCount,
      },
      tasks: {
        total: totalTasks,
        byStatus: tasksByStatus,
        overdue: overdueTasks,
        completionRate,
      },
    };
  }

  /**
   * Per-project health metrics.
   */
  async getProjectStats(projectId) {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const project = await Project.findById(projectObjectId);
    if (!project) throw new NotFoundError("Project not found");

    const [taskStats] = await Task.aggregate([
      { $match: { projectId: projectObjectId, isActive: true } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          byPriority: [
            { $group: { _id: "$priority", count: { $sum: 1 } } },
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                status: { $nin: ["done", "cancelled"] },
              },
            },
            { $count: "total" },
          ],
          dueThisWeek: [
            {
              $match: {
                dueDate: {
                  $gte: new Date(),
                  $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                status: { $nin: ["done", "cancelled"] },
              },
            },
            { $count: "total" },
          ],
          total: [{ $count: "total" }],
        },
      },
    ]);

    const byStatus = {};
    (taskStats?.byStatus || []).forEach(({ _id, count }) => { byStatus[_id] = count; });

    const byPriority = {};
    (taskStats?.byPriority || []).forEach(({ _id, count }) => { byPriority[_id] = count; });

    const total = taskStats?.total?.[0]?.total || 0;
    const done = byStatus["done"] || 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const overdue = taskStats?.overdue?.[0]?.total || 0;
    const dueThisWeek = taskStats?.dueThisWeek?.[0]?.total || 0;

    return {
      project: { _id: project._id, name: project.name, status: project.status, key: project.key },
      tasks: { total, done, completionRate, overdue, dueThisWeek, byStatus, byPriority },
    };
  }

  /**
   * Per-member workload inside a project.
   */
  async getProjectWorkload(projectId) {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const workload = await Task.aggregate([
      {
        $match: {
          projectId: projectObjectId,
          isActive: true,
          assigneeId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$assigneeId",
          total: { $sum: 1 },
          done: {
            $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          todo: {
            $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $not: [{ $in: ["$status", ["done", "cancelled"]] }] },
                    { $ne: ["$dueDate", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          email: "$user.email",
          avatar: "$user.avatar",
          total: 1,
          done: 1,
          inProgress: 1,
          todo: 1,
          overdue: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    return workload;
  }
}

module.exports = new AnalyticsService();
