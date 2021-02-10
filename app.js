var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var session = require('express-session');
var validator = require('express-validator');
var jquery = require('express-jquery');
var local = require('passport-local');
var passport = require('passport');
var ajax = require('./routes/ajax')

var index = require('./routes/index');
var index_admin = require('./routes/index_admin');
var manage = require('./routes/manage');
var table = require('./routes/table');
var login = require('./routes/login');
var users = require('./routes/users');
var edit = require('./routes/edit');
var edit_admin = require('./routes/edit_admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(validator());
app.use(jquery('/jquery'));

var session_opt = {
  secret:'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 *1000 }
};
app.use(session(session_opt));
app.use(passport.initialize());
app.use(passport.session());

// //. 全てのリクエストに対して前処理
// app.use( '/*', function( req, res, next ){
  
//   getDepartment();
//   getStatus();
//   getKyakusaki();
//   getShanai();
//   getMsg();

//   console.log("前処理終了。");

//   next();  //. 個別処理へ
// });
app.use('/edit', edit);
app.use('/edit_admin',edit_admin);
app.use('/login', login);
app.use('/', index);
app.use('/admin', index_admin);
app.use('/manage', manage);
app.use('/table', table);
app.use('/users', users);
app.use('/ajax', ajax);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
