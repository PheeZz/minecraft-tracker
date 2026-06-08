# -*- coding: utf-8 -*-
"""
Genome dataset generator for the genetics tracker.

Reads decompiled mod sources (CFR output) + extracted lang files and produces
genetics/data-src/species-genomes.json.

Sources (decompiled with CFR 0.152):
  Forestry : forestry/apiculture/genetics/BeeDefinition.java + BeeBranchDefinition.java
  ExtraBees: binnie/extrabees/genetics/ExtraBeeDefinition.java + ExtraBeeBranchDefinition.java
  MagicBees: magicbees/bees/BeeGenomeManager.java + BeeSpecies.java

Genome inheritance model (verified from source):
  Forestry/ExtraBees: defaultTemplate -> branch.setBranchProperties -> species.setAlleles
  MagicBees:          getTemplateModBase -> (base template chain) -> species override

All allele values are normalised to the tracker's canonical alleleEN strings.
Values with no canonical string (e.g. flowers=Snow, ExtraBees custom flowers/effects)
are OMITTED from the genome and recorded in _meta.coverageGaps + _meta.nonCanonicalAlleles.
"""
import re, json, os, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC  = r"C:\Users\pheezz\Desktop\pricoli-jar"
F_BEE   = os.path.join(DEC, "decomp", "forestry", "forestry", "apiculture", "genetics", "BeeDefinition.java")
EB_BEE  = os.path.join(DEC, "decomp", "binnie", "binnie", "extrabees", "genetics", "ExtraBeeDefinition.java")
MB_GEN  = os.path.join(DEC, "decompMB", "magicbees", "bees", "BeeGenomeManager.java")
MB_SPEC = os.path.join(DEC, "decompMB", "magicbees", "bees", "BeeSpecies.java")
ASSETS  = os.path.join(PROJ, "genetics", "_assets")
I18N    = os.path.join(PROJ, "bees", "i18n", "genetics-i18n.json")
OUT     = os.path.join(PROJ, "genetics", "data-src", "species-genomes.json")

# ---------------------------------------------------------------- canonical maps
SPEED = {"slowest":"Slowest","slower":"Slower","slow":"Slow","norm":"Normal","normal":"Normal",
         "fast":"Fast","faster":"Faster","fastest":"Fastest","blinding":"Blinding"}
LIFE  = {"shortest":"Shortest","shorter":"Shorter","short":"Short","shortened":"Shortened",
         "normal":"Normal","elongated":"Elongated","long":"Long","longer":"Longer","longest":"Longest","eon":"Eon"}
FERT  = {"low":"1","normal":"2","high":"3","maximum":"4"}
TOL   = {"none":"None","up1":"Up 1","up2":"Up 2","up3":"Up 3","down1":"Down 1","down2":"Down 2",
         "down3":"Down 3","both1":"Both 1","both2":"Both 2","both3":"Both 3","both5":"Both 5"}
# non-canonical tolerances (both4, up4/5, down4/5) -> not present
FLOWERING = {"slowest":"Slowest","slower":"Slower","slow":"Slow","average":"Average",
             "fast":"Fast","faster":"Faster","fastest":"Fastest"}  # 'maximum' -> non-canon
TERR  = {"average":"Average","default":"Average","large":"Large","larger":"Larger","largest":"Largest"}
FLOWERS = {"vanilla":"Flowers","nether":"Nether","cacti":"Cacti","jungle":"Jungle","end":"End",
           "wheat":"Wheat","mushrooms":"Mushrooms","gourd":"Gourds"}  # 'snow' -> non-canon
BOOL = {"true":"Yes","false":"No"}

# effect allele uid (forestry) -> in-game EN display (from forestry en_US.lang) -> canon
# canon effect set: None,Aggressive,Beatific,Creeper,Explorer,Freezing,Heroic,Flammable,
#                   Poison,Ends,Radioactive,Drunkard,Repulsion,Reanimation
EFFECT_FOR = {
    "effectnone":"None","effectaggressive":"Aggressive","effectheroic":"Heroic",
    "effectbeatific":"Beatific","effectmiasmic":"Poison","effectmisanthrope":"Ends",
    "effectglacial":"Freezing","effectradioactive":"Radioactive","effectcreeper":"Creeper",
    "effectignition":"Flammable","effectexploration":"Explorer","effectdrunkard":"Drunkard",
    "effectreanimation":"Reanimation","effectrepulsion":"Repulsion",
    # non-canonical (real EN display in comment) -> mapped to None so they get flagged
    "effectfestiveeaster":None,   # Festive
    "effectsnowing":None,         # Snow
    "effectresurrection":None,    # Resurrection
    "effectfertile":None,         # Fertile
    "effectmycophilic":None,      # Mycophilic
}
EFFECT_FOR_RAW = {  # for gap reporting
    "effectfestiveeaster":"Festive","effectsnowing":"Snow","effectresurrection":"Resurrection",
    "effectfertile":"Fertile","effectmycophilic":"Mycophilic",
}
# ExtraBees custom effects/flowers -> EN display (from extrabees en_US.lang); all non-canonical
EB_EFFECT = {"HUNGER":"Hunger","RADIOACTIVE":"Unstable","WATER":"Water","METEOR":"Meteor",
             "ECTOPLASM":"Ectoplasm","ACID":"Acidic","LIGHTNING":"Lightning","BLINDNESS":"Darkness",
             "GRAVITY":"Gravity","FOOD":"Nourishment","CONFUSION":"Confusion","WITHER":"Wither",
             "TELEPORT":"Teleport","SLOW":"Slowness","POWER":"Power","FIREWORKS":"Fireworks",
             "SPAWN_ZOMBIE":"Zombies","SPAWN_SKELETON":"Skeletons","SPAWN_CREEPER":"Creepers",
             "BONEMEAL_SAPLING":"Growth","BONEMEAL_FRUIT":"Ripening","BONEMEAL_MUSHROOM":"Mushroom"}
EB_FLOWER = {"DEAD":"Dead Bushes","ROCK":"Rocks","WATER":"Lily Pads","SUGAR":"Reeds",
             "REDSTONE":"Redstone","MYSTICAL":"Mystical","BOOK":"Books","WOOD":"Wood",
             "LEAVES":"Leaves","SAPLING":"Saplings","FRUIT":"Fruit"}

# ---------------------------------------------------------------- default template (Forestry == ExtraBees)
DEFAULT = {
    "speed":("speed","slowest"), "lifespan":("life","shorter"), "fertility":("fert","normal"),
    "tempTol":("tol","none"), "nocturnal":("bool","false"), "humidTol":("tol","none"),
    "flyer":("bool","false"), "cave":("bool","false"), "flowers":("flowers","vanilla"),
    "flowering":("flowering","slowest"), "territory":("terr","average"), "effect":("eff","effectnone"),
}

# ---------------------------------------------------------------- branch overrides (Forestry)
# from BeeBranchDefinition.java setBranchProperties
F_BRANCH = {
    "HONEY":{}, "NOBLE":{}, "INDUSTRIOUS":{}, "HEROIC":{},
    "INFERNAL":{"tempTol":("tol","down2"),"nocturnal":("bool","true"),"flowers":("flowers","nether"),"flowering":("flowering","average")},
    "AUSTERE":{"tempTol":("tol","both1"),"humidTol":("tol","down1"),"nocturnal":("bool","true"),"flowers":("flowers","cacti")},
    "TROPICAL":{"tempTol":("tol","up1"),"humidTol":("tol","up1"),"flowers":("flowers","jungle"),"effect":("eff","effectmiasmic")},
    "END":{"fertility":("fert","low"),"speed":("speed","slower"),"lifespan":("life","longer"),"tempTol":("tol","up1"),"territory":("terr","large"),"flowers":("flowers","end"),"nocturnal":("bool","true"),"effect":("eff","effectmisanthrope")},
    "FROZEN":{"tempTol":("tol","up1"),"humidTol":("tol","both1"),"flowers":("flowers","snow"),"effect":("eff","effectglacial")},
    "VENGEFUL":{"territory":("terr","largest"),"effect":("eff","effectradioactive")},
    "FESTIVE":{"speed":("speed","slower"),"tempTol":("tol","both2"),"humidTol":("tol","both1"),"lifespan":("life","normal")},
    "AGRARIAN":{"speed":("speed","slower"),"lifespan":("life","shorter"),"flowers":("flowers","wheat"),"flowering":("flowering","faster")},
    "BOGGY":{"flowers":("flowers","mushrooms"),"flowering":("flowering","slower"),"tempTol":("tol","both1")},
    "MONASTIC":{"speed":("speed","slower"),"lifespan":("life","long"),"fertility":("fert","low"),"flowering":("flowering","faster"),"humidTol":("tol","both1"),"tempTol":("tol","both1"),"cave":("bool","true"),"flowers":("flowers","wheat")},
}
# branch overrides (ExtraBees) from ExtraBeeBranchDefinition.java
EB_BRANCH = {
    "BARREN":{"humidTol":("tol","down1"),"nocturnal":("bool","true"),"speed":("speed","slower"),"lifespan":("life","short"),"tempTol":("tol","up1"),"flowers":("ebf","DEAD"),"fertility":("fert","low")},
    "HOSTILE":{"humidTol":("tol","down1"),"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"speed":("speed","slower"),"lifespan":("life","short"),"tempTol":("tol","up1"),"flowers":("ebf","DEAD"),"fertility":("fert","low")},
    "ROCKY":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"fertility":("fert","low"),"tempTol":("tol","both1"),"humidTol":("tol","both1"),"lifespan":("life","short"),"flowers":("ebf","ROCK")},
    "METALLIC":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"fertility":("fert","low"),"lifespan":("life","short"),"flowers":("ebf","ROCK"),"tempTol":("tol","both2"),"humidTol":("tol","both2")},
    "METALLIC2":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"fertility":("fert","low"),"lifespan":("life","short"),"flowers":("ebf","ROCK"),"tempTol":("tol","both2"),"humidTol":("tol","both2")},
    "ALLOY":{},
    "PRECIOUS":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"fertility":("fert","low"),"lifespan":("life","short"),"flowers":("ebf","ROCK"),"tempTol":("tol","both2"),"humidTol":("tol","both2")},
    "MINERAL":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"fertility":("fert","low"),"lifespan":("life","short"),"flowers":("ebf","ROCK"),"tempTol":("tol","both2"),"humidTol":("tol","both2")},
    "GEMSTONE":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"fertility":("fert","low"),"lifespan":("life","short"),"flowers":("ebf","ROCK"),"tempTol":("tol","both2"),"humidTol":("tol","both2")},
    "NUCLEAR":{"nocturnal":("bool","true"),"cave":("bool","true"),"flyer":("bool","true"),"flowers":("ebf","ROCK"),"tempTol":("tol","both2"),"humidTol":("tol","both2"),"fertility":("fert","low"),"lifespan":("life","shortest"),"effect":("ebe","RADIOACTIVE")},
    "HISTORIC":{"speed":("speed","slower"),"lifespan":("life","elongated"),"flowering":("flowering","slow")},
    "FOSSILIZED":{"speed":("speed","slower"),"lifespan":("life","normal"),"flowering":("flowering","slow")},
    "REFINED":{"speed":("speed","slower"),"lifespan":("life","normal"),"flowering":("flowering","slow")},
    "AQUATIC":{"flyer":("bool","true"),"flowering":("flowering","slowest"),"humidTol":("tol","both1"),"flowers":("ebf","WATER"),"effect":("ebe","WATER")},
    "SACCHARINE":{"flowers":("ebf","SUGAR")},
    "CLASSICAL":{},
    "VOLCANIC":{"speed":("speed","slower"),"lifespan":("life","normal"),"effect":("ebe","METEOR")},
    "VIRULENT":{"speed":("speed","slower"),"lifespan":("life","short"),"tempTol":("tol","up1"),"humidTol":("tol","up1"),"flowers":("flowers","jungle"),"effect":("eff","effectmiasmic")},
    "VISCOUS":{"tempTol":("tol","up1"),"humidTol":("tol","up1"),"flowers":("flowers","jungle"),"speed":("speed","slow"),"effect":("ebe","ECTOPLASM")},
    "CAUSTIC":{"tempTol":("tol","up1"),"humidTol":("tol","up1"),"flowers":("flowers","jungle"),"speed":("speed","fast"),"flowering":("flowering","average"),"effect":("ebe","ACID")},
    "ENERGETIC":{"cave":("bool","true"),"flowers":("ebf","REDSTONE"),"effect":("ebe","LIGHTNING")},
    "FARMING":{},
    "SHADOW":{"nocturnal":("bool","true"),"speed":("speed","slower"),"lifespan":("life","normal"),"effect":("ebe","BLINDNESS")},
    "PRIMARY":{}, "SECONDARY":{}, "TERTIARY":{},
    "FTB":{"speed":("speed","slower"),"lifespan":("life","normal"),"effect":("eff","effectbeatific"),"fertility":("fert","maximum"),"flowering":("flowering","maximum"),"territory":("terr","largest")},
    "QUANTUM":{"fertility":("fert","low"),"speed":("speed","slower"),"lifespan":("life","longer"),"tempTol":("tol","up1"),"territory":("terr","large"),"flowers":("flowers","end"),"nocturnal":("bool","true"),"effect":("ebe","GRAVITY")},
    "BOTANIA":{"speed":("speed","slower"),"lifespan":("life","short"),"flowering":("flowering","slow"),"flowers":("ebf","MYSTICAL")},
}

TRAIT_ORDER = ["species","speed","lifespan","fertility","tempTol","humidTol","nocturnal","flyer","cave","flowering","territory","effect","flowers"]
CHROMO = {"SPEED":"speed","LIFESPAN":"lifespan","FERTILITY":"fertility","TEMPERATURE_TOLERANCE":"tempTol",
          "HUMIDITY_TOLERANCE":"humidTol","NOCTURNAL":"nocturnal","TOLERANT_FLYER":"flyer",
          "CAVE_DWELLING":"cave","FLOWER_PROVIDER":"flowers","FLOWERING":"flowering",
          "TERRITORY":"territory","EFFECT":"effect","SPECIES":"species"}

gaps = []          # list of "Species (Mod): trait=rawvalue (reason)"
noncanon = collections.defaultdict(set)   # trait -> set(raw values)

def lang(path):
    d = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                d[k.strip()] = v.strip()
    return d

LF = lang(os.path.join(ASSETS,"forestry","assets","forestry","lang","en_US.lang"))
LEB = lang(os.path.join(ASSETS,"binnie","assets","extrabees","lang","en_US.lang"))
LMB = lang(os.path.join(ASSETS,"magicbees","assets","magicbees","lang","en_US.lang"))

# ----------------------------------------------------------------- value normaliser
def norm(trait, kind, raw, sp, mod):
    """Return canonical string or None (omit). Records gaps for None."""
    def gap(disp):
        gaps.append("%s (%s): %s=%s (no canonical value)" % (sp, mod, trait, disp))
        noncanon[trait].add(disp)
        return None
    if kind == "bool":
        return BOOL[raw]
    if kind == "speed":
        return SPEED.get(raw) or gap(raw)
    if kind == "life":
        return LIFE.get(raw) or gap(raw)
    if kind == "fert":
        return FERT.get(raw) or gap(raw)
    if kind == "tol":
        return TOL.get(raw) or gap(raw)
    if kind == "flowering":
        return FLOWERING.get(raw) or gap(raw if raw!="maximum" else "Maximum")
    if kind == "terr":
        return TERR.get(raw) or gap(raw)
    if kind == "flowers":
        v = FLOWERS.get(raw)
        return v if v else gap("Snow" if raw=="snow" else raw)
    if kind == "ebf":   # extrabees flower enum
        return gap(EB_FLOWER.get(raw, raw))
    if kind == "eff":   # forestry effect uid
        u = raw.lower()
        v = EFFECT_FOR.get(u, "__MISS__")
        if v is None:
            return gap(EFFECT_FOR_RAW.get(u, raw))
        if v == "__MISS__":
            return gap(raw)
        return v
    if kind == "ebe":   # extrabees effect enum
        return gap(EB_EFFECT.get(raw, raw))
    return gap(str(raw))

def build_genome(layers, sp, mod):
    """layers: list of dicts trait->(kind,raw); later overrides earlier. species set separately."""
    merged = dict(DEFAULT)
    for ly in layers:
        merged.update(ly)
    g = {"species": sp}
    for trait in TRAIT_ORDER:
        if trait == "species": continue
        kind, raw = merged[trait]
        val = norm(trait, kind, raw, sp, mod)
        if val is not None:
            g[trait] = val
    return g

# ----------------------------------------------------------------- parse Forestry / ExtraBees enum bodies
def parse_set_calls(body, eb=False):
    """Return dict trait->(kind,raw) from setAlleles body."""
    out = {}
    # AlleleHelper.instance.set(template, [(Enum)]EnumBeeChromosome.X, VALUE);
    pat = re.compile(r'EnumBeeChromosome\.(\w+)\s*,\s*(.*?)\)\s*;', re.S)
    for m in pat.finditer(body):
        chromo = m.group(1)
        val = m.group(2).strip()
        trait = CHROMO.get(chromo)
        if not trait or trait == "species":
            continue
        out[trait] = parse_value(trait, val)
    return out

def parse_value(trait, val):
    val = val.strip()
    # strip leading casts
    val = re.sub(r'^\((?:Enum|IAlleleValue|IAllele)\)\s*', '', val)
    val = re.sub(r'^\((?:Enum|IAlleleValue|IAllele)\)\s*', '', val)
    m = re.match(r'EnumAllele\.(\w+)\.(\w+)', val)
    if m:
        cat, name = m.group(1), m.group(2).lower()
        if cat == "Speed":   return ("speed", name)
        if cat == "Lifespan":return ("life", name)
        if cat == "Fertility":return ("fert", name)
        if cat == "Tolerance":return ("tol", name.replace("_",""))
        if cat == "Flowering":return ("flowering", name)
        if cat == "Territory":return ("terr", name)
        if cat == "Flowers": return ("flowers", name)
    if val in ("true","false"):
        return ("bool", val)
    m = re.match(r'AlleleEffect\.(\w+)', val)
    if m:
        return ("eff", m.group(1))
    m = re.match(r'AlleleHelper\.getAllele\("forestry\.(\w+)"\)', val)   # e.g. "forestry.effectDrunkard"
    if m:
        return ("eff", m.group(1))
    m = re.match(r'AlleleHelper\.getAllele\(ExtraBeesEffect\.(\w+)\.getUID', val)
    if m:
        return ("ebe", m.group(1))
    m = re.match(r'AlleleHelper\.getAllele\(ExtraBeesFlowers\.(\w+)\.getUID', val)
    if m:
        return ("ebf", m.group(1))
    return ("raw", val)

def split_enum_constants(src):
    """Yield (NAME, header_args, body) for each top-level enum constant."""
    # Find enum block start: first 'NAME(' after 'implements ... {' ; we rely on the
    # known pattern '\n    NAME(' for constants. Body is between '{' after header and matching '}'.
    # Simpler: locate each 'NAME(args){ ... }' or 'NAME(args)' constant up to ';' that ends enum list.
    # We scan for 'IDENT(' at indentation level following ',' or first.
    results = []
    # isolate the enum-constant region (from class decl to the first ';' that closes the list)
    # That ';' is the one right before private/static fields.
    # Heuristic: find 'private static' field after constants.
    pat = re.compile(r'\n    ([A-Z][A-Z0-9_]*)\(')
    idxs = [(m.group(1), m.start(1), m.end()) for m in pat.finditer(src)]
    for i,(name,s,argpos) in enumerate(idxs):
        end = idxs[i+1][1] if i+1 < len(idxs) else len(src)
        chunk = src[s:end]
        results.append((name, chunk))
    return results

def get_setalleles_body(chunk):
    m = re.search(r'setAlleles\(IAllele\[\] (?:template|var\d+)\)\s*\{(.*?)\n        \}', chunk, re.S)
    if not m:
        m = re.search(r'setAlleles\([^)]*\)\s*\{(.*?)\n        \}', chunk, re.S)
    return m.group(1) if m else ""

# ---- Forestry
species_out = []
f_src = open(F_BEE, encoding="utf-8").read()
for name, chunk in split_enum_constants(f_src):
    hm = re.match(r'[A-Z0-9_]+\(BeeBranchDefinition\.(\w+)', chunk)
    if not hm:
        continue
    branch = hm.group(1)
    if branch not in F_BRANCH:
        continue
    overrides = parse_set_calls(get_setalleles_body(chunk))
    disp = LF.get("for.bees.species." + name.lower())
    if not disp:
        continue
    g = build_genome([F_BRANCH[branch], overrides], disp, "Forestry")
    species_out.append({"en": disp, "mod": "Forestry", "_enum": name, "genome": g})

# ---- ExtraBees
eb_src = open(EB_BEE, encoding="utf-8").read()
for name, chunk in split_enum_constants(eb_src):
    hm = re.match(r'[A-Z0-9_]+\(\s*(?:\(IBranchDefinition\)\s*)?(ExtraBeeBranchDefinition|BeeBranchDefinition)\.(\w+)', chunk)
    if not hm:
        continue
    btype, branch = hm.group(1), hm.group(2)
    if btype == "ExtraBeeBranchDefinition":
        if branch not in EB_BRANCH: continue
        bl = EB_BRANCH[branch]
    else:
        if branch not in F_BRANCH: continue
        bl = F_BRANCH[branch]
    disp = LEB.get("extrabees.species.%s.name" % name.lower())
    if not disp:
        continue   # branch-only enum constant, not a species
    overrides = parse_set_calls(get_setalleles_body(chunk))
    g = build_genome([bl, overrides], disp, "ExtraBees")
    species_out.append({"en": disp, "mod": "ExtraBees", "_enum": name, "genome": g})

# ---- MagicBees: parse BeeGenomeManager template methods
mb_src = open(MB_GEN, encoding="utf-8").read()
mpat = re.compile(r'(?:private|public) static IAllele\[\] (getTempla\w+)\(\)\s*\{(.*?)\n    \}', re.S)

def mb_token(trait, tok):
    # tok like speedSlowest, lifespanShorter, fertilityNormal, toleranceBoth2, boolTrue,
    # flowersVanilla, floweringSlow, territoryLarge, effectIgnition
    for prefix,kind in (("speed","speed"),("lifespan","life"),("fertility","fert"),
                        ("tolerance","tol"),("flowering","flowering"),("flowers","flowers"),
                        ("territory","terr"),("bool","bool"),("effect","eff")):
        if tok.lower().startswith(prefix):
            rest = tok[len(prefix):]
            if kind == "bool":
                return ("bool", rest.lower())   # True/False
            if kind == "eff":
                return ("eff", "effect"+rest)   # effectIgnition -> uid
            return (kind, rest.lower())
    return ("raw", tok)

# rebuild methods with proper token parser (the lambda hack above)
methods = {}
for m in mpat.finditer(mb_src):
    mname, body = m.group(1), m.group(2)
    base = None
    bm = re.search(r'=\s*BeeGenomeManager\.(getTempla\w+)\(\)', body)
    if bm: base = bm.group(1)
    spec = None; overrides = []
    for line in body.splitlines():
        sm = re.search(r'EnumBeeChromosome\.(\w+)\.ordinal\(\)\]\s*=\s*(.*?);', line)
        if not sm: continue
        chromo, rhs = sm.group(1), sm.group(2).strip()
        trait = CHROMO.get(chromo)
        if trait == "species":
            spm = re.search(r'BeeSpecies\.(\w+)\.getSpecies', rhs)
            if spm: spec = spm.group(1)
            continue
        am = re.search(r'getBaseAllele\("(\w+)"\)', rhs)
        if not am: continue
        overrides.append((trait, mb_token(trait, am.group(1))))
    methods[mname] = (base, overrides, spec)

def resolve_mb(mname, seen=None):
    """Return ordered list of layers (dict trait->(kind,raw))."""
    if seen is None: seen = set()
    if mname in seen or mname not in methods:
        return []
    seen.add(mname)
    base, overrides, spec = methods[mname]
    layers = []
    if base:
        layers.extend(resolve_mb(base, seen))
    od = {}
    for trait,(kind,raw) in overrides:
        od[trait] = (kind, raw)
    layers.append(od)
    return layers

# map species enum -> template method via setupBeeSpecies registrations
mb_spec_src = open(MB_SPEC, encoding="utf-8").read()
reg = {}
for m in re.finditer(r'(\w+)\.registerGenomeTemplate\(BeeGenomeManager\.(getTempla\w+)\(\)\)', mb_spec_src):
    reg[m.group(1)] = m.group(2)
# enum -> speciesName(constructor first arg) to derive lang key
enum_specname = {}
for m in re.finditer(r'\n    ([A-Z][A-Z0-9_]*)\("([^"]+)"', mb_spec_src):
    enum_specname[m.group(1)] = m.group(2)

for enum, method in reg.items():
    specname = enum_specname.get(enum)
    if not specname:
        continue
    disp = LMB.get("magicbees.species" + specname, specname)
    layers = resolve_mb(method)
    g = build_genome(layers, disp, "MagicBees")
    species_out.append({"en": disp, "mod": "MagicBees", "_enum": enum, "genome": g})

# ----------------------------------------------------------------- whitelist match
i18n = json.load(open(I18N, encoding="utf-8"))
wl = i18n["species"]
wl_en = {s["en"] for s in wl}

def camel(enum):
    return "".join(p.capitalize() for p in enum.split("_"))

def candidates(s):
    """Whitelist-en candidates for this species, most-specific first."""
    e = s["_enum"]
    out = []
    if e.startswith("BOT_"):
        out.append(camel(e[4:]))            # BOT_VAZBEE -> Vazbee
    cm = camel(e)                           # AM_ARCANE -> AmArcane (placeholder)
    if cm in wl_en:
        out.append(cm)
    if s["en"] in wl_en:                    # official display name
        out.append(s["en"])
    # de-dup, keep only wl members
    seen=set(); res=[]
    for c in out:
        if c in wl_en and c not in seen:
            seen.add(c); res.append(c)
    return res

# greedy assignment: species with fewest candidates first, so unambiguous ones lock in
matched_keys = set()
order = sorted(species_out, key=lambda s: len(candidates(s)))
for s in order:
    for c in candidates(s):
        if c not in matched_keys:
            s["whitelistEn"] = c
            matched_keys.add(c)
            break

extracted_en = {s["en"] for s in species_out}
matched = sorted(matched_keys)
extracted_not_wl = sorted(s["en"] for s in species_out if "whitelistEn" not in s)
wl_not_extracted = sorted(wl_en - matched_keys)

# full-genome count (all 13 traits present)
full = sum(1 for s in species_out if len(s["genome"]) == 13)

# ----------------------------------------------------------------- emit
clean = []
for s in species_out:
    o = {"en": s["en"], "mod": s["mod"]}
    if "whitelistEn" in s and s["whitelistEn"] != s["en"]:
        o["whitelistEn"] = s["whitelistEn"]
    o["genome"] = s["genome"]
    clean.append(o)
species_out = clean
species_out.sort(key=lambda s:(s["mod"], s["en"]))

meta = {
    "server": "LoliLand",
    "source": "decompiled (CFR 0.152): forestry-4.2.16.64, binnie-mods-2.0.22.7 (extrabees), magicbees-2.4.4; lang from same JARs",
    "generated": "2026-06-06",
    "model": "genome = defaultTemplate -> branch overrides -> species overrides (Forestry/ExtraBees); modBase -> base-chain -> species (MagicBees)",
    "counts": {
        "extracted": len(species_out),
        "fullGenome13": full,
        "whitelistTotal": len(wl_en),
        "matchedWhitelist": len(matched),
    },
    "coverageGaps": sorted(set(gaps)),
    "nonCanonicalAlleles": {k: sorted(v) for k,v in sorted(noncanon.items())},
    "whitelistNotExtracted": wl_not_extracted,
    "extractedNotInWhitelist": extracted_not_wl,
}
out = {"_meta": meta, "species": species_out}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
print("extracted:", len(species_out), "| full13:", full,
      "| matched WL:", len(matched), "/", len(wl_en))
print("WL not extracted:", len(wl_not_extracted))
print("extracted not in WL:", len(extracted_not_wl))
print("gap lines:", len(set(gaps)), "| noncanon traits:", {k:len(v) for k,v in noncanon.items()})
