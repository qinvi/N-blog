const Post = require('../lib/mongo').Post
const marked = require('marked')


// 添加Post特定的插件
Post.plugin('contentToHtml', {
  afterFInd: function(posts) {
    posts.map(function(post) {
      post.content = marked(post.content)
      return post
    })
  },
  afterFIndOne: function(post) {
    if (post) {
      post.content = marked(post.content)
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
      .contentToHtml()
      .exec()
  },
  incPv: function(postId) { // 相应文章浏览数+1
    return Post
      .update({ _id: postId }, { $inc: { pv: 1 } } )
  }
}
