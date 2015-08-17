<?php

namespace App;

class Config
{

    const CONFIG_FILE = __DIR__ . '/../config/theme.php';

    static public function processConfigFile()
    {
        if (self::get('wordpress.comments') === false) {
            Config\Comments::disable();
        }
    }

    static public function get($propertyPath)
    {
        return array_reduce(explode('.', $propertyPath), function($parent, $propName) {
            return @$parent[$propName];
        }, require self::CONFIG_FILE);
    }

}
