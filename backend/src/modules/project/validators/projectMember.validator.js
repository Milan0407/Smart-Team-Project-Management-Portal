const Joi = require("joi");

const PROJECT_ROLES = ["project_manager", "developer", "viewer"];

const addProjectMemberSchema = Joi.object({
  userId: Joi.string()
    .hex()
    .length(24)
    .required(),

  role: Joi.string()
    .valid(...PROJECT_ROLES)
    .required(),
});

const updateProjectMemberRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...PROJECT_ROLES)
    .required(),
});

const validateAddProjectMember = (data) =>
  addProjectMemberSchema.validate(data, {
    abortEarly: false,
  });

const validateUpdateProjectMemberRole = (data) =>
  updateProjectMemberRoleSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateAddProjectMember,
  validateUpdateProjectMemberRole,
};
