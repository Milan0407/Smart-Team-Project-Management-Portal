const Document = require("../models/document.model");

const create = async (data) => {
  return Document.create(data);
};

const findById = async (id) => {
  return Document.findOne({ _id: id, isActive: true })
    .populate("creatorId", "name email avatar");
};

const findByOrgId = async (orgId) => {
  return Document.find({ orgId, isActive: true })
    .populate("creatorId", "name email avatar")
    .sort({ updatedAt: -1 });
};

const findByProjectId = async (projectId) => {
  return Document.find({ projectId, isActive: true })
    .populate("creatorId", "name email avatar")
    .sort({ updatedAt: -1 });
};

const updateById = async (id, data) => {
  return Document.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: data },
    { new: true }
  ).populate("creatorId", "name email avatar");
};

const softDeleteById = async (id) => {
  return Document.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: { isActive: false } },
    { new: true }
  );
};

module.exports = {
  create,
  findById,
  findByOrgId,
  findByProjectId,
  updateById,
  softDeleteById,
};
