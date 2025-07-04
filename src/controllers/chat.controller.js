import asyncHandler from '../middlewares/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {Chat} from '../models/Chat.model.js';
import {User} from '../models/User.model.js';

// Access or create one-on-one chat
const accessChat=asyncHandler(async(req, res)=>{
    const {userId} =req.body;

    if(!userId){
        throw new ApiError(400,"User not found");
    }

    let chat =await Chat.findOne({
        isGroupChat:false,
        users:{$all:[req.user._id, userId]}
    }).populate("users","-password");

    if(chat){
        return res
            .status(200).json(new ApiResponse(200,chat));
    }

    const newChat=await Chat.create({
        chatName:"sender",
        isGroupChat:false,
        users:[req.user._id,userId],
    });

    const fullChat= await Chat.findById(newChat._id).populate("users","-password");
    return res.status(201).json(new ApiResponse(201,fullChat));
});

