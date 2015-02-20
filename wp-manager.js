'use strict';

/*
 * Requirements
 */

var project = require('./wp-project.json');

var argv = require('yargs').argv,
    chalk = require('chalk'),
    fs = require('fs'),
    gulp = require('gulp'),
    shell = require('shelljs'),
    spawn = require('child_process').spawn;

/*
 * Constants
 */

var WP_BOILERPLATE_ENV = process.env.WP_BOILERPLATE_ENV.toLowerCase();

var WP_ROOT = 'public',
    ENV = !argv.skipEnvCheck && ['prod', 'dev', 'contrib'].indexOf(WP_BOILERPLATE_ENV) != -1
        ? process.env.WP_BOILERPLATE_ENV.toLowerCase()
        : 'dev';

/*
 * Helpers
 */

var manager = {

    errorsOccured: false,

    // Executes a new task
    task: function(message, execTask, envs) {
        process.stdout.write(chalk.yellow('Running: ') + message + '... ');

        if (!envs || envs.indexOf(ENV) != -1) {
            try {
                execTask();
                console.log(chalk.green('Success'));
            } catch(error) {
                this.errorsOccured = true;
                console.log(chalk.red('Error: ') + error.trim().replace(/[\n\r]/g, ' '));
            }
        } else {
            var envsOutput = envs.map(function(env) {
                return chalk.cyan(env);
            }).join(', ');

            console.log(chalk.yellow('Bypassed:') + ' Requires one of the following environments: ' + envsOutput);
        }
    },

    // Runs a command
    exec: function(command) {
        var result = shell.exec(command, {silent: true});

        if (result.code) {
            throw new Error(result.output);
        }

        return result.output;
    },

    writeFile: function(filepath, content) {
        if (fs.writeFileSync(filepath, content)) {
            throw new Error("The file cannot be written...");
        }
    },

    // Runs a WP command
    wp: function(command) {
        return this.exec('wp ' + command + ' --path=' + WP_ROOT);
    },

    // Returns installed WP plugins
    wpPlugins: function() {
        return JSON.parse(this.wp('plugin list --format=json').trim());
    }

};

/*
 * Commands
 */

var commands = {};

// Cleans the project to its initial state before any installation
commands.clean = function() {

    manager.task('Removing all Wordpress files', function() {
        manager.exec('git clean -fdx ' + WP_ROOT);
    });

    manager.task('Dropping the database', function() {
        manager.exec('mysql -u root -e "drop database if exists \\`' + project.database + '\\`;"');
    });

};

commands.install = function() {

    try {

        manager.wp('core is-installed');
        console.log(chalk.yellow('Cancelled:') + ' Wordpress seems already installed');

    } catch(error) {

        commands.clean();

        manager.task('Downloading Wordpress files', function() {
            if (!project.wordpress.version) {
                manager.wp('core download --locale=fr_FR');
            } else {
                manager.wp('core download --locale=fr_FR --version=' + project.wordpress.version);
            }
        });

        manager.task('Configuring Wordpress', function() {
            manager.wp('core config --dbname="' + project.database + '"');
        });

        manager.task('Creating the database', function() {
            manager.exec('mysql -u root -e "create database \\`' + project.database + '\\`;"');
        });

        manager.task('Installing Wordpress', function() {
            manager.wp('core install --title="' + project.title + '"');
        });

        manager.task('Managing plugins', function() {
            manager.wpPlugins().forEach(function(plugin) {
                manager.wp('plugin uninstall ' + plugin.name);
            });

            Object.keys(project.wordpress.plugins).forEach(function(name) {
                var version = project.wordpress.plugins[name];

                if (!version) {
                    manager.wp('plugin install ' + name + ' --activate');
                } else {
                    manager.wp('plugin install ' + name + ' --version=' + version + ' --activate');
                }
            });
        });

        manager.task('Managing themes', function() {
            manager.wp('theme activate project-theme');
            manager.wp('theme delete twentythirteen twentyfourteen twentyfifteen');
        });

        manager.task('Configuring rewriting rules', function() {
            manager.wp('rewrite structure "/%postname%/" --hard');
        });

        manager.task(
            'Adding ' + chalk.magenta('wp-cli.yml') + ' to the ' + chalk.magenta('public/') + ' folder',
            function() {
                manager.writeFile(WP_ROOT + '/wp-cli.yml', '');
            }
        );

        manager.task('Saving dependencies versions', function() {
            project.wordpress.version = manager.wp('core version').trim();

            manager.wpPlugins().forEach(function(plugin) {
                project.wordpress.plugins[plugin.name] = plugin.version;
            });

            manager.writeFile('wp-project.json', JSON.stringify(project, null, 4));
        }, ['prod', 'dev']);

        manager.task('Removing the "origin" git remote', function() {
            manager.exec('git remote remove origin');
        }, ['prod', 'dev']);

        manager.task('Commiting the new Wordpress install', function() {
            manager.exec('git add -A');
            manager.exec('git commit -m "New Wordpress install (v' + project.wordpress.version + ')"');
        }, ['prod', 'dev']);

        if (!manager.errorsOccured) {
            console.log('\n' + chalk.green('Success:') + ' Everything went better than expected!');
        } else {
            console.log([
                '\n' + chalk.red('Error:'),
                'Some errors occured during the installation. Check if all the dependencies are installed and if your',
                'MySQL server is running. Next, run ' + chalk.yellow('npm run wp-clean') + ' and',
                chalk.yellow('npm run wp-clean') + '.'
            ].join(' '));
        }

    }

};

commands.serve = function() {

    shell.cd(WP_ROOT);

    // Use the spawn method to preserve colors in the console
    spawn('wp', ['server'], {stdio: 'inherit'});

};

/*
 * Run the requested command
 */

console.log(chalk.blue('WP_BOILERPLATE_ENV') + ' = ' + chalk.cyan(ENV) + '\n');
commands[argv._[0]]();
