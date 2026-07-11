const Department = require(
  "../models/department.model"
);

const populateMemberUsers = (query) =>
  query.populate("members.userId", "name email avatar isActive");

const create = async (data) => {
  return Department.create(data);
};

const findById = async (id) => {
  return populateMemberUsers(Department.findById(id));
};

const findByOrgId = async (
  orgId
) => {
  return populateMemberUsers(Department.find({
    orgId,
    isActive: true,
  }));
};

const findByName = async (
  orgId,
  name
) => {
  return Department.findOne({
    orgId,
    name,
  });
};

const updateById = async (
  id,
  updateData,
  options = {}
) => {
  return populateMemberUsers(Department.findByIdAndUpdate(
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
  return populateMemberUsers(Department.findByIdAndUpdate(
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
  departmentId
) => {
  return Department.findById(
    departmentId
  )
    .select("members")
    .populate(
      "members.userId",
      "name email isActive"
    );
};

const findMember = async (
  departmentId,
  userId
) => {
  return Department.findOne({
    _id: departmentId,
    "members.userId": userId,
  });
};

const addMember = async (
  departmentId,
  member
) => {
  return populateMemberUsers(Department.findByIdAndUpdate(
    departmentId,
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
  departmentId,
  userId
) => {
  return populateMemberUsers(Department.findByIdAndUpdate(
    departmentId,
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

const assignManager = async (
  departmentId,
  managerId
) => {
  return populateMemberUsers(Department.findByIdAndUpdate(
    departmentId,
    {
      managerId,
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
  findByName,
  updateById,
  deactivate,
  listMembers,
  findMember,
  addMember,
  removeMember,
  assignManager,
};
