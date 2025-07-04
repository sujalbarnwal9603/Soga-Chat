import mongoose, {Schema} from "mongoose";

const messageSchema = new mongoose.Schema({
    sender:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    content:{
        type:String,
        required:true,
        trim:true,
    },
    contentType:{
            type:String,
            enum:["text", "image", "file"],
            default:"text",
    },
    chat:{
        type:Schema.Types.ObjectId,
        ref:"Chat",
        required:true,
    },
},{timestamps:true});


export const Message = mongoose.model("Message", messageSchema);