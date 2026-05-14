import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text"
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  mentions: {
    type: [{
      userId: {
        type: String,
        required: true
      },
      value: {
        type: String,
        default: null
      },
      label: {
        type: String,
        default: null
      }
    }],
    default: []
  },
  reactions: {
    type: [{
      emoji: {
        type: String,
        required: true
      },
      userId: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  seenBy: {
    type: [String],
    default: []
  },
  editedAt: {
    type: Date,
    default: null
  },
  isRecalled: {
    type: Boolean,
    default: false
  },
  recalledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

export default mongoose.model("Message", messageSchema);
