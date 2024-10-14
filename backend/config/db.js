import mongoose from "mongoose";


const connectToDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {})
        console.log(`MongoDB connected ${conn.connection.host}`)
    } catch (error) {
        console.log("Erorr connecting to Database: ", error.nessage)
        process.exit(1);
    }
}

export default connectToDB