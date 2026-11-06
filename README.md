# Hall of Faces

A small browser quiz about the characters of *A Song of Ice and Fire* and *Game of Thrones*: look at a portrait, read the hints and guess who it is. Available in Russian and English.

This is a hobby project I built while learning Vue 3. The game is free and has no ads.

## Running locally

Requires Node.js 24 and pnpm (the version is pinned in `package.json`, `corepack enable` picks it up).

```sh
pnpm install
pnpm dev        # dev server
pnpm validate   # check the game data against the schema
pnpm typecheck
pnpm test
pnpm build      # static build in dist/
```

The data format is described in [docs/DATA.md](docs/DATA.md).

## Deployment

Every push to `master` builds the site and publishes it to GitHub Pages (`.github/workflows/pages.yml`).

## Credits and licenses

- **Code** is released under the [MIT License](LICENSE).
- **Character portraits** in `public/portraits/` are by the artist [TheMico](https://www.instagram.com/txemico/). © TheMico, all rights reserved. They are **not** covered by the MIT License and may not be reused without the artist's permission.
- Character facts and coats of arms come from the fan wikis [7kingdoms.ru](https://7kingdoms.ru) and [A Wiki of Ice and Fire](https://awoiaf.westeros.org).

An unofficial fan project, not affiliated with George R. R. Martin, HBO or the publishers. *A Song of Ice and Fire* and *Game of Thrones* belong to their respective owners.
