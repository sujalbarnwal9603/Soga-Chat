import asyncHandler from "../utils/asyncHandler.js";
import {User} from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js";

// Register a new user

const generateAcessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken, refreshToken};
    }catch(error){
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}


const registerUser=asyncHandler(async(req, res)=>{
    const {email,password,fullName}= req.body;
    if([fullName, email, password].some((field)=>(field.trim()===""))){
        throw new ApiError(400, "All fields are necessary");
    }

    const userExist=await User.findOne({
        $or:[{email}]
    })
    if(userExist){
        throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const avatar=await uploadOnCloudinary(avatarLocalPath);

    const user=await User.create({
        fullName,
        avatar: avatar?.url||"",
        email,
        password
    })

    const userCreated=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500, "User Registration Failed. Try again!!!");
    };
    return res
        .status(201)
        .json(new ApiResponse(201, userCreated, "User Registration Successfully"));

})

const loginUser=asyncHandler(async(req,res)=>{
    const {email, password}= req.body;
    if(!email || !password){
        throw new ApiError(400, "All fields are required");
    }

    const userExist=await User.findOne({
        $or:[{email}]
    })

    if(!userExist){
        throw new ApiError(400, "User does not exist");
    }

    const isPasswordCorrect=await userExist.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Password");
    }

    const {accessToken, refreshToken} = await generateAcessAndRefreshToken(userExist._id);

    const loggedInUser= await User.findById(userExist._id).select(
        "-password -refreshToken"
    )

    if(!loggedInUser){
        throw new ApiError(500, "Login Failed. Try again!!!");
    }

    const options={ //it allows to change through backend only not from frontend
        httpOnly:true,
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {user:loggedInUser,accessToken,refreshToken}, "User Logged In Successfully"));

})


export default {
    registerUser,
    loginUser
}