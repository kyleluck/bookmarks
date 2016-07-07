// Define the app module with ngRoute dependency
var bookmarkApp = angular.module('bookmarkApp', ['ngRoute']);

// Configure route provider
bookmarkApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'MainController',
      templateUrl: 'main.html'
    })
    .when('/save', {
      controller: 'SaveController',
      templateUrl: 'save.html'
    })
    .otherwise({ redirectTo: '/' });
});

bookmarkApp.controller('MainController', function($scope, $http) {
  $scope.test = 'Hi Bookmark App';
  $http.get("/bookmarks")
    .then(function(response) {
      $scope.bookmarks = response.data.message;
      console.log(response);
    });
});
