// Package genuine browser screenshots into one portable, dependency-free gallery.
// JPEG encoding only: no drawing/retouching of the captured app content.
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const root='.arena/item-visual-review',out='docs/item-visual-review';mkdirSync(out,{recursive:true});
const before=JSON.parse(readFileSync(`${root}/before/results.json`)),after=JSON.parse(readFileSync(`${root}/after/results.json`)),echo=JSON.parse(readFileSync(`${root}/after-echo-final/results.json`)).items[0];
after.items=after.items.map(i=>i.id==='dash-echo'?echo:i);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const embed=async path=>{const im=await loadImage(path),cv=createCanvas(im.width,im.height);cv.getContext('2d').drawImage(im,0,0);return 'data:image/jpeg;base64,'+cv.toBuffer('image/jpeg',88).toString('base64');};
const notes={
 none:['Baseline','Baseline character and text; no special power action expected.'],
 halo:['Diagram','Falling dots show the lighter fall. Character itself stays posed.'],
 neko:['Diagram','Combo grace is shown by two bars; weak as a character animation.'],
 viper:['Diagram','Speed/width comparison uses bars, not a moving attack.'],
 oni:['Diagram','Health and score text change; the reward is readable but mostly static.'],
 ninja:['Baseline','Baseline eyes; minimal visual change is intentional.'],
 visor:['Subtle','Small lights on visor change; easy to miss without enlargement.'],
 blaze:['Subtle','Eye cuts change slightly. Refill benefit is described more than demonstrated.'],
 paper:['Baseline','Base health is displayed. No special triggered power shown.'],
 obsidian:['Diagram','Score bonus is text beside a static body. Needs an action example.'],
 hologram:['Subtle','Needle moves through the shell; phase hardware is visible but understated.'],
 standard:['Baseline','Base health and Edge values, intentionally not a proc animation.'],
 time:['Diagram','Recovery bars move while the character stays static.'],
 riot:['Diagram','Kill counters and Overdrive text change; action is mostly implied.'],
 glass:['Diagram','Health tradeoff and doubled score appear as changing numbers.'],
 ribbon:['Baseline','Cloth baseline, not an extra force or combat proc.'],
 wings:['Subtle','Wing pose/hardware changes after the first wall event; little motion.'],
 ghost:['Subtle','Scarf brightens slightly. Longer cut duration is not obvious visually.'],
 crown:['Diagram','Armor plates cross out; useful explanation, not a full attack scene.'],
 samurai:['Diagram','Wider cutting lane is a bar comparison, not a character sweep.'],
 coil:['Diagram','A visible zigzag joins two enemies after a cut. Character remains posed.'],
 beacon:['Diagram','Warning brackets appear around the Fang; useful but small.'],
 glitch:['Subtle','Eye conductors shift slightly; recovery benefit is mostly text.'],
 smug:['Subtle','Eyes visibly turn gold; combo extension is still mainly explained in copy.'],
 hypno:['Subtle','Eye spirals change; the affected enemy is absent from the main illustration.'],
 sniper:['Diagram','Armor plates cross out after the precise hit; fairly readable comparison.'],
 prism:['Subtle','Wall hardpoints change state; needles are brief and not resolved by these three frames.'],
 iron:['Subtle','Guard latch visibly changes from ready to spent; no large impact animation.'],
 lava:['Diagram','Combo bars/links change. Character motion does not show the benefit.'],
 gold:['Diagram','Score bonus remains prominent static text; no score event animation.'],
 grav:['Diagram','An enemy moves toward the aim line, but only in a small diagram.'],
 magnet:['Diagram','Close-pass width benefit is another bar comparison.'],
 echo:['Diagram','A stationary blade appears after three kill counters; small action area.'],
 'viper-tails':['Subtle','Tail folds shift; steering preservation is not visually demonstrated.'],
 anchor:['Subtle','Chain and weight move slightly. Floor-kick strength remains textual.'],
 thrusters:['Clear','Jets visibly switch on and off in the sampled sequence.'],
 spectrum:['Subtle','Small tail hardware/counter changes; earned Edge needs stronger action feedback.'],
 chamfer:['Diagram','Armor shove contact and numbers are visible; the actor barely moves.'],
 notched:['Diagram','Vents open, recovery bars fill, then vents close. Mostly a comparison chart.'],
 segmented:['Diagram','Spring return is described with state and speed readouts, little displacement.'],
 'dash-auto':['Clear','Launch changes character position. The held reference now retains its effect.'],
 'dash-ink':['Diagram','Launch is visible, but width advantage is still a bar comparison.'],
 'dash-fire':['Diagram','Fire-hit aftermath is visible, but tiny actors and dense timing text weaken it.'],
 'dash-lightning':['Diagram','Accepted arc is visible, but tiny hero and speed/width charts dominate. Card motion and travel-dependent rear rails were repaired.'],
 'dash-ice':['Diagram','Frozen collar, thaw state and timer are visible. Still a dense miniature lesson.'],
 'dash-water':['Diagram','Launch is visible. Recovery benefit remains a chart rather than a clear character event.'],
 'dash-void':['Diagram','Outer pull ring and smaller striking core visibly differ; text-heavy miniature scene.'],
 'dash-echo':['Clear','Travel, old path and replay are visible. Late enemy now stays within panel. Scene is still dense at mobile size.'],
 'pointer-reticle':['Baseline','Aiming-origin reference, not an attack or target lock.'],
 'pointer-diamond':['Subtle','Pointer expands slightly; extra cutting time is barely visible in the bars.'],
 'pointer-orbit':['Diagram','Pointer changes slightly and focus recovery bars fill.'],
 'pointer-cross':['Diagram','Pointer expands slightly; reduced aim cost is represented by bars.'],
 'radar-base':['Baseline','Map reference with no extra sensor upgrade; mostly static.'],
 'radar-1':['Diagram','Extra map contact/range appears; movement is not the selling point.'],
 'radar-2':['Diagram','Hazards appear as tiny dots/marks; range comparison remains chart-based.'],
 'radar-3':['Diagram','Hazard and heading marks appear, but fine details are small.'],
 'trajectory-base':['Clear','The short visible flight path grows across sampled frames.'],
 'trajectory-1':['Clear','A longer flight path visibly grows.'],
 'trajectory-2':['Clear','Path grows and a first-wall marker appears.'],
 'trajectory-3':['Clear','Path grows with first-wall marker and a compact flight readout.'],
};
function note(i){if(notes[i.id])return notes[i.id];if(i.slot==='slash')return ['Clear','Visible sweep and split target. Variants mostly share choreography with color/shape differences.'];if(i.slot==='world')return ['Clear','Scenery visibly travels; this is a cosmetic tour, not new arena geometry.'];return ['Needs review','No specific visual conclusion recorded.'];}
let cards='';const audit=[];
for(const [n,item]of after.items.entries()){
 const [status,observation]=note(item),old=before.items.find(i=>i.id===item.id),dir=item.id==='dash-echo'?'after-echo-final':'after';
 audit.push({id:item.id,name:item.name,status,observation,slot:item.slot,mode:item.mode});
 const frames=async(row,folder)=>{let s='';for(const f of row.stages)s+=`<figure><img loading="lazy" src="${await embed(`${root}/${folder}/${f.file}`)}" alt="${escape(row.name)} at ${f.at} milliseconds"><figcaption>${f.at/1000} seconds</figcaption></figure>`;return s;};
 cards+=`<article data-search="${escape(`${item.name} ${item.id} ${item.slot} ${status}`.toLowerCase())}"><h2>${n+1}. ${escape(item.name)} <small>${escape(item.slot)} · ${status}</small></h2><p>${escape(observation)}</p><div class="frames">${await frames(item,dir)}</div><details><summary>Earlier capture — before these visibility fixes</summary><div class="frames">${await frames(old,'before')}</div><details><summary>Earlier full shop view</summary><img loading="lazy" class="full" src="${await embed(`${root}/before/screenshots/${item.id}-full.png`)}" alt="Earlier full shop view for ${escape(item.name)}"></details></details><details><summary>Full shop screenshot after fixes</summary><img loading="lazy" class="full" src="${await embed(`${root}/${dir}/screenshots/${item.id}-full.png`)}" alt="Full shop view for ${escape(item.name)}"></details></article>`;
}
let extra='';for(const file of readdirSync(`${root}/interaction`).filter(f=>f.endsWith('-full.png')||f.startsWith('card-'))){extra+=`<details><summary>${escape(file)}</summary><img loading="lazy" class="full" src="${await embed(`${root}/interaction/${file}`)}" alt="${escape(file)}"></details>`;}
const counts=Object.fromEntries(['Baseline','Subtle','Diagram','Clear','Needs review'].map(s=>[s,audit.filter(i=>i.status===s).length]));
writeFileSync(`${out}/manifest.json`,JSON.stringify({method:'Genuine Chromium screenshots of a fresh production build. Before: direct item links. After: normal Shop/category/slot/item clicks. All73 items at600/1800/4100ms. Echo alone recaptured after final clipping correction. Gallery embeds JPEG copies of screenshots, not redrawn assets. Reviewer categories are subjective, not pixel-delta scores.',counts,audit,before,after,interaction:JSON.parse(readFileSync(`${root}/interaction/results.json`))},null,2));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SPLATR — actual item screenshot review</title><style>*{box-sizing:border-box}body{margin:0;background:#101f29;color:#e9eedc;font:16px/1.55 system-ui,sans-serif}main{max-width:1380px;margin:auto;padding:24px}h1{font-size:clamp(28px,4vw,50px);line-height:1.1}h2{font-size:23px}h2 small{display:block;color:#b8cdcf;font:14px system-ui}p{max-width:1000px}header,article,.findings{border:1px solid #47606a;background:#142b35;padding:20px;margin-bottom:24px;border-radius:8px}.frames{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}figure{margin:0}img{display:block;width:100%;height:auto;border:1px solid #52707b}figcaption{color:#bdc9bc;font-size:13px}details{margin-top:14px}summary{cursor:pointer;color:#cfe5a4;padding:8px}input{position:sticky;top:8px;z-index:3;width:100%;padding:14px;margin:0 0 20px;background:#e5ead9;color:#152b35;border:2px solid #9fbc8b;border-radius:6px;font:inherit}.full{max-width:1100px;margin:10px auto}li{margin:8px 0}.warning{color:#ffd292}a{color:#d4ebac}@media(max-width:800px){.frames{grid-template-columns:1fr}main{padding:12px}}@media print{input,details{display:none}body,header,article{background:white;color:black}article{break-inside:avoid}h2 small,figcaption{color:#333}.frames{grid-template-columns:repeat(3,minmax(0,1fr))}}</style><main><header><p>SPLATR / SCREENSHOT-DRIVEN REVIEW</p><h1>See what is actually visible.</h1><p>73 items. Three timed frames each, before and after. <b>438 item screenshots +146 full shop screenshots</b>, with an additional48 viewport/reduced-motion screenshots and8 card frames below. These are captures of the running production app, not generated art or hand-redrawn previews.</p><p class="warning"><b>Not an all-items visual pass.</b> The screenshots support your complaint: many previews are diagrams or tiny state changes rather than substantial character animation.</p><p>Reviewer categories: ${Object.entries(counts).filter(([,n])=>n).map(([s,n])=>`${n} ${s.toLowerCase()}`).join(' · ')}. “Clear” only means the sampled action is readily visible; it does not certify a massive upgrade or live-game quality.</p></header><section class="findings"><h2>Fixed from observed evidence</h2><ul><li>Restored actual redraws for visible selected/hovered catalogue cards; previously they stayed on the initial baked frame.</li><li>Normal shell browsing now shows its ability rather than silently defaulting to assembly. Explicit Assembly inspection remains available.</li><li>Dash preview now passes measured travel, restoring travel-based rear rails. Its labelled held reference retains an active effect instead of failing the effect's age/speed gates.</li><li>Echo's late-arriving target no longer starts below its panel. Its safe area labels were repositioned.</li></ul><h2>Still weak</h2><p>Many head/core benefits are bars rather than moving power demonstrations. Eye/tail hardware changes are often too subtle. Ember and Volt have small actors, dense labels and too much chart space. These remain flagged item by item below—not passed on the strength of test counts.</p><h2>How this was checked</h2><p>Fresh production build, Chromium,1440×1000, screenshots at0.6/1.8/4.1seconds. After captures use ordinary Shop → category → slot → item clicks. Both animation clocks advance together. All30 before/after contact sheets were visually inspected; Echo was then recaptured and inspected after its final correction. Extra checks cover390×844 portrait,844×390 landscape, desktop, reduced motion, real card redraw, pause, explicit assembly and unchanged purchases/equipment.</p><p><b>Limits:</b> Three frames are samples, not proof of every event in a loop. Main captures are shop illustrations, not live gameplay. Baselines need not invent new powers to animate. Browser emulation is not a real-device performance test.</p><p><b>Validation:</b>1,402 tests passed;12 ordinary-click viewport/motion regression cases passed. Normal production build passed. Test success is not used as an aesthetic score.</p></section><label for="find">Find an item or category</label><input id="find" placeholder="Try: Volt, Echo, subtle, diagram, world…"><div id="items">${cards}</div><section><h2>Actual mobile, landscape, reduced-motion and card captures</h2>${extra}</section></main><script>document.querySelector('#find').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();for(const a of document.querySelectorAll('article'))a.hidden=!a.dataset.search.includes(q);});</script></html>`;
writeFileSync(`${out}/index.html`,html);writeFileSync(`${out}/item-observations.md`,'# Actual item visual review\n\nThese are subjective observations from real production-browser screenshots, not automatic pixel-change grades.\n\n| Item | Assessment | Observation |\n|---|---|---|\n'+audit.map(i=>`| ${i.name} (${i.id}) | ${i.status} | ${i.observation} |`).join('\n')+'\n');
console.log('Packaged portable gallery:',(Buffer.byteLength(html)/1024/1024).toFixed(1),'MiB',counts);
