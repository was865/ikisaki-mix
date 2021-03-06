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
  tableName: "users"
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
function getDepartment() {
  new departmentdata()
    .fetchAll()
    .then(collection => {
      datadepartment = collection.toArray();
    })
    .catch(err => {
      response
        .status(500)
        .json({ error: true, data: { message: err.message } });
    });

  return datadepartment;
}

var datastatus;
function getStatus() {
  new statusdata()
    .fetchAll()
    .then(collection => {
      datastatus = collection.toArray();
    })
    .catch(err => {
      response
        .status(500)
        .json({ error: true, data: { message: err.message } });
    });

  return datastatus;
}

var datakyakusaki;
function getKyakusaki() {
  new kyakusakidata()
    .fetchAll()
    .then(collection => {
      datakyakusaki = collection.toArray();
    })
    .catch(err => {
      response
        .status(500)
        .json({ error: true, data: { message: err.message } });
    });

  return datakyakusaki;
}

var datashanai;
function getShanai() {
  new shanaidata()
    .fetchAll()
    .then(collection => {
      datashanai = collection.toArray();
    })
    .catch(err => {
      response
        .status(500)
        .json({ error: true, data: { message: err.message } });
    });

  return datashanai;
}

var datacontact;
function getMsg() {
  new contactdata()
    .where("id", "=", 1)
    .fetch()
    .then(record => {
      datacontact = record.attributes.msg;
    });

  return datacontact;
}

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

//SQL router.GETはここから
router.get("/", isAuthenticated, function(req, res, next) {

  getStatus();
  getKyakusaki();
  getShanai();
  getMsg();
  getDepartment();

  var login = req.session.login;
  var req_user = req.user;
 
  var usertabledata = new Array();
  var usertableMap = new Map();
  var updatedTimes = new Array();

  new UserStatusData().fetchAll().then((collection) => {
    var content = collection.toArray();
    content.forEach(element => {

      var d1 = moment(new Date(element.attributes.updated_at));
      d1.locale("ja");
      d1.tz("Asia/Tokyo");
      var dstr = d1.fromNow();

      updatedTimes.push(element.attributes.updated_at);

      usertabledata.push({
        id: element.attributes.user_id,
        table_id: element.attributes.id,
        name: element.attributes.name,
        information: element.attributes.information,
        department: element.attributes.department,
        status: element.attributes.status,
        ikisaki: element.attributes.ikisaki,
        time: element.attributes.time,
        memo: element.attributes.memo,
        email: element.attributes.email,
        updateTime: dstr
      });
      usertableMap.set(element.attributes.position, element.attributes);
    });
    
    var maxUpdatetime = Math.max.apply(null,updatedTimes);

    var maxUpdatetime_display = new Date(maxUpdatetime).toFormat("YYYY年M月D日 HH24時MI分SS秒");

    var maxUpdatetime_data = moment(new Date(maxUpdatetime));
    maxUpdatetime_data.locale("ja");
    maxUpdatetime_data.tz("Asia/Tokyo");
    var maxUpdatetime_display_fromNow = maxUpdatetime_data.fromNow();

    var data = {
      usertabledata: usertabledata,
      datastatus: datastatus,
      datakyakusaki: datakyakusaki,
      datashanai: datashanai,
      msg: datacontact,
      datadepartment: datadepartment,
      usertableMap: usertableMap,
      maxUpdatetime_display: maxUpdatetime_display,
      maxUpdatetime_display_fromNow: maxUpdatetime_display_fromNow,
      login: login,
      req_user: req_user
    };

    res.render("table", data);
  });
});

// updateはここから
router.post("/update", isAuthenticated, function(req, res, next) {

  console.log("update開始しました。");
  console.log(req.body);

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

  if (req.body.ikisaki == undefined || req.body.ikisaki.length == 0) {
    req.body.ikisaki = "／";
  }
  if (req.body.time == undefined || req.body.time.length == 0) {
    req.body.time = "／";
  }

  var rec = {
    status: req.body.status,
    ikisaki: req.body.ikisaki,
    time: req.body.time,
    memo: req.body.memo
  };

  if (Array.isArray(req.body.id)) {

    var userId_filtered_array = new Array();
    req.body.id.forEach(element => {
      if (element.slice(10) == "") {
        userId_filtered_array.push(element);
     }
    })

    var tableId_sliced_array = new Array();
    req.body.id.forEach(element => {
      if (element.slice(10) != "") {
        tableId_sliced_array.push(element.slice(10));
     }
    })
    console.log(req.body.id);
    console.log(tableId_sliced_array);

    var userId_joined = userId_filtered_array.join();
    var tableId_joined = tableId_sliced_array.join();

    console.log("userId_joined: " + userId_joined + ", tableId_joined: " + tableId_joined);

    var sql = "SELECT * FROM users_status WHERE user_id in (" + userId_joined + ") OR id in (" + tableId_joined + ");";

    Bookshelf.knex.raw(sql).then(collection => {
      collection.forEach(element => {
        new UserStatusData({id:element.id}).save(rec, { patch: true });
      })
      console.log("まとめ編集POST：更新しました。");
      res.redirect("/table");
    })

  } else {
    if (req.body.id.slice(10) == "") {
      new UserStatusData().where("id","=", req.body.id)
      .save(rec, { patch: true })
      .then(status => {
        console.log("単項目編集POST：更新しました。");
        res.redirect("/table");
      })
    } else {
      new UserStatusData().where("id","=", req.body.id.slice(10))
      .save(rec, { patch: true })
      .then(status => {
        console.log("単項目編集POST：更新しました（テーブルユーザー）。");
        res.redirect("/table");
      })
    }
  }


  
  // if (Array.isArray(req.body.id)) {
  //   console.log("req.body.id.length : " + req.body.id.length);
  //   for (var i = 0; i < req.body.id.length; i++) {

  //     console.log("更新開始しました。");
  //     var rec = {
  //       status: req.body.status,
  //       ikisaki: req.body.ikisaki,
  //       time: req.body.time,
  //       memo: req.body.memo
  //     };
      
  //     console.log("req.body.id[" + i + "] : " + req.body.id[i]);

  //     new UserStatusData().where("user_id","=", req.body.id[i])
  //       .save(rec, { patch: true })
  //       .then(result => {
  //         console.log("Array更新完了しました。");
  //       });
  //   }
  //   res.redirect("/table");
  // } else {
  //   console.log("更新開始しました。");
  //   var rec = {
  //     status: req.body.status,
  //     ikisaki: req.body.ikisaki,
  //     time: req.body.time,
  //     memo: req.body.memo
  //   };
    
  //   console.log("req.body.id: " + req.body.id);
    
  //   new UserStatusData().where("user_id","=", req.body.id)
  //       .save(rec, { patch: true })
  //       .then(result => {
  //         console.log("単項目更新完了しました。");
  //       });
  // }

});

// msgはここから
router.post("/contact", isAuthenticated, (req, res, next) => {

  console.log("req.body = " + req.body.msg);
  var rec = {
    msg: req.body.msg
  };
  new contactdata({ id: 1 }).save(rec, { patch: true }).then(result => {
    getMsg();
    console.log("MSG更新しました。");
  });

  res.redirect("/table");
});

//position変更はここから
router.post("/positionSet", isAuthenticated, (req, res, next) => {

  console.log("req.body.setting_id1_submit= " + req.body.setting_id1_submit);
  console.log("req.body.setting_id2_submit= " + req.body.setting_id2_submit);
  console.log("req.body.setting_position1_submit= " + req.body.setting_position1_submit);
  console.log("req.body.setting_position2_submit= " + req.body.setting_position2_submit);

  if (req.body.setting_id1_submit.length){
    var rec1 = {
      position: req.body.setting_position2_submit
    };
    new UserStatusData().where("user_id","=", req.body.setting_id1_submit).save(rec1, { patch: true }).then(result => {
      console.log("REC1を更新しました。");
    });
  }

  if (req.body.setting_id2_submit.length){
    var rec2 = {
      position: req.body.setting_position1_submit
    };
    new UserStatusData().where("user_id","=", req.body.setting_id2_submit).save(rec2, { patch: true }).then(result => {
      console.log("REC2を更新しました。");
    });
  }

  res.redirect("/table");
});


module.exports = router;
