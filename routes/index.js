var crypto = require('crypto'),
    User = require('../model/user.js'),
    Article = require('../model/article.js'),
    Comment = require('../model/comment.js');
module.exports = function (app) {
    app.get('/', function (req, res) {
        //判断是否是第一页，并把请求的页数转换成 number 类型
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //查询并返回第 page 页的 10 篇文章
        Article.getTen(null, page, function (err, articles, total) {
            if (err) {
                articles = [];
            }
            res.render('index', {
                title: '主页',
                articles: articles,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + articles.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name;
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });
        //检查用户名是否已经存在
        User.get(newUser.name, function (err, user) {
            if (err) {
                return res.json({error: '注册失败'});
            }
            if (user) {
                return res.json({error: '用户名已存在'});

            }
            //如果不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    return res.json({error: '注册失败'});
                }
                return res.json({sucess: '注册成功'});
            });
        });
    });
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, user) {
            if (err) {
                return res.json({error: '登录失败'});
            }
            if (!user) {
                return res.json({error: '用户不存在'});
            }
            if (password != user.password) {
                return res.json({error: '密码错误'});
            }
            req.session.user = user;
            res.json({sucess: '登录成功'});
            return res.redirect('/');
        });
    });
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        if (!req.body.title) {
            return res.json({error: '标题不能为空'});
        }
        if (!req.body.content) {
            return res.json({error: '内容不能为空'});
        }
        var article = new Article(req.session.user.name, req.body.title, req.body.tags, req.body.content);
        article.save(function (err) {
            if (err) {
                return res.json({error: '保存失败'});
            }
            return res.json({sucess: '发布成功', name: req.session.user.name});
        });
    });
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');//登出成功后跳转到主页
    });
    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!');
            res.redirect('back');//返回之前的页面
        }
        next();
    }

    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        req.flash('success', '文件上传成功!');
        res.redirect('/upload');
    });
    app.get('/u/:name', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //检查用户是否存在
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/');
            }
            //查询并返回该用户第 page 页的 10 篇文章
            Article.getTen(user.name, page, function (err, articles, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    articles: articles,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 10 + articles.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    app.get('/u/:name/:day/:title', function (req, res) {
        Article.getOne(req.params.name, req.params.day, req.params.title, function (err, article) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                article: article,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/u/:name/:day/:title', function (req, res) {
            var currentUser = req.session.user;
            Article.getOne(req.params.name, req.params.day, req.params.title, function (err, article) {
                if (err) {
                    req.flash('error', err);
                }
                var date = new Date(),
                    time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
                var newComment;
                if (currentUser) {
                    newComment = new Comment(currentUser.name, time, currentUser.email, "/u/" + currentUser.name, req.body.content);
                }
                else {
                    newComment = new Comment(req.body.cname, time, req.body.cemail, req.body.cwebsite, req.body.content);
                }
                newComment.save(function (err) {
                    if (err) {
                        req.flash('error', err);
                        return res.redirect('back');
                    }
                    req.flash('success', '留言成功!');
                    res.redirect('back');
                }, article);
            });

        }
    )
    ;
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Article.edit(currentUser.name, req.params.day, req.params.title, function (err, article) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                article: article,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        if (!req.body.title) {
            return res.json({error: '标题不能为空'});
        }
        if (!req.body.content) {
            return res.json({error: '内容不能为空'});
        }
        Article.update(currentUser.name, req.params.day, req.params.title, req.body.title, req.body.tags, req.body.content, function (err) {
            if (err) {
                return res.json({error: '保存失败'});
            }
            return res.json({sucess: '发布成功', name: req.session.user.name});
        });
    });
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Article.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('/');
        });
    });
    app.get('/archive', function (req, res) {
        Article.getArchive(function (err, articles) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: '存档',
                articles: articles,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/tags', function (req, res) {
        Article.getTags(function (err, tags) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                tags: tags,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/tags/:tag', function (req, res) {
        Article.getTag(req.params.tag, function (err, articles) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                articles: articles,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
};
process.on('uncaughtException', function (err) {
    console.log('Caught exception in article.js: ' + err);
});