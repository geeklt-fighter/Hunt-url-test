const mongoose = require('mongoose')



const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Required can not be empty']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: [true, 'Review must belong to a post']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
})


const Review = mongoose.model('Review',reviewSchema)

module.exports = Review