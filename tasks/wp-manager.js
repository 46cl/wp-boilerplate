'use strict';

/*
 * Requirements
 */

var project = require('../wp-project.json');

var argv = require('yargs').argv,
    chalk = require('chalk'),
    fs = require('fs'),
    gulp = require('gulp'),
    shell = require('shelljs'),
    spawn = require('child_process').spawn;

var wpRoot = 'public';

/*
 * Helpers
 */

// Runs a WP command
function wp(command, silent) {
    return shell.exec('wp ' + command + ' --path=' + wpRoot, {silent: silent});
}

// Cleans the project to its state before any installation
function cleanWp() {

    // Remove all Wordpress files
    shell.exec('git clean -fdx ' + wpRoot);

    // Drop the database
    shell.exec('mysql -u root -e "drop database if exists \\`' + project.database + '\\`;"');

}

// Cleans the output when installing or removing a plugin
function cleanOutput(output) {
    console.log(output.replace(/&rsquo;/g, "'").trim());
}

// Returns the currently installed plugins
function pluginList() {
    return JSON.parse(wp('plugin list --format=json', true).output.trim());
}

/*
 * Tasks
 */

gulp.task('wp-clean', cleanWp);

gulp.task('wp-install', function() {

    if (wp('core is-installed', true).code) {
        cleanWp();

        // Download and configure Wordpress
        if (!project.wordpress.version) {
            wp('core download --locale=fr_FR');
        } else {
            wp('core download --locale=fr_FR --version=' + project.wordpress.version);
        }

        wp('core config --dbname="' + project.database + '"');

        // Create the database and run the installer
        shell.exec('mysql -u root -e "create database \\`' + project.database + '\\`;"');
        wp('core install --title="' + project.title + '"');

        // Remove and install plugins
        pluginList().forEach(function(plugin) {
            cleanOutput(wp('plugin uninstall ' + plugin.name, true).output);
        });

        Object.keys(project.wordpress.plugins).forEach(function(name) {
            var version = project.wordpress.plugins[name];

            if (!version) {
                cleanOutput(wp('plugin install ' + name + ' --activate', true).output);
            } else {
                cleanOutput(wp('plugin install ' + name + ' --version=' + version + ' --activate', true).output);
            }
        });

        // Activate the project theme and remove the default ones provided with a new Wordpress installation
        wp('theme activate project-theme');
        wp('theme delete twentythirteen twentyfourteen twentyfifteen');

        // Configure the rewriting rules
        wp('rewrite structure "/%postname%/" --hard');

        // Add an empty "wp-cli.yml" file to the public folder to avoid server issues
        // See: https://github.com/wp-cli/server-command/issues/3#issuecomment-74491413
        fs.writeFileSync(wpRoot + '/wp-cli.yml', '');

        if (process.env.WP_BOILERPLATE_ENV.toLowerCase() != 'dev' || argv.skipEnvCheck) {
            // Save the versions of the dependencies
            project.wordpress.version = wp('core version', true).output.trim();

            pluginList().forEach(function(plugin) {
                project.wordpress.plugins[plugin.name] = plugin.version;
            });

            fs.writeFileSync('wp-project.json', JSON.stringify(project, null, 4));

            // Remove the "origin" Git remote, avoiding any unwanted new commits on the boilerplate repository.
            shell.exec('git remote remove origin');

            // Commit the new Wordpress install
            shell.exec('git add -A');
            shell.exec('git commit -m "New Wordpress install (v' + project.wordpress.version + ')"');
        } else {
            console.log([
                chalk.blue('WP_BOILERPLATE_ENV') + ' set to ' + chalk.green('dev') + '\n',
                chalk.yellow('Bypassed') + ': Rewriting of ' + chalk.magenta('wp-config.json') + '...',
                chalk.yellow('Bypassed') + ': Git alterations...\n'
            ].join('\n'));
        }
    }

});

gulp.task('wp-serve', function(cb) {

    shell.cd(wpRoot);

    // Use the spawn method to preserve colors in the console
    spawn('wp', ['server'], {stdio: 'inherit'});

});
