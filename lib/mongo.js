const config = require('config-lite')(__dirname)
const Mongolass = require('mongolass')

const mongolass = new Mongolass() // mongodb驱动器
mongolass.connect(config.mongodb)

// sessions、user、post、comments

// user聚集
exports.User = mongolass.model('User', {
  name: { type: 'string', required: true },
  password: { type: 'string', required: true },
  avatar: { type: 'string', required: true },
  gender: { type: 'string', enum: ['m', 'f', 'x'], default: 'x' },
  bio: { type: 'string', required: true }
})

// 创建索引，根据索引搜索用户，用户名唯一
exports.User.index({ name: 1}, { unique: true }).exec()

// mongolass插件系统
const moment = require('moment')
const objectidToTimestamp = require('objectid-to-timestamp')

// 公共插件
// 个人模块插件在相应model实现
mongolass.plugin('addCreatedAt', { // 添加数据库查找时间插件
  afterFind: function(results) {
    results.forEach(function(item) {
      item.create_at = moment(objectidToTimestamp(item['_id'])).format('YYYY-MM-DD HH:mm')
    })
    return results
  },
  afterFindOne: function(result) {
    if (result) {
      result.create_at = moment(objectidToTimestamp(result['_id'])).format('YYYY-MM-DD HH:mm')
    }
    return result
  }
})

// post聚集
exports.Post = mongolass.model('Post', {
  author: { type: Mongolass.Types.ObjectId, required: true },
  title: { type: 'string', required: true },
  content: { type: 'string', required: true },
  pv: { type: 'number', default: 0 }
})

// 创建索引; 按创建时间查看用户的文章列表
exports.Post.index({ author: 1, _id: -1}).exec()

// comment聚集
exports.Comment = mongolass.model('Comment', {
  author: { type: Mongolass.Types.ObjectId, required: true },
  content: { type: 'string', required: true },
  postId: { type: Mongolass.Types.ObjectId, required: true }
})

// 创建索引, 通过文章 id 获取该文章下所有留言，按留言创建时间升序
exports.Comment.index({ postId: 1, _id: 1 }).exec()
