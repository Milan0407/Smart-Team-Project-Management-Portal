const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Message Schema — Project-scoped chat channel
|--------------------------------------------------------------------------
*/
const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The message body — supports plain text / markdown
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 4000,
    },

    // 'text' = user message, 'system' = "User joined project" etc.
    type: {
      type: String,
      enum: ["text", "system"],
      default: "text",
    },

    // Thread support — reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Soft delete flag — never expose deleted messages' content
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Track when the message was last edited
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
// Primary query: messages for a project, ordered by time (newest first)
messageSchema.index({ projectId: 1, createdAt: -1 });

// Full-text search on message content
messageSchema.index({ content: "text" });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
