#!/usr/bin/env bash
set -euo pipefail

# This account and database are disposable test fixtures, never real credentials.
[[ "${GITHUB_ACTIONS:-}" == "true" ]]
[[ "${MYSQL_DATABASE:-}" == "testdb" ]]
[[ "${MYSQL_USER:-}" == "testuser" ]]
[[ "${MYSQL_HOST:-}" == "127.0.0.1" ]]
: "${CI_MYSQL_CONTAINER:?GitHub Actions MySQL service container is required}"

mysql_as_root() {
  docker exec --env MYSQL_PWD=ci-only-root-password --interactive     "$CI_MYSQL_CONTAINER" mysql --user=root --database=testdb "$@"
}

# GitHub waits for service health before steps run; authenticate before applying DDL.
mysql_as_root --execute="SELECT 1"
mysql_as_root --execute="SET GLOBAL sql_mode = 'NO_ENGINE_SUBSTITUTION,ALLOW_INVALID_DATES'"
for migration in prisma/migrations/*/migration.sql; do
  mysql_as_root < "$migration"
done

# A large historical ID and two kinds of session exercise migration safety.
mysql_as_root <<'SQL'
INSERT INTO Tags (id, objectId, tag, createdByUserId)
VALUES (9223372036854775807, 'fixture-object', 'fixture-tag', 'fixture-owner');
INSERT INTO session (session_id, sess, expire) VALUES
  ('fixture-anonymous', '{"userId":"fixture-owner"}', DATE_ADD(NOW(), INTERVAL 1 DAY)),
  ('fixture-email', '{"userId":"fixture-owner","email":"fixture@example.test"}', DATE_ADD(NOW(), INTERVAL 1 DAY));
SQL

# Give the migration rehearsal read-only access to the fixture.
mysql_as_root <<'SQL'
CREATE USER 'testuser'@'%' IDENTIFIED BY 'testpassword';
GRANT SELECT ON testdb.* TO 'testuser'@'%';
SQL
