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

# Releases

Releasing process is entirely manual (for the moment) and is based on [Semantic Versioning](http://semver.org/):

* Clean your working changes with a commit or a stash.
* Update the `version` entry in [package.json](./package.json).
* Commit the changements with the message `Release vX.X.X` where `X.X.X` is your release number.
* Add a tag to this commit, name it `vX.X.X`.
* Push your commits __and__ your tags.
