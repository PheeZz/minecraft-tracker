# -*- coding: utf-8 -*-
"""Thaumcraft recipe extractor (crucible / arcane / infusion / enchantment).

Parses ThaumcraftApi.add*Recipe(...) calls across Thaumcraft core + addons,
resolving item refs to display names (EN/RU) via item-names.json where possible,
and capturing aspect costs (the high-value data) + research links + instability.
Output: thaumcraft/data-src/recipes.json
"""
import re, json, os, glob, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC = r"C:\Users\pheezz\Desktop\pricoli-jar"
OUT = os.path.join(PROJ, "thaumcraft", "data-src", "recipes.json")

DECDIRS = ["decompTC","decompMB2","decompFM","decompTM","decompTT","decompAE2","decompBA","decompAV","decompAL"]

# ---- item-name lang (from generated item-names.json) : lang-key -> {en,ru}
names = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","item-names.json"),encoding="utf-8"))
NAME = {i["key"]: i for i in names["items"]}
# ---- vanilla SRG field -> {reg,name_en,name_ru}
VANILLA = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","vanilla-names.json"),encoding="utf-8"))["fields"]
REG2NAME = {v["reg"]: v for v in VANILLA.values()}   # vanilla registry id -> names (for MCTags)
# ---- mod field name -> {name_en,name_ru}
FIELDNAMES = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","field-names.json"),encoding="utf-8"))["fields"]

def clean_name(s):
    if not s: return s
    s = re.sub(r'§[0-9A-Fa-fk-orK-OR]', '', s)
    s = re.sub(r'§.', '', s)
    s = s.replace("%s", "[mob]").replace("%d", "[number]")
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()

# ThaumCraftResources.<field> -> unlocalized lang key (e.g. nuggetIron -> item.ItemNugget.0.name)
TCR_UNLOC = {}
_tcr = os.path.join(DEC, "decompTC", "com", "gamerforea", "thaumcraft", "resource", "ThaumCraftResources.java")
if os.path.exists(_tcr):
    _t = open(_tcr, encoding="utf-8", errors="replace").read()
    for m in re.finditer(r'Resource (\w+)\s*=\s*Resource\.of\([^;]*?setUnlocalizedName\("([^"]+)"\)', _t):
        TCR_UNLOC[m.group(1)] = m.group(2)

# ---------------------------------------------------------------------------
# AE2 / Thaumic Energistics fluent-API method  ->  AE2 lang key (resolved via
# item-names.json mod=AppliedEnergistics2). The AE2 integration builds recipes
# with AEApi.instance().definitions().<group>().<method>().maybeStack(..).get()
# and via local IMaterials/IItems/IBlocks/IParts vars (iMaterials/iDefinitions);
# the trailing method name uniquely identifies the item.
AE2_METHOD_KEY = {
    # IMaterials
    "coalescenceCore":       "item.appliedenergistics2.ItemMaterial.CoalescenceCore.name",
    "diffusionCore":         "item.appliedenergistics2.ItemMaterial.DiffusionCore.name",
    "aspectCell1kPart":      "item.appliedenergistics2.ItemMaterial.AspectCell1kPart.name",
    "aspectCell4kPart":      "item.appliedenergistics2.ItemMaterial.AspectCell4kPart.name",
    "aspectCell16kPart":     "item.appliedenergistics2.ItemMaterial.AspectCell16kPart.name",
    "aspectCell64kPart":     "item.appliedenergistics2.ItemMaterial.AspectCell64kPart.name",
    # IItems
    "knowledgeCore":         "item.appliedenergistics2.ItemKnowledgeCore.name",
    # IParts
    "arcaneCraftingTerminal":"item.appliedenergistics2.ItemPart.ArcaneCraftingTerminal.name",
    "visInterface":          "item.appliedenergistics2.ItemPart.VisInterface.name",
    # IBlocks
    "knowledgeInscriber":    "tile.appliedenergistics2.BlockKnowledgeInscriber.name",
    "arcaneAssembler":       "tile.appliedenergistics2.BlockArcaneAssembler.name",
    "infusionProvider":      "tile.appliedenergistics2.BlockInfusionProvider.name",
    "distillationEncoder":   "tile.appliedenergistics2.BlockDistillationEncoder.name",
}

# ---------------------------------------------------------------------------
# AE2 ThE integration "commonDependantItems.<field>" -> resolved component.
# Source: CommonDependantItems.java (populateAEItems/populateTCItems). Only the
# fields actually referenced by recipes are mapped; each is either an AE2 item
# (method key above) or a Thaumcraft item (ConfigItems field + meta).
CDI = {
    # AE2 blocks / materials / parts
    "MolecularAssembler": {"key": "tile.appliedenergistics2.BlockMolecularAssembler.name"},
    "MEInterface":        {"key": "tile.appliedenergistics2.BlockInterface.name"},
    "FormationCore":      {"key": "item.appliedenergistics2.ItemMaterial.FormationCore.name"},
    "AnnihilationCore":   {"key": "item.appliedenergistics2.ItemMaterial.AnnihilationCore.name"},
    "MEP2P":              {"key": "item.appliedenergistics2.ItemPart.P2PTunnel.name"},  # p2PTunnelME()
    # Thaumcraft itemShard subtypes (ItemShard.<meta>.name) + Quicksilver Drop nugget
    "QuickSilverDrop":    {"tc": ("itemNugget", 5)},
    "AirShard":           {"tc": ("itemShard", 0)},
    "FireShard":          {"tc": ("itemShard", 1)},
    "WaterShard":         {"tc": ("itemShard", 2)},
    "EarthShard":         {"tc": ("itemShard", 3)},
    "OrderShard":         {"tc": ("itemShard", 4)},
    "EntropyShard":       {"tc": ("itemShard", 5)},
    "BallanceShard":      {"tc": ("itemShard", 6)},
}

# ---------------------------------------------------------------------------
# MagicBees resource/propolis enum -> bare lang key (resource.<n> / propolis.<n>),
# resolved straight from the magicbees lang files (these keys are not item.* /
# tile.* so they are not in item-names.json). Maps come from ResourceType.java
# and PropolisType.java (enum const -> internal name).
MB_RESOURCE = {
    "LORE_FRAGMENT":"fragment","AROMATIC_LUMP":"lump","EXTENDED_FERTILIZER":"fertilizer",
    "SKULL_CHIP":"skullChip","SKULL_FRAGMENT":"skullFragment","DRAGON_DUST":"dragonDust",
    "DRAGON_CHUNK":"dragonChunk","ESSENCE_FALSE_LIFE":"essenceLife",
    "ESSENCE_SHALLOW_GRAVE":"essenceDeath","ESSENCE_LOST_TIME":"essenceTime",
    "ESSENCE_EVERLASTING_DURABILITY":"essenceDurability",
    "ESSENCE_SCORNFUL_OBLIVION":"essenceOblivion","ESSENCE_FICKLE_PERMANENCE":"essenceMutable",
    "DIMENSIONAL_SINGULARITY":"dimensionalSingularity",
    "TC_DUST_AIR":"TCairDust","TC_DUST_WATER":"TCwaterDust","TC_DUST_FIRE":"TCfireDust",
    "TC_DUST_EARTH":"TCearthDust","TC_DUST_ORDER":"TCorderDust","TC_DUST_CHAOS":"TCchaosDust",
}
MB_PROPOLIS = {"UNSTABLE":"unstable","AIR":"air","FIRE":"fire","WATER":"water",
               "EARTH":"earth","ORDER":"dull","CHAOS":"magic"}

def _load_lang(path):
    d = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8", errors="replace"):
            if "=" in line and not line.lstrip().startswith("#"):
                k, _, v = line.partition("="); d[k.strip()] = v.rstrip("\n")
    return d
_MB_DIR = os.path.join(PROJ, "thaumcraft", "_assets", "lang_addons", "magicbees")
MB_EN = _load_lang(os.path.join(_MB_DIR, "en_US.lang"))
MB_RU = _load_lang(os.path.join(_MB_DIR, "ru_RU.lang"))

# aspect field -> tag
field_tag = {}
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "Aspect(" not in t: continue
        for m in re.finditer(r'(\w+)\s*=\s*new (?:Rainbow)?Aspect\("(\w+)"',t):
            field_tag.setdefault(m.group(1),m.group(2))

def name_bases(fld):
    bases = list(FIELDNAMES.get(fld, {}).get("bases", []))   # raw unloc/registry ids (e.g. WandRod)
    for b in (fld, fld[0].upper()+fld[1:] if fld else fld):
        if b not in bases: bases.append(b)
    for pre in ("item", "Item", "block", "Block"):           # itemWandRod -> WandRod
        if fld.startswith(pre) and len(fld) > len(pre):
            b = fld[len(pre):]
            if b not in bases: bases.append(b)
    return bases

def name_by_key(k):
    if k in NAME: return clean_name(NAME[k]["name_en"]), clean_name(NAME[k]["name_ru"])
    return None

def name_for(fld, meta):
    fn0 = FIELDNAMES.get(fld, {})
    if meta is not None and str(meta) in fn0.get("metas", {}):
        mm = fn0["metas"][str(meta)]; return clean_name(mm["name_en"]), clean_name(mm["name_ru"])
    bases = name_bases(fld)
    if meta is not None:
        for b in bases:
            for k in ("item.%s.%s.name"%(b,meta), "tile.%s.%s.name"%(b,meta)):
                if k in NAME: return clean_name(NAME[k]["name_en"]), clean_name(NAME[k]["name_ru"])
    for b in bases:
        for k in ("item.%s.name"%b, "tile.%s.name"%b):
            if k in NAME: return clean_name(NAME[k]["name_en"]), clean_name(NAME[k]["name_ru"])
    fn = FIELDNAMES.get(fld)
    if fn and "name_en" in fn: return clean_name(fn["name_en"]), clean_name(fn["name_ru"])
    return None

def meta_of(tok):
    mm = re.search(r'new ItemStack\([^,)]+,\s*\w+\s*,\s*(\d+)', tok)
    if mm: return int(mm.group(1))
    mm = re.search(r'get(?:Item|Block)\(\s*(?:\(String\)\s*)?"[^"]+"\s*,\s*(?:\(int\)\s*)?(\d+)', tok)  # ItemApi.getItem/getBlock("x", meta)
    return int(mm.group(1)) if mm else None

VARMAP = {}   # per-file: local ItemStack/Item var -> defining expression
_RAW_UNRESOLVED = []   # collected raw tokens for coverage reporting

def resolve_item(tok, _depth=0):
    tok = tok.strip()
    # strip leading casts: (Item)/(Block)/(ItemStack)/(Object)/(String)
    tok = re.sub(r'^\((?:Item|Block|ItemStack|Object|String)(?:\[\])?\)\s*', '', tok).strip()
    if tok.startswith('"'):
        return {"oredict": tok.strip('"')}
    # (Enchantment)X or Enchantment field refs -> typed, no bogus name
    m = re.match(r'\(Enchantment\)\s*([\w.]+)', tok)
    if m:
        return {"type": "enchantment", "ref": m.group(1)[:60]}

    # --- AE2 / Thaumic Energistics fluent API + iMaterials/iDefinitions vars ---
    # ...().<group>().<method>().maybeStack(n).get()  OR  iMaterials.<method>()...
    # Pick the LAST mapped method name appearing in the token.
    ae2 = None
    for mm in re.finditer(r'\.(\w+)\s*\(\s*\)', tok):
        if mm.group(1) in AE2_METHOD_KEY:
            ae2 = mm.group(1)
    if ae2:
        out = {"ref": ae2, "mod": "AppliedEnergistics2"}
        r = name_by_key(AE2_METHOD_KEY[ae2])
        if r: out["name_en"], out["name_ru"] = r
        return out
    # AE2 ThE commonDependantItems.<field>
    m = re.match(r'commonDependantItems\.(\w+)$', tok)
    if m and m.group(1) in CDI:
        spec = CDI[m.group(1)]; out = {"ref": m.group(1)}
        if "key" in spec:
            out["mod"] = "AppliedEnergistics2"
            r = name_by_key(spec["key"])
            if r: out["name_en"], out["name_ru"] = r
        else:
            fld, mt = spec["tc"]; out["mod"] = "Thaumcraft"; out["meta"] = mt
            r = name_for(fld, mt)
            if r: out["name_en"], out["name_ru"] = r
        return out

    # --- MagicBees Config.miscResources / Config.propolis .getStackForType(X) ---
    m = re.search(r'Config\.(miscResources|propolis)\.getStackForType\(\s*(?:\w+\.)?(\w+)\s*(?:,\s*[^)]+)?\)', tok)
    if m:
        kind, ev = m.group(1), m.group(2)
        nm = (MB_RESOURCE if kind == "miscResources" else MB_PROPOLIS).get(ev)
        lk = ("resource." if kind == "miscResources" else "propolis.") + nm if nm else None
        out = {"ref": ev, "mod": "MagicBees"}
        if lk and lk in MB_EN:
            out["name_en"] = clean_name(MB_EN[lk])
            if lk in MB_RU: out["name_ru"] = clean_name(MB_RU[lk])
        return out

    # --- Absent-mod references (recipes skipped at runtime, mod not installed) ---
    # Ars Magica 2 reflection: amItems/amBlocks.getField("X").get(null)
    m = re.search(r'am(?:Items|Blocks)\.getField\(\s*"([^"]+)"', tok)
    if m:
        return {"unavailable": True, "mod": "ArsMagica2", "ref": m.group(1)}
    # Botania blocks via GameRegistry.findBlock("Botania","X")
    m = re.search(r'GameRegistry\.findBlock\(\s*(?:\(String\)\s*)?"Botania"\s*,\s*(?:\(String\)\s*)?"([^"]+)"', tok)
    if m:
        return {"unavailable": True, "mod": "Botania", "ref": m.group(1)}
    # ForbiddenMagic flowers are Botania special-flowers (NBT subtype); the whole
    # flowerPowerHippymancy() block only registers when Botania is loaded.
    m = re.search(r'ForbiddenBotany\.getFlower\(\s*"([^"]+)"', tok)
    if m:
        return {"unavailable": True, "mod": "Botania", "ref": "specialFlower:" + m.group(1)}

    # --- BloodArsenal wand rod/cap/staff via Thaumcraft registry lookup ---
    # bloodRod/alchemicalCap/bloodStaff = (WandRod)WandRod.rods.get("blood") ...
    # The looked-up keys ("blood"/"alchemical") are not registered (BA registers
    # "blood_wood"), so .getItem() is a runtime registry value -> template.
    m = re.match(r'(bloodRod|alchemicalCap|bloodStaff)\.getItem\(\)$', tok)
    if m:
        return {"template": True, "expr": tok, "ref": m.group(1),
                "note": "Thaumcraft wand-part registry lookup (runtime)"}

    # --- Template / runtime placeholders (set by caller or at runtime) ---
    m = re.match(r'this\.(\w+)$', tok)
    if m:
        return {"template": True, "expr": tok}
    # OreDictionary.getOres(var) -> resolve var to the ore-dict name where known
    m = re.search(r'OreDictionary\.getOres\(\s*(?:\(String\)\s*)?(\w+)\s*\)', tok)
    if m:
        v = VARMAP.get(m.group(1), "")
        sm = re.fullmatch(r'"([^"]+)"', v.strip())
        if sm:
            return {"oredict": sm.group(1)}
        return {"template": True, "expr": "OreDictionary.getOres(%s)" % m.group(1)}
    # opaque array spreads passed by reference: (Object[])objectArray / itemStackArray etc.
    m = re.match(r'(?:\([\w\[\]]+\)\s*)?(\w*[aA]rray\w*)$', tok)
    if m:
        return {"template": True, "expr": tok}

    meta = meta_of(tok)
    # ThaumCraftResources.<field>.getStack(n) -> resolve via the field's unlocalized lang key
    m = re.search(r'ThaumCraftResources\.(\w+)(?:\.getStack\(\s*(\d+)\s*\))?', tok)
    if m:
        fld = m.group(1); cnt = int(m.group(2)) if m.group(2) else 1
        out = {"ref": fld, "count": cnt, "mod": "Thaumcraft"}
        unloc = TCR_UNLOC.get(fld)
        r = name_by_key(unloc) if unloc else None
        if not r: r = name_for(fld, meta)
        if r: out["name_en"], out["name_ru"] = r
        return out
    # enchantment array subscript: Enchantment.field_xxx[...] (or bare Enchantment.field_xxx) -> typed, no bogus name
    if re.match(r'(?:\w+\.)?Enchantment\.field_\w+(?:\[|$)', tok) or re.match(r'Enchantment\.field_\w+', tok):
        return {"type": "enchantment", "ref": tok[:60]}
    # new Object[]{"subtype", new NBTTag...} -> extract leading string subtype
    m = re.match(r'new Object\[\]\s*\{\s*"([^"]+)"', tok)
    if m:
        return {"subtype": m.group(1)}
    # MCTags: Tags.Items.QUARTZ / Tags.Blocks.OBSIDIAN -> vanilla registry id
    m = re.search(r'Tags\.(?:Items|Blocks)\.([A-Z0-9_]+)', tok)
    if m:
        reg = m.group(1).lower(); v = REG2NAME.get(reg)
        if v: return {"tag": m.group(1), "reg": reg, "name_en": clean_name(v["name_en"]), "name_ru": clean_name(v["name_ru"])}
        return {"tag": m.group(1)}
    # ItemApi.getItem/getBlock("name"[, meta]) -> resolve by field/unloc name
    m = re.search(r'get(?:Item|Block)\(\s*(?:\(String\)\s*)?"([^"]+)"', tok)
    if m:
        fld = m.group(1); out = {"ref": fld, "meta": meta}
        r = name_for(fld, meta)
        if r: out["name_en"], out["name_ru"] = r
        return out
    m = re.search(r'(?:ConfigItems|ConfigBlocks)\.(\w+)', tok)
    if m:
        fld = m.group(1); out = {"ref": fld, "meta": meta}
        r = name_for(fld, meta)
        if r: out["name_en"], out["name_ru"] = r
        return out
    m = re.search(r'(?<![A-Za-z])(?:Items|Blocks)\.(\w+)', tok)
    if m:
        fld = m.group(1); v = VANILLA.get(fld)
        if v: return {"vanilla":fld,"reg":v["reg"],"name_en":clean_name(v["name_en"]),"name_ru":clean_name(v["name_ru"])}
        return {"vanilla": fld}
    m = re.search(r'new ItemStack\(\s*\((?:Item|Block)\)\s*([\w.]+)|new ItemStack\(\s*([\w.]+)', tok)
    if m:
        ref = m.group(1) or m.group(2); fld = ref.split(".")[-1]; out = {"ref": ref, "meta": meta}
        r = name_for(fld, meta)
        if r: out["name_en"], out["name_ru"] = r
        if "name_en" in out: return out
        if ref in VARMAP and _depth < 4:        # ref was a local var holding an ItemStack
            return resolve_item(VARMAP[ref], _depth+1)
        return out
    # bare local variable (e.g. quartz, basicWand, itemStack)
    bare = re.fullmatch(r'[\w]+', tok)
    if bare and tok in VARMAP and _depth < 4:
        return resolve_item(VARMAP[tok], _depth+1)
    # <localVar>.makeStack()/.getStack() -> resolve the underlying var (e.g.
    # obsidianEntry.makeStack() where obsidianEntry = Tags.Blocks.OBSIDIAN.getPrimary().get())
    m = re.match(r'(\w+)\.(?:makeStack|getStack)\(\s*\d*\s*\)$', tok)
    if m and m.group(1) in VARMAP and _depth < 4:
        return resolve_item(VARMAP[m.group(1)], _depth+1)
    _RAW_UNRESOLVED.append(tok)
    print("  [warn] unresolved recipe component:", tok[:80])
    return {"raw": tok}

def build_varmap(text):
    vm = {}
    # local item/stack vars, plus ThaumcraftApi entry helpers (BlockEntry/ItemEntry)
    for m in re.finditer(r'\b(?:ItemStack|Item|Block|BlockEntry|ItemEntry|String)\s+(\w+)\s*=\s*([^;]+);', text):
        vm.setdefault(m.group(1), m.group(2).strip())
    return vm

def balanced(s,start):
    depth=0
    for i in range(start,len(s)):
        if s[i]=="(":depth+=1
        elif s[i]==")":
            depth-=1
            if depth==0:return s[start+1:i],i
    return None,-1
def split_top(s):
    out,depth,cur,instr,esc=[],0,"",False,False
    for ch in s:
        if instr:
            cur+=ch
            if esc:esc=False
            elif ch=="\\":esc=True
            elif ch=='"':instr=False
            continue
        if ch=='"':instr=True;cur+=ch;continue
        if ch in "([{":depth+=1
        elif ch in ")]}":depth-=1
        if ch=="," and depth==0:out.append(cur);cur=""
        else:cur+=ch
    if cur.strip():out.append(cur)
    return [x.strip() for x in out]

def parse_aspects(s):
    d={}; computed=False
    for m in re.finditer(r'\.(?:add|merge)\(\s*(?:\w+\.)?(\w+),\s*([^),]+)\)',s):
        tag=field_tag.get(m.group(1),m.group(1).lower())
        val=m.group(2).strip()
        if re.fullmatch(r'\d+',val): d[tag]=int(val)
        else: d[tag]=None; computed=True
    return d,computed

TYPES = {
    "addCrucibleRecipe":"crucible",
    "addArcaneCraftingRecipe":"arcane",
    "addShapelessArcaneCraftingRecipe":"arcane_shapeless",
    "addInfusionCraftingRecipe":"infusion",
    "addInfusionEnchantmentRecipe":"infusion_enchantment",
}
MODNAME = {"decompTC":"Thaumcraft","decompMB2":"MagicBees","decompFM":"ForbiddenMagic",
           "decompTM":"TaintedMagic","decompTT":"ThaumicTinkerer","decompAE2":"AppliedEnergistics2",
           "decompBA":"BloodArsenal","decompAV":"Avaritia","decompAL":"Alfheim"}

recipes=[]
for dec in DECDIRS:
    mod=MODNAME[dec]
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "Recipe(" not in t: continue
        globals()["VARMAP"]=build_varmap(t)
        for meth,rtype in TYPES.items():
            for m in re.finditer(r'ThaumcraftApi\.'+meth+r'\(',t):
                inner,end=balanced(t,m.end()-1)
                if end<0: continue
                args=split_top(inner)
                if len(args)<3: continue
                research=args[0].strip().strip('"')
                al_idx=next((i for i,a in enumerate(args) if "AspectList" in a),None)
                aspects,computed=({},False)
                if al_idx is not None:
                    aspects,computed=parse_aspects(args[al_idx])
                rec={"research":research,"type":rtype,"mod":mod}
                # output = first arg that is an item (usually arg1)
                out_idx=1 if rtype not in ("crucible",) else 1
                rec["output"]=resolve_item(args[1]) if len(args)>1 else None
                rec["aspects"]=aspects
                if computed: rec["aspectsComputed"]=True
                if rtype=="crucible" and len(args)>=3:
                    # addCrucibleRecipe(research, output, input, aspectList)
                    rec["input"]=resolve_item(args[2])
                if rtype in ("infusion","infusion_enchantment"):
                    # ...(research, output, instability:int, aspectList, central, components[])
                    if al_idx and al_idx>=3:
                        mm=re.search(r'-?\d+',args[al_idx-1]); rec["instability"]=int(mm.group()) if mm else None
                    if al_idx is not None and al_idx+1<len(args):
                        rec["central"]=resolve_item(args[al_idx+1])
                        comps=[]
                        for a in args[al_idx+2:]:
                            am=re.search(r'new ItemStack\[\]\s*\{(.*)\}\s*$', a, re.S)
                            parts=split_top(am.group(1)) if am else [a]
                            for part in parts:
                                if part.strip(): comps.append(resolve_item(part))
                        if comps: rec["components"]=comps
                elif rtype=="arcane":
                    # shaped: rows (1-3 short strings) then Character/ingredient pairs
                    spec=args[(al_idx+1):] if al_idx is not None else args[2:]
                    rows=[]; i=0
                    while i<len(spec) and re.fullmatch(r'"[A-Za-z0-9 ._]{1,3}"', spec[i].strip()):
                        rows.append(spec[i].strip().strip('"')); i+=1
                    key={}
                    while i<len(spec):
                        cm=re.search(r"Character\.valueOf\('(.)'\)|^'(.)'$", spec[i].strip())
                        if cm and i+1<len(spec):
                            ch=cm.group(1) or cm.group(2)
                            key[ch]=resolve_item(spec[i+1]); i+=2
                        else: i+=1
                    if rows: rec["shape"]=rows
                    if key: rec["key"]=key
                elif rtype=="arcane_shapeless":
                    # shapeless arcane: flat ingredient list (each top-level arg = one ingredient).
                    # The list may be passed as new Object[]{...} / new ItemStack[]{...}; expand it.
                    ins=[]
                    tail=args[(al_idx+1):] if al_idx is not None else args[2:]
                    flat=[]
                    for a in tail:
                        am=re.search(r'new (?:Object|ItemStack)\[\]\s*\{(.*)\}\s*$', a.strip(), re.S)
                        flat.extend(split_top(am.group(1)) if am else [a])
                    for a in flat:
                        a=a.strip()
                        if not a or a.startswith("Character") or re.fullmatch(r"'.'",a): continue
                        r=resolve_item(a)
                        if r not in ins: ins.append(r)
                    if ins: rec["inputs"]=ins
                recipes.append(rec)

# ---- item warp: addWarpToItem(itemstack, n)
warp_items=[]
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "addWarpToItem" not in t: continue
        for m in re.finditer(r'addWarpToItem\(\s*(?:\(ItemStack\)\s*)?(new ItemStack\([^;]*?\)|\w[\w.]*)\s*,\s*(?:\(int\)\s*)?(\d+)\s*\)',t):
            warp_items.append({"item":resolve_item(m.group(1)),"warp":int(m.group(2)),"mod":MODNAME[dec]})

# ---- infernal furnace smelting bonus + loot bags
smelting=[]; loot=[]
LOOTBAG={0:"common",1:"uncommon",2:"rare"}
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        for m in re.finditer(r'addSmeltingBonus\(\s*((?:new ItemStack\([^)]*\))|"[^"]+")\s*,\s*((?:new ItemStack\([^)]*\))|"[^"]+")',t):
            smelting.append({"input":resolve_item(m.group(1)),"output":resolve_item(m.group(2)),"mod":MODNAME[dec]})
        for m in re.finditer(r'addLootBagItem\(\s*(new ItemStack\([^)]*\))\s*,\s*(\d+)\s*((?:,\s*\d+\s*)*)\)',t):
            bags=[int(x) for x in re.findall(r'\d+',m.group(3))]
            loot.append({"item":resolve_item(m.group(1)),"weight":int(m.group(2)),
                         "rarities":[LOOTBAG.get(b,b) for b in bags],"mod":MODNAME[dec]})
import collections as _c
json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(smelting),
                    "notes":"Infernal Furnace bonus drops: smelting `input` (ore/item) yields a chance of bonus `output`."},
           "smeltingBonus":smelting},
          open(os.path.join(PROJ,"thaumcraft","data-src","smelting-bonus.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(loot),
                    "rarityLevels":LOOTBAG,
                    "notes":"Eldritch loot bag contents. weight = relative drop weight; rarities = which bag tiers (common/uncommon/rare) contain it."},
           "lootBags":loot},
          open(os.path.join(PROJ,"thaumcraft","data-src","loot-bags.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("smelting bonus:",len(smelting),"| loot bag items:",len(loot))

by_type=collections.Counter(r["type"] for r in recipes)
by_mod=collections.Counter(r["mod"] for r in recipes)
named=sum(1 for r in recipes if r.get("output",{}) and ("name_en" in (r["output"] or {})))
json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(recipes),
                    "byType":dict(by_type),"byMod":dict(by_mod),
                    "outputsNamed":named,"warpItems":len(warp_items),
                    "notes":"aspects = essentia/vis cost (null value = computed at runtime, see aspectsComputed). output/input/central/components/inputs/key resolved to EN/RU names where the item ref maps to a lang key; otherwise {ref,meta} or {vanilla:srgName} or {oredict}. research = linked research key. arcane has shape[] (grid rows) + key{char:ingredient}. infusion has instability + central + components[]. warpItems = sanity (warp) gained from holding/crafting items."},
           "recipes":recipes,"warpItems":warp_items},
          open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("recipes:",len(recipes),"| byType:",dict(by_type))
print("byMod:",dict(by_mod),"| outputs named:",named)
print("unresolved {raw} components:",len(_RAW_UNRESOLVED))
