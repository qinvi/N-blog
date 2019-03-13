const User = require('../lib/mongo').User
module.exports = {
  create: function(user) {
    return User.create(user).exec()
  },
  getUserByName: function(name) {
    return User
      .findOne({ name: name })
      .addCreatedAt() // 查找记录状态
      .exec()
  }
}
