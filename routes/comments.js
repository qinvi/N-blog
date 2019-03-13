const express = require('express')
const router = express.Router()
const checkLogin = require('../middlewares/check').checkLogin
const CommentModel = require('../models/comments')

// POST /comments 创建一条留言
router.post('/', checkLogin, function(req, res, next) { // 创建文章留言
  const author = req.session.user['_id']
  const content = req.fields.content
  const postId = req.fields.postId

  const params = { author, content, postId }

  // 参数校验
  verifyParams(params, req, res)

  // 数据库写入
  CommentModel.create(params)
    .then(function() {
      req.flash('success', '留言成功')
      res.redirect('back')
    })
    .catch(next)
})

// GET /comments/:commentId/remove 删除一条留言
router.get('/:commentId/remove', checkLogin, function(req, res, next) { // 删除文章留言
  const commentId = req.params.commentId
  CommentModel.delCommentById(commentId)
    .then(function() {
      req.flash('success', '删除留言成功')
      res.redirect('back')
    })
    .catch(next)
})

/**
 * 参数校验
 * @param {Object} params
 * @param {Object} req
 * @param {Object} res
 */
function verifyParams(params, req, res) {
  const { content } = params
  try {
    if (!content.length) {
      throw new Error('请填写留言内容')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }
}

module.exports = router
