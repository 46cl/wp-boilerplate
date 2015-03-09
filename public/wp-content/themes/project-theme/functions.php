<?php

// Load the vendors
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    include_once __DIR__ . '/vendor/autoload.php';
}

// Load the libraries
require_once __DIR__ . '/lib/autoload.php';

foreach (glob(__DIR__ . '/lib/*/') as $libraryPath) {
    $library = basename($libraryPath);
    $file = __DIR__  . '/lib/' . $library . '/' . $library . '.php';

    if (file_exists($file)) {
        require_once $file;

        $class = new ReflectionClass($library);
        if ($class->implementsInterface('LoaderInterface')) {
            call_user_func($library . '::load');
        }
    }
}

// Load the configuration
foreach (glob(__DIR__ .'/config{/,/*/}*.php', GLOB_BRACE) as $filename) {
    require_once $filename;
}
