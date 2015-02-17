/*
 * Requirements
 */

var project = require('./wp-project.json');

var fs = require('fs'),
    gulp = require('gulp'),
    shell = require('shelljs');

/*
 * Initialization
 */

shell.cd('public');

/*
 * Helpers
 */

// Cleans the project to its state before any installation
function cleanWpProject() {

    // Remove all Wordpress files
    shell.ls('.').forEach(function(file) {
        if (file.indexOf('wp-content') == -1) {
            shell.rm('-rf', file);
        }
    });

    shell.ls('wp-content').forEach(function(file) {
        if (file.indexOf('themes') == -1) {
            shell.rm('-rf', 'wp-content/' + file);
        }
    });

    shell.ls('wp-content/themes').forEach(function(file) {
        if (file.indexOf('project-theme') == -1) {
            shell.rm('-rf', 'wp-content/themes/' + file);
        }
    });

    // Drop the database
    shell.exec('mysql -u root -e "drop database \\`' + project.database + '\\`;"', {silent: true});

}

// Returns the currently installed plugins
function pluginList() {
    return JSON.parse(shell.exec('wp plugin list --format=json', {silent: true}).output.trim());
}

// Cleans the output when installing or removing a plugin
function pluginOutput(command) {
    var output = shell.exec(command, {silent: true}).output;
    console.log(output.replace(/&rsquo;/g, "'").trim());
}

/*
 * Tasks
 */

gulp.task('wp-clean', cleanWpProject);

gulp.task('wp-init', function(cb) {

    shell.exec('wp core is-installed', {silent: true}, function(code) {
        if (code) {
            cleanWpProject();

            // Download and configure Wordpress
            if (!project.wordpress.version) {
                shell.exec('wp core download --locale=fr_FR');
            } else {
                shell.exec('wp core download --locale=fr_FR --version=' + project.wordpress.version);
            }

            shell.exec('wp core config --dbname="' + project.database + '"');

            // Create the database and run the installer
            shell.exec('mysql -u root -e "create database \\`' + project.database + '\\`;"');
            shell.exec('wp core install --title="' + project.title + '"');

            // Remove and install plugins
            pluginList().forEach(function(plugin) {
                pluginOutput('wp plugin uninstall ' + plugin.name);
            });

            Object.keys(project.wordpress.plugins).forEach(function(name) {
                var version = project.wordpress.plugins[name];

                if (!version) {
                    pluginOutput('wp plugin install ' + name + ' --activate');
                } else {
                    pluginOutput('wp plugin install ' + name + ' --version=' + version + ' --activate');
                }
            });

            // Activate the project theme and remove the default ones provided with a new Wordpress installation
            shell.exec('wp theme activate project-theme');
            shell.exec('wp theme delete twentythirteen twentyfourteen twentyfifteen');

            // Configure the rewriting rules
            shell.exec('wp rewrite structure "/%postname%/" --hard');

            // Add an empty "wp-cli.yml" file to the public folder to avoid server issues
            // See: https://github.com/wp-cli/server-command/issues/3#issuecomment-74491413
            fs.writeFileSync('wp-cli.yml', '');

            // Save the versions of the dependencies
            project.wordpress.version = shell.exec('wp core version', {silent: true}).output.trim();

            pluginList().forEach(function(plugin) {
                project.wordpress.plugins[plugin.name] = plugin.version;
            });

            fs.writeFileSync('../wp-project.json', JSON.stringify(project, null, 4));

            // Remove the "origin" Git remote, avoiding any unwanted new commits on the boilerplate repository.
            shell.exec('git remote remove origin', {silent: true});

            // Commit the new Wordpress install
            console.log('Commiting...');
            shell.exec('git add -A');

            var wpVersion = shell.exec('wp core version', {silent: true}).output.trim();
            shell.exec('git commit -m "New Wordpress install (v' + wpVersion + ')"', {silent: true});
        }

        cb();
    });

});
