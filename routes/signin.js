const express = require('express')
const sha1 = require('sha1')
const router = express.Router()

const checkNotLogin = require('../middlewares/check').checkNotLogin
const UserModel = require('../models/users')

// GET /signin 登录页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('signin')
})

// POST /signin 用户登录
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name
  const password = req.fields.password

  // 参数校验
  const params = { name, password }
  verifyParams(params, req, res)

  // 数据库查询检验
  getUserFromDB(params, req, res, next)
})

/**
 * 登录逻辑处理
 * @param {Object} params
 * @param {Object} req
 * @param {Object} res
 */
function verifyParams(params, req, res) {
  const { name, password } = params
  try {
    if (!name.length) {
      throw new Error('请填写用户名')
    }
    if (!password.length) {
      throw new Error('请填写密码')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }
}

/**
 * 数据库检验
 * @param {Object} params
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 */
function getUserFromDB(params, req, res, next) {
  const { name, password } = params
  UserModel.getUserByName(name)
    .then(function(user) {
      if (!user) {
        req.flash('error', '用户不存在')
        return res.redirect('back')
      }
      if (sha1(password) !== user.password) {
        req.flash('error', '密码错误')
        return res.redirect('back')
      }
      // 登录成功
      req.flash('success', '登录成功')
      delete user.password
      req.session.user = user
      res.redirect(`/posts?author=${user['name']}`)
    })
    .catch(next)
}

module.exports = router
