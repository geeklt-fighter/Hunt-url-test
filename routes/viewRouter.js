const express = require('express')
const router = express.Router()
const { getOverview, getLoginForm, getSignupForm, getAccount, getPost, updateUserData, getMyPost, getEditPost, getContribution } = require('../controller/viewController')
const { protect, loggedIn, restrictOwner } = require('../controller/authController')

router.get('/', loggedIn, getOverview)
router.get('/login', getLoginForm)
router.get('/signup', getSignupForm)
router.get('/post/:slug', loggedIn, getPost)
router.get('/me', protect, getAccount)
router.get('/myposts', protect, getMyPost)
router.get('/editpost', protect, getEditPost)
router.get('/contribution', protect, getContribution)
router.get('/submit-user-data', protect, updateUserData)




module.exports = router