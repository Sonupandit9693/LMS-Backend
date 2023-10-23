
import {app} from "./app"
import connectDB from "./utils/db";
require("dotenv").config();



// cretae server
app.listen(process.env.PORT, ()=>{
    console.log(`Serever is connected with  port ${process.env.PORT}`);
    connectDB();
})