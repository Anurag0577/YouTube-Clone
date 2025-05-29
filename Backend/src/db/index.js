import dotenv from 'dotenv'
import mongoose, { Mongoose } from 'mongoose';
import { DB_NAME } from '../constants.js';

dotenv.config()
// dotenv.config({
//     // if the .env file is not directly inside the root then you have to put the path. But if it in the root dont need to write this object.
//     path: './src' 
    
// })

async function  connectDB(){
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongoose database connected! Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log('Database connection failed!', error.message)
        process.exit(1); // terminate the program or process
        // This approach is not good, we should try to reconnect with db few times before exit.
    }
}

export default connectDB;