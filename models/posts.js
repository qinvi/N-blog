const Post = require('../lib/mongo').Post
const Comment = require('./comments')
const marked = require('marked')


// 添加Post特定的插件
Post.plugin('contentToHtml', {
  afterFind: function(posts) {
    return posts.map(function(post) {
      post.content = marked(post.content)
      return post
    })
  },
  afterFindOne: function(post) {
    if (post) {
      post.content = marked(post.content)
    }
    return post
  }
})
Post.plugin('addCommentCount', {
  afterFind: function(posts) {
    return Promise.all(posts.map(function(post) {
      return Comment
        .getCommentsCount(post['_id'])
        .then(function(count) {
          post.commentsCount = count
          return post
        })
    }))
  },
  afterFIndOne: function(post) {
    if (post) {
      return Comment.getCommentsCount(post['_id']).then(function(count) {
        post.commentsCount = count
        return post
      })
    }
    return post
  }
})

module.exports = {
  create: function(post) { // 创建一篇文章
    return Post.create(post).exec()
  },
  getPostById: function(postId) { // 通过id查询文章
    return Post
      .findOne({ _id: postId })
      .populate({ path: 'author', model: 'User' }) // populate: 将User保存的字段值copy到Post的author字段里
      .addCreatedAt()
      .addCommentCount()
      .contentToHtml()
      .exec()
  },
  getPosts: function(author) { // 返回特定用户文章或者所有用户文章
    const query = {}
    if (author) {
      query.author = author['_id']
    }
    return Post
      .find(query)
      .populate({ path: 'author', model: 'User'})
      .sort({ _id: -1 })
      .addCreatedAt()
      .addCommentCount()
      .contentToHtml()
      .exec()
  },
  incPv: function(postId) { // 相应文章浏览数+1
    return Post
      .update({ _id: postId }, { $inc: { pv: 1 } } )
  },
  getRawPostById: function(postId) { // 获取原生文章
    return Post
      .findOne({ _id: postId })
      .populate({ path: 'author', model: 'User'})
      .exec()
  },
  updatePostById: function(postId, data) { // 更新特定文章
    return Post
      .update({ _id: postId}, { $set: data })
      .exec()
  },
  delPostById: function(postId) { // 删除文章
    return Post
      .deleteOne({ _id: postId })
      .exec()
      .then(function(res) {
        if (res.result.ok && res.result.n > 0) { // res.result是个啥
          return Comment.delCommentByPostId(postId)
        }
      })
  }
}
