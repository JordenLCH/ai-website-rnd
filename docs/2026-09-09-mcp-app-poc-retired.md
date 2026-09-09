# The MCP Apps POC, and why it is gone

Removed at this commit. It is in git history at `3c9bb58` (`poc/mcp-app/`) if the
questions below ever need re-asking.

## What it was for

Before any of this was built there was one thing worth knowing and no way to
reason it out: **does an MCP server actually get to draw a UI inside a Claude
conversation, and can we lock it to our own people?** Every design here depends
on yes. A creator with no development machine has to see the site they are
composing, and if the answer had been no the whole chat path collapses back to
"clone the repo", which is the flaw we started from.

So it was a throwaway: the smallest server that declared `_meta.ui.resourceUri`,
served a `text/html;profile=mcp-app` resource, and rendered something visible.

## What it settled

- **MCP Apps works in claude.ai.** The host fetches the `ui://` resource and
  draws it in the conversation. Confirmed end to end through a Cloudflare tunnel,
  not just against a local harness.
- **`static_headers` is the auth we want.** A fixed org-shared credential, sent
  verbatim, configured once when the connector is added. That answers "only our
  own people, and nobody stumbles in by accident" without building a login.
- **`_meta` survives the round trip** — 11 KB there against 156 KB in `content`,
  which is the whole of the token argument for moving the preview payload later.
- Two failure modes that cost hours and look like nothing: a missing
  `jsx: react-jsx` tsconfig surfaces as `React is not defined` *inside* the app
  with no server error, and a tool that throws returns its error as text, which
  reads exactly like a stripped `_meta`.

## Why removing it is right

Everything it proved is now load-bearing in code that ships — `site_preview` in
`mcp/src/mcp.ts`, the app in `mcp/app/`, the assertions in `mcp/src/prove.ts`.
A POC kept past that point is a second implementation of the answer: it drifts,
it gets read as current, and eventually someone fixes a bug in the copy nobody
runs. The proof belongs in the test that runs on every change, and it is there.
