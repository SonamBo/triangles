# Getting Triangles into your own repo

This folder is a complete app made from the Cash Paws starter, with the game in `www/games/triangles/`. It needs two small shell changes that belong in Cash Paws, so they reach every app built from the starter.

## 1. Cash Paws first

In your Cash Paws clone:

```bash
git am cashpaws-shell-fixes.patch
node test/preflight.js && node test/run.js
git push
```

The patch holds two commits:
- **Games can add their own sounds:** a `sounds` map in the game manifest, played on the shell's effects bus, so the Sound switch, ads and backgrounding silence them too. Triangles uses this for meow, woof and the drawing sounds.
- **Starter export fixes:** removes the dead `www/js/` folder that stopped the starter export, and the stale Money Sort test copies in `test/` that made every starter app fail `node test/run.js`.

The starter workflow then exports the updated shell.

## 2. A new repo for Triangles

Follow SETUP.md step 1: clone the starter, rename its remote to `upstream`, add your new GitHub repo as `origin`. Then copy these from this folder into the clone:

```
www/games/triangles/        the game
test/games/triangles/       its tests
www/games/active.js         installs it
www/app.config.js           name and package id (com.pixelartgames.triangles)
www/img/logo.png, www/img/tagline.png
README.md
```

Then `node test/preflight.js && node test/run.js`, commit and push. CI builds the APK and AAB as for Cash Paws.
