import jwt from "jsonwebtoken";
import redis from "./redis.js";



export const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});

	return { accessToken, refreshToken };
};

export const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, {EX: 7 * 24 * 60 * 60}); // 7days
};

export const setCookies = (res, accessToken, refreshToken=null) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 15 * 60 * 1000, // 15 minutes
	});
	if (refreshToken) {
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true, // prevent XSS attacks, cross site scripting attack
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
	}
};

export const decodeToken = (token, type) => {
	let decoded = null;
	if (type === "refreshToken") {
		decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
	} else if (type === "accessToken") {
		decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	}

	return decoded;
}

export const deleteRefreshToken = async (userId) => {
	await redis.del(`refresh_token:${userId}`); // 7days
};

export const refreshAccessToken = async (refreshToken) => {
	let accessToken = null;
	const decoded = decodeToken(refreshToken, "refreshToken");

	if (!decoded) return accessToken;
	
	const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
	
	if (refreshToken !== storedToken) return accessToken
	
	accessToken = jwt.sign(decoded.userId, process.env.REFRESH_TOKEN_SECRET)
	return accessToken;
}