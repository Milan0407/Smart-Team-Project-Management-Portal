const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| DirectMessage Model
| Individual messages within a Conversation.
|--------------------------------------------------------------------------
*/
const directMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 4000,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When the recipient read this message
    readAt: {
      type: Date,
      default: null,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/
// Primary pagination query
directMessageSchema.index({ conversationId: 1, createdAt: -1 });

const DirectMessage = mongoose.model("DirectMessage", directMessageSchema);

module.exports = DirectMessage;
