const User = require("../models/user.model");

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }

  async findById(userId) {
    return User.findById(userId);
  }

  async findByIdWithOrgs(userId) {
    return User.findById(userId).populate("orgMemberships.orgId", "name slug settings");
  }

  async findByEmail(email) {
    return User.findOne({
      email: email.toLowerCase(),
    });
  }

  async findByEmailWithPassword(email) {
    return User.findOne({
      email: email.toLowerCase(),
    }).select("+passwordHash");
  }

  async existsByEmail(email) {
    const user = await User.exists({
      email: email.toLowerCase(),
    });

    return Boolean(user);
  }

  async updateById(userId, updateData) {
    return User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async updateLastSeen(userId) {
    return User.findByIdAndUpdate(
      userId,
      {
        lastSeenAt: new Date(),
      },
      {
        new: false,
      }
    );
  }

  async findByIdWithPassword(userId) {
  return User.findById(userId)
    .select("+passwordHash");
  }

 async updatePassword(
  userId,
  passwordHash
) {
  const user =
    await User.findById(userId)
      .select("+passwordHash");

  user.passwordHash = passwordHash;

  await user.save();

  return user;
}
}

module.exports = new UserRepository();