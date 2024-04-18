# tagtool

Tagtool is a simple microservice for collecting and requesting user tags on data elements from users.

## Deployment

You'll need to generate a key for the pipeline to connect to a host, and configure:
- DEPLOYMENT_HOST
- DEPLOYMENT_USER
- DEPLOYMENT_SSH_KEY - generate with ```ssh-keygen -t rsa -b 4096 -C "github-tagtool-dev@tagtool.dev.local" -f id_rsa.github-tagtool-dev```