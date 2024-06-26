# tagtool

Tagtool is a simple microservice for collecting and requesting user tags on data elements from users.

## Building

To build this project you will first need a Github PAT which has read access to github public package repositories.

Generate one from the *classic* token generation page at [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new) which has at least read:packages permissions.

Alternatively, use the github commandline tool and log in using `gh auth login` and `gh auth token`.

You can then add it to your user ~/.npmrc with a line like

```props
//npm.pkg.github.com/tjsr/:_authToken=ghp_ABCDEF
```

To run the `build:docker` targets, you must set the `TAGTOOL_GITHUB_PAT` environment variable to have the PAT value in the shell you're running npm from.

### Configuration

These values should be defined in your `.env.test[.local]` file on a per-environment basis to ensure data
is not accidentally used by a different environment it was generated for.  For instance, never use a `SESSION_SECRET`
or `USER_UUID_NAMESPACE` from your personal development environment in test, prod, or elsewhere - these values
should be unique to ensure that a user cannot accidentally clash and have data used in an environment it does not
belong to.

Used for limiting database connections - can be '%' if you really aren't worried about security.
`ACCESS_SOURCE_IP=172.16.0.%`

`SESSION_SECRET=<some UUID>`
`USERID_UUID_NAMESPACE=<some UUID>`

## Dependencies

This microservice utilises a number of other small libraries which have been extracted to their own packages/libraries for shared use by other similar stack tools.  This includes:

- [user-session-middleware](https://github.com/tjsr/user-session-middleware) - Session management, login handler framework, and attack protection.
- [simple-env-utils](https://github.com/tjsr/simple-env-utils) - simple methods for ensuring compliant environment variables.
- [mysql-pool-utils](https://github.com/tjsr/mysql-pool-utils) - simple re-usable database connection pool handling functions.
- [linkteam](https://github.com/tjsr/linkteam) - Development utility for linking the above libraries while in development.

## Deployment

Deployment via github actions occurs by having a remote docker host pull and re-start two images - first the database migration image, then the application image.

You'll need to generate an ssh key pair for the pipeline docker actions to connect to a host, and configure:

- DEPLOYMENT_HOST
- DEPLOYMENT_USER
- DEPLOYMENT_SSH_KEY - generate with `ssh-keygen -t rsa -b 4096 -C "github-tagtool-dev@tagtool.dev.local" -f id_rsa.github-tagtool-dev`
