<?php

// See: https://github.com/jarednova/timber/issues/545
add_action('twig_apply_filters', function($twig) {

    $twig->addFilter('date', new Twig_Filter_Function(function($date, $format = null) {
        if ( $format === null ) {
            $format = get_option( 'date_format' );
        }

        if ($date instanceof DateTime) {
            $timestamp = $date->getTimestamp();
        } else if ($date != 'now') {
            $timestamp = intval($date);
        } else {
            $timestamp = strtotime($date);
        }

        return date_i18n($format, $timestamp);
    }));

    return $twig;

});
