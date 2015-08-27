__This project is currently a work in progress. Expect breaking API changes!__

# WP-Boilerplate

A Wordpress boilerplate created by 46cl, featuring [Timber](http://upstatement.com/timber/) (with [Twig](http://twig.sensiolabs.org/)), [Composer](https://getcomposer.org/), [Bower](http://bower.io/), [Gulp](http://gulpjs.com/), [Less](http://lesscss.org/), [Browserify](http://browserify.org/) (with [Babel](http://babeljs.io/) as an option), _icon fonts and CSS sprites generation_, and _project management_ allowing to automatically install and run your new project on your working computer.

Tested on Wordpress 4.1+

## Dependencies

Required dependencies:

* [Git](http://git-scm.com/)
* [PHP](http://php.net/) v5.3+
* [Composer](https://getcomposer.org/)
* [MySQL](http://www.mysql.fr/) v5.5+
* [Node.js](http://nodejs.org/) (with NPM v2+)
* [WP-CLI](http://wp-cli.org/)
* [wp server](https://github.com/wp-cli/server-command)

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

Open the [wp-project.json](wp-project.json) file and fill in the `title`, `slug` and `database` properties:

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

To run a local server, use `npm run wp-serve`. By default, this command will listen on `0.0.0.0:8080`, you can adjust this behaviour with two options: `--host` and `--port`.

```shell
npm run wp-serve -- --host=127.0.0.1 --port=8000
```

You can now log in the back office with the __admin__ user and __admin__ password.

To watch for your assets modifications, use `npm run watch`.

## Plugin installation

Open the [wp-project.json](wp-project.json) file and add the slug of the plugin you want to install in the `plugins` array:

```js
{
    // ...

    "wordpress": {
        "version": null,

        "plugins": [
            // ...
        ]
    }
}
```

For example, say you want to install [Really Simple CAPTCHA](https://wordpress.org/plugins/really-simple-captcha/), check the [Wordpress.org](https://wordpress.org/) url of the plugin and you will see the slug at the end:

```
https://wordpress.org/plugins/really-simple-captcha/
```

The slug is `really-simple-captcha`, add it to the configuration file:

```js
"plugins": [
    "really-simple-captcha"
]
```

Run `npm run wp-install`, your plugin will be installed and activated, the configuration will also be rewritten to include the last version number:

```js
"plugins": [
    "really-simple-captcha@1.8.0.1"
]
```

## Theming

The boilerplate is provided with a theme ready to use. It leverages some redundant tasks and provides a structure for your files.

### Assets management

The boilerplate is provided with __Bower__ and a __Gulp__ configuration ready to be used to concatenate script files and compile __Less__, with sourcemaps. Icon fonts and CSS sprites generation also comes out of the box.

All the assets that should be compiled live in the `app/` directory of your theme. The output after compilation will be saved to the `assets/` directory.

You don't need to touch the `gulpfile.js` file to add new paths to the compilation tasks, everything lives in the [gulp-paths.json](gulp-paths.json) file.

In this file, the __%theme_path%__ keyword is automatically replaced at compilation time by the path of your theme, allowing you to have shorter paths in your config file and to easily rename your theme (don't forget [to update the configuration](#installation) if you do this).

Every path in the configuration file will be interpreted by the `gulp.src()` method (once the __%theme_path%__ keyword is replaced), check [its documentation](https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulpsrcglobs-options) to understand the syntax.

#### ES6 with Babel

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

Now you can use the corresponding classes in your HTML:

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

#### CSS sprites generation

You can generate CSS sprites through the gulp configuration. Choose a name for your sprite, "my-sprite" for example, and add a new object to the `sprites` section:

```js
// ...

"sprites": {
    "my-sprite": {
        "path": "%theme_path%/app/sprites/my-sprite/**"
    }
},

// ...
```

Run `npm run watch` in your console and add your new stylesheet to your HTML:

```twig
<link rel="stylesheet" href="{{ 'my-sprite.css'|asset('app') }}">
```

Now you can use the corresponding classes in your HTML:

```html
<div class="my-sprite my-sprite-image1"></div>
```

If you want to get rid of an additional HTTP request, you can also import the stylesheet in your `app.less` file:

```less
@import '../../assets/my-sprite.css';
```

It is worth mentioning you can also manage retina images. In your source folder, put the biggest dimensions of your images (they will be automatically resized) and add dimensions to your configuration:

```js
// ...

"sprites": {
    "my-sprite": {
        "path": "%theme_path%/app/sprites/my-sprite/**",
        "dimensions": [
            {"ratio": 1, "dpi": 72},
            {"ratio": 2, "dpi": 192}
        ]
    }
},

// ...
```

With this configuration, the retina sprite will be displayed on devices with a DPI >= 192. On other devices, a smaller sprite will be displayed.

### PHP helpers

#### Ajax

```php
/**
 * Create a new Ajax endpoint with preconfigured headers for JSON values.
 * @param string $action The action name associated to your endpoint.
 * @param callable $handler The callback executed each time the endpoint is requested.
 * @param boolean $isPublic Defines if the endpoint should be public or not.
 */
new App\Ajax\Endpoint($action, callable $handler, $isPublic = false);
```

```php
/**
 * Create a new public Ajax endpoint with preconfigured headers for JSON values.
 * @param string $action The action name associated to your endpoint.
 * @param callable $handler The callback executed each time the endpoint is requested.
 */
new App\Ajax\PublicEndpoint($action, callable $handler);
```

#### Meta

```php
/**
 * Save post meta data in the database, the $_POST values are automatically retrieved.
 * @param integer $post_id The ID of the post.
 * @param string[] $fields An array containing the name of the fields.
 */
App\Meta::savePostData($post_id, $fields);
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

### PHP Configuration

In the configuration file of the theme ([config/theme.php](public/wp-content/themes/project-theme/config/theme.php)), you can disable/enable Wordpress features and manage versions for your assets.

#### Wordpress features

Comments, pingbacks and trackbacks can easily be disabled/enabled by setting the associated key to `false`/`true`.

To customize the admin menu, you provide an array containing the name of the item as a key and whether it should disabled/enabled as a boolean value. For submenus, simply use nested arrays. For example, say you want to disable the __Appearance__ menu and the __Media__ submenu in the __Settings__ menu, simply use this configuration:

```php
return array(

    'wordpress' => array(
        // ...

        'admin_menu' => array(
            'themes.php' => false,
            'options-general.php' => array(
                'options-media.php' => false,
            ),
        ),
    ),

    // ...

);
```

The keys are based on the accepted values by the [`remove_menu_page`](https://codex.wordpress.org/Function_Reference/remove_menu_page) and [`remove_submenu_page`](https://codex.wordpress.org/Function_Reference/remove_submenu_page) functions.

__Note:__ Pingbacks and trackbacks are disabled by default since they can be used as a gateway for DDoS attacks, see [issue #35](https://github.com/46cl/wp-boilerplate/issues/35).

#### Asset versions

You can define versions for your assets, those will be used by the `asset` Twig filter. If you define `2.2.1` for the `vendor` key, all your assets included through the `asset` filter with the `'vendor'` parameter will be appended with this query parameter: `ver=2.2.1`. This feature is useful to force browsers to refresh their cache.

See the [views/layout.twig](public/wp-content/themes/project-theme/views/layout.twig) file for an usage example of this filter.

#### Easy access to the configuration

You can access a configuration property with the `App\Config::get($propertyPath)` method. For example, if you want to access to the `vendor` property in the `assets` array:

```php
App\Config::get('assets.vendor');
```
