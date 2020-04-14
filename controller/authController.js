// const {promisify} = require('util')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const Post = require('../models/postModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')


const signToken = id => {
    return jwt.sign({ id: id }
        , process.env.JWT_SECRET
        , { expiresIn: process.env.JWT_EXPIRES_IN })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true // Original is true
    }

    res.cookie('jwt', token, cookieOptions)
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}


exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body)

    createSendToken(newUser, 201, res)
    // const token = signToken(newUser._id)
    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // })
})


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }

    // Becuase password's select in user model is false
    const user = await User.findOne({ email: email }).select('+password')

    const correct = await user.correctPassword(password, user.password)

    if (!user || !correct) {
        return next(new AppError('Incorrect email or password', 401))
    }

    createSendToken(user, 200, res)
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token
    // })
})

exports.logout = (req,res)=>{
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now() + 100 * 1000),
        httpOnly: true  // Original is true
    })
    res.status(200).json({
        status:'success'
    })
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get the user based on the email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address', 404))
    }
    //*2) generate the reset token
    const resetToken = user.createPasswordResetToken()
    // because we define passwordConfirm is required, so we need to let it functionless temporarily
    await user.save({ validateBeforeSave: false })

    // 3) send mail
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `Forget your password? Submit a patch request with your new password and
        passwordConfirm to: ${resetURL}. \n If you did not forget password, please ignore this email`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 minutes)',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email ~'
        })
    } catch (err) {
        // if something error, we need to delete the resettoken save in the database
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending email. Try again later !'))
    }
})


exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    // 1.a) Find the same encrypted resetToken and ensure that token has not expired
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gte: Date.now() } })
    // console.log(user)
    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    createSendToken(user, 200, res)
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token
    // })
})

/**
 * If users want to do something in the website, they must login to get the token
 */
exports.protect = catchAsync(async (req, res, next) => {
    // Get the token and check whether it is there
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Hello')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }

    // Verify the token we get
    const decoded = await jwt.verify(token, process.env.JWT_SECRET)

    // Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The token belonging to this user does no longer exists', 401))
    }

    // Check user change password after the JWT was issued (the most complex part)
    if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again', 401))
    }

    // Please notice: grant access to this user
    req.user = currentUser
    res.locals.user = currentUser

    next()
})



exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from the collection
    const user = await User.findById(req.user._id).select('+password')

    // 2) Check if posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 403))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    createSendToken(user, 200, res)
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token
    // })
})


/**
 * @param {enum} roles - enter the role who can do the specific thing
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next()
    }
}

/**
 * Only the user can update or delete their post
 */
exports.restrictOwner = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id)

    if (post.poster.toString() !== req.user.id.toString()) {
        return next(new AppError('You are not the owner of this post', 403))
    }
    next()
})

/**
 * Let the browser know their state, because this website is stateless
 * This middleware is only for rendered page, we don't want to catch any error
 */
exports.loggedIn = async (req, res, next) => {

    // Get tokena and check if it is there
    if (req.cookies.jwt) {
        try {
            // 1) Need to verify token
            const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET)
            // console.log(decoded)
            // 2) Check if user still exists
            const freshUser = await User.findById(decoded.id)

            if (!freshUser) {
                return next()
            }

            // 3) check if user changed the password after the JWT was assigned
            if (freshUser.changesPasswordAfter(decoded.iat)) {
                return next()
            }

            res.locals.user = freshUser

            return next()
        } catch (err) {
            return next()
        }
    }
    next()
}