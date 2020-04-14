const mongoose = require('mongoose')
const slugify = require('slugify')

const postSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A post must have a name'],
        trim: true,
        maxlength: [50, 'A post name must have less or equal than 30 characters']
    },
    slug: String,
    difficulty: {
        type: String,
        required: [true, 'A tour must have a level'],
        enum: {
            values: ['easy', 'medium', 'hard'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        max: [5, 'Rating must be below 5.0'],
        min: [1, 'Rating must be above 1.0'],
        set: val => Math.round(val) // not 4.66666 but 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    theme: {
        type: String,
        required: [true, 'A post must have a theme']
    },
    summary: {
        type: String,
        maxlength: 100,
        required: [true, 'Summarize the content in your post']
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'A post must have a description']
    },
    mediaResource: {
        type: String,
        required: [true, 'You must sharing something']
    },
    images: [String],
    poster: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    result:String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}) 


postSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})


const Post = mongoose.model('Post', postSchema)


module.exports = Post