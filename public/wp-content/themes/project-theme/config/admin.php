<?php

// Hide the admin bar
add_filter('show_admin_bar', '__return_false');

// Hide the update notifications
function removeCoreUpdates() {
    global $wp_version;

    return (object) array(
        'last_checked'=> time(),
        'version_checked'=> $wp_version
    );
}

add_filter('pre_site_transient_update_core', 'removeCoreUpdates');
add_filter('pre_site_transient_update_plugins', 'removeCoreUpdates');
add_filter('pre_site_transient_update_themes', 'removeCoreUpdates');
