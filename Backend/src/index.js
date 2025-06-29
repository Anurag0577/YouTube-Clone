import express from 'express';
import connectDB from './db/index.js';
import uploadRouter from './routes/uploadRouter.js';

const app = express(); // creating instance of express
const PORT = process.env.PORT || 3000;

const startServer = async() => {
    try {
        await connectDB()
        app.listen(PORT, () => {
            console.log('Server started!')
        });
    } catch (error) {
        console.log('Server start failed.', error.message)
    }
}

app.use('/upload', uploadRouter)

startServer();

