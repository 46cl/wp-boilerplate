# Releases

Releasing process is entirely manual (for the moment) and is based on [Semantic Versioning](http://semver.org/):

* Clean your working changes with a commit or a stash.
* Update the `version` entry in [package.json](./package.json).
* Commit the changements with the message `Release vX.X.X` where `X.X.X` is your release number.
* Add a tag to this commit, name it `vX.X.X`.
* Push your commits __and__ your tags.
