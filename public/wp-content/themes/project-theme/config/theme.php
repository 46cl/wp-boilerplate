<?php

/*
 * Here we set the theme configuration, be free to alter this file to your needs.
 */
return array(

    // Disable Wordpress features in a snap
    'wordpress' => array(
        'comments' => true,
        'pingbacks' => false,
        'trackbacks' => false,
        'admin_menu' => array(
            'options-general.php' => array(
                'options-media.php' => false,
            ),
        ),
    ),

    // Array used by the "asset" Twig filter to define versions for your assets
    'assets' => array(
        'vendor' => '0.0',
        'app' => '0.0',
    )

);
