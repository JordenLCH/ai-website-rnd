# Test bundles

Two bundles the tests read: `merryfair` (a real client site, plus its `org.json`) and
`merryfair-free` (the same content under a second theme, which is what proves a theme swap
re-skins a site without touching content).

**They are not the fleet.** They used to live in `content/`, and everything in `content/` is
served by `fleet_siblings` to anyone holding a catalog token — so a creator asking "what am I
diverging from?" was shown two hand-built theme-swap fixtures as if they were separate client
sites, and told to differentiate against them. Moving them here is the fix; `content/` now holds
live sites only.

The bundles themselves are gitignored — they are copies of client work, same reason `content/`
is. A fresh clone has none, and `npm run smoke` prints `SKIP` for each missing pair rather than
failing. To restore them on a machine that has the archive:

```bash
cp -R dev/fleet-archive/merryfair      mcp/fixtures/
cp -R dev/fleet-archive/merryfair-free mcp/fixtures/
```
