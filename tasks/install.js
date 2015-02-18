/*
 * Requirements
 */

var project = require('../wp-project.json');

var fs = require('fs'),
    gulp = require('gulp'),
    shell = require('shelljs');

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
    shell.ls(wpRoot).forEach(function(file) {
        if (file.indexOf('wp-content') == -1) {
            shell.rm('-rf', wpRoot + '/' + file);
        }
    });

    shell.ls(wpRoot + '/wp-content').forEach(function(file) {
        if (file.indexOf('themes') == -1) {
            shell.rm('-rf', wpRoot + '/wp-content/' + file);
        }
    });

    shell.ls(wpRoot + '/wp-content/themes').forEach(function(file) {
        if (file.indexOf('project-theme') == -1) {
            shell.rm('-rf', wpRoot + '/wp-content/themes/' + file);
        }
    });

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

gulp.task('wp-init', function() {

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
    }

});
