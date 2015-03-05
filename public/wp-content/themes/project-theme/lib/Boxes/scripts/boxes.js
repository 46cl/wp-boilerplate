jQuery(function() {

    'use strict';

    var $ = jQuery;

    angular.module('wp-admin', ['ui.sortable'])

    .config(['$interpolateProvider', '$httpProvider', function($interpolateProvider, $httpProvider) {
        // Avoid Twig conflicts
        $interpolateProvider.startSymbol('((').endSymbol('))');

        // Post data as form data
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        $httpProvider.defaults.transformRequest = function(obj) {
            var encodedStr = [];
            $.each(obj || {}, function(key, value) {
                encodedStr.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            });
            return encodedStr.join('&');
        };
    }])

    /*
     * Sequential boxes
     */

    .factory('$sequentialBoxes', function() {
        var itemJustAdded = false;

        return {
            get itemJustAdded() {
                var cache = itemJustAdded;
                itemJustAdded = false;
                return cache;
            },

            set itemJustAdded(value) {
                itemJustAdded = value;
            }
        };
    })

    .directive('sequentialBoxes', ['$sequentialBoxes', function($sequentialBoxes) {

        function link(scope) {

            scope.data = [];

            try {
                // Parse the data instead of using two-way binding because UI.sortable can't reorder a two-way binded
                // array directly outputted in the HTML code
                scope.data = JSON.parse(scope.dataTxt) || [];
            } catch(e) {}

            scope.add = function() {
                $sequentialBoxes.itemJustAdded = true;
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
                options: '=',
                dataTxt: '@data'
            },
            templateUrl: 'sequential-boxes.html',
            link: link
        };

    }])

    /*
     * Upload box
     */

    .directive('uploadBox', ['$timeout', '$sequentialBoxes', function($timeout, $sequentialBoxes) {

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

            // Create a wrapper to manage the media modal
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

            scope.frame = null;
            scope.binded = angular.isDefined(attrs.ngModel);

            // Manage options
            scope.options = {
                label: 'Ajouter une image',
                openModalOnAddition: false
            };

            try {
                scope.options = $.extend(scope.options, JSON.parse(attrs.options));
            } catch(e) {}

            // Retrieve the current data
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

            // Create a function to open a new modal
            scope.openModal = function() {
                scope.frame = scope.frame || newFrame(select);
                scope.frame.open();
            };

            if (scope.options.openModalOnAddition && $sequentialBoxes.itemJustAdded) {
                $timeout(function() {
                    scope.openModal();
                });
            }

        }

        return {
            restrict: 'E',
            replace: true,
            require: '?ngModel',
            scope: {
                name: '@'
            },
            templateUrl: 'upload-box.html',
            link: link
        };

    }])

    /*
     * Post box
     */

    .directive('postBox', [
        '$rootScope', '$http', '$timeout', '$sce', '$sequentialBoxes',
        function($rootScope, $http, $timeout, $sce, $sequentialBoxes) {

            var lastInputId = 0;

            // Alter the wpLink API to intercept the `close` and `update` “events”
            ['update', 'close'].forEach(function(eventName) {
                wpLink[eventName] = (function(eventCallback) {
                    return function() {
                        $rootScope.$emit('postBox:' + eventName);
                        eventCallback();
                    };
                })(wpLink[eventName]);
            });

            function link(scope, element, attrs, NgModelCtrl) {

                scope.binded = angular.isDefined(attrs.ngModel);;
                scope.inputId = 'post-box-' + lastInputId++;

                // Manage options
                scope.options = {
                    label: 'Sélectionner un contenu',
                    hideLabel: false,
                    openModalOnAddition: false
                };

                try {
                    scope.options = $.extend(scope.options, JSON.parse(attrs.options));
                } catch(e) {}

                // Create a wrapper to manage the wpLink modal
                scope.modal = {

                    $modal: $('#wp-link-wrap'),
                    $title: $('#wp-link-wrap #link-modal-title').contents()[0],
                    $search: $('#wp-link-wrap #search-field'),
                    $submit: $('#wp-link-wrap #wp-link-submit'),

                    opened: false,

                    open: function() {
                        this.opened = true;

                        this.originalStates = {
                            searchPanelWasVisible: this.$modal.hasClass('search-panel-visible'),
                            title: this.$title.textContent,
                            submit: this.$submit.val()
                        };

                        this.$modal.addClass('search-panel-visible post-box-modal');
                        wpLink.open(scope.inputId);

                        this.$title.textContent = scope.options.label;
                        this.$submit.val('Valider');
                        this.$search.focus();
                    },

                    update: function() {
                        if (!this.opened) {
                            return;
                        }

                        scope.loading = true;

                        var formPost = wpLink.getAttrs();

                        // Retrieve the ID of the post
                        $http.post('/wp-admin/admin-ajax.php', {
                            action: 'post_box',
                            permalink: formPost.href
                        }).success(function(post) {
                            scope.post = post;
                            scope.post.title = $sce.trustAsHtml(scope.post.title);

                            if (scope.binded) {
                                NgModelCtrl.$setViewValue(post.id);
                            }

                            scope.loading = false;
                        });
                    },

                    close: function() {
                        if (!this.opened) {
                            return;
                        }

                        this.opened = false;

                        this.$modal.toggleClass('search-panel-visible', this.originalStates.searchPanelWasVisible)
                                   .removeClass('post-box-modal');

                        this.$title.textContent = this.originalStates.title;
                        this.$submit.val(this.originalStates.submit);
                    }

                };

                // Retrieve the current data
                function postFromId(id) {
                    if (typeof id != 'number' && (typeof id != 'string' || id.length == 0)) {
                        return;
                    }

                    scope.loading = true;

                    $http.post('/wp-admin/admin-ajax.php', {
                        action: 'post_box',
                        id: id
                    }).success(function(post) {
                        scope.post = post;
                        scope.post.title = $sce.trustAsHtml(scope.post.title);
                        scope.loading = false;
                    });
                }

                if (scope.binded) {
                    scope.$watch(NgModelCtrl, function() {
                        postFromId(NgModelCtrl.$modelValue);
                    });
                } else {
                    postFromId(attrs.value);
                }

                // Listen to wpLink events
                ['update', 'close'].forEach(function(eventName) {
                    $rootScope.$on('postBox:' + eventName, function() {
                        scope.modal[eventName]();
                    });
                });

                if (scope.options.openModalOnAddition && $sequentialBoxes.itemJustAdded) {
                    $timeout(function() {
                        scope.modal.open();
                    });
                }

            }

            return {
                restrict: 'E',
                replace: true,
                require: '?ngModel',
                scope: {
                    name: '@'
                },
                templateUrl: 'post-box.html',
                link: link
            };

        }
    ]);

    /*
     * Bootstrapping
     */

    if (!$(document.body).hasClass('nav-menus-php')) {
        angular.bootstrap(document, ['wp-admin']);
    }

});
