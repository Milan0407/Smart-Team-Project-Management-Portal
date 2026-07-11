const projectRepository = require("../repositories/project.repository");
const boardRepository = require("../../board/repositories/board.repository");
const organizationRepository = require("../../org/repositories/organization.repository");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");
const NotFoundError = require("../../../shared/errors/NotFoundError");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

const checkProjectAccess = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;
      if (!projectId) {
        return next();
      }

      const project = await projectRepository.findById(projectId);
      if (!project) {
        throw new NotFoundError("Project not found");
      }

      // Check organization membership
      const organization = await organizationRepository.findById(project.orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const isOrgOwner = organization.ownerId.toString() === req.user.id.toString();
      const orgMember = organization.members.find(
        (m) => toIdString(m.userId) === req.user.id.toString()
      );

      if (!orgMember && !isOrgOwner) {
        throw new ForbiddenError("You are not a member of this organization");
      }

      const orgRole = isOrgOwner ? "org_admin" : orgMember.role;

      // Project Lead or Organization Admin automatically gets project_manager privilege
      const isLead = toIdString(project.leadId) === req.user.id.toString();
      const isOrgAdmin = orgRole === "org_admin";

      const projMember = project.members.find(
        (m) => toIdString(m.userId) === req.user.id.toString()
      );

      if (!projMember && !isOrgAdmin && !isLead) {
        throw new ForbiddenError("You are not a member of this project");
      }

      const projectRole = isOrgAdmin || isLead ? "project_manager" : projMember.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(projectRole)) {
        throw new ForbiddenError("Insufficient permissions within this project");
      }

      req.project = project;
      req.projectRole = projectRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkBoardAccess = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId || req.params.id;
      if (!boardId) {
        return next();
      }

      const board = await boardRepository.findById(boardId);
      if (!board) {
        throw new NotFoundError("Board not found");
      }

      const project = await projectRepository.findById(board.projectId);
      if (!project) {
        throw new NotFoundError("Project not found");
      }

      // Org-level check
      const organization = await organizationRepository.findById(project.orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const isOrgOwner = organization.ownerId.toString() === req.user.id.toString();
      const orgMember = organization.members.find(
        (m) => toIdString(m.userId) === req.user.id.toString()
      );

      if (!orgMember && !isOrgOwner) {
        throw new ForbiddenError("You are not a member of this organization");
      }

      const orgRole = isOrgOwner ? "org_admin" : orgMember.role;

      const isLead = toIdString(project.leadId) === req.user.id.toString();
      const isOrgAdmin = orgRole === "org_admin";

      const projMember = project.members.find(
        (m) => toIdString(m.userId) === req.user.id.toString()
      );

      if (!projMember && !isOrgAdmin && !isLead) {
        throw new ForbiddenError("You are not a member of this project");
      }

      const projectRole = isOrgAdmin || isLead ? "project_manager" : projMember.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(projectRole)) {
        throw new ForbiddenError("Insufficient permissions within this board context");
      }

      req.board = board;
      req.project = project;
      req.projectRole = projectRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkProjectAccess,
  checkBoardAccess,
};
