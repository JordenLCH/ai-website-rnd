# The renderer is a shared repo, consumed two different ways

Why `renderer/` is a git submodule here and an npm dependency in `site-starter`, what the
arrangement replaced, and the rules it imposes on anyone editing a block. Written 2026-09-09.

If you only read one thing: **one repo owns the catalog, and neither consumer keeps a copy.**
Every rule below exists to stop a second copy coming back.

---

## 1. What this replaced

Three repos were involved and only one of them knew it.

```
ai-website/renderer/          work happened here — the real source
   │  git subtree split --prefix=renderer
   ▼
renderer-export               a replayed copy, same messages, new SHAs
   │  pushed as main
   ▼
website-renderer              a separate GitHub repo
   │  github:JordenLCH/website-renderer
   ▼
site-starter                  the only consumer that installed it
```

`ai-website` did **not** consume `website-renderer`. `platform/` depended on `file:../renderer` —
its own local directory. So the repo that produced the catalog built against a different copy than
the creators did, and nothing enforced that the two matched. By the time this was noticed they had
drifted by one commit, and four theme files carried an accent-ink fix that existed on exactly one
side.

The visible symptom was a git graph with two parallel rails of identically-worded commits. That is
just what `git subtree split` produces: it replays every commit touching a prefix, rewriting SHAs
and dropping the shared root, so the copy has **zero ancestry** in common with `main`. It looked
like corruption. It was a mirror.

### Why a mirror is the wrong shape

A mirror has a publishing step, and a publishing step can be skipped. Nothing failed when it was —
`ai-website` kept building fine against its own copy, so drift was silent and only discoverable by
diffing two histories that share no commits. There was also a second, contradictory publish path
in `scripts/release-renderer.sh` (`npm pack` to a tarball URL) that nothing actually used. Two
documented mechanisms, one in use, neither obviously canonical.

---

## 2. What it is now

```
website-renderer          the catalog. Single source of truth.
   ├── submodule ────►    ai-website/renderer/     (develops it)
   └── npm git dep ──►    site-starter             (only installs it)
```

The two consumers use **different access mechanisms on purpose**:

| Repo | Mechanism | Because |
|---|---|---|
| `ai-website` | git submodule | It edits blocks. A submodule is a real checkout it can commit and push from |
| `site-starter` | `github:JordenLCH/website-renderer` | A creator only installs. They should run `npm install`, never learn detached HEAD |

Both point at the same SHA. Keeping them equal is the whole point — two consumers on different
commits of a shared catalog is the drift this removed, in miniature.

### Why a submodule and not an npm git dependency here too

Because `mcp/` makes a promise that a pinned SHA would quietly break.
[`mcp/src/source.ts`](../mcp/src/source.ts) opens with:

> *The catalog is imported from the renderer package, not copied. That is the whole point: if a
> block ships, the MCP serves it the same day, and no distributed skill can go stale describing
> blocks that changed.*

An npm git dependency resolves to a fixed commit. The MCP would then serve whatever the pin last
said, and "the same day" would become "once somebody bumps the pin" — with no failure to notice it
hadn't happened. A submodule is a working checkout, so the MCP serves the catalog that is actually
present.

The submodule also costs nothing to wire: `platform` and `mcp` still resolve `file:../renderer`,
because the path still exists. It is a checkout of another repo rather than a directory of this
one, and no import changed.

### Why not keep the monorepo and just automate the split

That was the cheap option, and it keeps the mirror. Automation makes drift less likely, not
impossible, and it leaves the duplicate rail in the graph plus the standing question of which copy
is authoritative. The cost of extraction is real but bounded (see §4); the cost of a mirror is a
class of bug that cannot be checked for locally.

---

## 3. What the renderer is allowed to contain

**Preview and checking. Nothing else.** The server concerns — MCP, SEO/AEO/GEO derivation, the
build farm, the fleet — stay in `ai-website`, which is the single source of truth for them.

| Stays in the renderer | Lives in ai-website |
|---|---|
| `src/blocks/**`, `styles.css`, `render.tsx`, `ssr.ts`, `motion.ts`, `tokens.ts`, `fonts.ts` | `mcp/` — catalog server |
| `App.tsx`, `main.tsx`, `index.html`, `bin/preview.mjs` | `platform/` — build farm, `seo.ts` |
| `schema.ts`, `validate-bundle.ts`, `bin/validate.mjs`, `tools/validate.ts` | `content/` — the fleet |
| `tools/design-qa.js`, `tools/block-audit.js`, `tools/migrations.ts` | `platform/tools/bench.ts` |

Applying that line removed **16 of 67 files** from what every creator downloads:

- **`src/content/` — six clients' bundles, 8,370 lines.** The fleet is `ai-website`'s work product,
  not catalog code. It shipped only because `package.json`'s `files` includes `src`, so a creator
  installing the renderer received five other companies' sites. It now lives in `content/`, which
  is where [`CLAUDE.md`](../CLAUDE.md) had always said it lived — the code had simply never caught up.
- **`tools/bench.ts` + `bench-render.sh`.** Fleet-quality benchmarking. The fleet is here now, and a
  creator never benchmarks a fleet. Moved to `platform/tools/`.
- **`tools/build_free.py`, 29K.** A `FreeSection` authoring script for one client, hardcoding
  `/img/merryfair/`. Nothing called it. [`flow-audit.md`](flow-audit.md) had already flagged it.
- **`pnpm-workspace.yaml`.** Two lines holding the literal placeholder
  `esbuild: set this to true or false`, left by a stray pnpm invocation. The package builds with npm.

`migrations.ts` stayed, deliberately: it guards the renderer's own block deprecations, and
`npm run migrations` fails when a declared deprecation has no fixture. It belongs with the blocks
it guards.

### The rule that made the renderer unmovable

`mcp/` reached into the renderer by **relative path** in four places —
`../../renderer/src/blocks/index.ts` and friends. Those break the instant the directory moves,
and they were the only real obstacle to extraction. `platform/` had already learned this;
[`platform/src/build.ts`](../platform/src/build.ts) carries a comment saying the relative form was
a mistake.

> **Import the renderer by package name, never by relative path.** Every export it offers has an
> entry in `package.json`'s `exports` map. A relative import silently couples you to a directory
> layout you do not own.

The one legitimate path reference is the fleet, which is not the catalog: `mcp/src/source.ts`
exports `FLEET` (`<repo>/content`), read at runtime for `fleet_siblings` and theme divergence.

---

## 4. Working with the submodule

```bash
git clone --recurse-submodules <repo>      # fresh clone
git submodule update --init                # existing clone
```

Three things will bite you if nobody tells you:

**Work on a branch inside the submodule.** `git submodule update` leaves it on a *detached HEAD*.
Commits made there are unreachable the moment you switch away — the single most common way to lose
work in a submodule.

```bash
cd renderer && git checkout main
```

**A block change is two commits.** One inside `renderer/`, pushed to `website-renderer`; then one
here bumping the gitlink. Until you bump, this repo still builds against the old catalog — and that
is a feature, because it makes the version this repo uses explicit and reviewable.

```bash
cd renderer && git commit && git push          # 1. change the catalog
cd .. && git add renderer && git commit        # 2. record which catalog this repo uses
```

**`git checkout` across the conversion boundary fails.** Before `1e9a31e`, `renderer/` was a
tracked directory; after it, a submodule. Checking out an older commit aborts with *"untracked
working tree files would be overwritten"*, because the submodule's checkout occupies the path. Run
`git submodule deinit renderer` first, or update the ref without checking it out
(`git fetch . <branch>:main`).

**Preview needs `CONTENT_DIR`.** Content lives outside the package now, so the default
`src/content` is empty by design — a fresh clone of the catalog has no sites in it, and `App.tsx`
treats that as legitimate.

```bash
cd renderer && CONTENT_DIR=../content npm run dev      # :5183
```

---

## 5. Defects the extraction exposed

Both were invisible while the renderer lived inside a monorepo, and both would have hit the first
person to clone `website-renderer` on its own.

- **No `.gitignore`.** The split repo had been covered by the parent's rules. Standing alone,
  `node_modules/`, `dist/` and twelve megabytes of `public/img/` client photography were all
  untracked-but-offered on every `git add`.
- **`package-lock.json` contradicted `package.json`.** *"Make the renderer installable from git"*
  moved `vite`, `tsx` and `@vitejs/plugin-react` to `dependencies` — because `blackdash-preview`
  spawns vite and `blackdash-validate` spawns tsx, and a git install resolves neither from a
  devDependency. Only `package.json` was regenerated, so `npm ci` from a fresh clone reproduced the
  exact bug that commit set out to fix.

Both fixed in `588cd93`. The proof is that `npm ci` now succeeds from the committed lockfile.

Still open, unrelated to this change: **no bundle in `content/` has an `org.json`**, so
`platform build` fails on all six with `ENOENT`. `org.json` holds registration numbers and
addresses that must not be invented, so it is an intake gap, not something to generate.

---

## 6. Reference

| | |
|---|---|
| Catalog | `website-renderer` — the only place blocks are edited |
| ai-website | submodule at `renderer/`, gitlink recorded in `main` |
| site-starter | `github:JordenLCH/website-renderer`, pin in `package-lock.json` |
| Retired | `renderer-export` — the subtree-split mirror, deleted; its commits are ancestors of `website-renderer/main` |
| Unused | `scripts/release-renderer.sh` — the tarball path, superseded |

Commits, oldest first: `d3591fb` decouple mcp and move the fleet · `867bf5d` drop the pnpm stub ·
`529943e` convert to a submodule · `41237e2` document it and fix stale layout paths · `1e9a31e`
bump to the catalog's own ignore rules and corrected lockfile.
