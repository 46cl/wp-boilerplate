<?php

namespace App\Ajax;

class Endpoint
{

    /**
     * Create a new Ajax endpoint with preconfigured headers for JSON values.
     * @param string $action The action name associated to your endpoint.
     * @param callable $handler The callback executed each time the endpoint is requested.
     * @param boolean $isPublic Defines if the endpoint should be public or not.
     */
    public function __construct($action, callable $handler, $isPublic = false)
    {
        $endpoint = function() use ($handler) {
            header('Content-Type: application/json');
            $response = call_user_func($handler);

            // If the response is empty, return an empty object.
            // This way, client libraries like jQuery will not interpret the request as “falsy”.
            $response = !empty($response) ? $response : '{}';

            echo $response;
            wp_die();
        };

        add_action('wp_ajax_' . $action, $endpoint);

        if ($isPublic) {
            add_action('wp_ajax_nopriv_' . $action, $endpoint);
        }
    }

}
