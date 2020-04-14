const express = require('express')
const router = express.Router()
const { getRecentHistories } = require('../controller/historyController')
const { protect } = require('../controller/authController')

router
    .route('/')
    .get(protect, getRecentHistories) 




module.exports = router