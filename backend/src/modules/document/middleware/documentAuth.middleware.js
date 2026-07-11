const documentRepository = require("../repositories/document.repository");
const organizationRepository = require("../../org/repositories/organization.repository");
const projectRepository = require("../../project/repositories/project.repository");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");
const NotFoundError = require("../../../shared/errors/NotFoundError");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

const checkDocumentAccess = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const documentId = req.params.id;
      if (!documentId) return next();

      const document = await documentRepository.findById(documentId);
      if (!document || !document.isActive) {
        throw new NotFoundError("Document not found");
      }

      // Check organization membership
      const organization = await organizationRepository.findById(document.orgId);
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

      // If document is bound to a project, check project membership
      if (document.projectId) {
        const project = await projectRepository.findById(document.projectId);
        if (project) {
          const isLead = toIdString(project.leadId) === req.user.id.toString();
          const isOrgAdmin = orgRole === "org_admin";
          const projMember = project.members.find(
            (m) => toIdString(m.userId) === req.user.id.toString()
          );

          if (!projMember && !isOrgAdmin && !isLead) {
            throw new ForbiddenError("You are not a member of the project hosting this document");
          }
        }
      }

      // Optionally check roles if allowedRoles are specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(orgRole)) {
        throw new ForbiddenError("Insufficient permissions for this document");
      }

      req.document = document;
      req.orgRole = orgRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkDocumentAccess };
