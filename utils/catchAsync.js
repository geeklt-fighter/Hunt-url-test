module.exports = fn => {
    // console.log('asynchronous function:',fn)    // asynchronous function: [AsyncFunction]
    return (req,res,next)=>{
        fn(req, res, next).catch(err => next(err))
    }
}