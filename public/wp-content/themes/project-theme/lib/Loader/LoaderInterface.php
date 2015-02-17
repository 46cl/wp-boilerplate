<?php

interface LoaderInterface
{

    /**
     * Gets called right after a class has been required. Useful to perform tasks before any output, like enqueuing a
     * script or a stylesheet.
     */
    public static function load();

}
