import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, res, cb) => {
        cb(nul, `${Date.now()} - ${file.originalName}`);
    }
});

const upload = multer({ storage });

export default upload;