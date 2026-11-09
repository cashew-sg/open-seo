# cashew-sg/open-seo

[OpenSEO](https://github.com/every-app/open-seo) with one change, until upstream
ships it: **Prompt Research in the tracker's market**
([#508](https://github.com/every-app/open-seo/issues/508)). Outside US English it
researches the market's Google AI Overview searches, matched on the search only
and rewritten as questions, instead of US ChatGPT data. A market DataForSEO has
no Google data for falls back to US ChatGPT data.

This branch (`cashew`, the default) holds only the patch and the build. Upstream's
code never lands here.

- **`patches/`** is applied to upstream's newest release tag.
- **`build.yml`** runs daily, on a push here that changes the patch or the
  workflow, and by hand. For a release and patch not yet built, it applies the
  patch, runs upstream's `ci:check` and tests, and publishes
  `ghcr.io/cashew-sg/open-seo-standalone:<release>-sg.<patch hash>` (amd64),
  the image of upstream's multi-container stack (`deploy/standalone`). Every
  successful run moves `latest` to that image. A failed nightly opens an issue
  and publishes nothing.
- **Deploying** is by hand in Dokploy; see [Dokploy](#dokploy).

**Changing the patch:** the source is the `sg` branch, an upstream release tag
plus the change as commits. Edit and commit there, then regenerate and push here:
`git diff <tag> sg > patches/prompt-research-market.patch`. When upstream moves,
rebase `sg` onto the new tag first.

## Dokploy

The `open-seo` compose app (production environment) runs
[`dokploy/compose.yaml`](dokploy/compose.yaml): upstream's
`deploy/standalone/compose.yaml` with the image defaulting to this fork's build
and the four data volumes marked external. Dokploy names its project
`openseo-wqteyq`, but the data lives in volumes named `openseo-standalone_storage`,
`_runtime`, `_config` and `_web-config`, so a redeploy or a recreated app keeps it.

- **Redeploy** to pick up a new build: it pulls `latest` (`pull_policy: always`).
  To pin or roll back, set `OPENSEO_IMAGE` to a versioned tag in the environment.
- **Environment:** `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `AUTH_MODE=local_noauth`,
  `BETTER_AUTH_URL` (the Tailscale URL), `PORT=3101`,
  `DATAFORSEO_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET` and `CRAWLER_ACCESS_SECRET`. A copy is in
  `deploy/standalone/.env` of the `sg` checkout on the host. **Never change the
  two storage keys**: the stored data can't be read without them.
- **Reaching it:** the `web` service listens on `127.0.0.1:3101`, and the Tailscale
  service `svc:openseo` proxies its tailnet-only URL to it. No Dokploy domain is
  set.
- **When upstream changes its compose file** (a new service, variable or volume),
  carry the change into `dokploy/compose.yaml` and paste it into Dokploy, keeping
  the image line and the external volumes.

The app moved here on 2026-11-09 from the old single-container image, with
upstream's `compose.migrate.yaml` run once from a checkout on the host (see
"Move from the old Docker image" in upstream's `docs/SELF_HOSTING_DOCKER.md`).

**Retire the fork** once an upstream release fixes #508: set `OPENSEO_IMAGE` in
Dokploy to `ghcr.io/every-app/open-seo-standalone:<version>` and archive this
repository.
