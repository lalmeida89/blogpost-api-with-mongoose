const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { BlogPost } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(express.json());

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

app.get('/blogposts/:id', (req, res) => {
  BlogPost.findById(req.params.id)
    .then(blogpost => res.json(blogpost.serialize()))
    .catch(err => {
      console.error(err)
      res.status(500).json({ message: 'Internal server error'})
    })
})

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

app.post('/blogposts', (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  const item = BlogPosts.create(
    req.body.title,
    req.body.content,
    req.body.author
  );
  res.status(201).json(item);
});

// add endpoint for PUT requests to update blogposts. it should
// call `BlogPosts.update()` and return the updated post.
// it should also ensure that the id in the object representing
// the post matches the id of the path variable, and that the
// following required fields are in request body: `id`, `title`,
// `content`, `author`, `publishDate`

app.put('/blogposts/:id', (req, res) => {
  const requiredFields = ['id', 'title', 'content', 'author', 'publishDate'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  if (req.params.id !== req.body.id) {
    const message = `Request path id (${
      req.params.id
    }) and request body id ``(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).send(message);
  }
  console.log(`Updating blog post with id \`${req.params.id}\``);
  BlogPosts.update({
    id: req.params.id,
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    publishDate: req.body.publishDate
  });
  res.status(204).end();
});

// add endpoint for DELETE requests. These requests should
// have an id as a URL path variable and call
// `BlogPosts.delete()`

app.delete('/blogposts/:id', (req, res) => {
  BlogPosts.delete(req.params.id);
  console.log(`Deleted blog post with id \`${req.params.id}\``);
  res.status(204).end();
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
