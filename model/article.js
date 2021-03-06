var mongodb = require('./db'),
    markdown = require('markdown').markdown;
function Article(name, title, tags, content) {
    this.name = name;
    this.title = title;
    this.tags = tags;
    this.content = content;
}

module.exports = Article;

//存储一篇文章及其相关信息
Article.prototype.save = function (callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        content: this.content,
        tags: this.tags,
        comments: [],
        pv: 0
    };
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
            //将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                db.close();
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null);//返回 err 为 null
            });
        });
    });
};

//读取文章及其相关信息
Article.getAll = function (name, callback) {
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
            var query = {};
            if (name) {
                query.name = name;
            }
            //根据 query 对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function (err, docs) {
                db.close();
                if (err) {
                    return callback(err);//失败！返回 err
                }
                //解析 markdown 为 html
                docs.forEach(function (doc) {
                    try {
                        doc.content = markdown.toHTML(doc.content);
                    } catch (e) {
                        console.log('Caught exception: ' + e);
                    }
                });
                callback(null, docs);//成功！以数组形式返回查询的结果
            });
        });
    });
};
//获取一篇文章
Article.getOne = function (name, day, title, callback) {
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
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                if (doc) {
                    //每访问 1 次，pv 值增加 1
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: {"pv": 1}
                    }, function (err) {
                        db.close();
                        if (err) {
                            console.log('Caught exception: ' + err);
                        }
                    });
                    //解析 markdown 为 html
                    try {
                        doc.content = markdown.toHTML(doc.content);
                        doc.comments.forEach(function (comment) {
                            comment.content = markdown.toHTML(comment.content);
                        });
                    } catch (e) {
                        console.log('Caught exception: ' + e);
                    }
                }
                db.close();
                callback(null, doc);//返回查询的一篇文章
            });
        });
    });
};
//返回原始发表的内容（markdown 格式）
Article.edit = function (name, day, title, callback) {
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
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown 格式）
            });
        });
    });
};

//更新一篇文章及其相关信息
Article.update = function (name, day, title, newTitle, tags, post, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('articles', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name": name,
                "time.day": day,
                "title": title,
            }, {
                $set: {content: post, tags: tags, title: newTitle}
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
//删除一篇文章
Article.remove = function (name, day, title, callback) {
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
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
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

//一次获取十篇文章
Article.getTen = function (name, page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 articles 集合
        db.collection('articles', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //使用 count 返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    db.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析 markdown 为 html
                    docs.forEach(function (doc) {
                        try {
                            doc.post = markdown.toHTML(doc.post);
                        } catch (e) {
                            console.log('Caught exception: ' + e);
                        }
                    });
                    callback(null, docs, total);
                });
            });
        });
    });
};

//返回所有文章存档信息
Article.getArchive = function (callback) {
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
            //返回只包含 name、time、title 属性的文档组成的存档数组
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
//返回所有标签
Article.getTags = function (callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", function (err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
//返回含有特定标签的所有文章
Article.getTag = function (tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //查询所有 tags 数组内包含 tag 的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};