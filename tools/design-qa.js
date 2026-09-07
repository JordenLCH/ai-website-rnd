(() => {
  const site = document.querySelector('.site');
  const stage = document.querySelector('.stage');
  const vw = stage.clientWidth;
  const out = { vw, overflow: [], tiny: [], collide: [], contrast: [] };

  // 1. horizontal overflow — anything wider than the stage, or sticking out past its right edge
  for (const el of site.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const sr = stage.getBoundingClientRect();
    if (r.right > sr.right + 1.5 || r.left < sr.left - 1.5) {
      const sel = el.className && typeof el.className === 'string'
        ? el.tagName.toLowerCase() + '.' + el.className.split(' ').slice(0,2).join('.') : el.tagName.toLowerCase();
      const over = Math.round(Math.max(r.right - sr.right, sr.left - r.left));
      if (over > 2) out.overflow.push(sel + ' +' + over + 'px');
    }
  }
  out.overflow = [...new Set(out.overflow)].slice(0, 12);
  out.pageScrollX = site.scrollWidth > vw + 1;

  // 2. text that has collapsed or is running out of its box
  for (const el of site.querySelectorAll('p, h1, h2, h3, li, td, th, figcaption, .eyebrow, .p-badge')) {
    if (!el.innerText.trim()) continue;
    if (el.scrollWidth > el.clientWidth + 2) out.tiny.push((el.className||el.tagName) + ' clipped');
  }
  out.tiny = [...new Set(out.tiny)].slice(0, 8);

  // 3. contrast per tone.
  //    Colours are composited on a canvas rather than parsed from the computed string: the theme
  //    resolves --muted through color-mix, so getComputedStyle hands back
  //    `oklab(L a b / alpha)`. A regex that grabs the first three numbers reads that as an RGB
  //    triple and returns the same wrong ratio no matter what the alpha is — which is exactly how
  //    a contrast fix can look like it changed nothing.
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const paint = (under, over) => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, 1, 1);   // page ground, so a translucent bg resolves
    cx.fillStyle = under; cx.fillRect(0, 0, 1, 1);
    if (over) { cx.fillStyle = over; cx.fillRect(0, 0, 1, 1); }
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
  };
  const ratio = (fg, bg) => { const [x, y] = [lum(fg), lum(bg)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const seen = new Set();
  for (const sec of site.querySelectorAll('.section')) {
    const tone = sec.dataset.tone;
    const bgRaw = getComputedStyle(sec).backgroundColor;
    const bgPx = paint(bgRaw, null);
    for (const el of sec.querySelectorAll('p, .eyebrow, h1, h2, h3, a, figcaption, .p-badge, td, li')) {
      if (!el.innerText.trim()) continue;
      const cs = getComputedStyle(el);
      const key = tone + '|' + cs.color + '|' + Math.round(parseFloat(cs.fontSize)) + '|' + el.tagName;
      if (seen.has(key)) continue; seen.add(key);
      const fgPx = paint(bgRaw, cs.color);          // text alpha composited over its own section
      const r = ratio(fgPx, bgPx);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (r < need) out.contrast.push(`${tone}/${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} ${r.toFixed(2)}:1 (need ${need}) "${el.innerText.trim().slice(0, 26)}"`);
    }
  }
  out.contrast = [...new Set(out.contrast)].slice(0, 14);
  return JSON.stringify(out);
})()
