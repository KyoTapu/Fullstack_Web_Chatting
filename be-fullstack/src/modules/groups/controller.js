import {
  getUserGroups,
  getGroupDetail,
  createGroup,
  addMembersToGroup,
  deleteGroupService,
  renameGroupService,
  leaveGroupService,
} from "./service.js";

const parsePagination = (query) => {
  const hasQueryPagination = query.page !== undefined || query.limit !== undefined;
  const keyword = String(query.keyword || query.search || "").trim();
  const paginated =
    String(query.paginated || "").toLowerCase() === "true" || hasQueryPagination || Boolean(keyword);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { paginated, page, limit, keyword };
};

export const getMyGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const { paginated, page, limit, keyword } = parsePagination(req.query);
    const groups = await getUserGroups(userId, { paginated, page, limit, keyword });

    if (!paginated) {
      return res.json(groups);
    }

    res.json({
      data: groups.data,
      pagination: groups.pagination,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const details = await getGroupDetail(userId, id);
    res.json(details);
  } catch (err) {
    if (err.message.includes("FORBIDDEN")) {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

export const createGroupHandler = async (req, res) => {
  try {
    const ownerId = req.userId;
    const { name, members } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Group name is required" });
    }

    const groupId = await createGroup(ownerId, name, members);
    res.status(201).json({ id: groupId, message: "Group created successfully" });
  } catch (err) {
    if (err.message.includes("friends list")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

export const addMembersHandler = async (req, res) => {
  try {
    const requesterId = req.userId;
    const { id } = req.params;
    const { members } = req.body;

    if (!members || members.length === 0) {
      return res.status(400).json({ message: "Members list (array) is required" });
    }

    const result = await addMembersToGroup(requesterId, id, members);
    res.json(result);
  } catch (err) {
    if (err.message.includes("FORBIDDEN")) {
      return res.status(403).json({ message: err.message });
    }
    if (err.message.includes("friends list")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

export const deleteGroupHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await deleteGroupService(userId, id);
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    if (err.message.includes("FORBIDDEN")) {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

export const renameGroupHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name } = req.body;
    const updated = await renameGroupService(userId, id, name);
    if (!updated) return res.status(404).json({ message: "Group not found" });
    res.json({ message: "Group renamed successfully", group: updated });
  } catch (err) {
    if (err.message.includes("FORBIDDEN")) {
      return res.status(403).json({ message: err.message });
    }
    res.status(400).json({ message: err.message });
  }
};

export const leaveGroupHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await leaveGroupService(userId, id);
    res.json(result);
  } catch (err) {
    if (err.message.includes("FORBIDDEN")) {
      return res.status(403).json({ message: err.message });
    }
    res.status(400).json({ message: err.message });
  }
};
