const Notification = require("../models/notification.model");

class NotificationRepository {
  async create(data) {
    const notification = await Notification.create(data);
    return notification.populate("actorId", "name email avatar");
  }

  async findByUserId(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const items = await Notification.find({ userId })
      .populate("actorId", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId });

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async markAllRead(userId) {
    return Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  async markRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true } },
      { new: true }
    ).populate("actorId", "name email avatar");
  }

  async countUnread(userId) {
    return Notification.countDocuments({ userId, isRead: false });
  }
}

module.exports = new NotificationRepository();
