#!/bin/zsh
# Rendered density: words per 1000px of real page. The number that separates a website from a
# document, and the one thing the JSON cannot tell you — 60 words is dense at 400px, thin at 900.
# One port per bundle: reusing a port silently measures every later bundle against the first
# server still holding it, which produces a table of identical plausible-looking rows.
SP="$1"; PORT=8900
echo "bundle,page,height,words,per1000px,images,brokenImages"
for d in $SP/build/*/ ; do
  n=$(basename $d); PORT=$((PORT+1))
  python3 -m http.server $PORT --bind 127.0.0.1 --directory "$d" >/dev/null 2>&1 &
  SRV=$!
  for i in {1..60}; do curl -sf "http://127.0.0.1:$PORT/index.html" -o /dev/null && break; done
  for f in $(cd "$d" && /usr/bin/find . -name index.html | sed 's|^\./||'); do
    page=$(dirname "$f"); [ "$page" = "." ] && page=home
    agent-browser open "http://127.0.0.1:$PORT/$f" >/dev/null 2>&1
    r=$(agent-browser eval "(() => { const s=document.querySelector('.site'); const i=[...document.images]; return JSON.stringify({h:s.scrollHeight,w:(s.innerText.match(/\S+/g)||[]).length,im:i.length,br:i.filter(x=>!x.naturalWidth).length}); })()" 2>/dev/null | tail -1)
    echo "$r" | python3 -c "
import sys,json
raw=sys.stdin.read().strip()
try:
    d=json.loads(json.loads(raw)) if raw.startswith('\"') else json.loads(raw)
    print(f\"$n,$page,{d['h']},{d['w']},{round(d['w']/(d['h']/1000),1)},{d['im']},{d['br']}\")
except Exception:
    print(f\"$n,$page,ERR,,,,\")
"
  done
  kill -9 $SRV 2>/dev/null
done
