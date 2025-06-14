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
    // this condition is necessary bcoz let you skip this bcrypt process if password is not changed.
    if(!this.isModified('password')){ // is modified is a mongoose method which checks if the password is modified or not.
        // if password is not modified then just move to next middleware.
        next();
    }
    try {
        // random text, just to increase security.
        const salt = await bcrypt.genSalt(10);
        // hash the password
        this.password = await bcrypt.hash(this.password, salt)
        // now move to next middleware
        next();
    } catch (error) {
        next(error) // if any error occurs then pass it to next middleware
    }
})

// Create my custom method for password validation
// this is not a mongoose middleware, this is a custom method.
// So, you can use this method in your controller or anywhere you want.
// does not use arrow function here bcoz it does not support this keyword.
// If you use arrow function then this will not refer to the user document.
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password) // it's return true or false
}


//the major difference between access token and refresh token is that access token is used to access the protected routes and refresh token is used to generate a new access token when the access token expires.
// Access token is short lived and refresh token is long lived.
// Access token is sent in the header of the request and refresh token is sent in the body of the request.
// Access token is used to authenticate the user and refresh token is used to generate a new access token when the access token expires.
// Access token is signed with access token secret and refresh token is signed with refresh token secret.
// Access token has a short expiry time and refresh token has a long expiry time.
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