import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

const isProduction = process.env.NODE_ENV === "production";

// Register a new user


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body;
    if ([fullName, email, password].some((field) => (field.trim() === ""))) {
        throw new ApiError(400, "All fields are necessary");
    }

    const userExist = await User.findOne({
        $or: [{ email }]
    })
    if (userExist) {
        throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        email,
        password
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!userCreated) {
        throw new ApiError(500, "User Registration Failed. Try again!!!");
    };
    return res
        .status(201)
        .json(new ApiResponse(201, userCreated, "User Registration Successfully"));

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const userExist = await User.findOne({
        $or: [{ email }]
    })

    if (!userExist) {
        throw new ApiError(400, "User does not exist");
    }

    const isPasswordCorrect = await userExist.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userExist._id);

    const loggedInUser = await User.findById(userExist._id).select(
        "-password -refreshToken"
    )

    if (!loggedInUser) {
        throw new ApiError(500, "Login Failed. Try again!!!");
    }

    const options = { //it allows to change through backend only not from frontend
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User Logged In Successfully"));

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: null
            }
        },
        {
            new: true,
        }
    )

    const options = { //it allows to changeble through backend only not from frontend
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User Logged Out Successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {

        let decodedToken;
        try {
            decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired Refresh Token");
        }


        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: isProduction
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiResponse(200, { accessToken, newrefreshToken }, "Access Token Refreshed Successfully"));

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {currentPassword, newPassword}=req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }
    const user=await User.findById(req.user._id)
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect=await user.isPasswordCorrect(currentPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Current Password is incorrect");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave: false});
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully"));
})

const changeName =asyncHandler(async(req,res)=>{
    const {fullName}=req.body;
    if (!fullName) {
        throw new ApiError(400, "Full Name is required");
    }

    const user= await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404, "User not found");
    }
    user.fullName=fullName;
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Name changed successfully"));

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath=req.files?.avatar[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar?.url){
        throw new ApiError(500, "Avatar upload failed");
    }



    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password");
    
    return res
        .status(200)
        .json(new ApiResponse(200, user,"Avatar updated Successfully"));

})

<<<<<<< HEAD
const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
            $or: [
                { fullName: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
            ],
        }
        : {};

    const users = await User.find(keyword)
        .find({ _id: { $ne: req.user._id } })
        .select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

=======
>>>>>>> 83d095577a8de36edddfa468c21b27a990194f50


// Exporting the functions
// These functions can be used in the routes to handle user authentication


export default {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    changeName,
    getCurrentUser,
<<<<<<< HEAD
    updateUserAvatar,
    searchUsers
=======
    updateUserAvatar
>>>>>>> 83d095577a8de36edddfa468c21b27a990194f50
}