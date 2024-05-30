import express from "express";
import { uploadVolumeData } from "../controllers/volumeController.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

router.post("upload", upload.single("file"), uploadVolumeData);

export default router;