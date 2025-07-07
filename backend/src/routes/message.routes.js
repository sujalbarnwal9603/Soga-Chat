import express from "express"
import messageController from "../controllers/message.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = express.Router();

router.post("/", verifyJWT, messageController.sendMessage)
router.get("/:chatId", verifyJWT, messageController.getAllMessages)


export default router;