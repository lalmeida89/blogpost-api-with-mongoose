const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { BlogPost } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(express.json());

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
  const reqFields = ['title', 'author', 'content']
  for (let i = 0; i < reqFields.length; i++) {
    const field = reqFields[i];
    if(!(field in req.body)){
      const msg = `Missing ${field} in request body`;
      console.error(msg);
      return res.status(400).send(msg)
    }
  }
  BlogPost.create({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  })
  .then(post => res.status(201).json(post.serialize()))
  .catch(err => {
    console.error(err)
    res.status(500).json({message:'internal server error'})
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
  const updateableFields = ['title', 'content', 'author'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field]
    }
  })
  BlogPost.findByIdAndUpdate(req.params.id, {$set: toUpdate}, { new: true })
  .then(post => res.status(204).end())
  .catch(err => res.status(500).json({message: 'internal sever error'}))
});

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
