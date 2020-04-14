const azureStorage = require('azure-storage')

const User = require('../models/userModel')
const Post = require('../models/postModel')
const catchAsync = require('../utils/catchAsync')

const { AZURE_CSTRING_DEV } = process.env

const blobService = azureStorage.createBlobService(AZURE_CSTRING_DEV)


const getBlobImageUrl = (url) => {

    let urlwithoutqstr = url.split("?")[0]
    let file = urlwithoutqstr.split("/")
    let container = file[file.length - 2]
    let blob = file[file.length - 1]

    let sasToken = blobService.generateSharedAccessSignature(container, blob, {
        AccessPolicy: {
            Permissions: azureStorage.BlobUtilities.SharedAccessPermissions.READ,
            Start: azureStorage.date.daysFromNow(0),
            Expiry: azureStorage.date.daysFromNow(30)
        }
    })
    return `${urlwithoutqstr}?${sasToken}`
}


exports.getUserSasUrl = catchAsync(async (req, res, next) => {

    let url = getBlobImageUrl(req.body.url)

    /** 完成更新資料到資料庫，把調整過的sas_url重新寫進資料庫 */
    await User.findByIdAndUpdate(req.user.id, { photo: url }, { new: true, runValidators: true })

    res.status(200).json({
        status: 'success'
    })
})

exports.getPostSasUrl = catchAsync(async (req, res, next) => {

    let url = getBlobImageUrl(req.body.url)

    /** 完成更新資料到資料庫，把調整過的sas_url重新寫進資料庫 */
    // await User.findByIdAndUpdate(req.user.id,{photo:url}, { new: true, runValidators: true })
    // Post.findOneAndUpdate(req.user.id, { mediaResource: url }, { new: true, runValidators: true })

    res.status(200).json({
        status: 'success'
    })
})