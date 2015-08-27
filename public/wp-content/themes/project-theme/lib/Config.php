<?php

namespace App;

class Config
{

    const CONFIG_FILE = __DIR__ . '/../config/theme.php';

    static public function processConfigFile()
    {
        if (self::get('wordpress.comments') === false) Config\Comments::disable();
        if (self::get('wordpress.pingbacks') === false) Config\Pingbacks::disable();
        if (self::get('wordpress.trackbacks') === false) Config\Trackbacks::disable();

        Config\AdminMenu::disable(self::get('wordpress.admin_menu'));
    }

    static public function get($propertyPath)
    {
        static $properties;
        @$properties = $properties ?: require self::CONFIG_FILE;

        return array_reduce(explode('.', $propertyPath), function($parent, $propName) {
            return @$parent[$propName];
        }, $properties);
    }

}
