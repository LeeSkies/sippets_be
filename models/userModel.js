const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        match: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: Object,
        default: null,
    },
    bio: {
        type: String,
        default: '',
    },
    buzzs: [
        {ref: 'Buzz', type: mongoose.Types.ObjectId}
    ],
    sippetsCount: {
        type: Number,
        default: 0,
    },
    followersCount: {
        type: Number,
        default: 0,
        index: true,
    },
    followingCount: {
        type: Number,
        default: 0,
    },
    theme: {
        type: String,
    },
    codeTheme: {
        type: String,
        default: 'tokyoNight'
    },
    refresh_token: {
        type: String,
    }
}, {timestamps: true})

userSchema.methods.comparePassword = function (password) {
    console.log(this.password);
    return bcrypt.compareSync(password, this.password)
}

module.exports = mongoose.model('User', userSchema)