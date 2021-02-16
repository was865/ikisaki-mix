var express = require("express");
var router = express.Router();
var sqlite3 = require("sqlite3");
var moment = require("moment-timezone");
var datautils = require("date-utils");
const { response } = require("express");
const { get } = require("./login");
const sendmail = require('sendmail')();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const MobileDetect = require('mobile-detect');

var db = new sqlite3.Database("ikisaki.sqlite3");

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
});

var UserStatusData = Bookshelf.Model.extend({
  tableName: "users_status",
  hasTimestamps: true,
  user: function() {
    return this.belongsTo(Userdata);
  }
});


var statusdata = Bookshelf.Model.extend({
  tableName: "status_list"
});

var kyakusakidata = Bookshelf.Model.extend({
  tableName: "kyakusaki_list"
});

var shanaidata = Bookshelf.Model.extend({
  tableName: "shanai_list"
});

var contactdata = Bookshelf.Model.extend({
  tableName: "contact"
});

var departmentdata = Bookshelf.Model.extend({
  tableName: "department_list"
});

var datadepartment;
var datastatus;
var datakyakusaki;
var datashanai;

function isAuthenticated(req, res, next){
  if (req.isAuthenticated()) {  // 認証済
    return next();
  }
  else {  // 認証されていない
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>ログインする必要があります。</p>"
    };
    res.render("login", data);  // ログイン画面に遷移
  }
}

// ビジーwaitを使う方法
function sleep(waitMsec) {
  var startMsec = new Date();

// 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
  console.log("sleep完了しました。");
}


//SQL router.GETはここから
router.get("/", isAuthenticated, function(req, res, next) {

  function Callback(){  //Callback start

    console.log("Callback開始......");
  
    var usertabledata = new Array();
    var usertabledata_manage = new Array();
    var login = req.session.login;
    var req_user = req.user;
  
    var sql = 
      'SELECT users_status.id,users_status.name,users_status.user_id,users_status.email,users_status.department,users_status.information,users_status.position,users_status.status,users_status.ikisaki,time,users_status.memo,users_status.updated_at,users_status.created_at,users.admin,users.username,users.password,users.err_times,users.locked_at , CASE WHEN department = "' +
      login.department +
      '" THEN "AA" ELSE department END as sort1, CASE WHEN name = "' +
      login.name +
      '" THEN "00" ELSE name END as sort2 FROM users_status LEFT JOIN users ON users_status.user_id = users.id ORDER BY admin DESC, err_times DESC, sort1 ASC, sort2 ASC;';
  
    Bookshelf.knex.raw(sql).then(collection => {
      collection.forEach(element => {
        var d1 = moment(new Date(element.updated_at));
        d1.locale("ja");
        d1.tz("Asia/Tokyo");
        var dstr = d1.fromNow();
  
        usertabledata_manage.push({
          id: element.user_id,
          table_id: element.id,
          username: element.username,
          user_admin: element.admin,
          name: element.name,
          err_times: element.err_times,
          information: element.information,
          department: element.department,
          status: element.status,
          ikisaki: element.ikisaki,
          time: element.time,
          memo: element.memo,
          email: element.email,
          updateTime: dstr
        });
  
      });
  
    }).then(result => {
     
      var data = {
        title: "ユーザー管理",
        finding: "ユーザー名、”管理者”、”ロック”などを入力",
        login: login,
        req_user: req_user,
        usertabledata: usertabledata,
        usertabledata_manage: usertabledata_manage,
        datastatus: datastatus,
        datakyakusaki: datakyakusaki,
        datashanai: datashanai,
        datadepartment: datadepartment
      };
  
      res.render("manage", data);
  
    });
  }  //Callback end

  function getSelects(){
    return new Promise(resolve =>{
      db.serialize(() => {
        db.all("select * from department_list", (err, rows) =>{
          if (!err) {
            datadepartment = rows;
          }
        });
        db.all("select * from status_list", (err, rows) =>{
          if (!err) {
            datastatus = rows;
          }
        });
        db.all("select * from kyakusaki_list", (err, rows) =>{
          if (!err) {
            datakyakusaki = rows;
          }
        });
        db.all("select * from shanai_list", (err, rows) =>{
          if (!err) {
            datashanai = rows;
          }
        });
        db.run("SELECT 0", () => resolve());
      });
    });
  }
  async function doGetSelects(){
    await getSelects();
    console.log("【manage】SELECTS取り込み完了。Callback処理を呼び出す......");
    Callback();
  }

  //処理開始......
  console.log("manage page accessing......");

  var md = new MobileDetect(req.headers['user-agent']);
  const resp = {
      agent: md.userAgent() // モバイルからだと'Safari'などのブラウザ名を返す
  };
  // PCだとnullを返す
  console.log(resp);

  if (req.user.admin != 1 || resp.agent != null) {
    console.log("manage page access failed.");
    res.redirect("/");
    return false;
  }

  console.log("manage page access success!!!!!!!!");
  doGetSelects();
  
});


router.post("/:id/delete_user", isAuthenticated, function(req, res, next) {

  new UserStatusData().where("user_id","=", req.body.id)
    .fetch()
    .then(record_status => {
      record_status.attributes.user_id = null;
      record_status.save();
    })
    .then(result => {
      return new Userdata().where("id", "=", req.body.id)
      .fetch()
      .then(record_user => {
        record_user.destroy();
        console.log("削除が実行されました。");
        res.redirect("/manage");
      })
    });

});


module.exports = router;
