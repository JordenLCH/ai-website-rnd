# SOP — shipping the `website-create` plugin

*Written 2026-09-09. Read this before touching `plugin/`, `skills/create-webpage/` or the
catalog MCP's URL and auth.*

The plugin exists because a creator needs two things that arrive separately otherwise: the
**skill** that describes the workflow, and the **MCP** that serves the parts of the catalog a
skill must not hard-code. One install, both halves, one place to fix a bug.

## What the plugin is

`plugin/` is self-contained — it carries a `plugin.json` *and* a `marketplace.json` whose only
entry is itself (`source: "./"`). Claude Code always installs *through* a marketplace; that
second manifest is the install record, not a listing on anything public.

| Path | What | Edit it? |
|---|---|---|
| `plugin/.claude-plugin/plugin.json` | manifest — **`version` lives here** | yes, every release |
| `plugin/.claude-plugin/marketplace.json` | the install record | rarely |
| `plugin/.mcp.json` | `blackdash-catalog` → `https://catalog.blackdash.my/mcp`, header `x-api-key: ${CATALOG_TOKEN}` | only if the endpoint moves |
| `plugin/skills/create-webpage/` | **generated copy** | **no — see below** |
| `plugin/commands/setup.md` | `/website-create:setup` | yes |
| `plugin/scripts/catalog-token.sh` | stores/checks/clears the token | yes |

### The skill copy is generated. Never edit it.

The source is `skills/create-webpage/`. `./skills/install.sh` rsyncs it into `plugin/skills/`
(and into a starter checkout if you pass one). Edit the copy and the next `install.sh` run
deletes your work with no warning, because the sync is `--delete`.

It no longer installs to `~/.claude/skills/`, and removes a copy left there by an older run.
A local-directory plugin install serves the skill straight out of `plugin/skills/`, so a second
copy under the same name is the same skill loaded twice — one refresh away from the two
disagreeing about which is current.

## How a user knows an update exists

Only `version` in `plugin.json`. There is no push and no notification: `claude plugin list`
prints the installed version, and `marketplace update` refetches the manifest and compares.
**A fix shipped without a version bump is invisible** — the user's client has no other way to
tell its copy is stale.

That applies to skill-only fixes too. The skill is a file inside the plugin; changing its text
changes nothing a client can detect unless the version moves.

## Release SOP

1. Fix it in the **source** — `skills/create-webpage/` for skill text, `plugin/` for the
   command, script, manifest or MCP config.
2. `./skills/install.sh` — syncs the plugin's skill copy. Skip this and you ship the old skill.
3. Bump `version` in `plugin/.claude-plugin/plugin.json`. Patch for a wording or bug fix, minor
   for a new command or a changed workflow.
4. `claude plugin validate ./plugin` and `claude plugin validate ./plugin/.claude-plugin/plugin.json`
   — the first checks the marketplace manifest, the second the plugin manifest. Both, because
   `validate` on a directory stops at the marketplace file.
5. Commit and push.
6. `claude plugin tag plugin/` — cuts a `website-create--v<version>` git tag and **fails if
   plugin.json and the marketplace entry disagree**, which is the mistake this step exists to
   catch.
7. Tell users: `claude plugin marketplace update blackdash`, then
   `claude plugin update website-create@blackdash`, then restart the session. Restart is not
   optional — a running session holds the old copy.

## Distribution — three shapes, and only one of them updates

| Shape | Update flow | Use |
|---|---|---|
| zip / shared folder | **none.** Re-send the zip and hope they re-add it | never, for anything you will fix later |
| local directory (`marketplace add ./plugin`) | `installLocation` points at this working tree, so edits are live next session and `version` is meaningless | development only |
| private GitHub repo | `marketplace update` → `plugin update` → restart | **any Claude Code user** |
| claude.ai upload | re-upload the zip under the same name; it overwrites | **any claude.ai user** — see below |

The current install on this machine is the local-directory shape. That is why a fix here appears
to "just work" and reaches nobody else. Before handing the plugin to a known user, it needs a
repo of its own — `plugin/` sits inside a repo that also carries `content/`, `website_info/` and
two submodules, and pointing a user at it hands them all of that.

## What the plugin does *not* ship

**Catalog fixes.** The MCP is a server. Restart `cd mcp && ./tunnel.sh` and every user has the
new catalog on their next call — no version, no update, nothing for them to do. Only the URL and
the auth header live in the plugin, so bump the plugin only when *those* change.

This is the same split the repo relies on everywhere else: the skill is a snapshot and drifts,
so anything that changes on the platform's schedule is served, not shipped.

## The token

`plugin/.mcp.json` sends `x-api-key: ${CATALOG_TOKEN}`. Claude Code expands environment
variables there and nothing else — there is **no install-time prompt**, and no input hook a
plugin can use to ask for a key. `/website-create:setup <token>` is the substitute: it writes
`env.CATALOG_TOKEN` into `~/.claude/settings.json` (the only place the client reads variables
from before starting an MCP server) and then POSTs `tools/list` at the live server, so a wrong
token is reported wrong immediately instead of surfacing later as tools that will not connect.
`show` reports what is stored, masked; `clear` removes it. A stored token reaches the server on
the **next session start**.

Use `x-api-key`, not `Authorization`. claude.ai reserves that header for its own OAuth and
refuses a connector that sets it; the server accepts `x-api-key`, `x-auth-token` or
`Authorization`, with or without a `Bearer ` prefix, and the plugin uses the one that works in
both clients.

## Uploading to claude.ai

claude.ai takes plugins as an archive — it does not use marketplaces, so none of the
`marketplace add` / `plugin update` flow above applies there.

```bash
./package-plugin.sh    # → dist-plugin/website-create-v<version>.zip (and .plugin)
```

The script re-runs `install.sh` and both validations first, then zips **the contents of
`plugin/`, not the folder** — `.claude-plugin/plugin.json` has to sit at the archive root. An
archive of the parent directory uploads cleanly and then does nothing, which is the failure this
step exists to prevent.

Then, in claude.ai:

- **Personal workspace** — Settings → Plugins → *Upload a plugin*, drop the `.zip` (or the
  `.plugin` twin the script writes; same archive, both accepted), Upload.
- **A Team/Enterprise org** — Owner or Primary Owner only, at Organization settings → Plugins →
  Add plugins → *Upload a file*.

Limits: a valid `.zip` under 50 MB. Ours is ~44 KB, so size is not a concern unless someone puts
images in the skill.

**Updating is re-uploading the same plugin name.** A plugin with a name that already exists
overwrites the previous one automatically — no delete step, and no version comparison either.
Bump `version` anyway: it is the only way anyone can tell which build they are looking at.

### What actually works there, and what does not

Uploading the whole plugin is right — but only the skill half runs on claude.ai. Assume the
other two do not, and configure around them:

- **The `blackdash-catalog` MCP** — set it up as a custom connector instead: Settings →
  Connectors → Add custom connector, URL `https://catalog.blackdash.my/mcp`, auth **Request headers**,
  header `x-api-key` = the token. The plugin's `.mcp.json` carries `${CATALOG_TOKEN}`, and
  environment-variable expansion is a local-client behaviour — on the web there is no shell to
  expand it, so that header would be sent literally and rejected.
- **`/website-create:setup`** — a bash script writing `~/.claude/settings.json`. Nothing on
  claude.ai to run it. The connector dialog is where the key gets typed there.

So a creator on claude.ai needs two setup steps, not one: upload the plugin, add the connector.
Say both, or they get a skill that knows the workflow and cannot read the catalog.

## Two failure modes worth telling apart

- **401 / tools failed to connect** — no token, or the wrong one. `/website-create:setup show`.
- **502 from the tunnel** — Cloudflare is up and the catalog server behind it is not. Never a
  tunnel problem; start it (`cd mcp && ./tunnel.sh`).
