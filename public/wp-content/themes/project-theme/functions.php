<?php

// Load the vendors
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    include_once __DIR__ . '/vendor/autoload.php';
}

// Load the libraries
require_once __DIR__ . '/lib/autoload.php';

// Load the configuration
foreach (glob(__DIR__ .'/config{/,/*/}*.php', GLOB_BRACE) as $filename) {
    require_once $filename;
}
