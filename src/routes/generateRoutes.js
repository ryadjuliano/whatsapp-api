import express from "express";
import {
  getAllKeys,
  createKey,
  updateKey,
  deleteKey,
} from "../controllers/generateController.js"

const router = express.Router();

router.get("/", getAllKeys);
router.post("/", createKey);
router.put("/:id", updateKey);
router.delete("/:id", deleteKey);

export default router;
