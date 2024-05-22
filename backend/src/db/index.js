import mongoose from "mongoose";
import { DB_Name } from "../constants.js";


const connectDb = async() => {
    
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DB_URI}/${DB_Name}`)
         console.log(`MongoDB is connected !!! ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB Connection Error",error);
        process.exit(1);
    }

  }

 
export default connectDb;