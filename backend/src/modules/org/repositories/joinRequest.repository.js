const JoinRequest = require("../models/joinRequest.model");

const create = async (data) => {
  return JoinRequest.create(data);
};

const findById = async (id) => {
  return JoinRequest.findById(id);
};

const findOne = async (query) => {
  return JoinRequest.findOne(query);
};

const findPendingByOrg = async (orgId) => {
  return JoinRequest.find({ orgId, status: "pending" })
    .populate("userId", "name email avatar");
};

const findPendingByUser = async (userId) => {
  return JoinRequest.findOne({ userId, status: "pending" })
    .populate("orgId", "name slug");
};

const updateStatus = async (id, status) => {
  return JoinRequest.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};

const deleteByIdAndUser = async (id, userId) => {
  return JoinRequest.findOneAndDelete({ _id: id, userId, status: "pending" });
};

module.exports = {
  create,
  findById,
  findOne,
  findPendingByOrg,
  findPendingByUser,
  updateStatus,
  deleteByIdAndUser,
};
