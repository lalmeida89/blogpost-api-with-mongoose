const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, runServer, closeServer } = require('../server');

const expect = chai.expect;
chai.use(chaiHttp);

function lorem() {
  return (
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod " +
    "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, " +
    "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo " +
    "consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse " +
    "cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non " +
    "proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  );
}

describe('Blog Posts', function(){
  before(function(){
    return runServer()
  })
  after(function(){
    return closeServer()
  })
  it('should list blog posts on GET', function(){
    return chai.request(app)
      .get('/blog-posts')
      .then(function(res){
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body).to.be.an('array')
        expect(res.body.length).to.be.at.least(1)
        const expectedKeys = ['id', 'title', 'content', 'author']
        res.body.forEach(function(post){
          expect(post).to.be.an("object")
          expect(post).to.include.keys(expectedKeys)
        })
      })
  })
  it('should add new blog post on POST', function(){
    const newPost = {
      title:'blog title test',
      content: lorem(),
      author: 'bob burnquist'
    }
    return chai.request(app)
      .post('/blog-posts')
      .send(newPost)
      .then(function(res){
        newPost['id'] = res.body.id
        newPost['publishDate'] = res.body.publishDate
        expect(res.body).to.deep.equal(newPost)
        expect(res).to.have.status(201)
        expect(res).to.be.json;
        expect(res.body.id).to.not.equal(null)
        expect(res.body).to.be.an('object')
      })
  })
  it('should throw an error with bad data on POST', function(){
    const badPostReq = {}
    return chai.request(app)
      .post('/blog-posts')
      .send(badPostReq)
      .then(function(res){
        expect(res).to.have.status(400)
      })
  })
  it('should update post on PUT', function(){
    return chai.request(app)
      .get('/blog-posts')
      .then(function(res){
        const updateData = Object.assign(res.body[0], {
          title: 'test title',
          content: 'test content'
        })
        return chai.request(app)
          .put(`/blog-posts/${res.body[0].id}`)
          .send(updateData)
          .then(function(res) {
            expect(res).to.have.status(204)
          })
      })
  })
  it('should delete post on DELETE', function(){
    return chai.request(app)
      .get('/blog-posts')
      .then(function(res){
        return chai.request(app)
          .delete(`/blog-posts/${res.body[0].id}`)
          .then(function(res){
            expect(res).to.have.status(204)
          })
      })
  })
})
