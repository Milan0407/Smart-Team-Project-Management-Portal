const projectService = require("../services/project.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

class ProjectController {
  async createProject(req, res) {
    const project = await projectService.createProject(
      req.params.orgId,
      req.body,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Project created successfully",
        data: project,
      })
    );
  }

  async getProject(req, res) {
    // Project is pre-loaded and authorized in req.project by checkProjectAccess middleware
    return res.json(
      new ApiResponse({
        message: "Project fetched successfully",
        data: req.project,
      })
    );
  }

  async getProjectsByOrg(req, res) {
    const projects = await projectService.getProjectsByOrg(req.params.orgId);

    return res.json(
      new ApiResponse({
        message: "Projects fetched successfully",
        data: projects,
      })
    );
  }

  async updateProject(req, res) {
    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Project updated successfully",
        data: project,
      })
    );
  }

  async deleteProject(req, res) {
    await projectService.deleteProject(req.params.id);

    return res.json(
      new ApiResponse({
        message: "Project deleted successfully",
      })
    );
  }

  async listMembers(req, res) {
    const members = await projectService.listMembers(req.params.id);

    return res.json(
      new ApiResponse({
        message: "Project members fetched successfully",
        data: members,
      })
    );
  }

  async addMember(req, res) {
    const project = await projectService.addMember(
      req.params.id,
      req.body.userId,
      req.body.role
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Project member added successfully",
        data: project,
      })
    );
  }

  async updateMemberRole(req, res) {
    const project = await projectService.updateMemberRole(
      req.params.id,
      req.params.uid,
      req.body.role
    );

    return res.json(
      new ApiResponse({
        message: "Project member role updated successfully",
        data: project,
      })
    );
  }

  async removeMember(req, res) {
    const project = await projectService.removeMember(
      req.params.id,
      req.params.uid
    );

    return res.json(
      new ApiResponse({
        message: "Project member removed successfully",
        data: project,
      })
    );
  }
}

module.exports = new ProjectController();
