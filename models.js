const mongoose = require('mongoose')
mongoose.Promise = global.Promise;

const commentSchema = mongoose.Schema({
  content: String
})

const authorSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  userName: {
    type: String,
    unique: true
  }
})

const blogpostSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author'},
  content: {type: String, required: true},
  comments: [commentSchema]
})

blogpostSchema.pre('find', function(next){
  this.populate('author')
  next()
})

blogpostSchema.pre('findOne', function(next){
  this.populate('author')
  next()
})

blogpostSchema.virtual('authorName').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim();
})

authorSchema.methods.serialize = function(){
  return {
    id: this._id,
    author: this.firstName +' '+ this.lastName,
    userName: this.userName
  }
}

blogpostSchema.methods.serialize = function(){
  return {
    id: this._id,
    title: this.title,
    author: this.authorName,
    content: this.content,
    publishDate: this.publishDate,
    comments: this.comments
  }
}

const Author = mongoose.model('Author', authorSchema)
const BlogPost = mongoose.model('Blogpost', blogpostSchema, 'blogposts')
module.exports = {Author, BlogPost}
