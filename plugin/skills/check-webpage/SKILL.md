---
name: check-webpage
description: Use when a generated site needs checking before it goes live — "is this ready to publish", "run the quality check", "review the site", "check it before we launch" — or when a theme or section has changed and something needs to confirm the page still reads. Also use when another skill hands off for the design-QA pass. Not for schema validity, which bundle_validate already answers.
---

# Check a webpage

Validation proves the JSON is legal. **This pass proves the page works** — that a human can read it,
on a phone, with a keyboard, in the colours actually chosen. Nothing else in the pipeline asks that
question, and a bundle can be perfectly valid and unreadable.

Nine checks, split by one question: does this one need **eyes** on a rendered page?

## Run the script first

```bash
python3 scripts/check-theme.py theme.json site.json
```

It answers checks 1 and 3 outright and adds theme coverage, deterministically:

- **contrast** on every pairing the tone bands create, including translucent hairlines composited
  over their real ground — exits non-zero on any failure
- **slop tells** — accent sitting in the indigo/violet band, one radius across every token, a warm
  off-white ground arrived at rather than chosen, no structural tokens set
- **coverage** — every variant slug the pages use must exist in `sectionStyles`. A slug the theme
  never defines renders unstyled, the bundle still validates, and the page is silently not the
  design anyone approved

Where code execution is unavailable, do it by hand: relative luminance, then
`(L1+0.05)/(L2+0.05)`, 4.5:1 body and 3:1 large, and read the slugs off the two files.

Validation proves the JSON is legal. It does not prove the page works. Do this pass yourself before
handing anything over, and report what you found rather than quietly patching it.

**Five of these you can do anywhere. Four need a rendered page in a real browser, and on the
chat path you do not have one** — `site_preview` draws the page into the conversation, but you
cannot resize it, screenshot it, tab through it or run script in it. Say which four you could not
run and hand them to the human as a look-at list. A stage that reports `n/a` four times and calls
itself a QA pass is worse than one that admits it checked five things.

**A — five checks you run yourself, from the bundle. No browser needed.**

1. **Contrast on every tone.** You have the hex values in `theme.json`, so compute it: relative
   luminance, then `(L1+0.05)/(L2+0.05)`. Body text needs 4.5:1, large text 3:1. Check every pairing
   the tone bands actually create — text on default, on surface, on inverse, on accent, plus the
   accent colour used as *text* on each ground. Accent colours legible on light grounds routinely
   fail on dark ones, and nothing in the validator sees it.
2. **Content extremes, not average content.** Take the extremes table from stage 2 and find them in
   the JSON: the longest product name, the shortest headline, the nine-item list and the two-item
   one, a card with no image. You are looking for a 39-character string in a slot the layout gives
   one line to. Real content is uneven; the layout that only works on the sample fails on delivery.
3. **The slop tells.** Read the tokens: is every surface on the same radius? Is the accent the only
   non-neutral colour, and is it in the indigo/violet band? Is monospace used for labels and nowhere
   else? Any "yes" needs a reason, not a fix by reflex.
4. **Read the page with the images turned off.** Ignore every `src` and read the copy alone. If it
   stops making sense, the copy is leaning on photography the client may replace with something else
   entirely.
5. **Audit the tokens against `theme.direction`.** Take the three adjectives and name, for each, the
   token that carries it. If "precise" is carried by nothing — or contradicted by a 28px radius and
   a 600ms ease — either the tokens or the adjective is wrong. This is the check that keeps a chosen
   direction from decaying into the default one value at a time.

**B — four checks that need eyes on a rendered page.**

6. **Four widths, not two** — 360, 768, 1280, 1600. Most breakage lives at 768 and 360, and a site
   checked only at "narrow and wide" reliably ships a nav that wraps into itself.
7. **Greyscale, then squint.** Strip the colour and check the hierarchy still reads; if it collapses,
   colour was carrying work structure should do. Then zoom out to 25% and look for one focal point
   per screenful.
8. **Tap targets and focus.** Tab through: every control needs a visible focus ring at 3:1 and no
   keyboard trap. Controls want 44–48px; WCAG 2.2's 24px is the legal floor, not the target.
9. **Nothing hidden at rest.** A section that only becomes readable after a scroll reveal is one
   observer failure away from being blank.

**These four need eyes on a rendered page.** In a checkout you run them yourself; on the chat path
nobody can — **including the human, until the site is actually live.**

That timing catches people out, so state it plainly. The upload link is a dropzone — it shows a
filename checklist and a Publish button, it does not render the site and does not link to one. A
browsable page exists only after the human presses **"Publish the site"** on that page, which only
unlocks once every picture is in. So the honest order is:

1. Run the five bundle checks now and fix what they find. Say which four are still outstanding.
2. Pictures go up; the human presses Publish; the site builds and goes live.
3. **Then** put the five questions below to them, against the live address. Publishing returns the
   `domain` but no URL, so give them the address yourself: their own domain if it is attached, and
   otherwise the Pages one, which is the domain with dots turned to dashes —
   `sterlingcoldchain.com.my` serves at `sterlingcoldchain-com-my.pages.dev`.
4. Anything they report is a patch and a re-publish — cheap, and the normal path, not a setback.

Telling a client "everything passed" before step 3 is claiming four checks nobody could have run.
Carry them as `NOT RUN` until the answers come back, and say the site is live-but-unchecked rather
than finished.

> The site's live — five things I can't check from here. Could you open it and look?
>
> 1. On your phone, scroll the whole way down. Anything overlapping, cut off, or spilling sideways?
> 2. Same page on a laptop, then drag the window narrower until it's about half the screen. Anything
>    collapse badly in between?
> 3. Press Tab a few times. Does something visibly light up as you go, or does it move invisibly?
> 4. Scroll down slowly. Any section that stays blank instead of appearing?
> 5. Stand back from the screen, or squint. Does one thing on each screenful pull your eye first, or
>    does it all blur into the same weight?

Question 5 is the greyscale-and-squint check in a form a person can answer. Without it that check
has no route to done: it is the one of the four you cannot delegate as a mechanical action, so
delegate the *perception* instead.

Their answers are check results — record them in the table as theirs, not yours.

#### Report it as a table, not prose

A prose summary of nine checks hides which ones were skipped. One row per check, every check
present, and a **Who** column — because "I ran it", "the human looked", and "nobody has checked
this" are three different states that all read as a tick in prose:

```
#  Check              Who     Result   Detail
1  Contrast           me      FAIL     accent on inverse 2.45:1 (needs 4.5)
2  Content extremes   me      PASS     9-item list, 1-item list, no-image card
3  Slop tells         me      PASS     radius varies, accent is green not indigo
4  Images off         me      PASS
5  Direction audit    me      WARN     "precise" carried by nothing
6  Four widths        client  FAIL     nav wraps into itself on the phone
7  Greyscale/squint   —       NOT RUN  needs a browser; not asked yet
8  Targets and focus  client  PASS     "things light up as I tab"
9  Hidden at rest     client  PASS     "everything appeared"
```

`NOT RUN` is an honest row and a tick is not. Never write `PASS` for something nobody looked at.

**That table is your working record, not the client's report.** Nine rows of `2.45:1` and
`24px` hand a non-technical person a list they cannot act on and cannot verify, so they approve it
on trust, which defeats the checkpoint. Keep the table — paste it if they ask, or if they are
technical — and lead with two short lists in their language:

> **Fixed, nothing needed from you:** the phone menu was overlapping itself; some text on the dark
> band was too faint to read; three buttons were too small to tap comfortably on a phone.
>
> **Your call:** the statistics strip and the product range are competing for attention — the eye
> doesn't know where to land first. I'd quieten the statistics. Happy either way.

Split every finding into exactly those two: **what you fixed**, and **what is the human's call** — a
failing contrast ratio is yours, a section competing for attention may be intentional. Never report
a check as passing because you did not run it, and never move something into "fixed" that you only
decided was acceptable.


## Who this is for

`create-webpage` reaches here at stage 7, before handing off. `edit-webpage` should reach here after
any change that touches a theme token or adds a section — a patch that darkens one colour can push
text on the inverse band under 4.5:1, and nothing else in that flow looks.

**Running standalone, or from `edit-webpage`, you will not have those two inputs.** There is no
stage-2 extremes table in an edit session. Derive the extremes from the bundle itself — longest
string in each repeated slot, longest and shortest list — and say that is what you did; mark row 2
`NOT RUN` only if the bundle is unreadable. A missing `theme.direction` is a real finding, not a
missing input: report it as check 5 failing.

**If the bundle is held as a `draftId` with no files on disk**, write `theme.json` and `site.json`
out first and run the script against those. Code execution with nothing to point the script at is
the common claude.ai case, and it is a two-line fix, not a reason to skip the check.

**Done when** all nine rows carry a Who and a Result, with no blanks. `NOT RUN` closes a row; an
empty cell does not.
