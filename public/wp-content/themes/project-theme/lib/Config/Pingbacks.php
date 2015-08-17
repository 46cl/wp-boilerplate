<?php

namespace App\Config;

class Pingbacks
{

    /**
     * Disable Wordpress pingbacks
     */
    static public function disable()
    {
        add_filter('xmlrpc_methods', function($methods) {
            unset($methods['pingback.ping']);
            unset($methods['pingback.extensions.getPingbacks']);
            return $methods;
        });

        add_filter('wp_headers', function($headers) {
           unset($headers['X-Pingback']);
           return $headers;
        });
    }

}
