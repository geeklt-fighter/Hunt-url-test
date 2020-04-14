const express = require('express')
const router = express.Router()
const { getAllPosts, getPost, createPost, updatePost, deletePost, uploadPostImages, resizePostImages } = require('../controller/postController')
const { protect, restrictOwner } = require('../controller/authController')




router
    .route('/')
    .get(getAllPosts)
    .post(protect, uploadPostImages, resizePostImages, createPost)

router
    .route('/:id')
    .get(getPost)
    .patch(protect, restrictOwner, uploadPostImages, resizePostImages, updatePost)
    .delete(protect, restrictOwner, deletePost)


module.exports = router