// Define the app module with ngRoute dependency
var bookmarkApp = angular.module('bookmarkApp', ['ngRoute', 'ngCookies']);

// API set to the empty string as Express will serve public folder
var API = "";

// Configure route provider
bookmarkApp.config(function($routeProvider) {
  $routeProvider
    .when('/home', {
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
    .otherwise({ redirectTo: '/home' });
});

bookmarkApp.run(function($rootScope, $location, $cookies) {
  // on every location change start, see where the user is attempting to go
  $rootScope.$on('$locationChangeStart', function(event, nextUrl, currentUrl) {
    // get path from url
    var path = nextUrl.split('/')[4];
    // if user is going to a restricted area and doesn't have a token stored in a cookie, redirect to the login page
    var token = $cookies.get('token');
    if (!token && path === 'home') {
      $location.path('/login');
    }

    // is the user logged in? used to display login, logout and signup links
    $rootScope.isLoggedIn = function() {
      $rootScope.user = $cookies.get('user');
      return $cookies.get('token');
    };

    $rootScope.logout = function() {
      $cookies.remove('token');
      $location.path('/login');
    };
  });
});

// Controller for handling displaying of the bookmarks and associated functions
bookmarkApp.controller('DisplayController', function($scope, $http, $cookies, $timeout, $location) {

  var user;
  //check if user logged in. store username in a variable from the user cookie
  if ($cookies.get('token') && $cookies.get('user')) {
    user = $cookies.get('user');
  } else {
    $scope.message = 'Your session has expired, please login. Redirecting to login page...';
    $timeout(function() {
      $location.path("/login");
    }, 3000); // delay 1000 ms
  }

  // When the user lands on the display page, '/', request the saved bookmarks from the server
  $http.post("/bookmarks", { user: user })
    .then(function(response) {
      // Attach the booksmarks to the scope so that they can be displayed
      $scope.bookmarks = response.data.message;
      // Console the reponse during development
      // console.log(response);
    });

  // Attach the deleteBookmark function to the scope so that it can be used
  // with ng-click. This function will delete the bookmark when the user
  // clicks on the trash icon
  $scope.deleteBookmark = function(title) {
    $http.post("/delete", { "title": title, "user": user })
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
    $http.post("/save", { "title": $scope.title, "link": $scope.link, "user": user })
      .then(function(response) {
        if (response.data.status === 'ok') {
          // if we get an ok response from the server, attach the new bookmark to the $scope
          // in order to update the view
          var newBookmark = { link: $scope.link, title: $scope.title, hits: 0, user: $cookies.get('user') };
          $scope.bookmarks.push(newBookmark);

          // clear out link and title on the scope so the input fields are ready for a new bookmark
          $scope.link = '';
          $scope.title = '';

        } else {
          throw new Error('Error saving your bookmark.');
        }
      })
      .catch(function(err) {
        $scope.message = "There was an error: " + err;
      });
  };

  // when the user clicks a link, update the hit_count in the database
  $scope.updateHits = function(title) {
    $http.post("updateHits", { "title": title, "user": $cookies.get('user') })
      .then(function() {
        // update scope so number of hits displays without refreshing the page
        return $http.post("/bookmarks", { user: user });
      })
      .then(function(response) {
        // Attach the booksmarks to the scope so that they can be displayed
        $scope.bookmarks = response.data.message;
      })
      .catch(function(err) {
        $scope.message = "There was an error: " + err;
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
            // set a cookie with user's username
            $cookies.put('user', $scope.username);
            // redirect to the page they were trying to go to
            $location.path('/' + $rootScope.goHere);
          } else {
            $scope.loginFailed = true;
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

bookmarkApp.controller('RegisterController', function($scope, $location, $http, $timeout) {
  $scope.register = function() {
    $http.post(API + '/signup', { username: $scope.username, password: $scope.password })
      .then(function(response) {
        if (response.status === 200) {
          // user successfully created
          $scope.registered = true;
          // if they've registered successfully, redirect to the login page
          $timeout(function() {
            $location.path("/login");
          }, 3000); // delay 1000 ms
        } else {
          $scope.registered = false;
          $scope.message = "Username taken. Please select a different username.";
        }
      })
      .catch(function(err) {
        // there was an error, so let's display it to the end user
        $scope.message = "There was an error: " + err.data.message;
        $scope.registered = false;
      });
  };
});
