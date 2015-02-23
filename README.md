# WP-Boilerplate

Tested on Wordpress 4.1

## Requirements

* [Git](http://git-scm.com/)
* [PHP](http://php.net/) v5.3+
* [MySQL](http://www.mysql.fr/) v5.5+
* [Node.js](http://nodejs.org/) (with NPM v2+)
* [WP-CLI](http://wp-cli.org/)
* [wp server](https://github.com/wp-cli/server-command)

### Quick setup for OS X users

Install [Homebrew](http://brew.sh/) and run `brew doctor`. If everything seems OK, install the required packages with those commands:

```shell
brew tap homebrew/php
brew install git php mysql node wp-cli
```

Make sure MySQL's server is started with `mysql.server start`.

Install __wp server__ with the following commands (based [on this guide](https://github.com/wp-cli/wp-cli/wiki/Community-Packages#installing-a-package-without-composer)):

```shell
mkdir -p ~/.wp-cli/commands
git clone https://github.com/wp-cli/server-command.git ~/.wp-cli/commands/server
echo "require:\n  - commands/server/command.php" > ~/.wp-cli/config.yml
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

To run a local server, use `npm run wp-serve`.

To watch for your assets modifications, use `npm run watch`.

## Theme configuration

In the configuration file of the theme (`config/theme.php`), you can define versions for your assets. Those will be used by the `asset` Twig filter, see the `views/layout.twig` file for an usage example of this filter.

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
