jQuery(function() {

    'use strict';

    var $ = jQuery;

    angular.module('wp-admin', ['ui.sortable'])

    .config(['$interpolateProvider', function($interpolateProvider) {
        $interpolateProvider.startSymbol('((').endSymbol('))'); // Avoid Twig conflicts
    }])

    /*
     * Sequential boxes
     */

    .directive('sequentialBoxes', [function() {

        function link(scope) {

            scope.data = [];

            try {
                // Parse the data instead of using two-way binding because UI.sortable can't reorder a two-way binded
                // array directly outputted in the HTML code
                scope.data = JSON.parse(scope.dataTxt) || [];
            } catch(e) {}

            scope.add = function() {
                scope.data.push({});
            };

            scope.remove = function(dataSet) {
                var index = scope.data.indexOf(dataSet);
                scope.data.splice(index, 1);
            };

        }

        return {
            restrict: 'E',
            scope: {
                name: '@',
                fields: '=',
                dataTxt: '@data'
            },
            templateUrl: 'sequential-boxes.html',
            link: link
        };

    }])

    /*
     * Upload box
     */

    .directive('uploadBox', [function() {

        function newFrame(callback) {
            var frame = wp.media({
                title: 'Sélectionner un fichier',
                // library: { type: 'image' },
                multiple: false
            });

            frame.state('library').on('select', function () {
                callback(this.get('selection').first().toJSON());
            });

            return frame;
        }

        function link(scope, element, attrs, NgModelCtrl) {

            // Non-scope accessible
            var select = function(image) {
                scope.image = {};

                // Keep the following properties
                ['id', 'title', 'caption', 'alt', 'description', 'url', 'sizes'].forEach(function(key) {
                    scope.image[key] = image[key];
                });

                // Update the scopes
                if (scope.binded) {
                    NgModelCtrl.$setViewValue(scope.image);
                }

                scope.$apply();
            };

            // Scope accessible
            scope.frame = null;
            scope.binded = angular.isDefined(attrs.ngModel);

            if (scope.binded) {
                scope.$watch(NgModelCtrl, function() {
                    scope.image = NgModelCtrl.$modelValue;
                });
            } else {
                try {
                    scope.image = JSON.parse(attrs.value) || null;
                    scope.image = (typeof scope.image == 'string') ? null : scope.image;
                } catch(e) {
                    scope.image = null;
                }
            }

            scope.openModal = function() {
                scope.frame = scope.frame || newFrame(select);
                scope.frame.open();
            };

        }

        return {
            restrict: 'E',
            replace: true,
            require: '?ngModel',
            scope: {
                label: '@',
                name: '@'
            },
            templateUrl: 'upload-box.html',
            link: link
        };

    }]);

    /*
     * Bootstrapping
     */

    if ($(document.body).hasClass('post-php')) {
        angular.bootstrap(document, ['wp-admin']);
    }

});
