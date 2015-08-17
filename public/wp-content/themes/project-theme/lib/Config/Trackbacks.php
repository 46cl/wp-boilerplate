<?php

namespace App\Config;

class Trackbacks
{

    /**
     * Disable Wordpress trackbacks
     */
    static public function disable()
    {
        foreach (get_post_types() as $post_type) {
            remove_post_type_support($post_type, 'trackbacks');
        }
    }

}
