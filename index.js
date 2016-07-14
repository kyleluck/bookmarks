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
  link: { type: String, required: true },
  hits: { type: Number, default: 0}
});

// use body parser with JSON
app.use(bodyParser.json());

// serve public folder
app.use(express.static('public'));

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
      res.status(200).json({ "status": "ok", "message": "Bookmark saved" });
    })
    .catch(function(err) {
      res.status(400).json({ "status": "fail", "message": "There was an error: " + err.message });
    });
});

// view saved bookmarks
app.get('/bookmarks', function(req, res) {
  Bookmark.find({})
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
      bookmark.hits++;
      return bookmark.save();
    })
    .then(function() {
      res.status(200).json({ "status": "ok" });
    })
    .catch(function(err) {
      // do thing, it's just a hits
      res.status(400).json({ "status": "fail", "message": "Error updating hits" });
    });
});

app.listen('8000', function() {
  console.log('listening on 8000...');
});
