var mongodb = require('./db');

function Comment(name, time, email, website, content) {
    this.name = name;
    this.time = time;
    this.email = email;
    this.website = website;
    this.content = content;
}
module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function (callback, article) {

    var self = this;
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('articles', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //通过用户名、时间及标题查找文档，并把一条留言对象添加到该文档的 comments 数组里
            collection.update({
                "name": article.name,
                "time.day": article.time.day,
                "title": article.title
            }, {
                $push: {
                    "comments": {
                        name: self.name,
                        email: self.email,
                        website: self.website,
                        time: self.time,
                        content: self.content
                    }
                }
            }, function (err) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};