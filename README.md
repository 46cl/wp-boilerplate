# WP-Boilerplate

A Wordpress boilerplate created by 46cl, featuring [Timber](http://upstatement.com/timber/) (with [Twig](http://twig.sensiolabs.org/)), [Composer](https://getcomposer.org/), [Bower](http://bower.io/), [Gulp](http://gulpjs.com/), [Less](http://lesscss.org/), [Browserify](http://browserify.org/) (with [Babel](http://babeljs.io/) as an option), _icon fonts generation_, and _project management_ allowing to automatically install and run your new project on your working computer.

Tested on Wordpress 4.1+

## Dependencies

Required dependencies:

* [Git](http://git-scm.com/)
* [PHP](http://php.net/) v5.3+
* [MySQL](http://www.mysql.fr/) v5.5+
* [Node.js](http://nodejs.org/) (with NPM v2+)
* [WP-CLI](http://wp-cli.org/)
* [wp server](https://github.com/wp-cli/server-command)

Optional __but recommended__ dependencies:

* [Composer](https://getcomposer.org/)

### Quick setup for OS X users

Install [Homebrew](http://brew.sh/) and run `brew doctor`. If everything seems OK, install the required packages with those commands:

```shell
brew tap homebrew/php
brew install git php56 mysql node wp-cli composer
```

Make sure MySQL's server is started with `mysql.server start`.

Install __wp server__ with the following commands (based [on this guide](https://github.com/wp-cli/wp-cli/wiki/Community-Packages#installing-a-package-without-composer)):

```shell
mkdir -p ~/.wp-cli/commands
git clone https://github.com/wp-cli/server-command.git ~/.wp-cli/commands/server
echo -e "require:\n  - commands/server/command.php" > ~/.wp-cli/config.yml
```

That's it!

## Installation

Open the `wp-project.json` file and fill in the `title`, `slug` and `database` properties:

```js
{
    "title": "My new project",
    "slug": "my-new-project",
    "database": "mynewproject",

    // ...
}
```

Then install the dependencies and run the installer:

```shell
npm install
npm run wp-install
```

If the installation failed for any reason, just run `npm run wp-clean` to rollback to the previous state. It doesn't cancel the created commit but if you reached this point there shouldn't be any issues that requires a rollback.

## Serve the project locally

To run a local server, use `npm run wp-serve`. Available options are `--host` and `--port`, for example: `npm run wp-serve -- --host=0.0.0.0 --port=8000`

You can now log in the back office with the __admin__ user and __admin__ password.

To watch for your assets modifications, use `npm run watch`.

## Theming

The boilerplate is provided with a theme ready to use. It leverages some redundant tasks and provides a structure for your files.

### Assets management

The boilerplate is provided with __Bower__ and a __Gulp__ configuration ready to be used to concatenate script files and compile __Less__, with sourcemaps. Icon fonts generation also comes out of the box.

All the assets that should be compiled live in the `app/` directory of your theme. The output after compilation will be saved to the `assets/` directory.

You don't need to touch the `gulpfile.js` file to add new paths to the compilation tasks, everything lives in the `wp-project.json` file:

```js
{
    // ...

    "assets-paths": {
        "src": {
            "vendor": {
                "stylesheets": "bower_components/normalize.css/normalize.css",
                "scripts": ""
            },

            "app": {
                "icons": {},

                "stylesheets": "%theme_path%/app/stylesheets/*.less",

                "scripts": {
                    "app": "%theme_path%/app/scripts/app.js"
                }
            }
        },

        "dest": {
            "clean": "%theme_path%/assets/",
            "fonts": "%theme_path%/assets/fonts/",
            "stylesheets": "%theme_path%/assets/",
            "scripts": "%theme_path%/assets/"
        },

        "tmp": "%theme_path%/.tmp/",

        "watch": "%theme_path%/app/**"
    }
}
```

The __%theme_path%__ keyword is automatically replaced at compilation time by the path of your theme, allowing you to have shorter paths in your config file and to easily rename your theme (don't forget [to update the configuration](#installation) if you do this).

Every path in the configuration file will be interpreted by the `gulp.src()` method (once the __%theme_path%__ keyword is replaced), check [its documentation](https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulpsrcglobs-options) to understand the syntax.

### ES6 with Babel

Every scripts will be automatically passed to Babel to transpile ES6 to ES5. However, don't forget to require the polyfill if you use some methods introduced by this version of the specification, same goes if you use generators:

```js
require('babel/polyfill');
```

#### Icon fonts generation

While the properties of the assets configuration should be clear, you could need some help for the `icons` section. If you have a bunch of SVG files you want to embed in a font you will need [to prepare them](https://github.com/nfroidure/gulp-iconfont#preparing-svgs).

Once this is done, choose a name for your font, "ico" for example, and add a new object to the `icons` section:

```js
// ...

"icons": {
    "ico": {
        "stylesheet-tpl": "%theme_path%/app/stylesheets/icons.less.swig",
        "svgs": "%theme_path%/app/icons/ico/*.svg"
    }
},

// ...
```

Here's some explanations:

* The `"ico"` key is the name of your font.
* `"stylesheet-tpl"` contains a path to a template used to generate the final stylesheet associated to your fonts. The templating language is [Swig](http://paularmstrong.github.io/swig/), we already provide you a ready-to-use template (located at the specified path above), feel free to edit it.
* `"svgs"` is where your SVG files are located.

Run `npm run watch` in your console and add your new stylesheet to your HTML:

```twig
<link rel="stylesheet" href="{{ 'ico.css'|asset('app') }}">
```

Now you can use the classes in your HTML:

```html
<span class="ico ico-my-icon"></span>
```

If you want to use the classes created for your icon font in other stylesheets, you can import the intermediate Less stylesheet in your `app.less` file instead of importing the CSS file in the HTML code:

```less
@import '../../.tmp/ico.less';

// Now you can, for example, extend the generated classes:
.title {
    &:extend(.ico all, .ico-my-icon all);
}
```

### PHP dependencies

Composer is installed with the theme, allowing you to easily add PHP dependencies. To run Composer through the command-line:

```shell
$ pwd
/home/johann/wp-boilerplate
$ cd public/wp-content/themes/your_theme_name
$ composer require vendor/name
```

However, if you want to use Composer straight from the root of your project, we created a command for you:

```shell
$ pwd
/home/johann/wp-boilerplate
$ npm run composer -- require vendor/name
```

### Configuration

In the configuration file of the theme (`config/theme.php`), you can define versions for your assets. Those will be used by the `asset` Twig filter, see the `views/layout.twig` file for an usage example of this filter.

### Boxes

The theme contains a feature we named “Boxes”. It allows you to easily add some new form components in your metaboxes, each component is a “box”.

Each box takes a name which will be used to submit the data through the classic form submission. This data is structured with JSON, to save it as meta data you should previously pass it to the `Utils::jsonValue()` method:

```php
$value = Utils::jsonValue($_POST['my_box_data']);
update_post_meta($post->ID, 'my_box_data', $value);
```

This will convert the data from JSON data to a PHP object which can be automatically serialized and unserialized by the `*_post_meta()` functions provided by Wordpress.

#### Upload box

Outputs an upload button which uses the media modal:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $options An array of options
 */
function upload($name, $data, $options = array())
```

Usage example:

```php
Boxes::upload(
    'my_upload_file',
    get_post_meta($post->ID, 'my_upload_file', true),
    array(

        /**
         * Defines the text used for the button.
         * Defaults to: "Ajouter une image"
         */
        'label' => 'Add a new file',

        /**
         * Defines if the modal should be automatically opened on box
         * addition. This is effective only when used in sequential boxes.
         * Defaults to: false
         */
        'openModalOnAddition' => true,

    )
);
```

#### Post box

Outputs a field allowing to select a post with the modal used by the editor when adding a new link in the content:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $options An array of options
 */
function post($name, $data, $options = array())
```

Usage example:

```php
Boxes::post(
    'my_linked_post',
    get_post_meta($post->ID, 'my_linked_post', true),
    array(

        /**
         * Defines the text used for the label and the modal title.
         * Defaults to: "Ajouter une image"
         */
        'label' => 'Add a new file',

        /**
         * Defines if the modal should be automatically opened on box
         * addition. This is effective only when used in sequential boxes.
         * Defaults to: false
         */
        'openModalOnAddition' => true,

        /**
         * Should we hide the label?
         * Defaults to: false
         */
        'hideLabel' => true,

    )
);
```

#### Sequential boxes

Outputs a UI allowing the user to add multiple times a predefined set of fields:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $fields  An array of fields
 * @param  {array}  $options An array of options
 */
function sequential($name, $data, $fields, $options = array())
```

Usage example:

```php
Boxes::sequential(
    'my_sequential_boxes',
    get_post_meta($post->ID, 'my_sequential_boxes', true),
    array(

        /**
         * An input[type=text]
         */
        array(
            'type' => 'text',
            'name' => 'my_input_text',
            'label' => 'My input text'
        ),

        /**
         * A textarea
         */
        array(
            'type' => 'textarea',
            'name' => 'my_textarea',
            'label' => 'My textarea'
        ),

        /**
         * An upload box
         */
        array(
            'type' => 'upload',
            'name' => 'my_upload_box',
            'options' => array(
                'label' => 'My upload box',
                'openModalOnAddition' => true
            )
        ),

        /**
         * A post box
         */
        array(
            'type' => 'post',
            'name' => 'my_post_box',
            'options' => array(
                'label' => 'My post box',
                'openModalOnAddition' => true,
                'hideLabel' => true
            )
        ),

    ),
    array(

        /**
         * The layout to use between "classic" and "large".
         * Defaults to: "classic"
         */
        'layout' => 'large',

        /**
         * A maximum of sequential boxes the user can add.
         * Defaults to: null
         */
        'max' => 'large',

    )
);
```

## Contribute

Clone the repository and add this line to your `~/.profile`:

```shell
export WP_BOILERPLATE_ENV="contrib"
```

This will bypass the following tasks when running the `npm run wp-install` command:

* Renaming the project theme
* Saving dependencies versions
* Reinitializing the Git project

If you occasionally want to revert back to the default environment, use `npm run wp-install -- --skip-env-check`.
