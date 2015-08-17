<?php

// Use a simple IIFE to avoid global variables
call_user_func(function() {

    $assetsDir = get_stylesheet_directory_uri() . '/assets';

    // Move jQuery to the footer, include it by default, remove the "jquery-migrate" dependency.
    // NB: jQuery will be automatically moved in the header if a plugin requires it.
    add_action('wp_enqueue_scripts', function() {
        wp_deregister_script('jquery');
        wp_enqueue_script('jquery', '/wp-includes/js/jquery/jquery.js', array(), false, true);
    });

    // Add a stylesheet to the admin
    add_action('admin_enqueue_scripts', function() use ($assetsDir) {
        wp_enqueue_style('wp-boilerplate-admin', $assetsDir . '/admin.css');
    });

    // Add a stylesheet for TinyMCE
    add_action('after_setup_theme', function() use ($assetsDir) {
        add_editor_style($assetsDir . '/editor.css');
    });

    // Register an "asset" filter to easily manage asset versions (see the "theme.php" file).
    add_action('twig_apply_filters', function($twig) use ($assetsDir) {

        $assetsVersions = App\Config::get('assets');

        // Register the filter
        $twig->addFilter(
            'asset',
            new Twig_Filter_Function(function($filepath, $assetName) use ($assetsDir, $assetsVersions) {
                if (strtolower(substr($filepath, 0, 4)) != 'http') {
                    $filepath = $assetsDir . '/' . $filepath;
                }

                $hasQueryParams = strstr($filepath, '?') !== false;

                return $filepath . (!$hasQueryParams ? '?ver=' : '&ver=') . $assetsVersions[$assetName];
            })
        );

        return $twig;

    });

    // Avoid emojis errors, see: https://core.trac.wordpress.org/ticket/32305
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');

});
