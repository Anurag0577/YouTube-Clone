import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    videoFile : {
        type: String,
        required: true
    },
    thumbnail : {
        type: String,
        required: true
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title : {
        type: String,
        required: true,
        trim: true
    },
    description : {
        type: String,
        required: true,
        trim: true
    },
    duration : {
        type: Number,
        default: 0
    },
    views : {
        type: Number,
        default: 0
    },
    isPublished : {
        type: Boolean,
        required: true,
        default: false
    },
},{
        timestamps: true
})

const Video = mongoose.model('Video', videoSchema);
export default Video;
