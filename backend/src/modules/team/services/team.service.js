const teamRepository = require(
  "../repositories/team.repository"
);

const organizationRepository = require(
  "../../org/repositories/organization.repository"
);

const departmentRepository = require(
  "../../department/repositories/department.repository"
);

const ConflictError = require(
  "../../../shared/errors/ConflictError"
);

const NotFoundError = require(
  "../../../shared/errors/NotFoundError"
);

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

class TeamService {
  async createTeam(
    orgId,
    data,
    currentUserId
  ) {
    const organization =
      await organizationRepository.findById(
        orgId
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    const department =
      await departmentRepository.findById(
        data.departmentId
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    const existingTeam =
      await teamRepository.findByName(
        data.departmentId,
        data.name
      );

    if (existingTeam) {
      throw new ConflictError(
        "Team already exists"
      );
    }

    return teamRepository.create({
      orgId,
      departmentId:
        data.departmentId,

      name: data.name,

      description:
        data.description || "",

      color:
        data.color || "#2563eb",

      leadId:
        data.leadId || null,

      createdBy: currentUserId,
      updatedBy: currentUserId,
    });
  }

  async getTeamById(id) {
    const team =
      await teamRepository.findById(id);

    if (!team) {
      throw new NotFoundError(
        "Team not found"
      );
    }

    return team;
  }

  async getTeamsByOrg(orgId) {
    const organization =
      await organizationRepository.findById(
        orgId
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    return teamRepository.findByOrgId(
      orgId
    );
  }

  async updateTeam(
    id,
    updateData,
    currentUserId
  ) {
    const team =
      await teamRepository.findById(id);

    if (!team) {
      throw new NotFoundError(
        "Team not found"
      );
    }

    const cleanedUpdateData = { ...updateData };
    if (cleanedUpdateData.leadId === "") cleanedUpdateData.leadId = null;

    return teamRepository.updateById(
      id,
      {
        ...cleanedUpdateData,
        updatedBy: currentUserId,
      }
    );
  }

  async deleteTeam(id) {
    const team =
      await teamRepository.findById(id);

    if (!team) {
      throw new NotFoundError(
        "Team not found"
      );
    }

    return teamRepository.deactivate(
      id
    );
  }

  async addMember(
    teamId,
    userId,
    role
  ) {
    const team =
      await teamRepository.findById(
        teamId
      );

    if (!team) {
      throw new NotFoundError(
        "Team not found"
      );
    }

    const exists =
      team.members.find(
        (member) =>
          toIdString(member.userId) ===
          userId.toString()
      );

    if (exists) {
      throw new ConflictError(
        "User is already a team member"
      );
    }

    return teamRepository.addMember(
      teamId,
      {
        userId,
        role,
      }
    );
  }

  async removeMember(
    teamId,
    userId
  ) {
    const team =
      await teamRepository.findById(
        teamId
      );

    if (!team) {
      throw new NotFoundError(
        "Team not found"
      );
    }

    const exists =
      team.members.find(
        (member) =>
          toIdString(member.userId) ===
          userId.toString()
      );

    if (!exists) {
      throw new NotFoundError(
        "Team member not found"
      );
    }

    return teamRepository.removeMember(
      teamId,
      userId
    );
  }

  async assignLead(
    teamId,
    leadId
  ) {
    const team =
      await teamRepository.findById(
        teamId
      );

    if (!team) {
      throw new NotFoundError(
        "Team not found"
      );
    }

    return teamRepository.assignLead(
      teamId,
      leadId
    );
  }
}

module.exports =
  new TeamService();
