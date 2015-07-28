<?php

/*
 * Autoloads classes, interfaces and traits. This is absolutely not PSR-0 compliant, deal with it.
 *
 * Here's the loaded file when you try to call:
 *   - Test: lib/Test/Test.php
 *   - TestInterface: lib/Test/TestInterface.php
 *   - TestTrait: lib/Test/TestTrait.php
 */
spl_autoload_register(function($dependency) {

    $suffix = '';

    if (substr($dependency, -9) == 'Interface') {
        $dependency = substr($dependency, 0, -9);
        $suffix = 'Interface';
    }

    if (substr($dependency, -5) == 'Trait') {
        $dependency = substr($dependency, 0, -5);
        $suffix = 'Trait';
    }

    $file = __DIR__ . '/' . $dependency . '/' . $dependency . $suffix . '.php';

    if (file_exists($file)) {
        require_once $file;
    }

});
