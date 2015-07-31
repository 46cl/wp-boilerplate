<?php

class Utils
{

    /**
     * Handles meta data and save it in the database.
     * @param  Integer $post_id The ID of the post.
     * @param  Array   $fields An array containing the names of the fields.
     */
    static public function handleMetaData($post_id, $fields)
    {
        foreach ($fields as $field) {
            $value = isset($_POST[$field]) ? $_POST[$field] : '';
            update_post_meta($post_id, $field, $value);
        }
    }

}
