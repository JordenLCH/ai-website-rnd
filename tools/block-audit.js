(() => {
  const site = document.querySelector('.site');
  const rows = [];
  const paint = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    return (under, over) => {
      cx.clearRect(0,0,1,1); cx.fillStyle = '#fff'; cx.fillRect(0,0,1,1);
      cx.fillStyle = under; cx.fillRect(0,0,1,1);
      if (over) { cx.fillStyle = over; cx.fillRect(0,0,1,1); }
      const d = cx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2]];
    };
  })();
  const lum = ([r,g,b]) => { const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
  const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };

  for (const sec of site.querySelectorAll('.section')) {
    const blk = sec.querySelector('.block') || sec.firstElementChild;
    if (!blk) continue;
    const type = (blk.className||'').split(' ')[1] || blk.tagName.toLowerCase();
    const layout = blk.dataset ? blk.dataset.layout : '';
    const sr = sec.getBoundingClientRect();

    // how far the rightmost *text* reaches inside the content column
    let right = 0, left = 1e9, over = 0;
    for (const el of blk.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > sr.right + 1.5) over = Math.max(over, Math.round(r.right - sr.right));
      const t = (el.children.length === 0 && el.innerText) ? el.innerText.trim() : '';
      const isImg = el.tagName === 'IMG';
      if (t || isImg) { right = Math.max(right, r.right); left = Math.min(left, r.left); }
    }
    const inner = blk.querySelector('[class$="__inner"], [class$="__items"], [class$="__grid"]') || blk;
    const ir = inner.getBoundingClientRect();
    const fill = ir.width > 0 ? Math.round((right - left) / ir.width * 100) : 0;

    // orphan row: last row of a grid holding fewer items than the columns
    let orphan = '';
    for (const g of blk.querySelectorAll('*')) {
      const cs = getComputedStyle(g);
      if (cs.display !== 'grid') continue;
      const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
      const kids = [...g.children].filter(c => c.getBoundingClientRect().height > 0);
      // Count the columns each child actually occupies. Counting children instead reported the
      // mosaic's 5-item case as an orphan when its last tile spans the full row and leaves no
      // dead space at all — a finding that is real only if the tail row is short.
      const span = (c) => {
        // `grid-column: span 2` resolves to grid-column-START "span 2" with END "auto", so
        // reading only the end property reports every spanning tile as one column wide.
        const cc = getComputedStyle(c);
        const m = /span\s+(\d+)/.exec(cc.gridColumnStart || '') || /span\s+(\d+)/.exec(cc.gridColumnEnd || '');
        return m ? Number(m[1]) : 1;
      };
      const used = kids.reduce((n, c) => n + span(c), 0);
      if (cols > 1 && used > cols) {
        const rem = used % cols;
        if (rem === 1 && cols >= 3) orphan = `${kids.length} items filling ${used} of ${cols} cols — 1 column alone on the last row`;
      }
    }

    // contrast, worst case in this section
    // The background a run of text actually sits on is the nearest ancestor that paints one —
    // a button, a card, a panel — not the section. Measuring every label against the section
    // reports 1.00:1 for white-on-accent buttons inside a light section, which is both alarming
    // and wrong, and it buries the failures that are real.
    const bgOf = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        const m = c.match(/[\d.]+/g);
        if (c && c !== 'transparent' && m && (m.length < 4 || Number(m[3]) > 0.85)) return c;
      }
      return '#ffffff';
    };
    let worst = 99, worstOn = '';
    for (const el of blk.querySelectorAll('p, li, td, th, figcaption, .eyebrow, h1, h2, h3, a, span')) {
      if (el.children.length || !el.innerText.trim()) continue;
      const cs = getComputedStyle(el);
      const bgRaw = bgOf(el);
      const bgPx = paint(bgRaw, null);
      const r = ratio(paint(bgRaw, cs.color), bgPx);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
      if (r < need && r < worst) { worst = r; worstOn = `${el.tagName.toLowerCase()}.${(el.className||'').split(' ')[0]} ${r.toFixed(2)}/${need}`; }
    }

    const broken = [...blk.querySelectorAll('img')].filter(i => !i.naturalWidth).length;
    // Text colliding with text. The Timeline rail printed a marker straight through the title
    // beside it and every container-relative check passed, because the collision happened inside
    // the section. Compare painted text boxes against each other, not against their parent.
    let collide = '';
    // A paragraph flowing across a CSS column break has one bounding rect spanning both columns,
    // so it geometrically overlaps the text beside it while rendering perfectly. Skip anything
    // inside a multi-column container — getBoundingClientRect cannot describe fragmented boxes.
    const inColumns = (e) => {
      for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if ((cs.columnCount && cs.columnCount !== 'auto') || (cs.columnWidth && cs.columnWidth !== 'auto')) return true;
      }
      return false;
    };
    const leaves = [...blk.querySelectorAll('*')]
      .filter(e => e.children.length === 0 && e.innerText && e.innerText.trim() && !inColumns(e));
    for (let i = 0; i < leaves.length && !collide; i++) {
      const a = leaves[i].getBoundingClientRect();
      if (a.width < 2 || a.height < 2) continue;
      for (let j = i + 1; j < leaves.length; j++) {
        const b2 = leaves[j].getBoundingClientRect();
        if (b2.width < 2 || b2.height < 2) continue;
        if (leaves[i].contains(leaves[j]) || leaves[j].contains(leaves[i])) continue;
        const ox = Math.min(a.right, b2.right) - Math.max(a.left, b2.left);
        const oy = Math.min(a.bottom, b2.bottom) - Math.max(a.top, b2.top);
        if (ox > 4 && oy > 4) {
          collide = `TEXT OVERLAP "${leaves[i].innerText.trim().slice(0,18)}" over "${b2 && leaves[j].innerText.trim().slice(0,18)}"`;
          break;
        }
      }
    }

    // Tap targets. WCAG 2.2 AA's floor is 24x24 CSS px; every design system that has measured
    // thumbs (M3 48dp, Apple HIG 44pt) sets its own target far above it. Both are reported
    // separately, because 24 is the legal minimum and 44 is the one a person feels.
    let tap = '';
    let tapMin = 1e9, tapOn = '';
    for (const el of blk.querySelectorAll('a[href], button, [role="button"], input, select, summary')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      // Inline links inside a paragraph are text, not targets — 2.5.8 exempts them.
      const inProse = el.tagName === 'A' && el.closest('p, li, figcaption');
      if (inProse) continue;
      const side = Math.min(r.width, r.height);
      if (side < tapMin) { tapMin = side; tapOn = (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 18); }
    }
    if (tapMin < 24) tap = `TAP TARGET ${Math.round(tapMin)}px "${tapOn}" — under the 24px WCAG floor`;
    else if (tapMin < 44) tap = `tap target ${Math.round(tapMin)}px "${tapOn}" — under the 44-48px design floor`;

    // Content that is not readable at rest. A reveal gated on an observer that never fires — the
    // element already on screen at load, JS erroring, the clip-path collapsing the box the
    // observer measures — leaves a section that validates, renders, and says nothing. The rule
    // that prevents the whole class: animations start from a *visible* state.
    let hidden = '';
    for (const el of blk.querySelectorAll('*')) {
      if (hidden) break;
      const txt = el.innerText ? el.innerText.trim() : '';
      if (txt.length < 20) continue;
      if (el.closest('[hidden], [aria-hidden="true"], dialog, [role="menu"], [role="dialog"], details:not([open])')) continue;
      const cs = getComputedStyle(el);
      // inset(0 0 100% 0) collapses the box to a line — the known reveal bug, since it also
      // collapses what IntersectionObserver measures, so the reveal can never fire.
      const clipped = /inset\([^)]*100%/.test(cs.clipPath || '');
      if (Number(cs.opacity) < 0.05 || cs.visibility === 'hidden' || clipped) {
        hidden = `HIDDEN AT REST "${txt.slice(0, 24)}" (opacity ${cs.opacity}, clip-path ${cs.clipPath || 'none'}) — content must be readable before any reveal fires`;
      }
    }

    const flags = [];
    if (hidden) flags.push(hidden);
    if (tap) flags.push(tap);
    if (collide) flags.push(collide);
    if (over) flags.push('OVERFLOW +' + over + 'px');
    if (orphan) flags.push(orphan);
    if (worstOn) flags.push('CONTRAST ' + worstOn);
    if (broken) flags.push(broken + ' broken img');
    if (flags.length) rows.push(type + ' | ' + layout + ' | ' + flags.join('; '));
  }
  // Plain text, not JSON: the result crosses a shell, and every escaping layer between here and
  // the report is somewhere a real finding can turn into a parse error that reads as "clean".
  return rows.length ? rows.join('\n') : 'CLEAN';
})()
