// Генерация бренд-растров через playwright:
//   npm run gen:brand
// Вход:  public/favicon.svg (марка), scripts/og/catalyst-star.png (звезда катализатора)
// catalyst-star.png — иконка предмета Infinity Catalyst из мода Avaritia,
//   фон срезан по альфе (порог 55 → прозрачный). gitignored; пере-получить из ассетов мода.
// Выход: public/apple-touch-icon.png (180×180), public/og-cover.png (1200×630)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const faviconSvg = readFileSync('public/favicon.svg', 'utf8')
const starB64 = readFileSync('scripts/og/catalyst-star.png').toString('base64')
const starUri = `data:image/png;base64,${starB64}`

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

// --- apple-touch-icon 180×180 (марка во весь тайл) ---
await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0} html,body{width:180px;height:180px;background:#0c1410}
    svg{width:180px;height:180px;display:block}
  </style></head><body>${faviconSvg}</body></html>`,
)
await page.locator('svg').screenshot({ path: 'public/apple-touch-icon.png' })
console.log('✓ public/apple-touch-icon.png')

// --- og-cover 1200×630 (вариант D: герой-плитка + звезда в теге Avaritia) ---
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(`<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&family=Manrope:wght@600;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  .og{width:1200px;height:630px;position:relative;overflow:hidden;color:#e8f0e6;
      background:radial-gradient(115% 140% at 80% 18%,#16261b 0%,#0c1410 56%,#0a0f0c 100%);font-family:'Manrope',sans-serif}
  .graph{position:absolute;inset:0;opacity:.16}
  .b{display:grid;grid-template-columns:1.1fr .9fr;height:100%;align-items:center;position:relative;z-index:1}
  .text{padding:0 0 0 88px;display:flex;flex-direction:column;gap:26px}
  h1{font:800 80px 'Unbounded',sans-serif;line-height:.98;letter-spacing:-.015em}
  .grad{background:linear-gradient(92deg,#ff6b9d,#ffd36b 35%,#7be08a 60%,#6bc5ff 85%);-webkit-background-clip:text;background-clip:text;color:transparent}
  .sub{font:600 31px 'Manrope';color:#c2d6b6;max-width:540px}
  .tags{display:flex;gap:13px;margin-top:6px;align-items:center;flex-wrap:wrap;max-width:560px}
  .tag{font:700 21px 'JetBrains Mono',monospace;padding:9px 18px;border-radius:999px;border:1.6px solid rgba(143,209,79,.42);color:#bcd3b0;display:flex;align-items:center;gap:9px}
  .tag.honey{border-color:rgba(232,167,44,.5);color:#f0b54a}
  .tag.cyan{border-color:rgba(79,214,223,.55);color:#4fd6df}
  .tag.cosmo{border-color:rgba(180,150,255,.55);color:#cdb6ff;padding-left:11px}
  .tag.cosmo img{width:30px;height:30px;margin:-4px 0}
  .art{display:flex;align-items:center;justify-content:center;position:relative;padding-right:72px}
  .art .glow{position:absolute;width:420px;height:420px;border-radius:50%;
             background:radial-gradient(circle,rgba(143,209,79,.16),rgba(232,167,44,.08) 45%,transparent 68%)}
  .tile{width:320px;height:320px;filter:drop-shadow(0 18px 44px rgba(0,0,0,.6));position:relative}
  .tile svg{width:100%;height:100%}
</style></head><body>
<div class="og" id="og">
  <svg class="graph" viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice" id="g"></svg>
  <div class="b">
    <div class="text">
      <h1>Катализатор<br><span class="grad">бесконечности</span></h1>
      <div class="sub">Роадмап Forestry — пчёлы, деревья и генетика</div>
      <div class="tags">
        <span class="tag">🌳 деревья</span>
        <span class="tag honey">🐝 пчёлы</span>
        <span class="tag cyan">🔬 генетика</span>
        <span class="tag cosmo"><img src="${starUri}" alt=""> Avaritia</span>
      </div>
    </div>
    <div class="art"><div class="glow"></div><div class="tile">${faviconSvg}</div></div>
  </div>
</div>
<script>
  const palette=['#ff6b9d','#ffd36b','#7be08a','#6bc5ff','#cdb6ff','#8fd14f','#e8a72c'];
  let s=19; const rnd=()=>{s=(s*9301+49297)%233280;return s/233280};
  const nodes=[]; for(let i=0;i<26;i++)nodes.push({x:40+rnd()*1120,y:30+rnd()*570,r:5+rnd()*9,c:palette[Math.floor(rnd()*palette.length)]});
  let h=''; for(let i=0;i<nodes.length;i++){const a=nodes[i],b=nodes[(i+3)%nodes.length];h+=\`<line x1="\${a.x}" y1="\${a.y}" x2="\${b.x}" y2="\${b.y}" stroke="#8fd14f" stroke-width="1.4"/>\`}
  for(const n of nodes)h+=\`<circle cx="\${n.x}" cy="\${n.y}" r="\${n.r}" fill="\${n.c}"/>\`;
  document.getElementById('g').innerHTML=h;
</script>
</body></html>`)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)
await page.locator('#og').screenshot({ path: 'public/og-cover.png' })
console.log('✓ public/og-cover.png')

await browser.close()
