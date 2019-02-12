const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { BlogPost, Author } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(express.json());

//get authors
app.get('/authors', (req, res)=> {
  Author.find()
    .then(author => {
      res.json({
        author: author.map(authors => authors.serialize())
      })
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ message: 'Error retrieving authors'})
    })
})

//post author, throw error if username already exists
app.post('/authors', (req, res) => {
  const requiredFields = ['firstName', 'lastName', 'userName']
  for (var i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i]
    if(!(field in req.body)){
      const msg = `Missing ${field} in request body`
      console.error(msg)
      res.status(400).send(msg)
    }
  }
  Author.findOne({ userName: req.body.userName})
    .then(author => {
      if(author){
        const msg = 'userName already taken'
        console.error(msg);
        res.status(400).send(msg)
      } else {
        Author.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          userName: req.body.userName
        })
        .then(author => res.status(201).json(author).serialize())
        .catch(err => {
          console.error(err)
          res.status(500).json({message: 'Something went wrong trying to create a new author'})
        })
      }
    })
})

//update existing author
app.put('/authors/:id', (req, res)=>{
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
    const msg = `request path id ${req.params.id} and request body id ${req.body.id} must match`
    console.error(msg)
    res.status(400).send(msg)
  }
  const toUpdate = {}
  const updateableFields = ['firstName', 'lastName', 'userName']
  updateableFields.forEach(field =>{
    if (field in req.body){
      toUpdate[field] = req.body[field]
    }
  })
  Author.findOne({ userName: toUpdate.userName || '', _id: {$ne : req.params.id}})
    .then(author => {
      if(author){
        const msg = 'userName already taken'
        console.error(msg);
        res.status(400).send(msg)
      } else {
        Author.findByIdAndUpdate(req.params.id, {$set : toUpdate}, {new: true})
          .then(author => res.status(200).json(author).serialize())
          .catch(err => res.status(500).json({message: 'Internal server error'}))
      }
    })
})

//delete posts by author in BlogPost and then delete the author in Authors
app.delete('/authors/:id', (req,res)=>{
  BlogPost.remove({author: req.params.id})
    .then(() => {
      Author.findByIdAndRemove(req.params.id)
        .then(() => {
          const msg = `Deleted blogposts by author ${req.params.id}`
          console.log(msg);
          res.status(204).json({message: msg})
        })
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({message: `Couldnt delete author with id ${req.params.id}`})
    })
})

//get blogposts
app.get('/blogposts', (req, res) => {
  BlogPost.find()
    .then(blogpost => {
      res.json({
        blogpost: blogpost.map(bp => bp.serialize())
      })
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal Error'})
    })
});

//get a single blogpost by id
app.get('/blogposts/:id', (req, res) => {
  BlogPost.findById(req.params.id)
    .then(blogpost => res.json(blogpost.serialize()))
    .catch(err => {
      console.error(err)
      res.status(500).json({ message: 'Internal server error'})
    })
})

//post a blogpost
app.post('/blogposts', (req,res) => {
  const reqFields = ['title', 'author_id', 'content']
  for (let i = 0; i < reqFields.length; i++) {
    const field = reqFields[i];
    if(!(field in req.body)){
      const msg = `Missing ${field} in request body`;
      console.error(msg);
      return res.status(400).send(msg)
    }
  }
  Author.findById(req.body.author_id)
    .then(author=> {
      if(author){
        BlogPost.create({
          title: req.body.title,
          content: req.body.content,
          author: req.body.id
        })
        .then(blogPost => res.status(201).json({
          id: blogPost.id,
          author: `${author.firstName} ${author.lastName}`,
          content: blogPost.content,
          title: blogPost.title,
          comments: blogPost.comments
        }))
        .catch(err => {
          console.error(err)
          res.status(500).json({message:err})
        })
      }
      else {
        const msg = 'Author not found'
        console.error(msg);
        return res.status(400).send(msg)
      }
    })
  .catch(err => {
    console.error(err)
    res.status(500).json({message:err})
  })
})

//update blogpost by id
app.put('/blogposts/:id', (req, res) => {
  console.log(req.body);
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)){
    const msg = `Request path id ${req.params.id} and request body id ${req.body.id} must match`
    console.log(req.body);
    return res.status(400).json({ error: msg})
  }
  const toUpdate = {};
  const updateableFields = ['title', 'content'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field]
    }
  })
  BlogPost.findByIdAndUpdate(req.params.id, {$set: toUpdate}, { new: true })
  .then(post => res.status(200).json({
    id: toUpdate.id,
    title: toUpdate.title,
    content: toUpdate.content
  }))
  .catch(err => res.status(500).json({message: 'internal sever error'}))
});

//delete blogpost by id
app.delete('/blogposts/:id', (req, res) => {
  BlogPost.findByIdAndRemove(req.params.id)
    .then(post => {
      console.log(`deleted post with id ${req.params.id}`);
      res.status(204).end()
    })
    .catch(err => res.status(500).json({message: 'internal server error'}))
});

app.use("*", function(req, res) {
  res.status(404).json({ message: "Not Found" });
});

let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on('error', err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
