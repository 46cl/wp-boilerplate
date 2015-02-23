<?php

// Move jQuery to the footer, include it by default, remove the "jquery-migrate" dependency.
// NB: jQuery will be automatically moved in the header if a plugin requires it.
add_action('wp_enqueue_scripts', function() {
    wp_deregister_script('jquery');
    wp_enqueue_script('jquery', '/wp-includes/js/jquery/jquery.js', array(), false, true);
});

// Register an "asset" filter to easily manage asset versions (see the "theme.php" file).
add_action('twig_apply_filters', function($twig) {

    // Load the theme configuration
    $theme = require __DIR__ . '/theme.php';

    // Register the filter
    $twig->addFilter('asset', new Twig_Filter_Function(function($filepath, $assetName) use ($theme) {
        if (strtolower(substr($filepath, 0, 4)) != 'http') {
            $filepath = get_stylesheet_directory_uri() . '/assets/' . $filepath;
        }

        $hasQueryParams = strstr($filepath, '?') !== false;

        return $filepath . (!$hasQueryParams ? '?ver=' : '&ver=') . $theme['assets'][$assetName];
    }));

    return $twig;

});
