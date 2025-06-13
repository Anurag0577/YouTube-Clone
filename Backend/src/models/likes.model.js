import mongoose from 'mongoose';


// One thing is still remaining,  we have to make sure user can liked one item only once.

const likeSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tweet'
    }
},
{
    timestamps: true
})

const Like = mongoose.model('Like', likeSchema);

export default Like;