// Define the app module with ngRoute dependency
var bookmarkApp = angular.module('bookmarkApp', ['ngRoute']);

// Configure route provider
bookmarkApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'DisplayController',
      templateUrl: 'display.html'
    })
    .when('/save', {
      controller: 'SaveController',
      templateUrl: 'save.html'
    })
    .otherwise({ redirectTo: '/' });
});

// Controller for handling displaying of the bookmarks and associated functions
bookmarkApp.controller('DisplayController', function($scope, $http) {

  // When the user lands on the display page, '/', request the saved bookmarks from the server
  $http.get("/bookmarks")
    .then(function(response) {
      // Attach the booksmarks to the scope so that they can be displayed
      $scope.bookmarks = response.data.message;
      // Console the reponse during development
      console.log(response);
    });

  // Attach the deleteBookmark function to the scope so that it can be used
  // with ng-click. This function will delete the bookmark when the user
  // clicks on the trash icon
  $scope.deleteBookmark = function(title) {
    $http.post("/delete", { "title": title })
      .then(function(response) {
        // if response.data.status is ok, we've deleted the bookmark
        if (response.data.status === 'ok') {
          // now remove the bookmark from the $scope to update the view
          removeBookmarkFromView(title, $scope.bookmarks);
          console.log($scope.bookmarks);
        } else {
          throw new Error('Error deleting your bookmark.');
        }
      })
      .catch(function(err) {
        alert(err);
      });
  };
}); // end DisplayController

// function to remove the deleted bookmark from the $scope and hence the view
function removeBookmarkFromView(title, bookmarks) {
  // bookmarks is an array of objects. each object has a title property
  // that we need to match on in order to remove it
  for (var i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].title === title) {
      bookmarks.splice(i, 1);
      break;
    }
  }
}
