import {app} from "./app.js";
import connectDb from "./db/index.js ";
import dotenv from "dotenv";


//env config
dotenv.config({path:"./.env"});

//database
connectDb()
.then(()=>{
 app.listen(process.env.PORT || 8000,()=>{
    console.log(`Server is working on ${process.env.PORT}`);
})   
})
.catch((err)=>{
 console.log(err);
})