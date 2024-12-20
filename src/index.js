import dotenv from "dotenv";
import connectDB from "../src/db/index.js"
import { app } from "./app.js";

dotenv.config({
    path:"./.env"
})






connectDB()
.then(()=>{
    app.listen(process.env.PORT , ()=>{
        console.log(`App is listening on the port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB CONNECTION FAILED!!!",err)
})


















































// //first approach to connect database
// import express from "express";
// const app = express()

//     ; (async () => {
//         try {
//             await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//             app.on("error", (error) => {
//                 console.log("Appliaction is not able to talk with DATABASE : ", error);
//                 throw error
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`App is listening on port ${process.env.PORT}`)
//             })
//         } catch (error) {
//             console.error("ERROR:", error)
//             throw error;
//         }
//     })()