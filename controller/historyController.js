const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3')
const mkdirp = require('mkdirp')
const moment = require('moment')
const json2csv = require('json2csv').parse
const homedir = require('os').homedir()
const azureStorage = require('azure-storage')

const containerName = 'history-storage'
const { AZURE_CSTRING_DEV } = process.env
const blobService = azureStorage.createBlobService(AZURE_CSTRING_DEV)

const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')


const sourceFolder = `${homedir}/AppData/Local/Google/Chrome/User Data/Default/History`
const copyFolder = `${homedir}/HistoryData/`
const copyFile = `${homedir}/HistoryData/HistoryCopy`

const fields = ['user', 'identifier', 'url', 'title', 'visit_count'];

function copyHistoryData(user) {
    return new Promise((resolve, reject) => {
        // If there is no folder for the copied history
        if (!fs.existsSync(copyFolder)) {
            mkdirp(copyFolder)
        }
        var source = fs.createReadStream(sourceFolder)
        var dest = fs.createWriteStream(copyFile)

        if (fs.statSync(sourceFolder).size !== fs.statSync(copyFile).size) {
            source.pipe(dest)
        }

        source.on('end', () => {
            console.log('successfully copied')
            const db = new sqlite3.Database(copyFile, (err) => {
                if (!err) {
                    console.log('connect success')
                }
            })

            let sql = `select url,title,visit_count, datetime(last_visit_time / 1000000 + (strftime('%s', '1601-01-01T08:00:00')), 'unixepoch') as time from urls`

            db.all(sql, [], (err, rows) => {

                if (err) {
                    reject(err)
                }
                let urlArray = []
                let netUrlArray = []
                let orgUrlArray = []
                let comUrlArray = []
                let twUrlArray = []

                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].url.includes(".io")) {
                        dispatchUrl(rows[i], ".io", urlArray)
                    } else if (rows[i].url.includes(".net")) {
                        dispatchUrl(rows[i], ".net", netUrlArray)
                    } else if (rows[i].url.includes(".org")) {
                        dispatchUrl(rows[i], ".org", orgUrlArray)
                    } else if (rows[i].url.includes(".com") && !rows[i].url.includes(".tw")) {
                        dispatchUrl(rows[i], ".com", comUrlArray)
                    } else if (rows[i].url.includes(".tw")) {
                        dispatchUrl(rows[i], ".tw", twUrlArray)
                    }
                }
                var historyArray = urlArray.concat(netUrlArray).concat(orgUrlArray).concat(comUrlArray).concat(twUrlArray)

                var group = groupBy(historyArray, url => url.key)

                data = removeYG(user, group)


                let csv
                csv = json2csv(data, { fields })
                const dateTime = moment().format('YYYYMMDDhhmmss');
                // Change local storage to the azure blob storages
                const filePath = path.join(__basedir, "/data/url-" + dateTime + ".csv")
                fs.writeFile(filePath, csv, function (err) {
                    if (err) {
                        reject(err)
                    }
                    resolve(filePath)
                })
            })

        })
    })
}

/**
 * There are many types of url, so we need to divide and process
 * @param {Object} row 
 * @param {String} type 
 * @param {Array} container 
 */
function dispatchUrl(row, type, container) {
    u = row.url.split(type, 1)
    uObject = { key: u.toString() + type, url: row.url, title: row.title, visit_count: row.visit_count }
    container.push(uObject)
}

/**
 * Group the same host 
 * @param {Array} list 
 * @param {Function} keyGetter 
 */
function groupBy(list, keyGetter) {
    const map = new Map()
    list.forEach((item) => {
        const key = keyGetter(item)
        const collection = map.get(key)

        if (!collection) {
            map.set(key, [item])
        } else {
            collection.push(item)
        }
    });
    return map;
}

/**
 * Remove the youtube and google search history
 * @param {Map} group 
 */
function removeYG(user, group) {
    let mapArray = []
    group.forEach(item => {
        mapArray.push(item)
    })
    let history_without_g_y = []
    mapArray.map((item, i) => {
        item.map((single) => {
            // Remove the google search and youtube history
            if (single.key.includes("www.google") || single.key.includes("www.youtube")) {
                var google_youtube_obj = { user: user, identifier: single.key, url: single.url, title: single.title, visit_count: single.visit_count }
            } else {
                var history_without_g_y_obj = { user: user, identifier: single.key, url: single.url, title: single.title, visit_count: single.visit_count }
                history_without_g_y.push(history_without_g_y_obj)
            }
        })
    })
    return history_without_g_y
}




exports.getRecentHistories = catchAsync(async (req, res, next) => { 
    // console.log(req.user.id)
    const file = await copyHistoryData(req.user.id)
    const fileName = file.split('\\')[file.split('\\').length - 1]
    // Upload the local file to the azure blob storage
    blobService.createBlockBlobFromLocalFile(containerName, fileName, file, function (err, result, response) {
        if (!err) {
            console.log('file uploaded successfully')
        }
    })

    res.status(200).json({
        status: 'success',
        message: 'successfully copied'
    })
})