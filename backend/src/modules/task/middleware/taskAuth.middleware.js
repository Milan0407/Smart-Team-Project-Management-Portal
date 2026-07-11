const taskRepository = require("../repositories/task.repository");
const projectRepository = require("../../project/repositories/project.repository");
const organizationRepository = require("../../org/repositories/organization.repository");
const boardRepository = require("../../board/repositories/board.repository");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");
const NotFoundError = require("../../../shared/errors/NotFoundError");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

/*
|--------------------------------------------------------------------------
| checkTaskAccess
|--------------------------------------------------------------------------
| Resolves: Task → Project → Organization
| Sets: req.task, req.project, req.projectRole
*/
const checkTaskAccess = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id || req.params.taskId;
      if (!taskId) return next();

      const task = await taskRepository.findById(taskId);
      if (!task || !task.isActive) {
        throw new NotFoundError("Task not found");
      }

      const project = await projectRepository.findById(task.projectId);
      if (!project) {
        throw new NotFoundError("Project not found");
      }

      const organization = await organizationRepository.findById(project.orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      // Org-level membership check
      const isOrgOwner =
        organization.ownerId.toString() === req.user.id.toString();
      const orgMember = organization.members.find(
        (m) => toIdString(m.userId) === req.user.id.toString()
      );

      if (!orgMember && !isOrgOwner) {
        throw new ForbiddenError("You are not a member of this organization");
      }

      const orgRole = isOrgOwner ? "org_admin" : orgMember.role;
      const isOrgAdmin = orgRole === "org_admin";

      // Project-level membership check
      const isLead =
        project.leadId &&
        toIdString(project.leadId) === req.user.id.toString();

      const projMember = project.members.find(
        (m) => toIdString(m.userId) === req.user.id.toString()
      );

      if (!projMember && !isOrgAdmin && !isLead) {
        throw new ForbiddenError("You are not a member of this project");
      }

      const projectRole =
        isOrgAdmin || isLead ? "project_manager" : projMember.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(projectRole)) {
        throw new ForbiddenError("Insufficient permissions for this task");
      }

      req.task = task;
      req.project = project;
      req.projectRole = projectRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkTaskAccess };
