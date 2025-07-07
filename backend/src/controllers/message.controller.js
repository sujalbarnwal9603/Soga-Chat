import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {Message} from "../models/Message.model.js"
import { Chat } from "../models/Chat.model.js"


// send a new message

const sendMessage=asyncHandler(async(req,res)=>{
    const {content, chatId}=req.body;

    if(!content || !chatId){
        throw new ApiError(400, "Content and chatId are required");

    }

    const newMessage=await Message.create({
        sender: req.user._id,
        content,
        chat:chatId
    });

    const fullMessage=await Message.findById(newMessage._id)
        .populate("sender", "fullName email avatar")
        .populate("chat");

    await Chat.findByIdAndUpdate(chatId, {latestMessage:fullMessage});

    return res
        .status(200)
        .json(new ApiResponse(200, fullMessage,"Message sent successfully"))
})


// Get all message in a chat
const getAllMessages=asyncHandler(async(req,res)=>{
    const {chatId} = req.params;

    const message=await Message.find({chat:chatId})
        .populate("sender","fullName email avatar")
        .populate("chat");


    return res 
        .status(200)
        .json(new ApiResponse(200, message,"Message fetched successfully"));

})


export default{
    sendMessage,
    getAllMessages
};

