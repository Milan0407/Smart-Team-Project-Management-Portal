const Organization = require(
  "../models/organization.model"
);

const create = async (data) => {
  return Organization.create(data);
};

const findById = async (id) => {
  return Organization.findById(id);
};

const findBySlug = async (slug) => {
  return Organization.findOne({
    slug,
  });
};

const findByOwner = async (
  ownerId
) => {
  return Organization.find({
    ownerId,
    isActive: true,
  });
};

const updateById = async (
  id,
  updateData,
  options = {}
) => {
  return Organization.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
      ...options,
    }
  );
};

const deactivate = async (
  id
) => {
  return Organization.findByIdAndUpdate(
    id,
    {
      isActive: false,
    },
    {
      new: true,
    }
  );
};

const listMembers = async (
  orgId
) => {
  return Organization.findById(orgId)
    .select("members")
    .populate(
      "members.userId",
      "name email avatar isActive"
    );
};

const findMember = async (
  orgId,
  userId
) => {
  return Organization.findOne({
    _id: orgId,
    "members.userId": userId,
  });
};

const addMember = async (
  orgId,
  member
) => {
  return Organization.findByIdAndUpdate(
    orgId,
    {
      $push: {
        members: member,
      },
    },
    {
      new: true,
    }
  );
};

const removeMember = async (
  orgId,
  userId
) => {
  return Organization.findByIdAndUpdate(
    orgId,
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
  );
};

const updateMemberRole = async (
  orgId,
  userId,
  role
) => {
  return Organization.findOneAndUpdate(
    {
      _id: orgId,
      "members.userId": userId,
    },
    {
      $set: {
        "members.$.role": role,
      },
    },
    {
      new: true,
    }
  );
};

module.exports = {
  create,
  findById,
  findBySlug,
  findByOwner,
  updateById,
  deactivate,
  listMembers,
  findMember,
  addMember,
  removeMember,
  updateMemberRole,
};