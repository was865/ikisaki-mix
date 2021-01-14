var express = require("express");
var moment = require("moment-timezone");
const { Result } = require("express-validator");
var router = express.Router();

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

router.get("/", (req, res, next) => {
  var data = {
    title: "login",
    form: { name: "", password: "" },
    content: ""
  };
  res.render("login", data);
});

router.post("/", (req, res, next) => {
  var request = req;
  var response = res;
  req.check("login_nm", "名前は必ず入力してください。").notEmpty();
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
        form: req.body
      };
      response.render("login", data);
    } else {
      var nm = req.body.login_nm;
      var pw = req.body.password;

      new Userdata().where('name','=',nm)
      .fetch()
      .then((result) => {
        if (result == null) {
          var data = {
            title: "再入力",
            content:
              '<p class="error login_info">該当するユーザーは存在しません。</p>',
            form: req.body
          };
          response.render("login", data);
        } else {

          if (result.attributes.locked_at != null){                 //ロックされたら、30分後かをチェック
            var locked_at = new Date(result.attributes.locked_at);          
            console.log("ロックされた時刻は " + moment(locked_at).format('YYYY-MM-DD HH:mm:ss'));
            var locked_after;
            locked_after = moment(new Date(locked_at.setMinutes(locked_at.getMinutes() + 30)));
            console.log("ロックされた30分後の時刻（ロック解除時刻）：" + locked_after.format('YYYY-MM-DD HH:mm:ss'));
            var now = moment(new Date());
            if (now.isAfter(locked_after)) {
              console.log("現在時刻は：" + now.format('YYYY-MM-DD HH:mm:ss') + "-----30分後満了。ロック解除。");
              result.attributes.err_times = 0;
              result.attributes.locked_at = null;
              result.save();
            } else {
              console.log("現在時刻は：" + now.format('YYYY-MM-DD HH:mm:ss') + "-----30分未満。");
            }
          }
          
            var errMax = 5;
            if (result.attributes.password != pw) {
              if (result.attributes.err_times < errMax) {
                result.attributes.err_times ++;
                result.save();
                var errLefttimes = errMax - result.attributes.err_times;
                if (errLefttimes <= 0) {
                  var data = {
                    title: "最終確認ください",
                    content:
                      '<p class="error login_info">パスワードが違います。次でアカウントがロックされます。</p>',
                    form: req.body
                  };
                } else {
                  var data = {
                    title: "再入力",
                    content:
                      '<p class="error login_info">パスワードが違います。あと' + errLefttimes + '回でアカウントがロックされます。</p>',
                    form: req.body
                  };
                }
                response.render("login", data);
              } else {
                if (result.attributes.admin != 1) {
                  var data = {
                    title: "管理者に連絡ください",
                    content:
                      '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後にまたお試しください。または管理者に連絡ください。</p>',
                    form: req.body
                  };
                } else {
                  var data = {
                    title: "一定時間後お試しください",
                    content:
                      '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後またお試しください。または他の管理者にロック解除してもらえます。</p>',
                    form: req.body
                  };
                }
                if (result.attributes.err_times == 5) {
                  result.attributes.locked_at = new Date();
                  result.attributes.err_times ++;
                  result.save();
                  console.log("ロックされた時刻が更新されました: " + moment(result.attributes.locked_at).format('YYYY-MM-DD HH:mm:ss'));
                } else {
                  result.attributes.err_times ++;
                  result.save();
                }
                response.render("login", data);
                
              }
              
            } else {  //パスワードが正しく入力された場合
              if (result.attributes.err_times < errMax) {
                result.attributes.err_times = 0;
                result.save();
                request.session.login = result.attributes;
                var data = {
                  title: "Login",
                  content: '<p class="login_info">ログインしました！</p>',
                  form: req.body,
                  login: request.session.login
                };
                response.redirect("/");
              } else {
                if (result.attributes.admin != 1) {
                  var data = {
                    title: "管理者に連絡ください",
                    content:
                      '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後にまたお試しください。または管理者に連絡ください。</p>',
                    form: req.body
                  };
                } else {
                  var data = {
                    title: "一定時間後お試しください",
                    content:
                      '<p class="error login_info">＂' + result.attributes.name + '＂のアカウントがロックされました。<br>一定時間後またお試しください。または他の管理者にロック解除してもらえます。</p>',
                    form: req.body
                  };
                }
                response.render("login", data);
              }
            }

        }
      });

      router.post("/reset", (req, res, next) => {
        new Userdata().where('name','=',req.body.name_reset)
        .fetch()
        .then((result) => {
          var reset_mail = result.attributes.email;
          sendmail({
            from: 'a-ou@msi-net.co.jp',
            to: reset_mail,
            subject: 'パスワードリセットの確認メール（行先管理システム）',
            text: '株式会社エム・エス・アイ　'+ req.body.userinfo_name +'様\r\n\r\nあなたのパスワードリセット専用ページです。\r\n本人による操作でない場合は、無視してください。\r\n\r\n操作の時刻：' + formatted,
          }, function(err, reply) {
            console.log(err && err.stack);
            console.dir(reply);
          });
          res.redirect("/login");
        });
      });

      // Userdata.query({ where: { name: nm }, andWhere: { password: pw } })
      //   .fetch()
      //   .then(model => {
      //     if (model == null) {
      //       var data = {
      //         title: "再入力",
      //         content:
      //           '<p class="error login_info">名前またはパスワードが違います。</p>',
      //         form: req.body
      //       };
      //       response.render("login", data);
      //     } else {
      //       request.session.login = model.attributes;
      //       var data = {
      //         title: "Login",
      //         content: '<p class="login_info">ログインしました！</p>',
      //         form: req.body,
      //         login: request.session.login
      //       };
      //       response.redirect("/");
      //     }
      //   });
    }
  });
});

module.exports = router;
