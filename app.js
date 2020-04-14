const express = require('express');
const path = require('path');
const logger = require('morgan');
const passport = require('passport')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const AppError = require('./utils/appError')
const GlobalErrorHandler = require('./controller/errorController')
// require('dotenv').config()

const viewRouter = require('./routes/viewRouter')
const userRouter = require('./routes/userRouter')
const postRouter = require('./routes/postRouter')
const imageRouter = require('./routes/imageRouter')
const historyRouter = require('./routes/historyRouter')

global.__basedir = __dirname;

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Connect to cosmos 
  mongoose.set('useNewUrlParser', true);
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  mongoose.set('useUnifiedTopology', true);
  mongoose.connect(process.env.AZURE_COSMOS_CONNECTION_STRING)
    .then(() => { console.log('CosmosDB connected') })
    .catch(err => console.log(err))

} else if (process.env.NODE_ENV === 'development') {
  // Connect to mongo
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { console.log('MongoDB connected') })
    .catch(err => console.log(err))
}

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser())



app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  // console.log('cookies: ', req.cookies)
  // console.log('locals: ', res.locals)
  next()
})

app.use('/', viewRouter)
app.use('/images', imageRouter)
// API Router
app.use('/api/v1/users', userRouter)
app.use('/api/v1/posts', postRouter)
app.use('/api/v1/histories', historyRouter)


app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404))
})

app.use(GlobalErrorHandler)

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
