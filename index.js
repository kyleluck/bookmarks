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
  Bookmark.findOne(
    { link: link },
    function(err, bookmark) {
      if (err) {
        res.status(400).send({ "status": "fail", "message": "There was an error checking for existing bookmark: " + err.message });
        return;
      }
      if (bookmark) {
        res.status(400).send({ "status": "fail", "message": "There is already a bookmark saved with this link" });
        return;
      } else {
        // no duplicate found, save the new bookmark
        var newbookmark = new Bookmark({
          title: title,
          link: link
        });

        // save the new bookmark to the database
        newbookmark.save(function(err) {
          if (err) {
            res.status(400).send({ "status": "fail", "message": "There was an error saving the bookmark : " + err.message });
            return;
          }
          res.status(200).send({ "status": "ok", "message": "Bookmark saved" });
        });
      }
    }
  );
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
