<?php

class Boxes implements LoaderInterface
{

    static private $renderedOnce = false;
    static private $originalDirname;

    static public function load()
    {
        // Enqueue the assets required by the class
        add_action('admin_enqueue_scripts', function() {
            self::enqueueAssets();
        });

        // Register API endpoints
        add_action('wp_ajax_upload_box', function() {
            self::uploadAjax();
        });

        add_action('wp_ajax_post_box', function() {
            self::postAjax();
        });
    }

    static public function sequential($name, $data, $fields, $options = array())
    {
        self::init();

        $options = array_merge(array(
            'layout' => 'classic'
        ), $options);

        Timber::render('boxes/sequential.twig', array(
            'name' => $name,
            'data' => $data,
            'fields' => $fields,
            'options' => $options
        ));

        self::destroy();
    }

    static public function upload($name, $data, $options = array())
    {
        self::init();

        Timber::render('boxes/upload.twig', array(
            'name' => $name,
            'data' => $data,
            'options' => $options
        ));

        self::destroy();
    }

    static public function post($name, $data, $options = array())
    {
        self::init();

        Timber::render('boxes/post.twig', array(
            'name' => $name,
            'data' => $data,
            'options' => $options
        ));

        self::destroy();
    }

    static private function uploadAjax()
    {
        $id = wp_unslash($_POST['id']);
        $imgUrl = wp_get_attachment_image_src($id, 'full')[0];

        header('Content-type: application/json');
        die(json_encode($imgUrl));
    }

    static private function postAjax()
    {
        $response = null;
        $id = wp_unslash($_POST['id']);
        $permalink = wp_unslash($_POST['permalink']);

        if (!empty($id) || !empty($permalink)) {
            $query = array(
                'post_type' => array_keys(get_post_types()),
                'nopaging' => true
            );

            if (!empty($id)) {
                $query['p'] = intval($id);
            }

            $posts = get_posts($query);

            if (!empty($permalink)) {
                $posts = array_filter($posts, function($post) use ($permalink) {
                    return get_permalink($post->ID) == $permalink;
                });

                $posts = array_values($posts);
            }

            header('Content-type: application/json');

            $response = array(
                'id' => $posts[0]->ID,
                'title' => $posts[0]->post_title
            );
        }

        die(json_encode($response));
    }

    static private function enqueueAssets()
    {
        $base = get_stylesheet_directory_uri() . '/lib/' . basename(__DIR__);

        // JS dependencies provided by Wordpress
        wp_enqueue_script('jquery-ui-core');
        wp_enqueue_script('jquery-ui-widget');
        wp_enqueue_script('jquery-ui-mouse');
        wp_enqueue_script('jquery-ui-sortable');
        wp_enqueue_media();

        // External JS dependencies
        wp_enqueue_script('boxes-angular', '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.13/angular.min.js');
        wp_enqueue_script('boxes-ui-sortable', '//cdnjs.cloudflare.com/ajax/libs/angular-ui-sortable/0.13.3/sortable.min.js');

        // Our own scripts
        wp_enqueue_script('boxes-admin', $base . '/scripts/boxes.js');

        // Our own stylesheets
        wp_enqueue_style('boxes-admin', $base . '/stylesheets/boxes.css');
    }

    static private function init()
    {
        // Change the views directory
        self::$originalDirname = Timber::$dirname;
        Timber::$dirname = 'lib/Boxes/views';

        // Open a wrapper used to bootstrap the boxes inside
        echo '<div boxes-bootstrap>';

        // Load Angular templates
        Timber::render('templates.twig');

        // First rendering
        if (!self::$renderedOnce) {
            self::$renderedOnce = true;

            // Declare a new WP editor, never output it. This allows to output the default set of TinyMCE options.
            // The default set will be accessible in JS with `tinyMCEPreInit.mceInit.__boxes_defaults`.
            // See: https://github.com/WordPress/WordPress/blob/00e4f35300720d13895adafa51361d9bb9f7c93b/wp-includes/class-wp-editor.php#L639
            ob_start();
            wp_editor('hello', '__boxes_defaults');
            ob_end_clean();
        }
    }

    static private function destroy()
    {
        // Revert to the original views directory
        Timber::$dirname = self::$originalDirname;

        // Close the wrapper
        echo '</div>';
    }

}
