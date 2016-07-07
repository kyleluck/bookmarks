var express = require('express');
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var randtoken = require('rand-token');

var app = express();

// connect to the database
mongoose.connect('mongodb://localhost/bookmarks');

// mongodb model for bookmark
var Bookmark = mongoose.model('Bookmark', {
  title: { type: String, required: true },
  link: { type: String, required: true }
});

// use body parser with JSON
app.use(bodyParser.json());

// save a bookmark
app.post('/save', function(req, res) {
  var title = req.body.title;
  var link = req.body.link;

  // see if bookmark exists by link
  Bookmark.findOne({ link: link })
    .then(function(bookmark) {
      if (bookmark) {
        //we've found a duplicate, throw error
        throw new Error('Duplicate bookmark');
      }
      // no duplicate found, save the new bookmark
      var newbookmark = new Bookmark({
        title: title,
        link: link
      });

      // save the new bookmark to the database
      return newbookmark.save();
    })
    .then(function() {
      res.status(200).send({ "status": "ok", "message": "Bookmark saved" });
    })
    .catch(function(err) {
      res.status(400).send({ "status": "fail", "message": "There was an error: " + err.message });
    });
});

// view saved bookmarks
app.get('/bookmarks', function(req, res) {
  Bookmark.find({}, function(err, bookmarks) {
    if (err) {
      res.status(400).send({ "status": "fail", "message": "There was an error looking up bookmarks: " + err.message });
      return;
    }
    if (bookmarks) {
      // bookmarks were found
      res.status(200).send({ "status": "ok", "message": bookmarks });
    } else {
      // no bookmarks found
      res.status(400).send({ "status": "fail", "message": "You don't have any saved bookmarks" });
    }
  });
});

app.listen('8000', function() {
  console.log('listening on 8000...');
});
