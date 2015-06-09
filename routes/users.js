var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.render('boot', {
        title: '标题',
        body: '<p> 正文</p>'
    });
});

module.exports = router;
