import express from "express";
import { calculateCosts } from "../controllers/costController.js";

const router = express.Router();

router.post("/calculate", calculateCosts);

export default router;