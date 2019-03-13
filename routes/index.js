// 路由的主要处理逻辑

module.exports = function(app) {
    app.get('/', function(req, res) { // 跳到到用户的文章页
        res.redirect('/posts')
    })
    // 加载中间件
    app.use('/signup', require('./signup'))
    app.use('/signin', require('./signin'))
    app.use('/signout', require('./signout'))
    app.use('/posts', require('./posts'))
    app.use('/comments', require('./comments'))
    app.use(function(req, res) {
      if (!res.headersSent) {
        res.status(404).render('404')
      }
    })
}
