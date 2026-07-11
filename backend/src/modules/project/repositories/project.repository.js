const Project = require("../models/project.model");

class ProjectRepository {
  async create(data) {
    return Project.create(data);
  }

  async findById(id) {
    return Project.findById(id)
      .populate("leadId", "name email avatar")
      .populate("members.userId", "name email avatar isActive");
  }

  async findByOrgId(orgId) {
    return Project.find({ orgId, isActive: true })
      .populate("leadId", "name email avatar")
      .populate("members.userId", "name email avatar isActive");
  }

  async findByKey(orgId, key) {
    return Project.findOne({ orgId, key: key.toUpperCase(), isActive: true });
  }

  async updateById(id, updateData, options = {}) {
    return Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      ...options,
    })
      .populate("leadId", "name email avatar")
      .populate("members.userId", "name email avatar isActive");
  }

  async addMember(projectId, member) {
    return Project.findByIdAndUpdate(
      projectId,
      { $push: { members: member } },
      { new: true }
    )
      .populate("leadId", "name email avatar")
      .populate("members.userId", "name email avatar isActive");
  }

  async removeMember(projectId, userId) {
    return Project.findByIdAndUpdate(
      projectId,
      { $pull: { members: { userId } } },
      { new: true }
    )
      .populate("leadId", "name email avatar")
      .populate("members.userId", "name email avatar isActive");
  }

  async updateMemberRole(projectId, userId, role) {
    return Project.findOneAndUpdate(
      { _id: projectId, "members.userId": userId },
      { $set: { "members.$.role": role } },
      { new: true }
    )
      .populate("leadId", "name email avatar")
      .populate("members.userId", "name email avatar isActive");
  }

  async findMember(projectId, userId) {
    return Project.findOne({
      _id: projectId,
      "members.userId": userId,
    });
  }

  async deactivate(id) {
    return Project.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = new ProjectRepository();
