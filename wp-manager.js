'use strict';

/*
 * Requirements
 */

var project = require('./wp-project.json');

var argv = require('yargs').argv,
    chalk = require('chalk'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    shell = require('shelljs'),
    spawn = require('child_process').spawn;

/*
 * Constants
 */

var WP_BOILERPLATE_ENV = (process.env.WP_BOILERPLATE_ENV || '').toLowerCase();

var WP_ROOT = 'public',
    THEMES_PATH = WP_ROOT + '/wp-content/themes',
    ENV = !argv.skipEnvCheck && ['prod', 'dev', 'contrib'].indexOf(WP_BOILERPLATE_ENV) != -1
        ? process.env.WP_BOILERPLATE_ENV.toLowerCase()
        : 'dev';

/*
 * Helpers
 */

var manager = {

    errorsOccured: false,

    /**
     * Checks if the current environment doesn't match the provided ones.
     * @param  {string[]|function[]} envs An array composed of strings of environments ("prod", "dev", "contrib") and/or
     * of functions returning a message when an environment criteria isn't met.
     * @return {boolean|string}           Returns a value different from `false` if the current environment doesn't
     * match the provided ones.
     */
    envDoesntMatch: function(envs) {
        if (!envs) {
            return false;
        }

        var containsStrings = false;
        envs.forEach(function(env) {
            containsStrings = containsStrings || typeof env == 'string';
        });

        var result = false;

        envs.filter(function(env) {
            return typeof env == 'function';
        }).forEach(function(env) {
            result = result || env();
        });

        if (containsStrings && envs.indexOf(ENV) == -1) {
            var envsOutput = envs.filter(function(env) {
                return typeof env == 'string';
            }).map(function(env) {
                return chalk.cyan(env);
            }).join(', ');

            result = result || 'Requires one of the following environments: ' + envsOutput;
        }

        return result;
    },

    // Executes a new task
    task: function(message, execTask, envs) {
        process.stdout.write(chalk.yellow('Running: ') + message + '... ');

        var bypassingMessage = this.envDoesntMatch(envs);

        if (!bypassingMessage) {
            try {
                execTask();
                console.log(chalk.green('Success'));
            } catch(error) {
                this.errorsOccured = true;
                error = error.toString().trim().replace(/Error: /g, '').replace(/[\n\r]/g, ' ');
                console.log(chalk.red('Error: ') + error);
            }
        } else {
            console.log(chalk.yellow('Bypassed: ') + bypassingMessage);
        }
    },

    // Runs a command
    exec: function(command) {
        var result = shell.exec(command);

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

// Set shelljs as silent
shell.config.silent = true;

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

    /*
     * Custom environments
     */

    // No project is initialized
    var notInitializedEnv = (function() {
        var result = project.wordpress.version != null
             ? 'The project is already initialized'
             : false;

        return function() {
            return result;
        };
    })();

    // The project is not installed
    var notInstalledEnv = (function() {
        var result = 'The project is already installed';

        try {
            manager.wp('core is-installed');
        } catch(error) {
            result = false;
        }

        return function() {
            return result;
        };
    })();

    /*
     * Tasks
     */

    manager.task('Downloading Wordpress files', function() {
        function install(withLocale) {
            var locale = withLocale ? (' --locale=' + withLocale) : '';

            if (!project.wordpress.version) {
                manager.wp('core download' + locale);
            } else {
                manager.wp('core download' + locale + ' --version=' + project.wordpress.version);
            }
        }

        try {
            install('fr_FR');
        } catch(error) {
            install();
        }

    }, [notInstalledEnv]);

    manager.task('Configuring Wordpress', function() {
        manager.wp('core config --dbname="' + project.database + '"');
    }, [notInstalledEnv]);

    manager.task('Creating the database', function() {
        manager.exec('mysql -u root -e "create database \\`' + project.database + '\\`;"');
    }, [notInstalledEnv]);

    manager.task('Installing Wordpress', function() {
        manager.wp('core install --title="' + project.title + '"');
    }, [notInstalledEnv]);

    manager.task('Managing plugins', function() {
        manager.wpPlugins().forEach(function(plugin) {
            manager.wp('plugin uninstall ' + plugin.name);
        });

        project.wordpress.plugins.forEach(function(pluginStr) {
            var plugin = pluginStr.split('@')[0],
                version = pluginStr.split('@')[1];

            if (!version) {
                manager.wp('plugin install ' + plugin + ' --activate');
            } else {
                manager.wp('plugin install ' + plugin + ' --version=' + version + ' --activate');
            }
        });
    });

    manager.task('Renaming the project theme', function() {
        manager.writeFile(THEMES_PATH + '/project-theme/style.css', [
            '/*',
            'Theme Name: ' + project.title,
            '*/\n'
        ].join('\n'));

        if (fs.renameSync(THEMES_PATH + '/project-theme', THEMES_PATH + '/' + project.slug)) {
            throw new Error("The theme directory cannot be renamed...");
        }
    }, ['prod', 'dev', notInitializedEnv]);

    manager.task('Managing themes', function() {
        var themeName = manager.envDoesntMatch(['prod', 'dev']) ? 'project-theme' : project.slug;

        manager.wp('theme activate ' + themeName);
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

        manager.wpPlugins().forEach(function(pluginObj) {
            var plugins = project.wordpress.plugins,
                pluginIndex;

            plugins.forEach(function(pluginStr, index) {
                if (pluginStr.indexOf(pluginObj.name) == 0) pluginIndex = index;
            });

            if (pluginIndex !== undefined) {
                var plugin = plugins[pluginIndex].split('@')[0];
                plugins[pluginIndex] = plugin + '@' + pluginObj.version;
            }
        });

        manager.writeFile('wp-project.json', JSON.stringify(project, null, 4));
    }, ['prod', 'dev', notInitializedEnv]);

    manager.task('Reinitializing the Git project', function() {
        var lastCommit = manager.exec('git log -n 1 --format=oneline').trim().replace(/(`|")/g, '\\$1');

        rimraf.sync('.git');

        manager.exec('git init');
        manager.exec('git add -A');
        manager.exec([
            'git commit',
            '-m "New Wordpress install (v' + project.wordpress.version + ')"',
            '-m "Initialized with commit: ' + lastCommit + '"'
        ].join(' '));
    }, ['prod', 'dev', notInitializedEnv]);

    /*
     * Final state
     */

    if (!manager.errorsOccured) {
        console.log('\n' + chalk.green('Success:') + ' Everything went better than expected!');
    } else {
        console.log([
            '\n' + chalk.red('Error:'),
            'Some errors occured during the installation. Check if all the dependencies are installed and if your',
            'MySQL server is running. Next, run ' + chalk.yellow('npm run wp-clean') + ' and',
            chalk.yellow('npm run wp-install') + '.'
        ].join(' '));
    }

};

commands.serve = function() {

    shell.cd(WP_ROOT);

    // Use the spawn method to preserve colors in the console
    spawn('wp', ['server', '--host=0.0.0.0'].concat(process.argv.slice(3)), {stdio: 'inherit'});

};

commands.composer = function() {

    var themeName = 'project-theme';

    if (project.wordpress.version) {
        themeName = project.slug;
    } else if (manager.envDoesntMatch(['prod', 'dev'])) {
        try {
            fs.statSync(THEMES_PATH + '/project-theme');
        } catch(error) {
            if (error.code == 'ENOENT') themeName = project.slug;
        }
    }

    shell.cd(THEMES_PATH + '/' + themeName);

    // Use the spawn method to preserve colors in the console
    spawn('composer', process.argv.slice(3), {stdio: 'inherit'}).on('error', function(error) {
        // Throw errors only if Composer is installed
        if (error.code != 'ENOENT') {
            throw error;
        }
    });

};

/*
 * Run the requested command
 */

console.log(chalk.blue('WP_BOILERPLATE_ENV') + ' = ' + chalk.cyan(ENV) + '\n');
commands[argv._[0]]();
