import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken

        if (!accessToken) return res.status(401).json({success: false, message: "User not authorized"})
        
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET) 

        if (!decoded) throw new Error(error);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({success: false, message: "User not found"});

        req.user = user;
        next();
    } catch (error) {
        console.error(err)
        return res.status(500).json({message: "Internal server error"})
    }
}

export const adminRoute = async (req, res, next) => {
    try {
        if (req.user && req.user.role === "admin") {
            next();
        } else {
            return res.status(403).json({success: false, message: "Access denied - Admin only"})
        }
        
    } catch (error) {
        console.error(err)
        return res.status(500).json({message: "Internal server error"})
    }
}