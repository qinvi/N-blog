const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signup')
})

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {
  let name = req.fields.name // 姓名
  let password = req.fields.password
  let repassword = req.fields.repassword
  let gender = req.fields.gender
  let bio = req.fields.bio
  let avatar = req.files.avatar.path.split(path.sep).pop()

  let params = { name, password, repassword, gender, bio, avatar }
  // 参数校验
  verifyParams(params, req, res)

  // 数据写入数据库
  params.password = sha1(password)
  writeDataToDB(params, req, res)

  // 数据库查询

})

/**
 * 参数校验
 * @param {Object} params
 * @param {Object} req
*  @param {Object} res
 */
function verifyParams(params, req, res) {
  const { name, password, repassword, gender, bio } = params
  try {
    if (!(name.length >=1 && name.length <= 10)) {
      throw new Error('名字请限制在1～10个字符')
    }
    if (!['m', 'f', 'x'].includes(gender)) {
      throw new Error('性别只能是m, f, x')
    }
    if (!(bio.length >=1 && bio.length <= 30)) {
      throw new Error('个人简介限制在1～30个字符')
    }
    if (!req.files.avatar.name) {
      throw  new Error('缺少头像')
    }
    if (password.length < 6) {
      throw new Error('密码至少6个字符')
    }
    if (repassword !== password) {
      throw new Error('再次密码不一致')
    }
  } catch (e) {
    // 注册失败，异步删除上传的头像
    if (fs.existsSync(req.files.avatar.path)) fs.unlink(req.files.avatar.path)
    req.flash('error', e.message)
    return res.redirect('/signup')
  }
}

/**
 * 数据写入数据库
 * @param {Object} user
 * @param {Object} req
 * @param {Object} res
 */
function writeDataToDB(user, req, res) {
  UserModel.create(user)
    .then(function(result) {
      user = result.ops[0] // 写入数据库后user
      delete user.password
      req.session.user = user
      // 写入flash
      req.flash('success', '注册成功')
      // 跳转到首页
      res.redirect('/posts')
    })
    .catch(function(e) {
      if (fs.existsSync(req.files.avatar.path)) fs.unlink(req.files.avatar.path)

      // 用户名被占用
      if (e.message.match('duplicate key')) {
        req.flash('error', '用户名已被占用')
        return res.redirect('/signup')
      }
    })
}

module.exports = router
