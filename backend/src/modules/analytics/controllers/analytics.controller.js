const analyticsService = require("../services/analytics.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

class AnalyticsController {
  async getOrgStats(req, res) {
    const { orgId } = req.params;
    const data = await analyticsService.getOrgStats(orgId);
    return res.json(new ApiResponse({ message: "Org analytics fetched", data }));
  }

  async getProjectStats(req, res) {
    const { projectId } = req.params;
    const data = await analyticsService.getProjectStats(projectId);
    return res.json(new ApiResponse({ message: "Project analytics fetched", data }));
  }

  async getProjectWorkload(req, res) {
    const { projectId } = req.params;
    const data = await analyticsService.getProjectWorkload(projectId);
    return res.json(new ApiResponse({ message: "Workload fetched", data }));
  }
}

module.exports = new AnalyticsController();
