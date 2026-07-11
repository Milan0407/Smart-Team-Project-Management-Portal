const searchService = require("../services/search.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");
const ValidationError = require("../../../shared/errors/ValidationError");

/*
|--------------------------------------------------------------------------
| SearchController
|--------------------------------------------------------------------------
*/
class SearchController {
  /**
   * GET /api/v1/search?q=&orgId=&type=&limit=
   */
  async globalSearch(req, res) {
    const { q, orgId, type = "all", limit } = req.query;

    if (!q || q.trim().length < 2) {
      throw new ValidationError("Search query must be at least 2 characters");
    }

    if (!orgId) {
      throw new ValidationError("orgId is required for search");
    }

    const validTypes = ["all", "task", "project", "user", "message"];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`type must be one of: ${validTypes.join(", ")}`);
    }

    const result = await searchService.globalSearch(
      orgId,
      q,
      type,
      req.user.id,
      limit
    );

    return res.json(
      new ApiResponse({
        message: "Search completed",
        data: result,
      })
    );
  }
}

module.exports = new SearchController();
