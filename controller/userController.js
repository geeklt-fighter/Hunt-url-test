const multer = require('multer')
// const sharp = require('sharp')
const azureStorage = require('azure-storage')
const getStream = require('into-stream')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

// Get the azure blob storage connection string
const { AZURE_CSTRING_DEV } = process.env

const blobService = azureStorage.createBlobService(AZURE_CSTRING_DEV)
const multerStorage = multer.memoryStorage()

const containerName = 'user-porfolio'


const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! please upload an image', 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next()
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    // let data = await sharp(req.file.buffer)
    //     .resize(500, 500)
    //     .toFormat('jpeg')
    //     .jpeg({ quality: 90 })
    //     .toBuffer()
    // .toFile(`public/images/users/${req.file.filename}`)
    const stream = getStream(req.file.buffer)
    const streamLength = data.length

    blobService.createBlockBlobFromStream(containerName, req.file.filename, stream, streamLength, err => {
        if (!err) {
            console.log('upload successfully')
        }
    })

    next()
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


exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user want to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for the password update, please use /updateMyPassword route'))
    }

    // We do not update everythig in the req.body
    const filteredBody = filterObj(req.body, "name", "email")

    if (req.file) {
        let url = `https://timlodatapipeline.blob.core.windows.net/user-porfolio/${req.file.filename}`
        let sasToken = blobService.generateSharedAccessSignature(containerName, req.file.filename, {
            AccessPolicy: {
                Permissions: azureStorage.BlobUtilities.SharedAccessPermissions.READ,
                Start: azureStorage.date.daysFromNow(0),
                Expiry: azureStorage.date.daysFromNow(15)
            }
        })
        filteredBody.photo = `${url}?${sasToken}`
    }
    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    })
})

// user delete themselves = we don't actually delete them but tag their active attribute to false
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
})

/**
 * Middleware
 * user can get their own data, combining with getUser function
 */
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}


/**
 * Admin privilege
 * admin can see the user data
 */
exports.getUser = catchAsync(async (req, res, next) => {
    let query = User.findById(req.params.id)

    const doc = await query
    if (!doc) {
        return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    })
})


/**
 * Admin privileges
 * admin can delete user and remove user data from the database
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
        return next(new AppError('No user found with that ID', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
})

/**
 * Admin privileges
 * admin can not change the user's password
 */
exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!user) {
        return next(new AppError('No user found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: user
        }
    })
})

/**
 * Admin privileges
 * admin can see all the user data
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const user = await User.find()

    res.status(200).json({
        status: 'success',
        results: user.length,
        data: {
            data: user
        }
    })
})