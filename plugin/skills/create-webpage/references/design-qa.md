# Design QA — the nine checks, and who can run each

Referenced from `SKILL.md` stage 7. Read when you reach it.

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

**On the local path you run all four yourself** — there are audit scripts that measure the live page
and report 6, 8 and 9 outright. See `references/local-path.md`.

**On the chat path you cannot, so ask.** Once the site has been published as a draft, the human has
a real page in a real browser — that is the only pair of eyes in the room. Give them four short
instructions, in their language, and wait:

> Four things I can't check from here — could you open the site and look?
>
> 1. On your phone, scroll the whole way down. Anything overlapping, cut off, or spilling sideways?
> 2. Same page on a laptop, then drag the window narrower until it's about half the screen. Anything
>    collapse badly in between?
> 3. Press Tab a few times. Does something visibly light up as you go, or does it move invisibly?
> 4. Scroll down slowly. Any section that stays blank instead of appearing?

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
