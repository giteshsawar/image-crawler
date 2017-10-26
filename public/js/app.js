'use strict';

    var app = angular.module('imageApp', []);

    app.controller('mainController', mainController);

    mainController.$inject = ['$scope', 'socket']
    function mainController($scope, socket) {
        
        $scope.alert = false;
        $scope.quantity = 25;
        $scope.images = [];
        
        $scope.getImage = function() {
            
            $scope.loading = true;
            $scope.images = [];
            socket.emit('getimage', $scope.url);
        };
        
        socket.on('sendimage', function(data) {
            
            $scope.loading = false;
            $scope.url = data.url;
            $scope.images = [];
            console.log($scope.images);
            for(var i=0, x=data.images.length; i<x; i++) {
                if(data.images[i].indexOf('http') == -1) {
                    $scope.images.push(data.url + '/' +data.images[i]);
                }
                else {
                    
                    $scope.images.push(data.images[i]);
                }
            }
                
        });
        
        socket.on('err', function() {
           
            $scope.loading = false;
            $scope.message = "Url did not respond"; 
        });
    }