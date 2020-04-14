const express = require('express')
const router = express.Router()
const { getUserSasUrl,getPostSasUrl } = require('../controller/imageController')
const { protect } = require('../controller/authController')

router.post('/user',protect, getUserSasUrl)
router.post('/post',protect, getPostSasUrl)

module.exports = router