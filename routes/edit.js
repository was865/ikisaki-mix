var express = require("express");
var router = express.Router();
var sqlite3 = require("sqlite3");
var moment = require("moment-timezone");
var datautils = require("date-utils");
const { response } = require("express");
const sendmail = require('sendmail')();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

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

var departmentdata = Bookshelf.Model.extend({
  tableName: "department_list"
});

var datadepartment;
function getDepartment() {
  db.serialize(() =>{
    db.all("select * from department_list", (err, rows) =>{
      if (!err) {
        datadepartment = rows;
      }
    });
  });
}
getDepartment();

// var datastatus;
// function getStatus() {
//   new statusdata()
//     .fetchAll()
//     .then(collection => {
//       datastatus = collection.toArray();
//     })
//     .catch(err => {
//       response
//         .status(500)
//         .json({ error: true, data: { message: err.message } });
//     });

//   return datastatus;
// }

var datastatus;
function getStatus() {
  db.serialize(() =>{
    db.all("select * from status_list", (err, rows) =>{
      if (!err) {
        datastatus = rows;
      }
    });
  });
}
getStatus();

// var datakyakusaki;
// function getKyakusaki() {
//   new kyakusakidata()
//     .fetchAll()
//     .then(collection => {
//       datakyakusaki = collection.toArray();
//     })
//     .catch(err => {
//       response
//         .status(500)
//         .json({ error: true, data: { message: err.message } });
//     });

//   return datakyakusaki;
// }

var datakyakusaki;
function getKyakusaki() {
  db.serialize(() =>{
    db.all("select * from kyakusaki_list", (err, rows) =>{
      if (!err) {
        datakyakusaki = rows;
      }
    });
  });
}
getKyakusaki();

// var datashanai;
// function getShanai() {
//   new shanaidata()
//     .fetchAll()
//     .then(collection => {
//       datashanai = collection.toArray();
//     })
//     .catch(err => {
//       response
//         .status(500)
//         .json({ error: true, data: { message: err.message } });
//     });

//   return datashanai;
// }

// var datashanai;
// function getShanai() {
//   db.serialize(() =>{
//     db.all("select * from shanai_list", (err, rows) =>{
//       if (!err) {
//         datashanai = rows;
//       }
//     });
//   });
// }
// getShanai();

var datashanai;
function readShanai(){
  return new Promise(resolve =>{
    db.serialize(() => {
      db.all("select * from shanai_list", (err, rows) =>{
        if (!err) {
          datashanai = rows;
        }
      });
      db.run("COMMIT", () => {
          resolve();
      });
    })
  })
}

async function getShanai(){
  await readShanai();
}

getShanai();


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

/* GET page. */
router.get("/:id", isAuthenticated, function(req, res, next) {

  getStatus();
  getKyakusaki();
  getShanai();
  getDepartment();

  var login = req.session.login;
  var req_user = req.user;


  if (req.params.id.slice(10) == ""){

    new UserStatusData()
      .where("user_id", "=", req.params.id)
      .fetch({withRelated: ["user"]})
      .then(collection => {
        var d1 = moment(new Date(collection.attributes.updated_at));
        d1.locale("ja");
        d1.tz("Asia/Tokyo");
        var dstr = d1.fromNow();
        var data = {
          title: "行先情報",
          subtitle: "編集...",
          greeting: "前回のアップデート: " + dstr,
          content: collection,
          content_user: collection.relations.user.attributes,
          datastatus: datastatus,
          datakyakusaki: datakyakusaki,
          datashanai: datashanai,
          datadepartment: datadepartment,
          login: login,
          req_user: req_user,
        };
        res.render("edit", data);
      })
      .catch(err => {
        res.status(500).json({ error: true, data: { message: err.message } });
      });

  } else {
    new UserStatusData()
      .where("id", "=", req.params.id.slice(10))
      .fetch()                      //userアカウント情報ターブルにデータがないので
      .then(collection => {
        var d1 = moment(new Date(collection.attributes.updated_at));
        d1.locale("ja");
        d1.tz("Asia/Tokyo");
        var dstr = d1.fromNow();
        var data = {
          title: "行先情報",
          subtitle: "編集...",
          greeting: "前回のアップデート: " + dstr,
          content: collection,
          content_user: {admin:0, err_times:0},
          datastatus: datastatus,
          datakyakusaki: datakyakusaki,
          datashanai: datashanai,
          datadepartment: datadepartment,
          login: login,
          req_user: req_user,
        };
        res.render("edit", data);
      })
      .catch(err => {
        res.status(500).json({ error: true, data: { message: err.message } });
      });
  }
});


router.post("/:id", isAuthenticated, function(req, res, next) {

  getStatus();
  getKyakusaki();
  getShanai();
  getDepartment();

  var login = req.session.login;
  var req_user = req.user;

  if (req.body.information == '' || req.body.information == null) {
    req.body.information == '／';
  }

  if (
    req.body.status == "" ||
    req.body.status == "在席" ||
    req.body.status == "帰宅"
  ) {
    req.body.ikisaki = "／";
    req.body.time = "／";
  } else if (
    req.body.status == "出張" ||
    req.body.status == "研修" ||
    req.body.status == "その他"
  ) {
    req.body.ikisaki = "／";
  } else if (req.body.status == "休暇") {
    req.body.time = "／";
  }

  if (req.body.password == undefined || req.body.password == '') {
    var rec_Userdata = {
      username: req.body.name,
      admin: req.body.admin
    };
    var rec_UserStatusData = {
      name: req.body.name,
      department: req.body.department,
      position: req.body.position,
      information: req.body.information,
      email: req.body.email,
      status: req.body.status,
      ikisaki: req.body.ikisaki,
      time: req.body.time,
      memo: req.body.memo,
    };
  } else {
    var formatted = new Date().toFormat("YYYY/MM/DD HH24時MI分SS秒");
    let hashed_password_adminChange = bcrypt.hashSync(req.body.password, 10);
    var rec_Userdata = {
      username: req.body.name,
      admin: req.body.admin,
      password: hashed_password_adminChange
    };
    var rec_UserStatusData = {
      name: req.body.name,
      department: req.body.department,
      position: req.body.position,
      information: req.body.information,
      email: req.body.email,
      status: req.body.status,
      ikisaki: req.body.ikisaki,
      time: req.body.time,
      memo: req.body.memo,
    };
    sendmail({
      from: 'a-ou@msi-net.co.jp',
      to: req.body.email,
      subject: 'セキュリティーに関する通知（行先管理システム）',
      text: '株式会社エム・エス・アイ　'+ req.body.name +'様\r\n\r\nあなたのパスワードが管理者より変更されました。\r\n\r\n操作の時刻：' + formatted,
    }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    });
    console.log("パスワードを変更しました。");
  }

  if (req.params.id.slice(10) == ""){

    console.log("req.body.admin：" + req.body.admin);

    new Userdata({ id: req.body.id })
      .save(rec_Userdata, { patch: true })
      .then(user => {
        return new UserStatusData().where("user_id","=", user.id)
          .save(rec_UserStatusData, { patch: true })
        })
      .then(status => {
        return new UserStatusData().where("user_id","=", req.body.id)
          .fetch({withRelated: ["user"]})
        })
      .then(statusData => {
        var d2 = new Date(statusData.attributes.updated_at);
        var dstr = d2.toFormat("YYYY年M月D日 HH24時MI分SS秒");
        var data = {
          title: "行先情報",
          subtitle: "編集済み。",
          greeting: dstr + "に更新。",
          content: statusData,
          content_user: statusData.relations.user.attributes,
          datastatus: datastatus,
          datakyakusaki: datakyakusaki,
          datashanai: datashanai,
          datadepartment: datadepartment,
          login: login,
          req_user: req_user
        };
        res.render("edit", data);
      });

  } else {
    new UserStatusData({ id: req.params.id.slice(10) })
      .save(rec_UserStatusData, { patch: true })
      .then(statusData => {
        var d2 = new Date(statusData.attributes.updated_at);
        var dstr = d2.toFormat("YYYY年M月D日 HH24時MI分SS秒");
        var data = {
          title: "行先情報",
          subtitle: "編集済み。",
          greeting: dstr + "に更新。",
          content: statusData,
          content_user: {admin:0, err_times:0},
          datastatus: datastatus,
          datakyakusaki: datakyakusaki,
          datashanai: datashanai,
          datadepartment: datadepartment,
          login: login,
          req_user: req_user
        };
        res.render("edit", data);
      })
  }
});

router.post("/:id/delete", isAuthenticated, function(req, res, next) {

  if (req.body.id.slice(10) == ""){ //アカウントを持っていれば

    new UserStatusData().where("user_id","=", req.body.id)
    .fetch()
    .then(record_status => {
      record_status.attributes.information = null;
      record_status.attributes.position = null;
      record_status.attributes.status = null;
      record_status.attributes.ikisaki = null;
      record_status.attributes.time = null;
      record_status.attributes.memo = null;
      record_status.attributes.department = "*非表示*";
      record_status.save();
      res.redirect("/");
    })

  } else { //アカウントを持たなければ
    new UserStatusData().where("id", "=", req.body.id.slice(10))
    .fetch()
    .then(result =>{
      result.destroy();
      console.log("ユーザーが削除されました。");
      res.redirect("/");
    })
  }
  
});

router.post("/:id/unlock", isAuthenticated, function(req, res, next) {

  new Userdata()
    .where("id", "=", req.body.id)
    .save({err_times: 0, locked_at: null},{patch:true})
    .then(result => {
      res.redirect("/");
    });
});

module.exports = router;
