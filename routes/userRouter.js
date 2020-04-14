const express = require('express')
const { signup, login,logout, forgotPassword, resetPassword, protect, updatePassword, restrictTo } = require('../controller/authController')
const { getMe, getUser, updateMe, deleteMe, updateUser, deleteUser, getAllUsers, uploadUserPhoto, resizeUserPhoto } = require('../controller/userController')
const router = express.Router()


router.post('/signup', signup)
router.post('/login', login)
router.get('/logout',logout)

router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword/:token', resetPassword)

// This will basically prtect all the routes come after this middleware
router.use(protect)

router.patch('/updatePassword', updatePassword)
router.get('/me', getMe, getUser)
router.delete('/deleteMe', deleteMe)
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe)

router.use(restrictTo('admin'))


// RESTful style coding
router
    .route('/')
    .get(getAllUsers)

router
    .route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser)

module.exports = router