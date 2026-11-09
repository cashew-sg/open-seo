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
  `ghcr.io/cashew-sg/open-seo:<release>-sg.<patch hash>` (amd64). Every
  successful run moves `latest` to that image. A failed nightly opens an issue
  and publishes nothing.
- **Deploying** is by hand: redeploy the Dokploy app, which pulls `latest`
  (`pull_policy: always`). To pin or roll back, set `OPEN_SEO_IMAGE` to a
  versioned tag.

**Changing the patch:** the source is the `sg` branch, an upstream release tag
plus the change as commits. Edit and commit there, then regenerate and push here:
`git diff <tag> sg > patches/prompt-research-market.patch`. When upstream moves,
rebase `sg` onto the new tag first.

**Retire the fork** once an upstream release fixes #508: point Dokploy back at
`ghcr.io/every-app/open-seo:<version>` and archive this repository.
