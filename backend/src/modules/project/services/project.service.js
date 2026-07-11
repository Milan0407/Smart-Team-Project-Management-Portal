const projectRepository = require("../repositories/project.repository");
const boardRepository = require("../../board/repositories/board.repository");
const organizationRepository = require("../../org/repositories/organization.repository");
const ConflictError = require("../../../shared/errors/ConflictError");
const NotFoundError = require("../../../shared/errors/NotFoundError");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

class ProjectService {
  async createProject(orgId, data, currentUserId) {
    const organization = await organizationRepository.findById(orgId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    const leadIsOrgMember = organization.members.some(
      (member) => member.userId.toString() === data.leadId.toString()
    );

    if (!leadIsOrgMember) {
      throw new NotFoundError("Project lead must be an organization member");
    }

    const key = data.key.toUpperCase();
    const existingProject = await projectRepository.findByKey(orgId, key);
    if (existingProject) {
      throw new ConflictError(`Project key "${key}" already exists in this organization`);
    }

    const project = await projectRepository.create({
      orgId,
      name: data.name,
      key,
      description: data.description || "",
      leadId: data.leadId,
      members: [
        {
          userId: data.leadId,
          role: "project_manager",
          joinedAt: new Date(),
        },
      ],
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    // Automatically create a default board for the project
    await boardRepository.create({
      projectId: project._id,
      name: "Main Kanban Board",
      columns: [
        { name: "To Do", order: 0, color: "#3b82f6" },
        { name: "In Progress", order: 1, color: "#f59e0b" },
        { name: "Done", order: 2, color: "#10b981" },
      ],
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    return project;
  }

  async getProjectById(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async getProjectsByOrg(orgId) {
    const organization = await organizationRepository.findById(orgId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }
    return projectRepository.findByOrgId(orgId);
  }

  async updateProject(id, updateData, currentUserId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (updateData.leadId) {
      const organization = await organizationRepository.findById(project.orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const leadIsOrgMember = organization.members.some(
        (member) => member.userId.toString() === updateData.leadId.toString()
      );

      if (!leadIsOrgMember) {
        throw new NotFoundError("Project lead must be an organization member");
      }

      const leadMember = project.members.find(
        (member) => toIdString(member.userId) === updateData.leadId.toString()
      );

      if (!leadMember) {
        await this.addMember(id, updateData.leadId, "project_manager");
      } else if (leadMember.role !== "project_manager") {
        await projectRepository.updateMemberRole(
          id,
          updateData.leadId,
          "project_manager"
        );
      }
    }

    return projectRepository.updateById(id, {
      ...updateData,
      updatedBy: currentUserId,
    });
  }

  async deleteProject(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return projectRepository.deactivate(id);
  }

  async listMembers(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project.members;
  }

  async addMember(id, userId, role) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const organization = await organizationRepository.findById(project.orgId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    const isOrgMember = organization.members.some(
      (member) => member.userId.toString() === userId.toString()
    );

    if (!isOrgMember) {
      throw new NotFoundError("User is not a member of this organization");
    }

    const existingMember = project.members.find(
      (member) => toIdString(member.userId) === userId.toString()
    );

    if (existingMember) {
      throw new ConflictError("User is already a project member");
    }

    return projectRepository.addMember(id, {
      userId,
      role,
      joinedAt: new Date(),
    });
  }

  async updateMemberRole(id, userId, role) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const member = project.members.find(
      (item) => toIdString(item.userId) === userId.toString()
    );

    if (!member) {
      throw new NotFoundError("Project member not found");
    }

    if (toIdString(project.leadId) === userId.toString() && role !== "project_manager") {
      throw new ConflictError("Project lead must remain a project manager");
    }

    return projectRepository.updateMemberRole(id, userId, role);
  }

  async removeMember(id, userId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (toIdString(project.leadId) === userId.toString()) {
      throw new ConflictError("Project lead cannot be removed");
    }

    const member = project.members.find(
      (item) => toIdString(item.userId) === userId.toString()
    );

    if (!member) {
      throw new NotFoundError("Project member not found");
    }

    return projectRepository.removeMember(id, userId);
  }
}

module.exports = new ProjectService();
