const teamService = require(
  "../services/team.service"
);

const ApiResponse = require(
  "../../../shared/utils/ApiResponse"
);

class TeamController {
  async createTeam(
    req,
    res
  ) {
    const team =
      await teamService.createTeam(
        req.params.orgId,
        req.body,
        req.user.id
      );

    return res.status(201).json(
      new ApiResponse({
        message:
          "Team created successfully",
        data: team,
      })
    );
  }

  async getTeamsByOrg(
    req,
    res
  ) {
    const teams =
      await teamService.getTeamsByOrg(
        req.params.orgId
      );

    return res.json(
      new ApiResponse({
        message:
          "Teams fetched successfully",
        data: teams,
      })
    );
  }

  async getTeam(
    req,
    res
  ) {
    const team =
      await teamService.getTeamById(
        req.params.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Team fetched successfully",
        data: team,
      })
    );
  }

  async updateTeam(
    req,
    res
  ) {
    const team =
      await teamService.updateTeam(
        req.params.id,
        req.body,
        req.user.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Team updated successfully",
        data: team,
      })
    );
  }

  async deleteTeam(
    req,
    res
  ) {
    const team =
      await teamService.deleteTeam(
        req.params.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Team deleted successfully",
        data: team,
      })
    );
  }

  async addMember(
    req,
    res
  ) {
    const team =
      await teamService.addMember(
        req.params.id,
        req.body.userId,
        req.body.role
      );

    return res.json(
      new ApiResponse({
        message:
          "Team member added successfully",
        data: team,
      })
    );
  }

  async removeMember(
    req,
    res
  ) {
    const team =
      await teamService.removeMember(
        req.params.id,
        req.params.uid
      );

    return res.json(
      new ApiResponse({
        message:
          "Team member removed successfully",
        data: team,
      })
    );
  }

  async assignLead(
    req,
    res
  ) {
    const team =
      await teamService.assignLead(
        req.params.id,
        req.body.leadId
      );

    return res.json(
      new ApiResponse({
        message:
          "Team lead assigned successfully",
        data: team,
      })
    );
  }
}

module.exports =
  new TeamController();