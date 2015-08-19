<?php

// For french, reword the "articles" occurences in the admin.
if (get_locale() === 'fr_FR') {
    add_action('admin_menu', function() {
        global $menu;
        global $submenu;

        $menu[5][0] = "Actualités";
        $submenu['edit.php'][5][0] = "Toutes les actualités";
    });

    add_action('init', function() {
        global $wp_post_types;

        $labels = &$wp_post_types['post']->labels;

        $labels->name = "Actualités";
        $labels->singular_name = "Actualité";
        $labels->add_new = "Ajouter une actualité";
        $labels->add_new_item = "Ajouter une actualité";
        $labels->edit_item = "Editer une actualité";
        $labels->new_item = "Actualité";
        $labels->view_item = "Afficher l'actualité";
        $labels->search_items = "Rechercher dans les actualités";
        $labels->not_found = "Aucune actualité n'a été trouvée";
        $labels->not_found_in_trash = "Aucune actualité n'a été trouvée dans la corbeille";
        $labels->all_items = "Toutes les actualités";
        $labels->menu_name = "Actualités";
        $labels->name_admin_bar = "Actualités";
    });
}
