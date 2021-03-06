var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var credentials = require('./credentials.json');
var bcrypt = require('bcryptjs');
var randtoken = require('rand-token');
var Promise = require('bluebird');

var app = express();

mongoose.Promise = Promise; // use bluebird with mongoose

// connect to the database on mlab
mongoose.connect('mongodb://' + credentials.username + ':' + credentials.password + '@ds029051.mlab.com:29051/dc');

// mongodb model for bookmark
var Bookmark = mongoose.model('Bookmark', {
  title: { type: String, required: true },
  link: { type: String, required: true },
  hits: { type: Number, default: 0 },
  user: { type: String, required: true }
});

// mongodb model for users
var User = mongoose.model('User', {
  _id: { type: String, required: true },
  password: { type: String, required: true },
  authenticationTokens: [{ token: String, expiration: Date }],
});

// use body parser with JSON
app.use(bodyParser.json());

// serve public folder
app.use(express.static('public'));

// save a bookmark
app.post('/save', function(req, res) {
  var title = req.body.title;
  var link = req.body.link;
  var user = req.body.user;

  // see if bookmark exists by link and user
  Bookmark.findOne({ link: link, user: user })
    .then(function(bookmark) {
      if (bookmark) {
        //we've found a duplicate, throw error
        throw new Error('Duplicate bookmark');
      }
      // no duplicate found, save the new bookmark
      var newbookmark = new Bookmark({
        title: title,
        link: link,
        user: user
      });

      // save the new bookmark to the database
      return newbookmark.save();
    })
    .then(function() {
      res.status(200).json({ "status": "ok", "message": "Bookmark saved" });
    })
    .catch(function(err) {
      res.status(400).json({ "status": "fail", "message": "There was an error: " + err.message });
    });
});

// view saved bookmarks
app.post('/bookmarks', function(req, res) {
  Bookmark.find({ user: req.body.user })
    .then(function(bookmarks) {
      if (!bookmarks) {
        //no bookmarks saved
        throw new Error("You do not have any saved bookmarks.");
      }
      // we have saved bookmarks
      res.status(200).json({ "status": "ok", "message": bookmarks });
    })
    .catch(function(err) {
      res.status(400).json({ "status": "fail", "message": "There was an error: " + err.message });
    });
});

// delete a bookmarks
app.post('/delete', function(req, res) {
  var title = req.body.title;
  Bookmark.findOne({ title: title }).remove()
    .then(function() {
      res.status(200).json({ "status": "ok" });
    })
    .catch(function(err) {
      res.status(400).json({ "status": "fail", "message": "There was an error deleting your bookmark: " + err.message });
    });
});

// update hits for the bookmark
app.post('/updateHits', function(req, res) {
  var title = req.body.title;
  Bookmark.findOne({ title: title })
    .then(function(bookmark) {
      // increment hits and save the bookmark with new hit count
      bookmark.hits++;
      return bookmark.save();
    })
    .then(function() {
      res.status(200).json({ "status": "ok" });
    })
    .catch(function(err) {
      res.status(400).json({ "status": "fail", "message": "Error updating hits" });
    });
});

// handle signups
app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // has the password, create the user if the username doesn't already exist
  bcrypt.hash(password, 10, function(err, encryptedPassword) {
    if (err) {
      return res.status(400).json({ "status": "fail", "message": err.message });
    }
    User.findOne({ _id: username })
      .then(function(user) {
        if (!user) {
          return User.create({
            _id: username,
            password: encryptedPassword
          });
        } else {
          res.status(409).json({ "status": "fail", "message": "User already exists!" });
        }
      })
      .then(function() {
        //successfully created user, respond with ok
        res.status(200).json({ "status": "ok" });
      })
      .catch(function(err) {
        res.status(err.statusCode).json({ "status": "fail", "message": err.message });
      });
  });
});

// handle login
app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // find user in database
  User.findOne({ _id: username })
    .then(function(user) {
      // if user isn't found
      if (!user) {
        throw new Error("User not found");
      } else {
        // compare submitted password with encrypted password in database
        bcrypt.compare(password, user.password, function(err, response) {
          if (response) {
            var token = randtoken.generate(64);
            // set token to expire in 10 days and push to authenticationTokens array
            user.authenticationTokens.push({ token: token, expiration:  Date.now() + 1000 * 60 * 60 * 24 * 10 });
            // save user's new token
            /*
              changing to return user.save() which will go to the next .then()
              throw error which will be caught by .catch() if incorrect password
            */
            user.save(function(err) {
              if (err) {
                throw new Error("Error when saving the new user.");
              }
            });
            res.status(200).json({ "status": "ok", "token": token });
          } else {
            // incorrect password, throw error
            throw new Error("Incorrect password!");
          }
        });
      }
    })
    .catch(function(err) {
      res.status(400).json({ "status": "fail", "message": err.message });
    });
});

app.listen('8000', function() {
  console.log('listening on 8000...');
});
