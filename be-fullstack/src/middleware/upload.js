import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = path.resolve(process.cwd(), "uploads", "chat-files");
fs.mkdirSync(uploadDir, { recursive: true });

const sanitizeFileName = (name) => name.replace(/[^\w.-]+/g, "_");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const safeBaseName = sanitizeFileName(basename);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeBaseName}${ext}`);
  },
});

const CHAT_FILE_LIMIT = 25 * 1024 * 1024;// 25mb

const uploader = multer({
  storage,
  limits: {
    fileSize: CHAT_FILE_LIMIT,
  },
});

export const uploadChatFile = (req, res, next) => {
  uploader.single("file")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Max size is 25MB." });
    }

    return res.status(400).json({ message: err.message || "File upload failed" });
  });
};
