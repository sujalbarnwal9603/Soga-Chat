import express from "express";
import chatController from "../controllers/chat.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=express.Router();


router.post("/", verifyJWT, chatController.accessChat)
router.get("/", verifyJWT,chatController.fetchChats)
router.post("/group",verifyJWT, chatController.createGroupChat)
router.put("/rename", verifyJWT, chatController.renameGroup)
router.put("/group-add", verifyJWT, chatController.addToGroup)
router.put("/group-remove", verifyJWT, chatController.removeFromGroup)


export default router;