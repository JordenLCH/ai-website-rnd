"""Author the Merryfair site as pure free-composition data.
Every section is a FreeSection: a grid recipe + a tree of 14 primitives.
Helpers here are just an authoring convenience — the output is plain JSON."""
import json

I = "/img/merryfair/"

# ---------- primitive helpers ----------
def n(el, **kw):
    d = {"el": el}
    d.update({k: v for k, v in kw.items() if v is not None})
    return d

def mo(t, delay=None):
    m = {"type": t}
    if delay: m["delay"] = delay
    return m

def H(text, level=2, size="heading", **kw): return n("Heading", text=text, level=level, size=size, **kw)
def T(text, size=None, **kw): return n("Text", text=text, size=size, **kw)
def E(text, **kw): return n("Eyebrow", text=text, **kw)
def B(label, kind="primary", **kw): return n("Button", label=label, kind=kind, **kw)
def Im(src, alt, kind="detail", ratio="landscape", **kw): return n("Image", src=I+src, alt=alt, kind=kind, ratio=ratio, **kw)
def St(v, l, size="heading", **kw): return n("Stat", value=v, label=l, size=size, **kw)
def L(items, style="dashed", **kw): return n("List", items=items, style=style, **kw)
def Q(text, author=None, role=None, size="heading", **kw): return n("Quote", text=text, author=author, role=role, size=size, **kw)
def Stack(*kids, **kw): return n("Stack", children=list(kids), **kw)
def Row(*kids, **kw): return n("Row", children=list(kids), **kw)
def Grid(cols, *kids, **kw): return n("Grid", cols=cols, children=list(kids), **kw)
def Card(*kids, **kw): return n("Card", children=list(kids), **kw)
def Div(**kw): return n("Divider", **kw)
def F(label, type="text", options=None, **kw): return n("Field", label=label, type=type, options=options, **kw)

def sec(role, variant, children, cols=12, gap="md", align="start", pad="md", minH=None, bleed=None, bg=None):
    props = {"role": role, "grid": {"cols": cols, "gap": gap, "align": align, "pad": pad}, "children": children}
    if minH: props["grid"]["minH"] = minH
    if bleed: props["grid"]["bleed"] = True
    if bg: props["bg"] = bg
    return {"type": "FreeSection", "variant": variant, "props": props}

NAVLINKS = [("Home","home"),("Products","products"),("Technology","technology"),("About","about"),("Contact","contact")]

def header():
    """One header for every page. A single flex row — grid areas overlap when the
    viewport narrows, flex just shrinks."""
    return sec("nav", "free/nav", cols=1, gap="sm", align="center", pad="none", children=[
        Row(
            Stack(H("MERRYFAIR", level=2, size="title"),
                  T("Chair systems since 1974", size="small"), gap="xs"),
            Row(*[T(lbl, size="small", page=pg) for lbl, pg in NAVLINKS], gap="md", wrap=True),
            Row(T("+60 3 3392 8888", size="small"), B("Request quotation", page="contact"), gap="sm"),
            justify="between", gap="lg", wrap=True, area="1/1/2/2"),
    ])

def footer():
    """One footer for every page: oversized wordmark, three link columns, legal rule."""
    cols = [
        ("Products", ["Wau 2 Series","Tune Series","Anggun Series","Muze Series","Desking & storage"]),
        ("Company", ["About","Manufacturing","Technology","Careers"]),
        ("Visit", ["Klang showroom","By appointment","Weekdays 9:00–17:30","Request a quotation"]),
    ]
    kids = [
        H("MERRYFAIR", level=2, size="display", motion=mo("fade-up")),
        Div(),
        Row(
            Stack(E("Klang campus"),
                  T("2 Jalan Koporat 1/KU9", size="small"),
                  T("Taman Perindustrian Meru", size="small"),
                  T("42200 Klang, Selangor", size="small"),
                  gap="xs"),
            *[Stack(E(title), L(links, style="plain"), gap="sm") for title, links in cols],
            justify="between", align="start", gap="lg", wrap=True),
        Div(),
        Row(T("ISO certified manufacturing since 1982", size="small"),
            T("10 million chairs · 82 countries", size="small"),
            justify="between", gap="md", wrap=True),
    ]
    return sec("footer", "free/footer", [Stack(*kids, gap="lg", area="1/1/2/2")],
               cols=1, gap="md", pad="sm")

# ---------- pages ----------
def home():
    return [
      # HERO — full-bleed environment with parallax, copy pinned to the lower-left third
      sec("hero", "free/hero", cols=12, gap="sm", align="end", pad="xl", minH="76cqi", bleed=False,
          bg={"image": I+"07-corporate-office.webp", "alt": "Merryfair seating across a corporate floor",
              "kind": "environment", "overlay": True, "parallax": 0.55},
          children=[
            Stack(E("Chair systems since 1974", motion=mo("fade-up")),
                  H("Seating engineered around the working spine", level=1, size="display", motion=mo("fade-up", 90)),
                  T("Fifty years of Malaysian manufacturing — tooling, injection moulding, upholstery, assembly and testing, all under one roof in Klang.",
                    size="lede", maxw="prose", motion=mo("fade-up", 180)),
                  Row(B("View the Wau 2 series", page="products"), B("Book a showroom visit", "ghost", page="contact"),
                      gap="sm", motion=mo("fade-up", 260)),
                  gap="md", area="1/1/2/9")]),
      # PROOF — stat row, staggered
      sec("proof", "free/proof", cols=12, gap="md", pad="sm", children=[
            St("10M+", "Chairs exported", area="1/1/2/4", motion=mo("fade-up")),
            St("82", "Countries served", area="1/4/2/7", motion=mo("fade-up", 80)),
            St("5 yr", "Structural warranty", area="1/7/2/10", motion=mo("fade-up", 160)),
            St("1974", "Manufacturing since", area="1/10/2/13", motion=mo("fade-up", 240))]),
      # RANGE — asymmetric: heading spans 4, four cards in a 8-col field
      sec("range", "free/range", cols=12, gap="lg", children=[
            Stack(E("The range"), H("Four seating families, one material science", size="heading"),
                  T("One material science, four answers to different floors.", maxw="narrow"),
                  gap="sm", area="1/1/2/5", motion=mo("slide-right")),
            Card(Im("11-wau2-product.webp", "Wau 2 chair", ratio="portrait"),
                 Stack(H("Wau 2 Series", size="title"), T("Organic spine-mimicking frame, recyclable polyelastomer mesh, deep synchronised tilt.", size="small"), gap="xs", pad="sm"),
                 area="1/5/2/9", motion=mo("fade-up", 60)),
            Card(Im("12-tune-product.webp", "Tune chair", ratio="portrait"),
                 Stack(H("Tune Series", size="title"), T("Auto weight-sensing tilt and high-tensile polyester mesh for high-density floors.", size="small"), gap="xs", pad="sm"),
                 area="1/9/2/13", motion=mo("fade-up", 140)),
            Card(Im("13-anggun-product.webp", "Anggun chair", ratio="landscape"),
                 Stack(H("Anggun Series", size="title"), T("Lightweight responsive lumbar engineering for long shifts.", size="small"), gap="xs", pad="sm"),
                 area="2/5/3/9", motion=mo("fade-up", 60)),
            Card(Im("16-muze-stack.webp", "Muze chairs", ratio="landscape"),
                 Stack(H("Muze Series", size="title"), T("Heavy-duty stackable polymer seating for cafés and institutions.", size="small"), gap="xs", pad="sm"),
                 area="2/9/3/13", motion=mo("fade-up", 140))]),
      # MEDIA — image bleeds left, copy offset right, clip reveal
      sec("media", "free/media", cols=12, gap="lg", align="center", children=[
            n("Image", src=I+"06-klang-manufacturing.webp", alt="Klang manufacturing campus", kind="environment",
              ratio="landscape", area="1/1/2/8", motion=mo("reveal-clip"), parallax=0.12),
            Stack(E("One roof"), H("Design, tooling and assembly on a single campus"),
                  T("Everything from design engineering and plastic injection moulding to upholstery, assembly and load testing happens inside our Klang facility."),
                  T("Centralising R&D with production is why a specification change reaches the line in days, not quarters."),
                  Row(B("Inside the factory", page="about")),
                  gap="sm", area="1/8/2/13", motion=mo("fade-up", 120))]),
      # QUOTE — one display-size quote, nothing else
      sec("quote", "free/quote", cols=12, gap="md", pad="md", children=[
            Q("We specified 1,400 Tune chairs across three floors. Four years in, we have replaced two gas lifts and nothing else.",
              "Facilities lead", "Regional bank, Kuala Lumpur", size="display", area="1/1/2/11", motion=mo("fade-up"))]),
      # PROCESS — numbered steps as a 4-across rhythm with rules
      sec("process", "free/process", cols=12, gap="md", children=[
            Stack(E("How specification works"), H("From floor plan to installed seating"), gap="sm", area="1/1/2/13", motion=mo("fade-up")),
            *[Stack(Div(), St(f"0{i+1}", t, size="heading"), T(b, size="small"), gap="sm",
                    area=f"2/{1+i*3}/3/{4+i*3}", motion=mo("fade-up", 70*i))
              for i,(t,b) in enumerate([
                ("Enquiry","Send headcount, floor plate and fabric direction. Rough numbers are enough."),
                ("Specification","Dimensioned specification, fabric options and a price, usually within two working days."),
                ("Sample","A sample chair in your configuration goes to site for sign-off before the order is cut."),
                ("Install","One visit: delivery, on-site assembly and packaging removal.")])]]),
      # CTA
      sec("cta", "free/cta", cols=12, gap="md", align="end", children=[
            Stack(H("Specify seating for your next floor plate", size="display"),
                  T("Corporate fabric matching to your brand guidelines, free delivery and on-site assembly across main Malaysian commerce zones.", size="lede", maxw="prose"),
                  gap="sm", area="1/1/2/9", motion=mo("fade-up")),
            Row(B("Request a quotation", page="contact"), justify="end", area="1/9/2/13", motion=mo("fade-up", 120))]),
    ]

def products():
    items = [("11-wau2-product.webp","Wau 2 Series","Executive mesh, synchronised tilt, multi-axis lumbar.","Polyelastomer or foam"),
             ("15-wau2-range.webp","Wau 2 — full range","Highback, midback and visitor on one frame.","3 configurations"),
             ("12-tune-product.webp","Tune Series","Auto weight-sensing tilt for high-density floors.","High-tensile mesh"),
             ("13-anggun-product.webp","Anggun Series","Lightweight responsive lumbar support.","Task seating"),
             ("14-muze-product.webp","Muze Series","Stackable polymer seating for cafés and institutions.","Stacks 8 high"),
             ("23-executive-chair.webp","Executive leather","Upholstered seating for cellular offices.","Fabric matching")]
    cards = []
    for i,(img,name,body,meta) in enumerate(items):
        c = (i % 3) * 4 + 1
        r = i // 3 + 2
        cards.append(Card(Im(img, name, ratio="square"),
                          Stack(H(name, size="title"), T(body, size="small"), T(meta, size="small", tone="accent"), gap="xs", pad="sm"),
                          area=f"{r}/{c}/{r+1}/{c+4}", motion=mo("fade-up", 60*(i%3))))
    spec_groups = [("Frame & back", ["Organic spine-mimicking polymer","100% recyclable polyelastomer mesh","Polyurethane moulded foam option"]),
                   ("Mechanism", ["Deep synchronised tilt, 4-position lock","Multi-axis lumbar pressure control","Sliding seat depth, 60 mm travel"]),
                   ("Warranty", ["Structural parts — 5 years","Mesh and upholstery — 2 years","Spare parts manufactured in-house"]),
                   ("Logistics", ["Lead time 3–5 weeks, corporate fabric","Free delivery, main commerce zones","On-site assembly included"])]
    return [
      sec("hero", "free/hero", cols=12, gap="sm", pad="lg", children=[
            Stack(Row(T("Home", size="small", page="home"), T("/", size="small", tone="muted"), T("Products", size="small"), gap="xs"),
                  E("Products"),
                  H("Task, executive and institutional seating", level=1, size="display", motion=mo("fade-up")),
                  T("Four chair families plus desking, cubicles, acoustic panels and file storage — specified together or independently.",
                    size="lede", maxw="prose", motion=mo("fade-up", 100)),
                  gap="sm", area="1/1/2/10")]),
      sec("range", "free/range", cols=12, gap="md", children=[
            Stack(E("Catalogue"), H("Current range"), gap="sm", area="1/1/2/13", motion=mo("fade-up")), *cards]),
      sec("spec", "free/spec", cols=12, gap="lg", children=[
            Stack(E("Wau 2 Series"), H("Specification", size="heading"),
                  T("Dimensioned drawings and BIFMA test summaries available on request.", size="small"),
                  gap="sm", area="1/1/2/5", motion=mo("slide-right")),
            *[Stack(E(label), L(rows, style="rows"), gap="sm",
                    area=f"{1 + i//2}/{5 + (i%2)*4}/{2 + i//2}/{9 + (i%2)*4}", motion=mo("fade-up", 60*i))
              for i,(label, rows) in enumerate(spec_groups)]]),
      sec("story", "free/story", cols=12, gap="lg", align="center", children=[
            Stack(E("Beyond seating"), H("Desking, storage and acoustic systems"),
                  T("Smart executive desking, modular cubicles, acoustic panels and industrial file storage are manufactured on the same campus and specified against the same fabric library."),
                  gap="sm", area="1/1/2/6", motion=mo("fade-up")),
            n("Image", src=I+"04-executive-desk.webp", alt="Executive desking", kind="environment", ratio="wide",
              area="1/6/2/13", motion=mo("scale-in", 100), parallax=0.1)]),
      sec("proof", "free/proof", cols=12, gap="md", pad="sm", children=[
            St("3–5 wk","Typical lead time", area="1/1/2/4", motion=mo("fade-up")),
            St("5 yr","Structural warranty", area="1/4/2/7", motion=mo("fade-up", 80)),
            St("100%","Recyclable mesh", area="1/7/2/10", motion=mo("fade-up", 160)),
            St("1","Assembly visit", area="1/10/2/13", motion=mo("fade-up", 240))]),
      sec("cta", "free/cta", cols=12, gap="md", align="center", children=[
            Stack(H("Need a specification sheet?", size="display"),
                  T("Dimensioned drawings, fabric swatches and BIFMA test summaries for any series.", size="lede"),
                  Row(B("Request specification pack", page="contact"), justify="center"),
                  gap="md", align="center", area="1/3/2/11", motion=mo("fade-up"))]),
    ]

def technology():
    pillars = [("Synchronised tilt","Backrest and seat rotate on a fixed ratio so the sightline to the desk holds through the full recline range."),
               ("Auto weight sensing","Tension adapts to occupant mass without a dial, which matters on hot-desked floors where nobody adjusts anything."),
               ("Multi-axis lumbar","Height and depth adjust independently, so support tracks the lordotic curve rather than a single fixed bump.")]
    return [
      sec("hero", "free/hero", cols=12, gap="sm", pad="lg", minH="46cqi",
          bg={"image": I+"24-mesh-detail.webp", "alt": "Mesh detail", "kind": "environment", "overlay": True, "parallax": 0.4},
          children=[
            Stack(Row(T("Home", size="small", page="home"), T("/", size="small"), T("Technology", size="small"), gap="xs"),
                  E("Technology"),
                  H("Material science, not marketing adjectives", level=1, size="display", motion=mo("fade-up")),
                  T("Three engineering decisions define how a Merryfair chair behaves over an eight-hour day: the mesh, the mechanism and the lumbar geometry.",
                    size="lede", maxw="prose", motion=mo("fade-up", 110)),
                  gap="sm", area="1/1/2/9")]),
      sec("story", "free/story", cols=12, gap="lg", align="center", children=[
            n("Image", src=I+"24-mesh-detail.webp", alt="Close detail of chair mesh", kind="detail", ratio="square",
              area="1/1/2/6", motion=mo("reveal-clip")),
            Stack(E("Mesh"), H("Polyelastomer, recyclable, tensioned to spec"),
                  T("Our polyelastomer mesh is tensioned against a moulded frame rather than a stretched panel, so seat pressure stays even as the material ages."),
                  T("Where a floor needs higher air movement we specify high-tensile polyester instead — the same frame accepts both."),
                  gap="sm", area="1/6/2/13", motion=mo("fade-up", 120))]),
      sec("process", "free/process", cols=12, gap="md", children=[
            Stack(E("Engineering pillars"), H("What we test for"), gap="sm", area="1/1/2/5", motion=mo("fade-up")),
            *[Stack(Div(), H(t, size="title"), T(b, size="small"), gap="sm",
                    area=f"2/{1+i*4}/3/{5+i*4}", motion=mo("fade-up", 80*i)) for i,(t,b) in enumerate(pillars)]]),
      sec("spec", "free/spec", cols=12, gap="lg", children=[
            Stack(E("Mechanism"), H("Test and tolerance summary"), gap="sm", area="1/1/2/5", motion=mo("slide-right")),
            Stack(E("Durability"), L(["Tilt cycles — 120,000","Seat impact — 100,000 cycles","Castor travel — 36 km loaded"], style="rows"),
                  gap="sm", area="1/5/2/9", motion=mo("fade-up", 60)),
            Stack(E("Load"), L(["Rated occupant — 120 kg","Static test — 1,136 kg","Backrest force — 890 N"], style="rows"),
                  gap="sm", area="1/9/2/13", motion=mo("fade-up", 120))]),
      sec("story", "free/story", cols=12, gap="lg", children=[
            Stack(E("Why it matters"), H("Occupational back pain is a specification problem"), gap="sm", area="1/1/2/5", motion=mo("fade-up")),
            Stack(T("Lower back pain is the most common musculoskeletal complaint in office work, and most of it traces to chairs that support a posture nobody actually holds."),
                  T("The Anggun series was developed around that finding: lightweight, responsive lumbar engineering aimed at shifts where the occupant moves constantly."),
                  Card(T("All series are tested to BIFMA methods at our Klang facility before release to the line.", size="small"), pad="md"),
                  gap="sm", area="1/6/2/13", motion=mo("fade-up", 100))]),
      sec("quote", "free/quote", cols=12, gap="md", children=[
            Stack(E("From the floor"), H("What specifiers report back"), gap="sm", area="1/1/2/13", motion=mo("fade-up")),
            *[Q(q, a, r, size="body", area=f"2/{1+i*4}/3/{5+i*4}", motion=mo("fade-up", 70*i))
              for i,(q,a,r) in enumerate([
                ("The auto-tension is the part that actually gets used. Nobody touches a dial.","Workplace manager","Shared services centre"),
                ("We could re-mesh rather than replace. That decided the tender.","Procurement","University campus"),
                ("Same fabric across chairs, screens and storage. Fewer arguments.","Interior designer","Fit-out practice")])]]),
      sec("cta", "free/cta", cols=12, gap="md", align="end", children=[
            Stack(H("Ask for the test data", size="display"),
                  T("BIFMA summaries, material declarations and recyclability statements for every series.", size="lede"),
                  gap="sm", area="1/1/2/9", motion=mo("fade-up")),
            Row(B("Request test data", page="contact"), justify="end", area="1/9/2/13", motion=mo("fade-up", 100))]),
    ]

def about():
    era = [("1974","Industrial components","Founded as a precision component manufacturer supplying Malaysian industry."),
           ("1982","Pivot to seating","Full transition to office seating manufacture, retaining in-house tooling."),
           ("1990s","Export programme","Institutional seating begins shipping across Southeast Asia and the Middle East."),
           ("Today","82 countries","Over 10 million chairs exported, R&D and production centralised in Klang.")]
    gallery = [("17-showroom-klang.webp","Klang showroom","1/1/3/6"),
               ("18-showroom-bays.webp","Showroom display bays","1/6/2/10"),
               ("20-team.webp","Merryfair team","1/10/2/13"),
               ("19-meeting-room.webp","Meeting room seating","2/6/3/10"),
               ("07-corporate-office.webp","Corporate floor","2/10/3/13")]
    return [
      sec("hero", "free/hero", cols=12, gap="md", align="center", pad="xl", minH="70cqi",
          bg={"image": I+"22-office-exterior.webp", "alt": "Merryfair facility exterior", "kind": "environment",
              "overlay": True, "parallax": 0.6},
          children=[
            Stack(E("Since 1974", motion=mo("fade")),
                  H("Fifty years making chairs in one place", level=1, size="display", motion=mo("fade-up", 80)),
                  T("Merryfair began as an industrial component manufacturer and moved into office seating in 1982. The campus has grown; the address has not.",
                    size="lede", maxw="prose", motion=mo("fade-up", 180)),
                  gap="md", align="center", area="1/2/2/12")]),
      sec("process", "free/process", cols=12, gap="md", children=[
            Stack(E("History"), H("How the company arrived here"), gap="sm", area="1/1/2/13", motion=mo("fade-up")),
            *[Stack(Div(), St(y, t, size="heading"), T(b, size="small"), gap="sm",
                    area=f"2/{1+i*3}/3/{4+i*3}", motion=mo("fade-up", 70*i)) for i,(y,t,b) in enumerate(era)]]),
      sec("media", "free/media", cols=12, gap="lg", align="center", children=[
            Stack(E("R&D"), H("Engineering sits next to the moulding floor"),
                  T("Design engineering, tooling and quality control share a building with production. A prototype frame can be moulded, assembled and load-tested in the same week it is drawn."),
                  T("That proximity is why we still manufacture our own spare parts rather than sourcing them."),
                  gap="sm", area="1/1/2/6", motion=mo("fade-up")),
            n("Image", src=I+"08-rd-design.webp", alt="R&D and design engineering", kind="environment", ratio="portrait",
              area="1/7/2/13", motion=mo("scale-in", 120), parallax=0.15)]),
      sec("proof", "free/proof", cols=12, gap="md", pad="sm", children=[
            St("50 yr","In manufacturing", size="display", area="1/1/2/4", motion=mo("fade-up")),
            St("10M+","Chairs shipped", area="1/4/2/7", motion=mo("fade-up", 80)),
            St("82","Export markets", area="1/7/2/10", motion=mo("fade-up", 160)),
            St("1","Campus, Klang", area="1/10/2/13", motion=mo("fade-up", 240))]),
      sec("media", "free/media", cols=12, gap="sm", children=[
            Stack(E("The campus"), H("Klang, Selangor"), gap="sm", area="1/1/2/13", motion=mo("fade-up")),
            *[n("Image", src=I+img, alt=alt, kind="environment", ratio="fill", area=f"{int(a.split('/')[0])+1}/{a.split('/')[1]}/{int(a.split('/')[2])+1}/{a.split('/')[3]}",
                motion=mo("fade-up", 60*i)) for i,(img,alt,a) in enumerate(gallery)]]),
      sec("story", "free/story", cols=12, gap="lg", children=[
            Stack(H("What has not changed"), gap="sm", area="1/1/2/5", motion=mo("slide-right")),
            Stack(T("Every structural component is still made in-house, which is what makes a five-year parts warranty a manufacturing commitment rather than an insurance product."),
                  T("It is also why customers who bought chairs a decade ago can still order the exact gas lift, castor or arm pad that fits them."),
                  gap="sm", area="1/6/2/12", motion=mo("fade-up", 90))]),
      sec("cta", "free/cta", cols=12, gap="md", align="center", children=[
            Stack(H("Come and sit in them", size="display"),
                  T("The Klang showroom holds the full current range plus fabric and finish libraries.", size="lede"),
                  Row(B("Arrange a visit", page="contact"), justify="center"),
                  gap="md", align="center", area="1/3/2/11", motion=mo("fade-up"))]),
    ]

def contact():
    faqs = [("What is the minimum order for corporate fabric matching?","From 50 units. Below that we supply from the standard library, which covers 40 colourways."),
            ("How long does delivery take?","Three to five weeks for corporate fabric orders; standard library colours typically ship within two weeks."),
            ("Do you deliver outside Malaysia?","Yes — we export to 82 countries. Freight and assembly terms are quoted per destination."),
            ("What does the five-year warranty cover?","Structural components: frame, base, mechanism and gas lift. Mesh and upholstery carry two years."),
            ("Can existing chairs be re-meshed rather than replaced?","For Wau and Tune series, yes. Send batch details and we confirm part availability.")]
    fields = [("Name","text"),("Company","text"),("Email","email"),("Phone","tel"),
              ("Series of interest","select"),("Approximate quantity","text")]
    return [
      sec("hero", "free/hero", cols=12, gap="sm", pad="lg", children=[
            Stack(Row(T("Home", size="small", page="home"), T("/", size="small"), T("Contact", size="small"), gap="xs"),
                  E("Contact"),
                  H("Quotations, showroom visits and after-sales", level=1, size="display", motion=mo("fade-up")),
                  T("Tell us the headcount, the floor plate and the fabric direction. We come back with a specification and a price.",
                    size="lede", maxw="prose", motion=mo("fade-up", 100)),
                  gap="sm", area="1/1/2/10")]),
      sec("contact", "free/contact", cols=12, gap="lg", align="center", children=[
            Stack(E("Find us"), H("Manufacturing campus and showroom"),
                  Stack(H("Head office & factory", size="title"),
                        T("2 Jalan Koporat 1/KU9, Taman Perindustrian Meru, 42200 Klang, Selangor", size="small"),
                        T("Design, moulding, upholstery, assembly and testing", size="small", tone="accent"), gap="xs"),
                  Stack(H("Showroom", size="title"),
                        T("Same campus, Block A · weekdays 9:00–17:30", size="small"),
                        T("Full current range, by appointment", size="small", tone="accent"), gap="xs"),
                  gap="md", area="1/1/2/6", motion=mo("fade-up")),
            n("Image", src=I+"10-client-showroom.webp", alt="Merryfair client showroom", kind="environment", ratio="landscape",
              area="1/6/2/13", motion=mo("reveal-clip", 120), parallax=0.12)]),
      sec("process", "free/process", cols=12, gap="md", children=[
            Stack(E("What happens next"), H("After you send the enquiry"), gap="sm", area="1/1/2/13", motion=mo("fade-up")),
            *[Stack(Div(), St(f"0{i+1}", t, size="heading"), T(b, size="small"), gap="sm",
                    area=f"2/{1+i*4}/3/{5+i*4}", motion=mo("fade-up", 80*i))
              for i,(t,b) in enumerate([
                ("We read it","A specification engineer, not a queue. Expect questions rather than a brochure."),
                ("Specification and price","Drawings, fabric options and freight terms, typically within two working days."),
                ("Sample sign-off","A sample chair in the exact configuration goes to site before anything is cut.")])]]),
      sec("contact", "free/contact", cols=12, gap="lg", children=[
            Stack(E("Request a quotation"), H("Tell us about the floor"),
                  T("Rough numbers are fine at this stage — we will come back with questions rather than a form to fill in again."),
                  gap="sm", area="1/1/2/5", motion=mo("fade-up")),
            Stack(
              Grid(2,
                   *[F(lbl, t, options=["Wau 2","Tune","Anggun","Muze","Desking & storage","Not sure yet"] if t == "select" else None)
                     for lbl, t in fields],
                   F("Anything else we should know", "textarea"),
                   gap="md"),
              Row(B("Send enquiry"), justify="start"),
              gap="lg", area="1/5/2/13", motion=mo("fade-up", 90))]),
      sec("story", "free/story", cols=12, gap="md", children=[
            Stack(E("Before you ask"), H("Common questions"), gap="sm", area="1/1/2/5", motion=mo("slide-right")),
            Stack(*[Stack(Div(), H(q, size="title"), T(a, size="small"), gap="xs") for q,a in faqs],
                  gap="md", area="1/5/2/13", motion=mo("fade-up", 90))]),
      sec("cta", "free/cta", cols=12, gap="md", align="end", children=[
            Stack(H("Prefer to call?", size="display"),
                  T("Our specification team answers engineering and logistics questions directly.", size="lede"),
                  gap="sm", area="1/1/2/9", motion=mo("fade-up")),
            Stack(T("Klang, Selangor", size="small"), T("Weekdays 9:00–17:30 MYT", size="small"),
                  area="1/9/2/13", gap="xs", motion=mo("fade-up", 100))]),
    ]

site = {"client": "merryfair",
        "chrome": {"header": header(), "footer": footer()},
        "pages": {
    "home": {"title": "Home", "blocks": home()},
    "products": {"title": "Products", "blocks": products()},
    "technology": {"title": "Technology", "blocks": technology()},
    "about": {"title": "About", "blocks": about()},
    "contact": {"title": "Contact", "blocks": contact()},
}}

import os
out = os.path.join(os.path.dirname(__file__), "..", "src", "specs", "merryfair-free.json")
json.dump(site, open(out, "w"), indent=2)
print({k: len(v["blocks"]) for k, v in site["pages"].items()},
      "sections;", sum(len(v["blocks"]) for v in site["pages"].values()), "total")
