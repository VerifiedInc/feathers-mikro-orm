# Feathers Mikro ORM Adapter

An ORM adapter for use with [Mikro ORM](https://mikro-orm.io/) and [Feathers](https://bailer.gitbooks.io/feathersjs/content/databases/readme.html).

## Releases
Releases and publishing to NPM is automated via Github Actions CI job. In order to trigger a release one should push a git tag with a preceding `v` with semver notation, ie `v1.1.1`, to the `main` branch. This will trigger the CI job to bump the package version, publish to NPM, make a release commit, and make a Github Release. The message of the git tag will be the release message so please make it meaningful. For example, `git tag v1.1.1 -m "Updated the SDK with a new CI job" && push origin v1.1.1`.

## Tests
### Local
Need to ensure you have a local db user `unumid` that has access to the `feathers_mikro_orm_test` db. Considering we use that user for our DBeaver localhost connections probably worth giving that user `superadmin` role locally.

```
psql
CREATE ROLE unumid WITH LOGIN SUPERUSER;
```