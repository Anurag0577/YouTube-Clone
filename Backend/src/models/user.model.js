import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    watchHistory : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    username : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName : {
        type: String,
        required: true
    },
    avatar : {
        type: String
    },
    coverImage : {
        type: String
    },
    password : {
        type: String,
        required: true,
        minlength: 6
    },
    refreshToken : {
        type: String
    },
},
{
    timestamps: true
})

// You may think why i dont use arrow function here bcoz the arrow function did not support this keyword.
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt)
        next();
    } catch (error) {
        next(error)
    }
})

// Create my custom method for password validation
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id : this._id,
            username : this.username,
            email : this.email
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id : this._id
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model('User', userSchema);
export default User;