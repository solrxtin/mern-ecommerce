import bcrypt from "bcryptjs";



import User from "../models/user.model.js"
import { generateTokens, setCookies, storeRefreshToken, decodeToken, deleteRefreshToken, refreshAccessToken } from "../utils/token.js";




export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({success: false, message: "One or more fields missing"})
        }

        const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid credentials"});
		}

        if (await user.comparePassword(password)) {
            const { accessToken, refreshToken } = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);
            res.status(200).json({
                _id: user._id,
                firstName: user.firstName,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(401).json({message: "Invalid credentials"})
        }
       
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Internal server error"})
    }
}
export const logoutController = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (refreshToken) {
            const decoded = decodeToken(refreshToken, "refreshToken");
            deleteRefreshToken(decoded.userId);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({success: true, message: "Logged out successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const registerController = async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ firstName, lastName, email, password });

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);

		setCookies(res, accessToken, refreshToken);

		res.status(201).json({
			_id: user._id,
			firstName: user.firstName,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
}

export const regenerateAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) return res.status(401).json({success: false, message: "No refresh token provided"})
        
        const accessToken = await refreshAccessToken(refreshToken);

        if (accessToken === null) return res.status(400).json({success: false, message: "Malformed request"})
        
        setCookies(res, accessToken);
        
        res.status(200).json({success: true, message: "Access token refreshed successfully"})
        
    } catch (error) {
        console.log("Error in regenerateAccessToken controller", error.message);
		res.status(500).json({ message: error.message });
    }
}