const organizationRepository = require("../repositories/organization.repository");
const departmentRepository = require("../../department/repositories/department.repository");
const teamRepository = require("../../team/repositories/team.repository");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");
const NotFoundError = require("../../../shared/errors/NotFoundError");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

const checkOrgAccess = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const orgId = req.params.orgId || req.params.id;
      if (!orgId) {
        return next();
      }

      const organization = await organizationRepository.findById(orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const isOwner = organization.ownerId.toString() === req.user.id.toString();
      const member = organization.members.find(
        (m) => m.userId.toString() === req.user.id.toString()
      );

      if (!member && !isOwner) {
        throw new ForbiddenError("You are not a member of this organization");
      }

      const userRole = isOwner ? "org_admin" : member.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        throw new ForbiddenError("Insufficient permissions within this organization");
      }

      req.org = organization;
      req.orgRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkDeptAccess = (allowedRoles = [], allowManager = false) => {
  return async (req, res, next) => {
    try {
      const deptId = req.params.id;
      const department = await departmentRepository.findById(deptId);
      if (!department) {
        throw new NotFoundError("Department not found");
      }

      const organization = await organizationRepository.findById(department.orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const isOwner = organization.ownerId.toString() === req.user.id.toString();
      const member = organization.members.find(
        (m) => m.userId.toString() === req.user.id.toString()
      );

      if (!member && !isOwner) {
        throw new ForbiddenError("You are not a member of this organization");
      }

      const userRole = isOwner ? "org_admin" : member.role;
      const isManager = department.managerId && department.managerId.toString() === req.user.id.toString();

      // If org admin or owner, bypass role check
      if (userRole === "org_admin") {
        req.department = department;
        return next();
      }

      // If allowed as manager and is manager, bypass
      if (allowManager && isManager) {
        req.department = department;
        return next();
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        throw new ForbiddenError("Insufficient permissions");
      }

      req.department = department;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkTeamAccess = (allowedRoles = [], allowLead = false, allowDeptManager = false) => {
  return async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const team = await teamRepository.findById(teamId);
      if (!team) {
        throw new NotFoundError("Team not found");
      }

      const organization = await organizationRepository.findById(team.orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const isOwner = organization.ownerId.toString() === req.user.id.toString();
      const member = organization.members.find(
        (m) => m.userId.toString() === req.user.id.toString()
      );

      if (!member && !isOwner) {
        throw new ForbiddenError("You are not a member of this organization");
      }

      const userRole = isOwner ? "org_admin" : member.role;

      // If org admin or owner, bypass
      if (userRole === "org_admin") {
        req.team = team;
        return next();
      }

      const isLead = team.leadId && toIdString(team.leadId) === req.user.id.toString();
      if (allowLead && isLead) {
        req.team = team;
        return next();
      }

      if (allowDeptManager) {
        const department = await departmentRepository.findById(team.departmentId);
        const isManager = department && department.managerId && department.managerId.toString() === req.user.id.toString();
        if (isManager) {
          req.team = team;
          return next();
        }
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        throw new ForbiddenError("Insufficient permissions");
      }

      req.team = team;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkOrgAccess,
  checkDeptAccess,
  checkTeamAccess,
};
