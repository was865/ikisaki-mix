var express = require("express");
var moment = require("moment-timezone");
const { Result } = require("express-validator");
var router = express.Router();

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const bcrypt = require('bcrypt');

var knex = require("knex")({
  dialect: "sqlite3",
  connection: {
    filename: "ikisaki.sqlite3"
  },
  useNullAsDefault: true
});

var Bookshelf = require("bookshelf")(knex);

var Userdata = Bookshelf.Model.extend({
  tableName: "users",
  hasTimestamps: true
});


passport.use(new LocalStrategy(
  (username, password, done) => {
    console.log("username: " + username)
    new Userdata().where('name','=',username)
      .fetch()
      .then((result) => {
        if (result == null) {
          errMessage = { message : '<p class="error login_info">該当するユーザーは存在しません。</p>' }
          return done(null, false, errMessage);
        } else {
          if (result.attributes.locked_at != null){                 //ロックされたら、30分後かをチェック
            var locked_at = new Date(result.attributes.locked_at);          
            console.log("ロックされた時刻は " + moment(locked_at).format('YYYY-MM-DD HH:mm:ss'));
            var locked_after;
            locked_after = moment(new Date(locked_at.setMinutes(locked_at.getMinutes() + 30)));
            console.log("ロックされた30分後の時刻（ロック解除時刻）：" + locked_after.format('YYYY-MM-DD HH:mm:ss'));
            var now = moment(new Date());
            if (now.isAfter(locked_after)) {
              console.log("現在時刻は：" + now.format('YYYY-MM-DD HH:mm:ss') + "-----30分満了。ロック解除。");
              result.attributes.err_times = 0;
              result.attributes.locked_at = null;
              result.save();
            } else {
              console.log("現在時刻は：" + now.format('YYYY-MM-DD HH:mm:ss') + "-----30分未満。ロック解除されません。");
            }
          }
          
          //パスワード暗号化
            var password_enter = password;
            let hashed_password_enter = bcrypt.hashSync(password_enter, 10)
            console.log("hashedパスワード：" + hashed_password_enter);

            var errMax = 5;
            var errMessage;
            if (!bcrypt.compareSync(result.attributes.password, hashed_password_enter)) {
              if (result.attributes.err_times < errMax -1) {
                result.attributes.err_times ++;
                result.save();
                var errLefttimes = errMax - result.attributes.err_times;
                
                if (errLefttimes == 1) {
                  errMessage = { message : '<p class="error login_info">パスワードが違います。次でアカウントがロックされます。</p>' }
                } else {
                  errMessage = { message : '<p class="error login_info">パスワードが違います。あと' + errLefttimes + '回でアカウントがロックされます。</p>' }
                }
                return done(null, false, errMessage);
              } else {
                if (result.attributes.admin != 1) {
                  errMessage = { message : '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後にまたお試しください。または管理者に連絡ください。</p>' }
                } else {
                  errMessage = { message : '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後またお試しください。または他の管理者にロック解除してもらえます。</p>' }
                }
                if (result.attributes.err_times == errMax -1) {
                  result.attributes.locked_at = new Date();
                  result.attributes.err_times ++;
                  result.save();
                  console.log("ロックされた時刻が更新されました: " + moment(result.attributes.locked_at).format('YYYY-MM-DD HH:mm:ss'));
                } else {
                  result.attributes.err_times ++;
                  result.save();
                }
                return done(null, false, errMessage);
              }
            } else {  //パスワードが正しく入力された場合
              if (result.attributes.err_times < errMax) {
                result.attributes.err_times = 0;
                result.attributes.locked_at = null;
                result.save();
                return done(null, result.attributes);
              } else {
                if (result.attributes.admin != 1) {
                  errMessage = { message : '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後にまたお試しください。または管理者に連絡ください。</p>' }
                } else {
                  errMessage = { message : '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後またお試しください。または他の管理者にロック解除してもらえます。</p>' }
                }
                return done(null, false, errMessage);
              }
            }
        }
      })

    // if(username !== loginUser){
    //   // Error
    //   return done(null, false);
    // } else if(password !== loginPassword) {
    //   // Error
    //   return done(null, false);
    // } else {
    //   // Success and return user information.
    //   return done(null, { username: username, password: password});
    // }
  }
));

passport.serializeUser((user, done) => {
  console.log('Serialize ...');
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log('Deserialize ...');
  done(null, user);
});

router.use(passport.initialize());
router.use(passport.session());
router.use(flash());


router.get("/", (req, res, next) => {
  var data = {
    title: "login",
    content: req.flash( 'error' ),
    form: { username: req.flash('username_flash'), password: "" }
  };
  // console.log("req.flash('username_flash')" + req.flash('username_flash')); // flashは一回呼び出されるとデータが消えるらしい？
  // console.log("form.username" + data.form.username);
  // console.log("form.content" + data.content);
  res.render("login", data);
});

router.post('/',
  (req, res, next) => {
    var request = req;
    var response = res;
    req.check("username", "名前は必ず入力してください。").notEmpty();
    req.check("password", "パスワードは必ず入力してください。").notEmpty();
    req.getValidationResult().then(result => {
      if (!result.isEmpty()) {
        var content = '<ul class="error login_info">';
        var result_arr = result.array();
        for (var n in result_arr) {
          content += "<li>" + result_arr[n].msg + "</li>";
        }
        content += "</ul>";
        var data = {
          title: "Login",
          content: content,
          form: { username: req.body.username, password: "" }
        };
        response.render("login", data);
      }
      else {
        req.flash('username_flash', req.body.username);
        next();
      }          
    })},
    passport.authenticate('local',
      {
        failureRedirect : '/login',
        successRedirect : '/',
        failureFlash: true
      })
);

router.post('/logout', (req, res) => {
  // req.session.passport.user = undefined;
  req.logout();
  res.redirect('/login');
});

// router.post("/", (req, res, next) => {
//   var request = req;
//   var response = res;
//   req.check("username", "名前は必ず入力してください。").notEmpty();
//   req.check("password", "パスワードは必ず入力してください。").notEmpty();
//   req.getValidationResult().then(result => {
//     if (!result.isEmpty()) {
//       var content = '<ul class="error login_info">';
//       var result_arr = result.array();
//       for (var n in result_arr) {
//         content += "<li>" + result_arr[n].msg + "</li>";
//       }
//       content += "</ul>";
//       var data = {
//         title: "Login",
//         content: content,
//         form: req.body
//       };
//       response.render("login", data);
//     } else {
//       var nm = req.body.username;
//       var pw = req.body.password;

//       new Userdata().where('name','=',nm)
//       .fetch()
//       .then((result) => {
//         if (result == null) {
//           var data = {
//             title: "再入力",
//             content:
//               '<p class="error login_info">該当するユーザーは存在しません。</p>',
//             form: req.body
//           };
//           response.render("login", data);
//         } else {

//           if (result.attributes.locked_at != null){                 //ロックされたら、30分後かをチェック
//             var locked_at = new Date(result.attributes.locked_at);          
//             console.log("ロックされた時刻は " + moment(locked_at).format('YYYY-MM-DD HH:mm:ss'));
//             var locked_after;
//             locked_after = moment(new Date(locked_at.setMinutes(locked_at.getMinutes() + 30)));
//             console.log("ロックされた30分後の時刻（ロック解除時刻）：" + locked_after.format('YYYY-MM-DD HH:mm:ss'));
//             var now = moment(new Date());
//             if (now.isAfter(locked_after)) {
//               console.log("現在時刻は：" + now.format('YYYY-MM-DD HH:mm:ss') + "-----30分後満了。ロック解除。");
//               result.attributes.err_times = 0;
//               result.attributes.locked_at = null;
//               result.save();
//             } else {
//               console.log("現在時刻は：" + now.format('YYYY-MM-DD HH:mm:ss') + "-----30分未満。");
//             }
//           }
        
//             var errMax = 5;
//             if (result.attributes.password != pw) {
//               if (result.attributes.err_times < errMax) {
//                 result.attributes.err_times ++;
//                 result.save();
//                 var errLefttimes = errMax - result.attributes.err_times;
//                 if (errLefttimes == 1) {
//                   var data = {
//                     title: "最終確認ください",
//                     content:
//                       '<p class="error login_info">パスワードが違います。次でアカウントがロックされます。</p>',
//                     form: req.body
//                   };
//                 } else {
//                   var data = {
//                     title: "再入力",
//                     content:
//                       '<p class="error login_info">パスワードが違います。あと' + errLefttimes + '回でアカウントがロックされます。</p>',
//                     form: req.body
//                   };
//                 }
//                 response.render("login", data);
//               } else {
//                 if (result.attributes.admin != 1) {
//                   var data = {
//                     title: "管理者に連絡ください",
//                     content:
//                       '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後にまたお試しください。または管理者に連絡ください。</p>',
//                     form: req.body
//                   };
//                 } else {
//                   var data = {
//                     title: "一定時間後お試しください",
//                     content:
//                       '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後またお試しください。または他の管理者にロック解除してもらえます。</p>',
//                     form: req.body
//                   };
//                 }
//                 if (result.attributes.err_times == 5) {
//                   result.attributes.locked_at = new Date();
//                   result.attributes.err_times ++;
//                   result.save();
//                   console.log("ロックされた時刻が更新されました: " + moment(result.attributes.locked_at).format('YYYY-MM-DD HH:mm:ss'));
//                 } else {
//                   result.attributes.err_times ++;
//                   result.save();
//                 }
//                 response.render("login", data);
              
//               }
            
//             } else {  //パスワードが正しく入力された場合
//               if (result.attributes.err_times < errMax) {
//                 result.attributes.err_times = 0;
//                 result.save();
//                 request.session.login = result.attributes;
//                 var data = {
//                   title: "Login",
//                   content: '<p class="login_info">ログインしました！</p>',
//                   form: req.body,
//                   login: request.session.login
//                 };
//                 response.redirect("/");
//               } else {
//                 if (result.attributes.admin != 1) {
//                   var data = {
//                     title: "管理者に連絡ください",
//                     content:
//                       '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後にまたお試しください。または管理者に連絡ください。</p>',
//                     form: req.body
//                   };
//                 } else {
//                   var data = {
//                     title: "一定時間後お試しください",
//                     content:
//                       '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後またお試しください。または他の管理者にロック解除してもらえます。</p>',
//                     form: req.body
//                   };
//                 }
//                 response.render("login", data);
//               }
//             }

//         }
//       });

       

//        // Userdata.query({ where: { name: nm }, andWhere: { password: pw } })
//        //   .fetch()
//        //   .then(model => {
//        //     if (model == null) {
//        //       var data = {
//        //         title: "再入力",
//        //         content:
//        //           '<p class="error login_info">名前またはパスワードが違います。</p>',
//        //         form: req.body
//        //       };
//        //       response.render("login", data);
//        //     } else {
//        //       request.session.login = model.attributes;
//        //       var data = {
//        //         title: "Login",
//        //         content: '<p class="login_info">ログインしました！</p>',
//        //         form: req.body,
//        //         login: request.session.login
//        //       };
//        //       response.redirect("/");
//        //     }
//        //   });
//      }
//    });
//  });

//  router.post("/reset", (req, res, next) => {
//    new Userdata().where('name','=',req.body.name_reset)
//    .fetch()
//    .then((result) => {
//      var reset_mail = result.attributes.email;
//      sendmail({
//        from: 'a-ou@msi-net.co.jp',
//        to: reset_mail,
//        subject: 'パスワードリセットの確認メール（行先管理システム）',
//        text: '株式会社エム・エス・アイ　'+ req.body.userinfo_name +'様\r\n\r\nあなたのパスワードリセット専用ページです。\r\n本人による操作でない場合は、無視してください。\r\n\r\n操作の時刻：' + formatted,
//      }, function(err, reply) {
//        console.log(err && err.stack);
//        console.dir(reply);
//      });
//      res.redirect("/login");
//    });
//  });
  
module.exports = router;
