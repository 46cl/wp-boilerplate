<?php

// Load the settings
foreach (glob(__DIR__ .'/config{/,/*/}*.php', GLOB_BRACE) as $filename) {
    require_once $filename;
}

// Load the libraries
foreach (glob(__DIR__ .'/lib/*') as $library) {
    require_once $library . '/loader.php';
}
