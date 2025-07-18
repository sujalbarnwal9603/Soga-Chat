import dotenv from 'dotenv';
import { app, server } from './app.js';

import connectDB from './db/index.js';
import {setupSocket} from './sockets/index.js'

dotenv.config();

connectDB()
  .then(() => {
    // Initialize Socket.IO
    setupSocket(server); //Start socket.io after server starts
    server.listen(process.env.PORT || 8000, () => {
    console.log("☸️Server is running on port", process.env.PORT || 8000);
      

    });

    

  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed", err);
    process.exit(1);
  });