const marked = require('marked')
const Comment = require('../lib/mongo').Comment

// Comment插件添加
Comment.plugin('contentToHtml', {
  afterFind: function(comments) {
    return comments.map(function(comment) {
      comment.content = marked(comment.content)
      return comment
    })
  }
})

module.exports = {
  create: function(comment) { // 创建留言
    return Comment.create(comment).exec()
  },
  getCommentById: function(commentId) { // 通过id获取相应留言
    return Comment.findOne({ _id: commentId }).exec()
  },
  delCommentById: function(commentId) { // 通过id删除该留言
    return Comment.deleteOne({ _id: commentId }).exec()
  },
  delCommentByPostId: function(postId) { // 删除postId相应文章的所有留言
    return Comment.deleteMany({ postId: postId })
  },
  getComments: function(postId) { // 获取postId对应的文章的所有留言
    return Comment
      .find({ postId: postId })
      .populate({ path: 'author', model: 'User' }) // 将User的字段跟留言的author相关联
      .sort({ _id: -1 }) // 按时间降序
      .addCreatedAt()
      .contentToHtml()
      .exec()
  },
  getCommentsCount: function(postId) { // 留言数获取
    return Comment.count({ postId: postId }).exec()
  }
}
