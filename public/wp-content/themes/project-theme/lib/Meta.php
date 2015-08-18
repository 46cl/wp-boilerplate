<?php

namespace App;

class Meta
{

    /**
     * Call the right function to save datas in the database, the $_POST values are automatically retrieved.
     * @param integer $data_id The ID of the post/user/comment.
     * @param string[] $fields An array containing the name of the fields.
     * @param string $type The type of the data. Possible value: "post", "user" or "comment".
     */
    static public function saveData($data_id, $fields, $type)
    {
        $class = "update_".$type."_meta";

        foreach ($fields as $field) {
            $value = isset($_POST[$field]) ? $_POST[$field] : '';
            $class($data_id, $field, $value);
        }
    }

    /**
     * Save post meta data in the database.
     * @param integer $post_id The ID of the post.
     * @param string[] $fields An array containing the name of the fields.
     */
    static public function savePostData($post_id, $fields)
    {
        self::saveData($post_id, $fields, 'post');
    }

    /**
     * Save user meta data in the database.
     * @param integer $user_id The ID of the user.
     * @param string[] $fields An array containing the name of the fields.
     */
    static public function saveUserData($user_id, $fields)
    {
        self::saveData($user_id, $fields, 'user');
    }

    /**
     * Save comment meta data in the database.
     * @param integer $comment_id The ID of the comment.
     * @param string[] $fields An array containing the name of the fields.
     */
    static public function saveCommentData($comment_id, $fields)
    {
        self::saveData($comment_id, $fields, 'comment');
    }

}
