#!/usr/bin/env python3
"""Stage 7, checks 1 and 3, computed instead of eyeballed.

Every run of this skill otherwise re-derives the same WCAG arithmetic by hand across ~10 colour
pairings, and hand-derived ratios are where "looks about right" gets written down as a pass. This
reads theme.json and answers two of the five bundle-only checks outright.

    python3 scripts/check-theme.py theme.json [site.json]

Pass site.json too and it adds two more, both reading the content rather than the colours:

  * coverage — every variant slug the pages actually use must exist in theme.sectionStyles. A slug
    the theme never defines renders unstyled, and nothing else in the pipeline notices: the page is
    valid, it just silently isn't the design anyone approved.
  * alt text and form labels — WCAG 1.1.1 and 3.3.2. Seven blocks (Hero, Features, Team, PostList,
    Locations, Promo, LogoWall) declare `imageAlt` optional next to a required-if-present `image`
    and render `alt=""` when it is missing, so a page full of products, faces and client logos can
    validate clean and be entirely invisible to a screen reader. Nothing else in the pipeline looks.

Exit 0 = every pairing clears its threshold. Exit 1 = at least one FAIL. stdlib only.
"""
import json, re, sys

def srgb_to_lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def parse(colour, over=None):
    """-> (r,g,b) or None. rgba() is composited over `over`, because a hairline declared
    rgba(0,0,0,.12) is not a 12%-black line, it is whatever it becomes on the ground behind it —
    and that composite is the thing a reader actually has to see."""
    c = colour.strip()
    m = re.fullmatch(r'rgba?\(([^)]+)\)', c)
    if m:
        parts = [x.strip() for x in m.group(1).replace('/', ',').split(',')]
        try:
            r, g, b = (float(x.rstrip('%')) for x in parts[:3])
            a = float(parts[3].rstrip('%')) if len(parts) > 3 else 1.0
        except ValueError:
            return None
        if a > 1: a /= 100
        if over is None:
            return None
        return tuple(v * a + o * (1 - a) for v, o in zip((r, g, b), over))
    h = c.lstrip('#')
    if len(h) == 3:
        h = ''.join(ch * 2 for ch in h)
    if not re.fullmatch(r'[0-9a-fA-F]{6}', h):
        return None
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def luminance(colour, over=None):
    rgb = parse(colour, over) if isinstance(colour, str) else colour
    if rgb is None:
        return None
    r, g, b = rgb
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)

def ratio(a, b):
    """b is the ground, so a translucent a is composited over it first."""
    ground = parse(b)
    la, lb = luminance(a, over=ground), luminance(b)
    if la is None or lb is None:
        return None
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def hue(colour):
    rgb = parse(colour)
    if rgb is None:
        return None
    r, g, b = (v / 255 for v in rgb)
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return None
    d = mx - mn
    if mx == r:   deg = ((g - b) / d) % 6
    elif mx == g: deg = (b - r) / d + 2
    else:         deg = (r - g) / d + 4
    return deg * 60

def _oklab(rgb):
    """linear sRGB -> OKLab. Needed because the renderer lifts the accent on dark tones with
    color-mix(in oklab, ...), so a ratio computed on the raw accent is a colour nothing paints."""
    r, g, b = (srgb_to_lin(c) for c in rgb)
    l = (0.4122214708*r + 0.5363325363*g + 0.0514459929*b) ** (1/3)
    m = (0.2119034982*r + 0.6806995451*g + 0.1073969566*b) ** (1/3)
    s = (0.0883024619*r + 0.2817188376*g + 0.6299787005*b) ** (1/3)
    return (0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
            1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
            0.0259040371*l + 0.7827717662*m - 0.8086757660*s)


def _un_oklab(lab):
    L, A, B = lab
    l = (L + 0.3963377774*A + 0.2158037573*B) ** 3
    m = (L - 0.1055613458*A - 0.0638541728*B) ** 3
    s = (L - 0.0894841775*A - 1.2914855480*B) ** 3
    lin = (+4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
           -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
           -0.0041960863*l - 0.7034186147*m + 1.7076147010*s)
    out = []
    for c in lin:
        c = max(0.0, min(1.0, c))
        out.append(round(255 * (12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4) - 0.055)))
    return tuple(out)


def mix_oklab(a, b, pct):
    """color-mix(in oklab, a pct%, b) -> '#rrggbb', or None if either side won't parse."""
    ca, cb = parse(a), parse(b)
    if not ca or not cb:
        return None
    la, lb = _oklab(ca[:3]), _oklab(cb[:3])
    t = pct / 100
    return '#%02x%02x%02x' % _un_oklab(tuple(x*t + y*(1-t) for x, y in zip(la, lb)))


# (label, foreground token, background token, minimum ratio)
PAIRS = [
    ('body on default',        '--color-ink',            '--color-bg',          4.5),
    ('muted on default',       '--color-muted',          '--color-bg',          4.5),
    ('accent text on default', '@accent-fg-light',       '--color-bg',          4.5),
    ('body on surface',        '--color-ink',            '--color-surface',     4.5),
    ('muted on surface',       '--color-muted',          '--color-surface',     4.5),
    ('body on inverse',        '--color-inverse-ink',    '--color-inverse-bg',  4.5),
    ('muted on inverse',       '--color-inverse-muted',  '--color-inverse-bg',  4.5),
    ('accent text on inverse', '@accent-fg-inverse',     '--color-inverse-bg',  4.5),
    ('text on accent',         '--color-on-accent',      '--color-accent',      4.5),
    # Hairlines are decorative separators, not UI controls: WCAG 1.4.11 does not reach them, and
    # palette.md mandates 0.12-0.16 alpha, which cannot reach 3:1 on any ground. Reported, not failed.
    ('rule on default',        '--color-line',           '--color-bg',          None),
    ('rule on inverse',        '--color-inverse-line',   '--color-inverse-bg',  None),
]

def coverage(theme, site):
    """Slugs the pages use vs slugs the theme defines, plus whether any tone is unreachable."""
    styles = theme.get('sectionStyles', {})
    used = {}
    for key, page in (site.get('pages') or {}).items():
        for b in (page.get('blocks') or []):
            if b.get('variant'):
                used.setdefault(b['variant'], []).append(key)
    for slot in ('header', 'footer'):
        b = (site.get('chrome') or {}).get(slot)
        if isinstance(b, dict) and b.get('variant'):
            used.setdefault(b['variant'], []).append(f'chrome.{slot}')

    missing = {v: p for v, p in used.items() if v not in styles}
    tones = {st.get('tone', 'default') for st in styles.values() if isinstance(st, dict)}
    return missing, used, tones


IMG_EXT = re.compile(r'\.(jpe?g|png|webp|avif|gif|svg)$', re.I)
# "Photo of a chair" — a screen reader already announces the element as an image, so the first two
# words are dead air on every single one.
ALT_NOISE = re.compile(r'^(an?\s+)?(image|photo|photograph|picture|graphic|screenshot|logo|icon)\b'
                       r'(\s*(of|showing|for|:)\b|\s*$)', re.I)
NEIGHBOURS = ('title', 'name', 'caption', 'label', 'eyebrow')


def _alt_problems(where, src, alt, sibling):
    """One image's alt, judged. Returns (level, message) pairs."""
    if alt is None or not str(alt).strip():
        # The catalog has no way to declare an image decorative — a missing imageAlt means both
        # "this is a spacer" and "I forgot", and the renderer resolves both to alt="". Every image
        # slot in this catalog is content (a product, a face, a client's logo), so treat the
        # ambiguity as the failure it usually is. If one genuinely is decorative, that is a gap in
        # the catalog to raise, not an alt to leave blank.
        return [('FAIL', f'{where} — image with no alt text ({src}); renders alt="" and is '
                         f'invisible to a screen reader')]
    a = str(alt).strip()
    if a == src or IMG_EXT.search(a):
        return [('WARN', f'{where} — alt is the filename ("{a}")')]
    if ALT_NOISE.match(a):
        return [('WARN', f'{where} — alt opens with "{a.split()[0]}"; the element is already '
                         f'announced as an image')]
    for n in sibling:
        if n and str(n).strip().lower() == a.lower():
            return [('WARN', f'{where} — alt repeats the adjacent text verbatim; it is read twice')]
    return []


def _images(node, where, out):
    """Walk any props tree and judge every image it carries, whatever shape declares it."""
    if isinstance(node, list):
        for i, v in enumerate(node):
            _images(v, f'{where}[{i}]', out)
        return
    if not isinstance(node, dict):
        return

    sibling = [node.get(k) for k in NEIGHBOURS]
    # Three shapes carry an image in this catalog: block props and items use image/imageAlt, the
    # Img helper uses src/alt, and a FreeSection node uses el:"Image" with src/alt.
    if isinstance(node.get('image'), str) and node['image'].strip():
        out += _alt_problems(where, node['image'], node.get('imageAlt'), sibling)
    src = node.get('src')
    if isinstance(src, str) and src.strip() and ('alt' in node or node.get('el') == 'Image'):
        out += _alt_problems(where, src, node.get('alt'), sibling)

    for k, v in node.items():
        if isinstance(v, (dict, list)):
            _images(v, f'{where}.{k}', out)


def content_a11y(site):
    """WCAG 1.1.1 (alt text) and 3.3.2 (form labels), read straight off the bundle."""
    out, seen = [], 0

    def block(b, where):
        nonlocal seen
        if not isinstance(b, dict):
            return
        seen += 1
        label = f'{where} {b.get("type", "?")}'
        _images(b.get('props') or {}, label, out)
        if b.get('type') == 'ContactForm':
            for i, f in enumerate((b.get('props') or {}).get('fields') or []):
                if not str((f or {}).get('label', '')).strip():
                    out.append(('FAIL', f'{label}.fields[{i}] — field with no label; the input is '
                                        f'unannounced and unclickable (WCAG 3.3.2)'))

    for key, page in (site.get('pages') or {}).items():
        for i, b in enumerate(page.get('blocks') or []):
            block(b, f'{key}/blocks[{i}]')
    for slot in ('header', 'footer'):
        block((site.get('chrome') or {}).get(slot), f'chrome.{slot}')
    return out, seen


def main(path, site_path=None):
    theme = json.load(open(path))
    tok = theme.get('tokens', {})
    rows, failed, skipped = [], 0, []

    # What the stylesheet actually paints for accent-as-text, per tone:
    #   light tones  --accent-fg: var(--color-accent-ink, var(--color-accent))
    #   inverse tone --accent-fg: color-mix(in oklab, var(--color-accent) 45%, var(--color-inverse-ink))
    # Reading --color-accent straight off the theme fails a correctly-built theme and passes a
    # broken one, so resolve both the way the CSS does.
    tok = dict(tok)
    if '--color-accent' in tok:
        tok['@accent-fg-light'] = tok.get('--color-accent-ink') or tok['--color-accent']
        if '--color-inverse-ink' in tok:
            mixed = mix_oklab(tok['--color-accent'], tok['--color-inverse-ink'], 45)
            if mixed:
                tok['@accent-fg-inverse'] = mixed

    for label, fg, bg, need in PAIRS:
        if fg not in tok or bg not in tok:
            skipped.append(f'{label}: {fg} or {bg} not set')
            continue
        r = ratio(tok[fg], tok[bg])
        if r is None:
            skipped.append(f'{label}: unparseable colour, compute this one by eye')
            continue
        if need is None:
            note = 'faint' if r < 1.5 else 'ok for a divider'
            rows.append(f'  INFO  {label:<24} {r:5.2f}:1  (decorative — {note})')
            continue
        ok = r >= need
        failed += not ok
        rows.append(f'  {"PASS" if ok else "FAIL"}  {label:<24} {r:5.2f}:1  (needs {need})')

    print('Contrast — check 1')
    print('\n'.join(rows) if rows else '  nothing computable')

    print('\nSlop tells — check 3')
    tells = []
    acc = tok.get('--color-accent', '')
    h = hue(acc)
    if h is not None and 220 <= h <= 300:
        tells.append(f'accent {acc} sits at hue {h:.0f}° — the indigo/violet band every generator reaches for')
    radii = {k: v for k, v in tok.items() if 'radius' in k}
    if len(set(radii.values())) == 1 and len(radii) > 1:
        tells.append(f'every radius is {next(iter(radii.values()))} — one value across {len(radii)} tokens reads as undesigned')
    bg = tok.get('--color-bg', '')
    hb = hue(bg)
    if hb is not None and 20 <= hb <= 60 and (luminance(bg) or 0) > 0.8:
        tells.append(f'ground {bg} is a warm off-white — the default prior; chosen or inherited?')
    structural = ['--scale-ratio', '--density', '--motion-duration', '--grid-cols', '--radius-tight']
    if not any(s in tok for s in structural):
        tells.append('no structural tokens set — this theme varies only colour and size')
    print('\n'.join('  ' + t for t in tells) if tells else '  none')

    if site_path:
        site = json.load(open(site_path))
        missing, used, tones = coverage(theme, site)
        print('\nTheme coverage — every slug a page uses must exist in the theme')
        if missing:
            for v, pages in sorted(missing.items()):
                print(f'  FAIL  {v} used on {", ".join(sorted(set(pages)))} — not in sectionStyles; renders unstyled')
        else:
            print(f'  PASS  all {len(used)} slugs in use are defined')
        for t in ('inverse', 'accent'):
            if t not in tones:
                print(f'  WARN  no slug resolves to tone "{t}" — a page asking for that band has nowhere to land')

        problems, seen = content_a11y(site)
        fails = [m for lvl, m in problems if lvl == 'FAIL']
        warns = [m for lvl, m in problems if lvl == 'WARN']
        failed += len(fails)
        print('\nAlt text and form labels — checks 4 and 8, the half that needs no browser')
        if not problems:
            print(f'  PASS  every image across {seen} blocks carries usable alt text; every field is labelled')
        for m in fails:
            print(f'  FAIL  {m}')
        for m in warns:
            print(f'  WARN  {m}')

    if 'direction' not in theme:
        print('\n  theme.direction is missing — check 5 has nothing to audit against')
    if skipped:
        print('\nNot computed:')
        print('\n'.join('  ' + s for s in skipped))

    print(f'\n{failed} failure(s).')
    return 1 if failed else 0

if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else None))
