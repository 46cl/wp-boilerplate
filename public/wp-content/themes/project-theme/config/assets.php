<?php

// Move jQuery to the footer, include it by default, remove the "jquery-migrate" dependency.
// NB: jQuery will be automatically moved in the header if a plugin requires it.
add_action('wp_enqueue_scripts', function() {
    wp_deregister_script('jquery');
    wp_enqueue_script('jquery', '/wp-includes/js/jquery/jquery.js', array(), false, true);
});
