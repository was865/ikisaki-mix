var express = require('express');
var router = express.Router();
var sqlite3 = require("sqlite3");

var db = new sqlite3.Database("ikisaki.sqlite3");

var datacontact;

router.get('/', (req, res, next) => {

    function readMsg(){
        return new Promise(resolve =>{
          db.serialize(() => {
            db.all("select * from contact where id = 1", (err, rows) =>{
                console.log(rows);
            if (!err) {
                datacontact = rows;
                console.log("DB: datacontact[0].msg: " + datacontact[0].msg);
            }
            });
            db.run("SELECT 0", () => {
                resolve();
            });
          })
        })
      }
      
    async function doSomething(){
        await readMsg();
        console.log("datacontact[0].msg: " + datacontact[0].msg);
        res.json(datacontact[0]);
    }

    doSomething();

});

  module.exports = router;
