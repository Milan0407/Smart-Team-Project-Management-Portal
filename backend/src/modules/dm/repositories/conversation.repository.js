const Conversation = require("../models/conversation.model");

/*
|--------------------------------------------------------------------------
| ConversationRepository
|--------------------------------------------------------------------------
*/
class ConversationRepository {
  constructor() {
    this.indexRepairPromise = null;
  }

  /**
   * Sort participant IDs so the pair is always in the same order.
   * This guarantees uniqueness regardless of who initiates the DM.
   */
  _sortedParticipants(id1, id2) {
    const a = id1.toString();
    const b = id2.toString();
    return a < b ? [id1, id2] : [id2, id1];
  }

  _participantKey(participants) {
    return participants.map((id) => id.toString()).sort().join(":");
  }

  async _populateConversation(query) {
    return query.populate("participants", "name email avatar");
  }

  async _repairIndexes() {
    if (!this.indexRepairPromise) {
      this.indexRepairPromise = (async () => {
        const existing = await Conversation.find({ participantKey: { $exists: false } }).select("participants");
        await Promise.all(
          existing
            .filter((conversation) => conversation.participants?.length === 2)
            .map((conversation) => {
              const participantKey = this._participantKey(conversation.participants);
              return Conversation.updateOne({ _id: conversation._id }, { $set: { participantKey } });
            })
        );

        const indexes = await Conversation.collection.indexes();
        if (indexes.some((index) => index.name === "participants_1")) {
          await Conversation.collection.dropIndex("participants_1");
        }
        await Conversation.createIndexes();
      })().catch((error) => {
        this.indexRepairPromise = null;
        if (error?.codeName === "IndexNotFound" || error?.code === 27) return;
        throw error;
      });
    }

    return this.indexRepairPromise;
  }

  /**
   * Find an existing conversation between two users, or create one.
   */
  async findOrCreate(userId1, userId2) {
    await this._repairIndexes();
    const participants = this._sortedParticipants(userId1, userId2);
    const participantKey = this._participantKey(participants);

    let conversation = await this._populateConversation(
      Conversation.findOne({
        $or: [
          { participantKey },
          { participants: { $all: participants, $size: 2 } },
        ],
      })
    );

    if (!conversation) {
      try {
        conversation = await Conversation.create({ participants, participantKey });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        conversation = await Conversation.findOne({ participantKey });
      }
      conversation = await this._populateConversation(Conversation.findById(conversation._id));
    }

    return conversation;
  }

  /**
   * Get all conversations for a user, sorted by latest message first.
   */
  async findByUser(userId) {
    return Conversation.find({ participants: userId })
      .populate("participants", "name email avatar")
      .populate("lastMessage.senderId", "name")
      .sort({ "lastMessage.createdAt": -1, updatedAt: -1 });
  }

  async findById(id) {
    return Conversation.findById(id)
      .populate("participants", "name email avatar");
  }

  /**
   * Update the denormalized lastMessage and increment recipient's unread count.
   */
  async updateLastMessage(conversationId, message, recipientId) {
    const unreadKey = `unreadCounts.${recipientId.toString()}`;
    return Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
        },
        $inc: { [unreadKey]: 1 },
      },
      { new: true }
    );
  }

  /**
   * Reset unread count for a user in a conversation (mark as read).
   */
  async resetUnread(conversationId, userId) {
    const unreadKey = `unreadCounts.${userId.toString()}`;
    return Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { [unreadKey]: 0 } },
      { new: true }
    );
  }

  /**
   * Get total unread count across all conversations for a user.
   */
  async getTotalUnread(userId) {
    const conversations = await Conversation.find({ participants: userId });
    const key = userId.toString();
    return conversations.reduce((sum, c) => {
      return sum + (c.unreadCounts?.get(key) || 0);
    }, 0);
  }
}

module.exports = new ConversationRepository();
