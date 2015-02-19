# Requirements

* Git
* PHP 5.3+
* MySQL 5.5+
* Node.js
* [WP-CLI](http://wp-cli.org/)
* [wp server](https://github.com/wp-cli/server-command)

Tested on Wordpress 4.1

# Installation

Open the `wp-project.json` file and fill in the `title`, `slug` and `database` properties:

```json
{
    "title": "My new project",
    "slug": "my-new-project",
    "database": "mynewproject",

    "wordpress": {
        "version": null,

        "plugins": {
            "timber-library": null
        }
    }
}
```

Then run the installer:

```shell
npm install
```

If the installation failed for any reason, just run `npm run clean` to rollback to the previous state. It doesn't cancel the created commit but if you reached this point there shouldn't be any issues that requires a rollback.

# Serve the project locally

```shell
cd public/
wp server
```
