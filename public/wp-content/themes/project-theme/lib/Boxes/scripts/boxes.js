jQuery(function() {

    'use strict';

    var $ = jQuery;

    angular.module('wp-admin', ['ui.sortable'])

    .config(['$interpolateProvider', '$httpProvider', function($interpolateProvider, $httpProvider) {
        // Avoid Twig conflicts
        $interpolateProvider.startSymbol('((').endSymbol('))');

        // Post data as form data because Wordpress doesn't support JSON
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
                if (angular.isDefined(scope.options.max) && scope.data >= scope.options.max) {
                    return;
                }

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
     * WP Editor
     */

    .directive('wpEditor', function() {

        var link = function(scope, element, attrs, NgModelCtrl) {
            var id = 'boxes-wysiwyg-' + (new Date).getTime();
            element.find('textarea').attr('id', id);

            // Retrieve the current data
            scope.$watch(NgModelCtrl, function() {
                scope.text = NgModelCtrl.$modelValue;
            });

            // Initialize the editor, based on this repository: https://github.com/hezachary/wordpress-wysiwyg-widget
            setTimeout(function() {
                tinymce.execCommand('mceRemoveEditor', true, id);

                var initParams = tinymce.extend(tinyMCEPreInit.mceInit.__boxes_defaults, {
                    selector: '#' + id,
                    setup: function(editor) {
                        editor.on('change', function(e) {
                            scope.$apply(function() {
                                scope.text = editor.getContent();
                                NgModelCtrl.$setViewValue(scope.text);
                            });
                        });
                    }
                });

                tinymce.init(initParams);
            }, 0);

        };

        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            scope: {},
            templateUrl: 'wp-editor.html',
            link: link
        };

    })

    /*
     * Upload box
     */

    .directive('uploadBox', ['$http', '$timeout', '$sequentialBoxes', function($http, $timeout, $sequentialBoxes) {

        /**
         * A wrapper to manage the media modal
         */
        function newFrame(callback) {
            var frame = wp.media({
                title: 'Sélectionner un fichier',
                // library: { type: 'image' },
                multiple: false
            });

            frame.state('library').on('select', function () {
                var image = this.get('selection').first().toJSON();
                callback(image.id, image.url);
            });

            return frame;
        }

        function link(scope, element, attrs, NgModelCtrl) {

            function select(id, url) {
                $timeout(function() {
                    scope.imageId = id;

                    // Update the model value
                    if (scope.binded) {
                        NgModelCtrl.$setViewValue(id);
                    }

                    // Retrieve the URL if necessary
                    if (id !== undefined && !url) {
                        $http.post('/wp-admin/admin-ajax.php', {
                            action: 'upload_box',
                            id: id
                        }).success(function(url) {
                            scope.imageUrl = url;
                        });
                    } else {
                        scope.imageUrl = url;
                    }
                });
            }

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
                    select(NgModelCtrl.$modelValue);
                });
            } else {
                try {
                    var id = JSON.parse(attrs.value) || null;
                    id = isNaN(parseInt(id)) ? undefined : parseInt(id);
                    select(id);
                } catch(e) {
                    select();
                }
            }

            // Create a function to open a new modal
            scope.openModal = function() {
                scope.frame = scope.frame || newFrame(select);
                scope.frame.open();
            };

            // If the `openModalOnAddition` is set to `true`, open the modal when an item is added.
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
                        }).finally(function() {
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

    $('[boxes-bootstrap]').each(function() {
        angular.bootstrap(this, ['wp-admin']);
    });

});
