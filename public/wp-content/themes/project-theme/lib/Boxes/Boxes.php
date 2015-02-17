<?php

class Boxes implements LoaderInterface
{

    static private $renderedOnce = false;

    static public function load()
    {
        add_action('admin_enqueue_scripts', function() {
            $base = get_stylesheet_directory_uri() . '/lib/' . basename(__DIR__);

            wp_enqueue_style('boxes-admin', $base . '/stylesheets/boxes.css');

            wp_enqueue_script('boxes-angular', '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.13/angular.min.js');
            wp_enqueue_script('boxes-ui-sortable', '//cdnjs.cloudflare.com/ajax/libs/angular-ui-sortable/0.13.3/sortable.min.js');
            wp_enqueue_script('boxes-admin', $base . '/scripts/boxes.js');
        });
    }

    static public function sequential($name, $data, $fields)
    {
        self::init();

        Timber::render('boxes/sequential.twig', array(
            'name' => $name,
            'data' => $data,
            'fields' => $fields,
        ));

        self::destroy();
    }

    static public function upload($label, $name, $data)
    {
        self::init();

        Timber::render('boxes/upload.twig', array(
            'label' => $label,
            'name' => $name,
            'data' => $data
        ));

        self::destroy();
    }

    static private function init()
    {
        // Change the views directory
        $originalDirname = Timber::$dirname;
        Timber::$dirname = 'lib/boxes/views';

        // First rendering, load Angular templates.
        if (!self::$renderedOnce) {
            self::$renderedOnce = true;
            Timber::render('templates.twig');
        }
    }

    static private function destroy()
    {
        // Revert to the original views directory
        Timber::$dirname = $originalDirname;
    }

}
