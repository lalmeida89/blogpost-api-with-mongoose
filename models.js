const mongoose = require('mongoose')
mongoose.Promise = global.Promise;

const blogpostSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String
  },
  content: {type: String, required: true}
})

blogpostSchema.virtual('authorName').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogpostSchema.methods.serialize = function(){
  return {
    id: this._id,
    title: this.title,
    author: this.authorName,
    content: this.content,
    publishDate: this.publishDate
  }
}

const BlogPost = mongoose.model('Blogpost', blogpostSchema, 'blogposts')
module.exports = {BlogPost}
