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

// var datadepartment;
// function getDepartment() {
//   new departmentdata()
//     .fetchAll()
//     .then(collection => {
//       datadepartment = collection.toArray();
//     })
//     .catch(err => {
//       response
//         .status(500)
//         .json({ error: true, data: { message: err.message } });
//     });

//   return datadepartment;
// }

var datadepartment;
// function getDepartment() {
//   db.serialize(() =>{
//     db.all("select * from department_list", (err, rows) =>{
//       if (!err) {
//         datadepartment = rows;
//       }
//     });
//   });
// }
// getDepartment();

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
// function getStatus() {
//   db.serialize(() =>{
//     db.all("select * from status_list", (err, rows) =>{
//       if (!err) {
//         datastatus = rows;
//       }
//     });
//   });
// }
// getStatus();

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
// function getKyakusaki() {
//   db.serialize(() =>{
//     db.all("select * from kyakusaki_list", (err, rows) =>{
//       if (!err) {
//         datakyakusaki = rows;
//       }
//     });
//   });
// }
// getKyakusaki();

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

var datashanai;
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


// var datacontact;
// function getMsg() {
//   new contactdata()
//     .where("id", "=", 1)
//     .fetch()
//     .then(record => {
//       datacontact = record.attributes.msg;
//     });
// }

var datacontact;
// function getMsg() {
//   db.serialize(() =>{
//     db.all("select * from contact where id = 1", (err, rows) =>{
//       if (!err) {
//         rows.forEach(element => {
//           datacontact = element.msg;
//         });
//       }
//     });
//   });
// }
// getMsg();

// var datacontact;
// function readMsg(){
//   return new Promise(resolve =>{
//     db.serialize(() => {
//       db.all("select * from contact where id = 1", (err, rows) =>{
//           console.log(rows);
//       if (!err) {
//         datacontact = rows[0].msg;
//       }
//       });
//       db.run("SELECT 0", () => {
//           resolve();
//       });
//     })
//   })
// }

// async function getMsg(){
//   await readMsg();
//   console.log("GET中：" + datacontact);
// }

// getMsg();


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

  function Callback(){ //callback start
  
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
      '" THEN "00" ELSE name END as sort2 FROM users_status LEFT JOIN users ON users_status.user_id = users.id ORDER BY sort1,sort2 ASC;';
  
    Bookshelf.knex.raw(sql).then(collection => {
      collection.forEach(element => {
        var d1 = moment(new Date(element.updated_at));
        d1.locale("ja");
        d1.tz("Asia/Tokyo");
        var dstr = d1.fromNow();
  
        usertabledata.push({
          id: element.user_id,
          table_id: element.id,
          username: element.username,
          user_admin: element.admin,
          name: element.name,
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
        title: "行先情報一覧",
        finding: "名前または部署名などを入力",
        login: login,
        req_user: req_user,
        usertabledata: usertabledata,
        usertabledata_manage: usertabledata_manage,
        datastatus: datastatus,
        datakyakusaki: datakyakusaki,
        datashanai: datashanai,
        msg: datacontact,
        datadepartment: datadepartment
      };
      console.log("IndexページGET連絡：" + datacontact);
  
      res.render("index", data);
  
    });

  } //callback end

  function getDatas(){
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
        db.all("select * from contact where id = 1", (err, rows) =>{
          if (!err) {
            rows.forEach(element => {
              datacontact = element.msg;
            });
          }
        });
        db.run("SELECT 0", () => resolve());
      });
    });
  }
  async function doGetDatas(){
    await getDatas();
    console.log("【index】DATA取り込み完了。Callback処理を呼び出す......");
    Callback();
  }

  console.log("public page accessed.");
  doGetDatas();

  
});

//SQL router.getはここまで

//Bookshelf router.getはここから
// router.get('/', function(req, res, next) {

  // if (req.user == null) {
  //   var data = {
  //     title: "login",
  //     form: { name: "", password: "" },
  //     content: "<p class='error login_info'>ログインしてください。</p>"
  //   };
  //   res.render("login", data);
  //   return;
  // }

//   getStatus();
//   getKyakusaki();
//   getShanai();
//   getMsg();
//   getDepartment();

//   var usertabledata = new Array();

//   new Userdata().orderBy('department','ASC')
//     .fetchAll()
//     .then((collection) => {
//         var content = collection.toArray();
//         console.log('datacontact' + datacontact);
//         console.log('datadepartment' + datadepartment);

//         content.forEach(element => {

//             var d1 = moment(new Date(element.attributes.updated_at));
//                 d1.locale('ja');
//                 d1.tz('Asia/Tokyo');
//             var dstr = d1.fromNow();

//             usertabledata.push({
//                 id: element.attributes.id,
//                 name: element.attributes.name,
//                 information: element.attributes.information,
//                 department: element.attributes.department,
//                 status: element.attributes.status,
//                 ikisaki: element.attributes.ikisaki,
//                 time: element.attributes.time,
//                 memo: element.attributes.memo,
//                 email: element.attributes.email,
//                 updateTime : dstr
//             });
//         });

//         var data = {
//             title: '行先情報一覧',
//             finding : '名前または部署名などを入力',
//             login: req.user,
//             usertabledata: usertabledata,
//             datastatus: datastatus,
//             datakyakusaki: datakyakusaki,
//             datashanai: datashanai,
//             msg: datacontact,
//             datadepartment: datadepartment
//         };
//         res.render('index', data);
//     }).catch((err) => {
//     res.status(500).json({error: true, data: {message: err.message}});
//     });

// });
//Bookshelf router.getはここまで

//検索バー
router.post("/", isAuthenticated, (req, res, next) => {

  var login = req.session.login;
  var req_user = req.user;
  
  if (req.body.find == "") {
    res.redirect("/");
    return;
  }

  var usertabledata = new Array();
  var find_content = req.body.find;
  new UserStatusData()
    .orderBy("created_at", "DESC")
    .query(function(find) {
      find
        .where("department", "like", "%" + req.body.find + "%")
        .orWhere("name", "like", "%" + req.body.find + "%")
        .orWhere("status", "like", "%" + req.body.find + "%")
        .orWhere("ikisaki", "like", "%" + req.body.find + "%")
        .orWhere("information", "like", "%" + req.body.find + "%")
        .orWhere("time", "like", "%" + req.body.find + "%")
        .orWhere("memo", "like", "%" + req.body.find + "%");
    })
    .fetchAll()
    .then(collection => {
      var content = collection.toArray();

      content.forEach(element => {
        var d1 = moment(new Date(element.attributes.updated_at));
        d1.locale("ja");
        d1.tz("Asia/Tokyo");
        var dstr = d1.fromNow();

        usertabledata.push({
          id: element.attributes.user_id,
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
      });

      var data = {
        title: "“" + find_content + "”の検索結果",
        finding: "状態、行先、メモ内容などでも検索可能",
        usertabledata: usertabledata,
        datadepartment: datadepartment,
        datastatus: datastatus,
        datakyakusaki: datakyakusaki,
        datashanai: datashanai,
        login: login,
        req_user: req_user,
        msg: datacontact
      };
      res.render("index", data);
    })
    .catch(err => {
      res.status(500).json({ error: true, data: { message: err.message } });
    });
});


//基本情報変更
router.post("/newuserinfo", isAuthenticated, (req, res, next) => {

  if (req.body.userinfo_information == '') {
    req.body.userinfo_information == '／';
  }

  var formatted = new Date().toFormat("YYYY/MM/DD HH24時MI分SS秒");
  if (req.body.userinfo_newpassword == ''){
    var rec_Userdata = {
      username: req.body.userinfo_name
    }
    var rec_UserStatusData = {
      name: req.body.userinfo_name,
      department: req.body.userinfo_department,
      position: req.body.userinfo_position,
      information: req.body.userinfo_information,
      email: req.body.userinfo_email
    }
    if (req.body.userinfo_email == req.body.original_email) {
      sendmail({
        from: 'a-ou@msi-net.co.jp',
        to: req.body.original_email,
        subject: 'セキュリティーに関する通知（行先管理システム）',
        text: '株式会社エム・エス・アイ　'+ req.body.userinfo_name +'様\r\n\r\nあなたの基本情報が変更されました。\r\n本人による操作でない場合は、アカウントが不正利用された可能性があります。\r\n\r\n操作の時刻：' + formatted,
      }, function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
      });
    } else {
      sendmail({
        from: 'a-ou@msi-net.co.jp',
        to: req.body.original_email,
        subject: 'セキュリティーに関する通知（行先管理システム）',
        text: '株式会社エム・エス・アイ　'+ req.body.userinfo_name +'様\r\n\r\nあなたのメールアドレスが変更されました。\r\n本人による操作でない場合は、アカウントが不正利用された可能性があります。\r\nなお、これからのセキュリティー通知が本メールアドレスに届かなくなります。\r\n\r\n操作の時刻：' + formatted,
      }, function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
      });
   }
  } else {
    let hashed_password_change = bcrypt.hashSync(req.body.userinfo_newpassword, 10);
    var rec_Userdata = {
      username: req.body.userinfo_name,
      password: hashed_password_change
    }
    var rec_UserStatusData = {
      name: req.body.userinfo_name,
      department: req.body.userinfo_department,
      position: req.body.userinfo_position,
      information: req.body.userinfo_information,
      email: req.body.userinfo_email
    }
    sendmail({
      from: 'a-ou@msi-net.co.jp',
      to: req.body.original_email,
      subject: 'セキュリティーに関する通知（行先管理システム）',
      text: '株式会社エム・エス・アイ　'+ req.body.userinfo_name +'様\r\n\r\nあなたのパスワードが変更されました。\r\n本人による操作でない場合は、アカウントが不正利用された可能性があります。\r\n\r\n操作の時刻：' + formatted,
    }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    });
  }

  new Userdata({ id: req.user.id })
    .save(rec_Userdata, { patch: true })
    .then(user => {
      return new UserStatusData().where("user_id","=", user.id)
      .save(rec_UserStatusData, { patch: true })
    })
    .then(status => {
      console.log(
      req.user.username +
        "の基本情報を更新しました：名前：" +
        req.body.userinfo_name +
        "; 部署：" +
        req.body.userinfo_department +
        "; 配置：" +
        req.body.userinfo_position +
        "; 内線：" +
        req.body.userinfo_information +
        "; 新パスワード：" +
        req.body.userinfo_newpassword +
        "; status.attributes.name：" +
        status.attributes.name
    )
      res.redirect("/logout");
      console.log("更新完了 >> ログアウトします。");
  })
});

//メール
router.post("/mail", isAuthenticated, (req, res, next) => {
  var formatted = new Date().toFormat("YYYY/MM/DD HH24時MI分SS秒");
    sendmail({
      from: req.body.mailFrom,
      to: req.body.mailTo,
      subject: req.body.subject,
      text: req.body.mail_Text + '\r\n\r\n' + formatted,
    }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    });
    res.redirect("/");
})

//まとめ編集
router.post("/editing", isAuthenticated, (req, res, next) => {

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


  if (Array.isArray(req.body.editing_id)) {

    var userId_filtered_array = new Array();
    req.body.editing_id.forEach(element => {
      if (element.slice(10) == "") {
        userId_filtered_array.push(element);
     }
    })

    var tableId_sliced_array = new Array();
    req.body.editing_id.forEach(element => {
      if (element.slice(10) != "") {
        tableId_sliced_array.push(element.slice(10));
     }
    })
    console.log(req.body.editing_id);
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
      res.redirect("/");
    })

  } else {
    if (req.body.editing_id.slice(10) == "") {
      new UserStatusData().where("id","=", req.body.editing_id)
      .save(rec, { patch: true })
      .then(status => {
        console.log("クイック編集POST：更新しました。");
        res.redirect("/");
      })
    } else {
      new UserStatusData().where("id","=", req.body.editing_id.slice(10))
      .save(rec, { patch: true })
      .then(status => {
        console.log("クイック編集POST：更新しました（テーブルユーザー）。");
        res.redirect("/");
      })
    }
  }


  // if (Array.isArray(req.body.editing_id)) {

    // function redirect_Callback(){
    //   console.log("まとめ編集POST：更新しました。");
    //   res.redirect("/");
    //   return false;
    // }
    
  //   var checkEditingTimes = 0;
  //   for (var i = 0; i < req.body.editing_id.length; i++) {
  //     console.log("req.body.editing_id[" + i + "]: " + req.body.editing_id[i]);
  //     new UserStatusData().where("user_id","=", req.body.editing_id[i])
  //       // .save(rec, { patch: true })
  //       .fetch()
  //       .then(result => {
  //         console.log("result: " + result);
  //         if (result !== null) {
  //           result.save(rec);
  //           checkEditingTimes++;
  //           console.log("checkEditingTimes: " + checkEditingTimes + " ,i: " + i);
  //           console.log("通常ユーザーのデータが更新されました。");
  //           if (checkEditingTimes == i){
  //             redirect_Callback();
  //           }
  //         } else { //useridの持たないユーザーデータの更新
  //           console.log("tableId_sliced_array[" + i + "]: " + tableId_sliced_array[i] + ", req.body.editing_id[" + i + "]: " + req.body.editing_id[i]);
  //           return new UserStatusData().where("id","=", tableId_sliced_array[i])
  //           .save(rec, { patch: true })
  //           .then(status => {
  //             checkEditingTimes++;
  //             console.log("checkEditingTimes: (tableUser)" + checkEditingTimes + " ,i: " + i);
  //             console.log("テーブルユーザーのデータが更新されました。");
  //             if (checkEditingTimes == i){
  //               redirect_Callback();
  //             }
  //           });
  //         }
  //       })
        
  //   }
  // } else {  //quick edit
    
  //   console.log("req.body.editing_id: " + req.body.editing_id);
  //   new UserStatusData().where("user_id","=", req.body.editing_id)
  //     // .save(rec, { patch: true })
  //     .fetch()
  //     .then((result) => {
  //       console.log("result: " + result);
  //       if (result !== null) {
  //         result.save(rec);
  //         console.log("クイック編集POST：更新しました。");
  //         res.redirect("/");
  //         return false;
  //       } else {
  //         var tableId_tmp = req.body.editing_id.slice(10);
  //         console.log("tableId_tmp(quick): " + tableId_tmp);
  //         return new UserStatusData().where("id","=", tableId_tmp)
  //         .save(rec, { patch: true })
  //         .then(status => {
  //           console.log("クイック編集POST：更新しました（テーブルユーザー）。");
  //           res.redirect("/");
  //         })
  //       }
  //     });
  // }
});

router.post("/contact", isAuthenticated, (req, res, next) => {

  console.log("req.body = " + req.body.msg);
  var rec = {
    msg: req.body.msg
  };
  new contactdata({ id: 1 }).save(rec, { patch: true }).then(result => {
    console.log("連絡事項更新：更新しました。" + "result:"+ result.attributes.msg);
    res.redirect("/");
    });
    
});


router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/login");
});

module.exports = router;
