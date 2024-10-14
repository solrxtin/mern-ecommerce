import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectToDB from "./config.js/db.js";


import authRouther from "./routes/auth.route.js";


dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use("/api/v1/auth", authRouther);

app.listen(PORT, async () => {
    await connectToDB();
    console.log(`Server running on port ${PORT}`);
})