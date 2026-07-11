const Role = require("../models/role.model");

class RoleRepository {
  async create(roleData) {
    return Role.create(roleData);
  }

  async findById(roleId) {
    return Role.findById(roleId);
  }

  async findByOrg(orgId) {
    return Role.find({
      orgId,
    });
  }

  async findByScope(scope) {
    return Role.find({
      scope,
    });
  }

  async findDefaultRoles(orgId = null) {
    return Role.find({
      orgId,
      isDefault: true,
    });
  }

  async findByName(name, orgId = null) {
    return Role.findOne({
      name,
      orgId,
    });
  }
}

module.exports = new RoleRepository();