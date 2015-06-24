<?php

class Utils
{

    /**
     * Checks if a string is a valid JSON object and decodes it.
     * @param  String $value The string to analyze.
     * @return String        Returns the decoded object if the value was a valid JSON object or, otherwise, the original
     * value.
     */
    static public function jsonValue($value)
    {
        if (is_string($value)) {
            $value = stripslashes($value); // I hate you Wordpress, really.
            $firstChar = substr($value, 0, 1);

            if ($firstChar == '{' || $firstChar == '[') { // Fast checking
                $jsonValue = json_decode($value);

                if (is_object($jsonValue) || is_array($jsonValue)) { // Be sure it's a JSON object
                    return $jsonValue;
                }
            }
        }

        return $value;
    }

    /**
     * Handles meta data and save it in the database.
     * @param  Integer $post_id The ID of the post.
     * @param  Array   $fields An array containing the names of the fields.
     */
    static public function handleMetaData($post_id, $fields)
    {
        foreach ($fields as $field) {
            $value = isset($_POST[$field]) ? $_POST[$field] : '';
            $value = self::jsonValue($value);

            update_post_meta($post_id, $field, $value);
        }
    }

}
