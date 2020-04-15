const multer = require('multer')
const sharp = require('sharp')
const azureStorage = require('azure-storage')
const getStream = require('into-stream')
const Post = require('../models/postModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

// Get the azure blob storage connection string
const { AZURE_CSTRING_DEV } = process.env

const blobService = azureStorage.createBlobService(AZURE_CSTRING_DEV)
const multerStorage = multer.memoryStorage()

const containerName = 'user-post'

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only an image', 404), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadPostImages = upload.single('mediaResource')

exports.resizePostImages = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next()
    }
    let filename = req.file.originalname.split('.')
    req.file.filename = filename[0]
    req.body.mediaResource = `post-${filename[0].toLowerCase()}-${Date.now()}-cover.jpeg`

    let data = await sharp(req.file.buffer)
        .resize(1980, 1280)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer()
    // .toFile(`public/images/tests/${req.body.mediaResource}`)
    const stream = getStream(data)
    const streamLength = data.length

    blobService.createBlockBlobFromStream(containerName,req.body.mediaResource,stream,streamLength,err=>{
        if (!err) {
            console.log('upload successfully')
        }
    })

    next()
})

exports.getAllPosts = catchAsync(async (req, res, next) => {

    const posts = await Post.find()

    res.status(200).json({
        status: 'success',
        results: posts.length,
        data: {
            posts
        }
    })
})

exports.getPost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id)

    if (!post) {
        return next(new AppError('No post found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    })
})

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el]    // {key: el, value: obj[el]} 
        }
    })
    return newObj
}

exports.createPost = catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, "name", "theme", "difficulty", "summary", "description", "poster")

    if (req.file) {
        let url = `https://timlodatapipeline.blob.core.windows.net/user-post/${req.body.mediaResource}`
        let sasToken = blobService.generateSharedAccessSignature(containerName, req.body.mediaResource, {
            AccessPolicy: {
                Permissions: azureStorage.BlobUtilities.SharedAccessPermissions.READ,
                Start: azureStorage.date.daysFromNow(0),
                Expiry: azureStorage.date.daysFromNow(15)
                // Start: azureStorage.date.secondsFromNow(0),
                // Expiry: azureStorage.date.secondsFromNow(15)
            }
        })
        filteredBody.mediaResource = `${url}?${sasToken}`
    }


    const newPost = await Post.create(filteredBody)

    res.status(201).json({
        status: 'success',
        data: {
            post: newPost
        }
    })
})


exports.updatePost = catchAsync(async (req, res, next) => {


    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    // protect the user's specific post
    if (post.poster.toString() !== req.user.id.toString()) {
        return next(new AppError('You are not the owner of this post', 403))
    }
    res.status(200).json({
        status: 'success',
        data: {
            post: 'Update something'
        }
    })
})


exports.deletePost = catchAsync(async (req, res, next) => {
    console.log(req.params.id)
    const post = await Post.findByIdAndDelete(req.params.id)


    if (!post) {
        return next(new AppError('No post found with that id', 404))
    }

    // protect the user's specific post
    if (post.poster.toString() !== req.user.id.toString()) {
        return next(new AppError('You are not the owner of this post', 403))
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
})