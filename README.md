# tagtool

Tagtool is a simple microservice for collecting and requesting user tags on data elements from users.

## Building

To build this project you will first need a Github PAT which has read access to github public package repositories.

Generate one from the *classic* token generation page at [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new) which has at least read:packages permissions.

You can then add it to your user ~/.npmrc with a line like
```
//npm.pkg.github.com/tjsr/:_authToken=ghp_ABCDEF
```

To run the `build:docker` targets, you must set the `TAGTOOL_GITHUB_PAT` environment variable to have the PAT value in the shell you're running npm from.

## Deployment

You'll need to generate a key for the pipeline to connect to a host, and configure:
- DEPLOYMENT_HOST
- DEPLOYMENT_USER
- DEPLOYMENT_SSH_KEY - generate with ```ssh-keygen -t rsa -b 4096 -C "github-tagtool-dev@tagtool.dev.local" -f id_rsa.github-tagtool-dev```