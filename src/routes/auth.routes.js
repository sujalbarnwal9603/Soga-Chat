import express from 'express';
import authController from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router=express.Router();

// ✅ Public routes
router.post('/register', upload.fields([{name: 'avatar', maxCount: 1}]), authController.registerUser);
router.post('/login', authController.loginUser);   
router.post('/refresh-token', authController.refreshAccessToken);

// ✅ Protected routes (require login)
router.post('/logout', verifyJWT, authController.logoutUser);
router.get('/me', verifyJWT, authController.getCurrentUser);
router.post('/change-password', verifyJWT, authController.changeCurrentPassword);
router.put('/change-name', verifyJWT, authController.changeName);
router.put('/update-avatar', verifyJWT, upload.fields([{ name: 'avatar', maxCount: 1 }]), authController.updateUserAvatar);

export default router;
// This code defines the authentication routes for user registration, login, and profile management.
// It uses Express.js to create a router and defines both public and protected routes.  

// Public routes allow users to register, login, and refresh their access tokens.
// Protected routes require a valid JWT token and allow users to log out, get their profile information