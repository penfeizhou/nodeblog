var settings = require('../settings');
var url = 'mongodb://' + settings.username + ':' + settings.password + '@' + settings.host + ':' + settings.port + '/' + settings.db;
var MongoClient = require('mongodb').MongoClient;
function DBM() {
};
module.exports = DBM;
DBM.open = function (act) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log("Connected error" + err);
        }
        act(err, db);
    });
}