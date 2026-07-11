const Task = require("../../task/models/task.model");
const Project = require("../../project/models/project.model");
const User = require("../../auth/models/user.model");
const Message = require("../../chat/models/message.model");

/*
|--------------------------------------------------------------------------
| SearchService
| Performs parallel full-text search across multiple collections.
| Uses MongoDB $text operator on pre-created text indexes.
|--------------------------------------------------------------------------
*/
class SearchService {
  /**
   * Execute global search across tasks, projects, users, and messages.
   *
   * @param {string}  orgId         - Scope search to this organization
   * @param {string}  query         - The search term
   * @param {string}  type          - 'all' | 'task' | 'project' | 'user' | 'message'
   * @param {string}  userId        - Requesting user (for authorization scoping)
   * @param {number}  limit         - Max results per entity type (default 10)
   */
  async globalSearch(orgId, query, type = "all", userId, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { tasks: [], projects: [], users: [], messages: [] };
    }

    const trimmedQuery = query.trim();
    const resultsLimit = Math.min(parseInt(limit, 10) || 10, 25);

    // Determine which entity types to search
    const searchAll = type === "all";

    const searches = [];

    /*
    |----------------------------------------------------------
    | Tasks — scoped to org via project membership
    |----------------------------------------------------------
    */
    if (searchAll || type === "task") {
      searches.push(
        Task.find(
          { $text: { $search: trimmedQuery }, isActive: true },
          { score: { $meta: "textScore" } }
        )
          .populate("projectId", "name key orgId")
          .populate("assigneeId", "name email avatar")
          .sort({ score: { $meta: "textScore" } })
          .limit(resultsLimit)
          .then((tasks) =>
            // Post-filter to org scope
            tasks.filter(
              (t) => t.projectId?.orgId?.toString() === orgId.toString()
            )
          )
      );
    } else {
      searches.push(Promise.resolve([]));
    }

    /*
    |----------------------------------------------------------
    | Projects — scoped to org
    |----------------------------------------------------------
    */
    if (searchAll || type === "project") {
      searches.push(
        Project.find(
          {
            $text: { $search: trimmedQuery },
            orgId,
            isActive: true,
          },
          { score: { $meta: "textScore" } }
        )
          .populate("leadId", "name email avatar")
          .sort({ score: { $meta: "textScore" } })
          .limit(resultsLimit)
      );
    } else {
      searches.push(Promise.resolve([]));
    }

    /*
    |----------------------------------------------------------
    | Users — name/email prefix search (regex, not $text)
    | Users don't have a text index — use case-insensitive regex
    |----------------------------------------------------------
    */
    if (searchAll || type === "user") {
      const regex = new RegExp(trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      searches.push(
        User.find(
          {
            $or: [{ name: regex }, { email: regex }],
            isActive: true,
            "orgMemberships.orgId": orgId,
          },
          "name email avatar isVerified"
        ).limit(resultsLimit)
      );
    } else {
      searches.push(Promise.resolve([]));
    }

    /*
    |----------------------------------------------------------
    | Messages — scoped to projects within the org
    |----------------------------------------------------------
    */
    if (searchAll || type === "message") {
      // First get the org's project IDs
      const orgProjects = await Project.find(
        { orgId, isActive: true },
        "_id"
      ).lean();
      const projectIds = orgProjects.map((p) => p._id);

      searches.push(
        Message.find(
          {
            $text: { $search: trimmedQuery },
            projectId: { $in: projectIds },
            isDeleted: false,
          },
          { score: { $meta: "textScore" } }
        )
          .populate("senderId", "name email avatar")
          .populate("projectId", "name key")
          .sort({ score: { $meta: "textScore" } })
          .limit(resultsLimit)
      );
    } else {
      searches.push(Promise.resolve([]));
    }

    // Execute all searches in parallel
    const [tasks, projects, users, messages] = await Promise.all(searches);

    return { tasks, projects, users, messages };
  }
}

module.exports = new SearchService();
