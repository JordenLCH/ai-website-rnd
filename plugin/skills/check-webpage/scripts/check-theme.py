#!/usr/bin/env python3
"""Stage 7, checks 1 and 3, computed instead of eyeballed.

Every run of this skill otherwise re-derives the same WCAG arithmetic by hand across ~10 colour
pairings, and hand-derived ratios are where "looks about right" gets written down as a pass. This
reads theme.json and answers two of the five bundle-only checks outright.

    python3 scripts/check-theme.py theme.json [site.json]

Pass site.json too and it adds the coverage check: every variant slug the pages actually use must
exist in theme.sectionStyles. A slug the theme never defines renders unstyled, and nothing else in
the pipeline notices — the page is valid, it just silently isn't the design anyone approved.

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

# (label, foreground token, background token, minimum ratio)
PAIRS = [
    ('body on default',        '--color-ink',            '--color-bg',          4.5),
    ('muted on default',       '--color-muted',          '--color-bg',          4.5),
    ('accent text on default', '--color-accent',         '--color-bg',          4.5),
    ('body on surface',        '--color-ink',            '--color-surface',     4.5),
    ('muted on surface',       '--color-muted',          '--color-surface',     4.5),
    ('body on inverse',        '--color-inverse-ink',    '--color-inverse-bg',  4.5),
    ('muted on inverse',       '--color-inverse-muted',  '--color-inverse-bg',  4.5),
    ('accent text on inverse', '--color-accent',         '--color-inverse-bg',  4.5),
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


def main(path, site_path=None):
    theme = json.load(open(path))
    tok = theme.get('tokens', {})
    rows, failed, skipped = [], 0, []

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
        missing, used, tones = coverage(theme, json.load(open(site_path)))
        print('\nTheme coverage — every slug a page uses must exist in the theme')
        if missing:
            for v, pages in sorted(missing.items()):
                print(f'  FAIL  {v} used on {", ".join(sorted(set(pages)))} — not in sectionStyles; renders unstyled')
        else:
            print(f'  PASS  all {len(used)} slugs in use are defined')
        for t in ('inverse', 'accent'):
            if t not in tones:
                print(f'  WARN  no slug resolves to tone "{t}" — a page asking for that band has nowhere to land')

    if 'direction' not in theme:
        print('\n  theme.direction is missing — check 5 has nothing to audit against')
    if skipped:
        print('\nNot computed:')
        print('\n'.join('  ' + s for s in skipped))

    print(f'\n{failed} contrast failure(s).')
    return 1 if failed else 0

if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else None))
