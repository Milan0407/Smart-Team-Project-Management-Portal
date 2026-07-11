const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Conversation Model
| A conversation is always between exactly 2 users (DM scope).
| Participants stored as a sorted pair to guarantee uniqueness.
|--------------------------------------------------------------------------
*/
const conversationSchema = new mongoose.Schema(
  {
    // Always [smallerUserId, largerUserId] for consistent uniqueness
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (v) => v.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
    },

    participantKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Denormalized last message for O(1) inbox rendering
    lastMessage: {
      content: { type: String, default: "" },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      createdAt: { type: Date, default: null },
    },

    // Per-participant unread count map: { userId: count }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.pre("validate", function setParticipantKey(next) {
  if (this.participants?.length === 2) {
    const sorted = this.participants
      .map((participant) => (participant._id || participant).toString())
      .sort();
    this.participants = sorted;
    this.participantKey = sorted.join(":");
  }
  next();
});

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/
// Unique conversation between two users without a multikey unique array index.
conversationSchema.index({ participantKey: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
