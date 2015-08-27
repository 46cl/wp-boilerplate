<?php

namespace App\Config;

class AdminMenu
{

    /**
     * Disable items of the admin menu
     */
    static public function disable($menuItems)
    {
        if (is_array($menuItems)) {
            foreach ($menuItems as $menuItem => $menuItemValue) {
                if ($menuItemValue === false) {
                    self::removeMenuItem($menuItem);
                    self::restrictPage($menuItem);
                } else if (is_array($menuItemValue)) {
                    foreach ($menuItemValue as $subItem => $subItemValue) if ($subItemValue === false) {
                        self::removeMenuItem($menuItem, $subItem);
                        self::restrictPage($subItem);
                    }
                }
            }
        }
    }

    static private function removeMenuItem($menuItem, $subItem = null)
    {
        add_action('admin_menu', function() use($menuItem, $subItem) {
            if ($subItem === null) {
                remove_menu_page($menuItem);
            } else {
                remove_submenu_page($menuItem, $subItem);
            }
        });
    }

    static private function restrictPage($pageName)
    {
        $pageUrl = "/wp-admin/$pageName";

        add_action('admin_init', function() use ($pageUrl) {
            if (!current_user_can('manage_network') && $_SERVER['PHP_SELF'] == $pageUrl) {
                wp_redirect(admin_url());
                exit;
            }
        });
    }

}
