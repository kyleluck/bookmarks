// Define the app module with ngRoute dependency
var bookmarkApp = angular.module('bookmarkApp', ['ngRoute']);

// Configure route provider
bookmarkApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'DisplayController',
      templateUrl: 'display.html'
    })
    .when('/login', {
      controller: 'LoginController',
      templateUrl: 'login.html'
    })
    .when('/register', {
      controller: 'RegisterController',
      templateUrl: 'register.html'
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
        } else {
          throw new Error('Error deleting your bookmark.');
        }
      })
      .catch(function(err) {
        alert(err);
      });
  };

  // Attach the saveBookmark function to the scope so that it can be used
  // when the form is submitted to save a new bookmark.
  $scope.saveBookmark = function() {
    $http.post("/save", { "title": $scope.title, "link": $scope.link})
      .then(function(response) {
        if (response.data.status === 'ok') {
          // if we get an ok response from the server, attach the new bookmark to the $scope
          // in order to update the view
          var newBookmark = { link: $scope.link, title: $scope.title, hits: 0 };
          $scope.bookmarks.push(newBookmark);

          // clear out link and title on the scope so the input fields are ready for a new bookmark
          $scope.link = '';
          $scope.title = '';

        } else {
          throw new Error('Error saving your bookmark.');
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  // when the user clicks a link, update the hit_count in the database
  $scope.updateHits = function(title) {
    $http.post("updateHits", { "title": title })
      .then(function() {
        // update scope so number of hits displays without refreshing the page
        return $http.get("/bookmarks");
      })
      .then(function(response) {
        // Attach the booksmarks to the scope so that they can be displayed
        $scope.bookmarks = response.data.message;
      })
      .catch(function(err) {
        console.log(err);
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

bookmarkApp.controller('LoginController', function($scope, $http, $location, $rootScope, $cookies) {
  $scope.login = function() {
    if ($scope.loginForm.$valid) {
      $http.post(API + '/login', { username: $scope.username, password: $scope.password })
        .then(function(response) {
          // if login is a success, redirect
          if (response.status === 200) {
            $scope.loginFailed = false;
            // set a cookie with the token from the database response
            $cookies.put('token', response.data.token);
            // redirect to the page they were trying to go to
            $location.path('/' + $rootScope.goHere);
          }
        })
        .catch(function(err) {
          // tell user login wasn't successful
          $scope.loginFailed = true;
        });
    }
  };
  $scope.registration = function(){
    $location.path("/register");
  };
});

bookmarkApp.controller('RegisterController', function($scope, $location, $http) {
  $scope.register = function() {
    $http.post(API + '/signup', { username: $scope.username, password: $scope.password })
      .then(function(response) {
        if (response.status === 200) {
          // user successfully created
          $scope.registered = true;
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  // if they've registered and clicked the login button, redirect to the login page
  $scope.redirectToLogin = function() {
    $location.path('/login');
  };
});
