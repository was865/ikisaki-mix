var express = require("express");
var router = express.Router();
var sqlite3 = require("sqlite3");
var moment = require("moment-timezone");
var datautils = require("date-utils");
const { response } = require("express");

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

//SQL router.GETはここから
router.get("/", function(req, res, next) {

  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>ログインしてください。</p>"
    };
    res.render("login", data);
  }

  getStatus();
  getKyakusaki();
  getShanai();
  getMsg();
  getDepartment();
 
  var usertabledata = new Array();
  var usertableMap = new Map();

  new Userdata().fetchAll().then((collection) => {
    var content = collection.toArray();
    content.forEach(element => {
      var d1 = moment(new Date(element.attributes.updated_at));
      d1.locale("ja");
      d1.tz("Asia/Tokyo");
      var dstr = d1.fromNow();

      usertabledata.push({
        id: element.attributes.id,
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

    var data = {
      usertabledata: usertabledata,
      datastatus: datastatus,
      datakyakusaki: datakyakusaki,
      datashanai: datashanai,
      msg: datacontact,
      datadepartment: datadepartment,
      usertableMap: usertableMap
    };

    res.render("table", data);
  });
});

// updateはここから
router.post("/update", function(req, res, next) {
  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>ログインしてください。</p>"
    };
    res.render("login", data);
  }
  console.log(req.body);
  
  for (var i = 0; i < req.body.id.length; i++) {
    if (req.body.ikisaki == undefined || req.body.ikisaki.length == 0) {
      req.body.ikisaki = "";
    }
    if (req.body.time == undefined || req.body.time.length == 0) {
      req.body.time = "";
    }

    var rec = {
      status: req.body.status,
      ikisaki: req.body.ikisaki,
      time: req.body.time,
      memo: req.body.memo
    };
    new Userdata({ id: req.body.id[i] })
      .save(rec, { patch: true })
      .then(result => {
        console.log("更新完了しました。");
        res.redirect("/table");
      });
  }

});

// msgはここから
router.post("/contact", (req, res, next) => {
  if (req.session.login == null) {
    var data = {
      title: "login",
      form: { name: "", password: "" },
      content: "<p class='error login_info'>ログインしてください。</p>"
    };
    res.render("login", data);
  }

  console.log("req.body = " + req.body.msg);
  var rec = {
    msg: req.body.msg
  };
  new contactdata({ id: 1 }).save(rec, { patch: true }).then(result => {
    console.log("更新しました。");
  });

  res.redirect("/table");
});


module.exports = router;
