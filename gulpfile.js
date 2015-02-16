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

/*
 * Tasks
 */

gulp.task('wp-clean', cleanWpProject);

gulp.task('wp-init', function(cb) {

    shell.exec('wp core is-installed', {silent: true}, function(code) {
        if (code) {
            cleanWpProject();

            // Download and configure Wordpress
            shell.exec('wp core download --locale=fr_FR');
            shell.exec('wp core config --dbname="' + project.database + '"');

            // Create the database and the tables
            shell.exec('mysql -u root -e "create database \\`' + project.database + '\\`;"');
            shell.exec('wp core install --title="' + project.title + '"');

            // Install the required plugins and remove the useless ones
            var timberOutput = shell.exec('wp plugin install timber-library --activate', {silent: true}).output;
            console.log(timberOutput.replace(/&rsquo;/g, "'"));

            shell.exec('wp plugin uninstall hello');

            // Activate the project theme and remove the default ones provided with a new Wordpress installation
            shell.exec('wp theme activate project-theme');
            shell.exec('wp theme delete twentythirteen twentyfourteen twentyfifteen');

            // Configure the rewriting rules
            shell.exec('wp rewrite structure "/%postname%/" --hard');

            // Add an empty "wp-cli.yml" file to the public folder to avoid server issues
            // See: https://github.com/wp-cli/server-command/issues/3#issuecomment-74491413
            fs.writeFileSync('wp-cli.yml', '');

            // Remove the "origin" Git remote, avoiding any unwanted new commits on the boilerplate repository.
            shell.exec('git remote remove origin', {silent: true});

            // Commit the new Wordpress install
            console.log('Commiting...');
            shell.exec('git add -A');

            var wpVersion = shell.exec('wp core version', {silent: true}).output.trim(),
                timberVersion = JSON.parse(
                    shell.exec('wp plugin get timber-library --format=json', {silent: true}).output.trim()
                ).version;

            shell.exec(
                'git commit -m "New install: Wordpress v' + wpVersion + ' and Timber v' + timberVersion + '"',
                {silent: true}
            );
        }

        cb();
    });

});
