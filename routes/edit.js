var express = require("express");
var router = express.Router();
var moment = require("moment-timezone");
var datautils = require("date-utils");
const { response } = require("express");
const sendmail = require('sendmail')();

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

/* GET page. */
router.get("/:id", function(req, res, next) {
  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>操作がなかったため、ログアウトされました。<br>再度ログインしてください。</p>"
    };
    res.render("login", data);
    getStatus();
    getKyakusaki();
    getShanai();
    getDepartment();
    return;
  }

  getStatus();
  getKyakusaki();
  getShanai();
  getDepartment();

  new Userdata()
    .where("id", "=", req.params.id)
    .fetch()
    .then(collection => {
      var d1 = moment(new Date(collection.attributes.updated_at));
      d1.locale("ja");
      d1.tz("Asia/Tokyo");
      var dstr = d1.fromNow();
      var data = {
        title: "行先情報",
        subtitle: "編集...",
        login: req.session.login,
        greeting: "前回のアップデート: " + dstr,
        content: collection.attributes,
        datastatus: datastatus,
        datakyakusaki: datakyakusaki,
        datashanai: datashanai,
        datadepartment: datadepartment
      };
      res.render("edit", data);
    })
    .catch(err => {
      res.status(500).json({ error: true, data: { message: err.message } });
    });
});

router.post("/:id", function(req, res, next) {
  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>操作がなかったため、ログアウトされました。<br>再度ログインしてください。</p>"
    };
    res.render("login", data);
    getStatus();
    getKyakusaki();
    getShanai();
    getDepartment();
    return;
  }

  getStatus();
  getKyakusaki();
  getShanai();
  getDepartment();

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

  console.log("管理者権限" + req.body.admin);

  if (req.body.password == undefined || req.body.password == '') {
    var rec = {
      name: req.body.name,
      department: req.body.department,
      position: req.body.position,
      information: req.body.information,
      email: req.body.email,
      status: req.body.status,
      ikisaki: req.body.ikisaki,
      time: req.body.time,
      memo: req.body.memo,
      admin: req.body.admin
    };
  } else {
    var formatted = new Date().toFormat("YYYY/MM/DD HH24時MI分SS秒");
    var rec = {
      name: req.body.name,
      department: req.body.department,
      position: req.body.position,
      information: req.body.information,
      email: req.body.email,
      status: req.body.status,
      ikisaki: req.body.ikisaki,
      time: req.body.time,
      memo: req.body.memo,
      password: req.body.password,
      admin: req.body.admin
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

  new Userdata({ id: req.body.id }).save(rec).then(model => {
    var d2 = new Date(model.attributes.updated_at);
    var dstr = d2.toFormat("YYYY年M月D日 HH24時MI分SS秒");
    var data = {
      title: "行先情報",
      subtitle: "編集済み。",
      greeting: dstr + "に更新。",
      content: model.attributes,
      datastatus: datastatus,
      datakyakusaki: datakyakusaki,
      datashanai: datashanai,
      datadepartment: datadepartment,
      login: req.session.login
    };
    res.render("edit", data);
  });
});

router.post("/:id/delete", function(req, res, next) {

  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>操作がなかったため、ログアウトされました。<br>再度ログインしてください。</p>"
    };
    res.render("login", data);
    return;
  }

  new Userdata()
    .where("id", "=", req.body.id)
    .fetch()
    .then(record => {
      record.destroy();
    })
    .then(result => {
      res.redirect("/");
    });
});

router.post("/:id/unlock", function(req, res, next) {

  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>操作がなかったため、ログアウトされました。<br>再度ログインしてください。</p>"
    };
    res.render("login", data);
    return;
  }

  new Userdata()
    .where("id", "=", req.body.id)
    .save({err_times: 0, locked_at: null},{patch:true})
    .then(result => {
      res.redirect("/");
    });
});

module.exports = router;
