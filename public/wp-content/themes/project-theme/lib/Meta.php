<?php

namespace App;

class Meta
{

    /**
     * Save post meta data in the database.
     * @param integer $post_id The ID of the post.
     * @param string[] $fields An array containing the name of the fields.
     */
    static public function savePostData($post_id, $fields)
    {
        foreach ($fields as $field) {
            $value = isset($_POST[$field]) ? $_POST[$field] : '';
            update_post_meta($post_id, $field, $value);
        }
    }

}
