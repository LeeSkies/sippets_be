const mongoose = require('mongoose')

const Schema = mongoose.Schema

const User = require('./userModel')
const Follow = require('./followModel')

const buzzSchema = new Schema({
    user: {
        ref: 'users',
        type: mongoose.Types.ObjectId,
        required: true
    },
    text: {
        type: 'string',
        required: true
    },
    link: {
        type: 'string',
    },
    read: {
        type: 'boolean',
        required: true,
        default: false,
        index: true
    }
}, {timestamps: true})

buzzSchema.methods.notifyPost = async function (id) {
    try {
        const follows = await Follow.find( { following: id } )

        if (!follows.length > 0) throw new Error('no followers found')
        await Promise.all(follows.map(follow => {
            return User.findByIdAndUpdate(follow.follower, { $push: { buzzs: this._id } });
          }));

        this.save()
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = mongoose.model('Buzz', buzzSchema)