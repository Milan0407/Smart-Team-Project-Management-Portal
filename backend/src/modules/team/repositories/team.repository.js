const Team = require(
  "../models/team.model"
);

const populateMemberUsers = (query) =>
  query.populate("members.userId", "name email avatar isActive");

const create = async (data) => {
  return Team.create(data);
};

const findById = async (id) => {
  return populateMemberUsers(Team.findById(id));
};

const findByOrgId = async (
  orgId
) => {
  return populateMemberUsers(Team.find({
    orgId,
    isActive: true,
  }));
};

const findByDepartmentId =
  async (departmentId) => {
    return populateMemberUsers(Team.find({
      departmentId,
      isActive: true,
    }));
  };

const findByName = async (
  departmentId,
  name
) => {
  return Team.findOne({
    departmentId,
    name,
  });
};

const updateById = async (
  id,
  updateData,
  options = {}
) => {
  return populateMemberUsers(Team.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
      ...options,
    }
  ));
};

const deactivate = async (
  id
) => {
  return populateMemberUsers(Team.findByIdAndUpdate(
    id,
    {
      isActive: false,
    },
    {
      new: true,
    }
  ));
};

const listMembers = async (
  teamId
) => {
  return Team.findById(teamId)
    .select("members")
    .populate(
      "members.userId",
      "name email isActive"
    );
};

const findMember = async (
  teamId,
  userId
) => {
  return Team.findOne({
    _id: teamId,
    "members.userId": userId,
  });
};

const addMember = async (
  teamId,
  member
) => {
  return populateMemberUsers(Team.findByIdAndUpdate(
    teamId,
    {
      $push: {
        members: member,
      },
    },
    {
      new: true,
    }
  ));
};

const removeMember = async (
  teamId,
  userId
) => {
  return populateMemberUsers(Team.findByIdAndUpdate(
    teamId,
    {
      $pull: {
        members: {
          userId,
        },
      },
    },
    {
      new: true,
    }
  ));
};

const assignLead = async (
  teamId,
  leadId
) => {
  return populateMemberUsers(Team.findByIdAndUpdate(
    teamId,
    {
      leadId,
    },
    {
      new: true,
    }
  ));
};

module.exports = {
  create,
  findById,
  findByOrgId,
  findByDepartmentId,
  findByName,
  updateById,
  deactivate,
  listMembers,
  findMember,
  addMember,
  removeMember,
  assignLead,
};
