import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const coonectDB=async()=>{
    try {
        const coonectionInstance=await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${coonectionInstance.connection.host}`);
        console.log("Connected at",process.env.PORT)
        console.log("Database Name:", DB_NAME);
        // console.log("Connection Options:", coonectionInstance.connection.options);
        // console.log("Connection State:", coonectionInstance.connection.readyState);
        // console.log("Connection Time:", new Date().toLocaleString());
        // console.log("Connection Id:", coonectionInstance.connection.id);
        // console.log("Connection Replset:", coonectionInstance.connection.replset);
        // console.log("Connection Server:", coonectionInstance.connection.serverConfig);
        // console.log("Connection Host:", coonectionInstance.connection.host);
        // console.log("Connection Port:", coonectionInstance.connection.port);
        // console.log("Connection Db:", coonectionInstance.connection.db.databaseName);
        // console.log("Connection Collection Names:", await coonectionInstance.connection.db.listCollections().toArray());
        // console.log("Connection Client:", coonectionInstance.connection.client);
        // console.log("Connection Options:", coonectionInstance.connection.options);
        // console.log("Connection Schema:", coonectionInstance.connection.schema);
        // console.log("Connection Model Names:", coonectionInstance.connection.modelNames());
        // console.log("Connection Models:", coonectionInstance.connection.models);
        // console.log("Connection Plugins:", coonectionInstance.connection.plugins);
        // console.log("Connection Middleware:", coonectionInstance.connection.middleware);
        
    } catch (error) {
        console.log("MongoDb Connection Error",error);
        process.exit(1);
        
    }
}
