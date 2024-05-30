import express from "express";
import { uploadInstanceData } from "../controllers/instanceController.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadInstanceData);

export default router;