import {
  createDirectConversation,
  createGroupConversation,
  getUserConversations
} from "./service.js";


// 🔥 create direct
export const createDirect = async (req, res) => {
  try {
    const senderId = req.userId;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId required" });
    }

    const conversationId = await createDirectConversation(
      senderId,
      recipientId
    );

    res.json({ conversationId });

  } catch (err) {
    if (err.message.includes("blocked")) {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};


// 🔥 create group
export const createGroup = async (req, res) => {
  try {
    const creatorId = req.userId;
    const { name, members } = req.body;

    if (!name || !members?.length) {
      return res.status(400).json({
        message: "name and members required"
      });
    }

    const conversationId = await createGroupConversation(
      creatorId,
      name,
      members
    );

    res.json({ conversationId });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔥 get all conversations
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const hasQueryPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const keyword = String(req.query.keyword || req.query.search || "").trim();
    const paginated =
      String(req.query.paginated || "").toLowerCase() === "true" || hasQueryPagination || Boolean(keyword);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const type = String(req.query.type || "").trim().toLowerCase();
    const search = keyword;

    const conversations = await getUserConversations(userId, { paginated, page, limit, type, keyword: search });

    if (!paginated) {
      return res.json(conversations);
    }

    return res.json({
      data: conversations.data,
      pagination: conversations.pagination,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
