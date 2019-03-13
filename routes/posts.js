

const express = require('express')
const router = express.Router()

const checkLogin = require('../middlewares/check').checkLogin
const PostModel = require('../models/posts')

// GET /posts 所有用户或者特定用户的文章页
//   eg: GET /posts?author=xxx
router.get('/', function (req, res, next) {
  const author = req.session.user

  PostModel.getPosts(author)
    .then(function (posts) {
      res.render('posts', {
        posts: posts
      })
    })
    .catch(next)
})

// POST /posts/create 发表一篇文章
router.post('/create', checkLogin, function (req, res, next) {
  const author = req.session.user._id
  const title = req.fields.title
  const content = req.fields.content

  const params = { author, title, content }
  const errorMes = { title: '请填写标题', content: '请填写内容' }
  // 校验参数
  verifyParams(params, errorMes, req, res)

  // 数据库写入
  writeDataToDB(params, req, res, next)
})

/**
 * 数据库写入
 * @param {Object数据库写入} data
 * @param {Object数据库写入} req
 * @param {Object} res
 */
function writeDataToDB(data, req, res, next) {
  PostModel.create(data)
    .then(function (result) {
      // 此 post 是插入 mongodb 后的值，包含 _id
      data = result.ops[0]
      req.flash('success', '发表成功')
      // 发表成功后跳转到该文章页
      res.redirect(`/posts/${data._id}`)
    })
    .catch(next)
}

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function (req, res, next) {
  res.render('create')
})

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function (req, res, next) {
  const postId = req.params.postId

  Promise.all([
    PostModel.getPostById(postId), // 获取文章信息
    PostModel.incPv(postId)// pv 加 1
  ])
    .then(function (result) {
      const post = result[0]
      if (!post) {
        throw new Error('该文章不存在')
      }

      res.render('post', {
        post: post,
      })
    })
    .catch(next)
})

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function (req, res, next) {
  const postId = req.params.postId

  PostModel.getRawPostById(postId)
    .then(function(post) {
      if (!post) {
        throw new Error('文章不存在')
      }
      res.render('edit', {
        post: post
      })
    })
    .catch(next)
})

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function (req, res, next) {
  // author title content
  const title = req.fields.title
  const content = req.fields.content
  const postId = req.params.postId

  const params = { content, title }
  const errorMes = { title: '请填写标题', title: '请填写内容' }
  // 参数校验
  verifyParams(params, errorMes, req, res)

  // 数据库写入
  PostModel.updatePostById(postId, params)
    .then(function() {
      req.flash('success', '编辑文章成功')
      res.redirect(`/posts/${postId}`) // 跳转到文章新的详情页
    })
    .catch(next)
})

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  PostModel.delPostById(postId)
  .then(function() {
    req.flash('success', '删除文章成功')
    res.redirect('/posts')
  })
  .catch(next)
})

/**
 * 参数校验、目前只校验length
 * @param {Object} params
 * @param {Object} errorMes 错误报告信息
 * @param {Object} req
 * @param {Object} res
 */
function verifyParams(params, errorMes, req, res) {
  try {
    Object.keys(params).forEach(key => {
      if (!params[key].length) throw new Error(errorMes[key])
    })
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }
}

module.exports = router
