<?php

namespace App\Ajax;

class PublicEndpoint extends Endpoint
{

    /**
     * Create a new public Ajax endpoint with preconfigured headers for JSON values.
     * @param string $action The action name associated to your endpoint.
     * @param callable $handler The callback executed each time the endpoint is requested.
     */
    public function __construct($action, callable $handler)
    {
        parent::__construct($action, $handler, true);
    }

}
