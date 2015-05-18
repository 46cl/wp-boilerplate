<?php

// Adds device information into timber context
add_filter('timber_context', function ($context) {
    $detect = new Mobile_Detect;
    $context['device'] = array(
        'isMobile' => $detect->isMobile() == 1, /* Mobile means any mobile device : phone, tablet, watch etc. */
        'isTablet' => $detect->isTablet(),
        'isPhone' => $detect->isMobile() && !$detect->isTablet(),
        'mobileGrade' => $detect->mobileGrade()
    );
    return $context;
});