<?php

// Enable the thumbnails on posts
// add_theme_support('post-thumbnails');

// Add new image sizes
// add_image_size('my_image_size', 250, 250, true);

// Remove standard sizes
add_filter('intermediate_image_sizes_advanced', function($sizes) {
    unset($sizes['thumbnail']);
    unset($sizes['medium']);
    unset($sizes['large']);

    return $sizes;
});

// Edit the size list in the media gallery
add_filter('image_size_names_choose', function($sizes) {
    unset($sizes['thumbnail']);
    unset($sizes['medium']);
    unset($sizes['large']);

    return array_merge($sizes, array(
        // 'my_image_size' => "Ma taille d'image",
    ));
});
