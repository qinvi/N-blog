const path = require('path')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const config = require('config-lite')(__dirname)
const routes = require('./routes')
const pkg = require('./package')

const app = express()

// 设置模板目录
app.set('views', path.join(__dirname, 'views'))
// 设置模板引擎
app.set('view engine', 'ejs')

// 静态文件中间件
app.use(express.static(path.join(__dirname, 'public')))
// session中间件
app.use(session({
  name: config.session.key, // 设置cookie中保存session id的字段
  secret: config.session.secret, // 通过设置secret来计算hash值并放在cookie中，防篡改
  resave: true, // 强制更新session
  saveUninitialized: false, // 设置为false,强制创建一个session,尽管客户没有登录
  cookie: {
    maxAge: config.session.maxAge
  },
  store: new MongoStore({ // 将session存储到mongodb
    url: config.mongodb
  })
}))
// flash中间件，显示通知
app.use(flash())

// express-formidable处理form表单数据
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname,  'public/img'), // 上传目录
  keepExtensions: true // 保留后缀
}))

// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
}
// 设置模板常用的全局变量
app.use(function(req, res, next) {
  res.locals.user = req.session.user
  res.locals.success = req.flash('success').toString()
  res.locals.error = req.flash('error').toString()
  next()
})

routes(app);

app.listen(config.port, function() {
  console.info(`${pkg.name} listening on port ${config.port}`)
})

