import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectToDB from "./config/db.js";


import authRouter from "./routes/auth.route.js";
import productRouter from "./routes/product.route.js";


dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);

app.listen(PORT, async () => {
    await connectToDB();
    console.log(`Server running on port ${PORT}`);
})