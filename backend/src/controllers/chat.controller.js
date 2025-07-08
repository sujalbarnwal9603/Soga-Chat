import asyncHandler from '../utils/asyncHandler.js';
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


const fetchChats = asyncHandler(async(req,res)=>{
    const chats= await Chat.find({
        users: req.user._id
    })
        .populate("users","-password")
        .populate("groupAdmin","-password")
        .populate({
            path:"latestMessage",
            populate:{
                path:"sender",
                select:"fullName email",
            },
        })
        .sort({updatedAt:-1})

    return res.status(200).json(new ApiResponse(200,chats));
})


const createGroupChat=asyncHandler(async(req,res)=>{
    const {users, name}= req.body;

    if(!users || !name){
        throw new ApiError(400,"Please provide users and name")
    }

    if(users.length<2){
        throw new ApiError(400,"More than 2 people required");
    }
    users.push(req.user._id);

    const groupChat= await Chat.create({
        chatName: name,
        users,
        isGroupChat:true,
        groupAdmin:req.user?._id,
    });

    const fullGroupChat= await Chat.findById(groupChat._id)
        .populate("users","-password")
        .populate("groupAdmin", "-password");
    
    return res
        .status(200)
        .json(new ApiResponse(201,fullGroupChat));

})

// Rename Group

const renameGroup= asyncHandler(async(req,res)=>{
    const {chatId,chatName}= req.body;

    const updatedChat=await Chat.findByIdAndUpdate(
        chatId,
        {chatName},
        {new:true}
    ).populate("users","-password").populate("groupAdmin","-password");


    if(!updatedChat){
        throw new ApiError(400,"Chat not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200,updatedChat));

})

const addToGroup=asyncHandler(async(req,res)=>{
    const {chatId, userId}= req.body;
    const added =await Chat.findByIdAndUpdate(
        chatId,
        {$push:{users:userId}},
        {new:true}
    ).populate("users","-password").populate("groupAdmin","-password");

    if(!added){
        throw new ApiError(400, "Chat not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200,added));

})

const removeFromGroup=asyncHandler(async(req,res)=>{
    const {chatId,userId} =req.body;

    const removed=await Chat.findByIdAndUpdate(
        chatId,
        {$pull:{users:userId}},
        {new:true}

    ).populate("users","-password").populate("groupAdmin","-password");

    if(!removed){
        throw new ApiError(400,"Chat not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, removed));

})


export default{
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup
}