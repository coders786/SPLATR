import {shopDemoFrame} from './shop-demo.js';
import {storyRole} from './equipment-stories.js';
import {prependIcon,iconNode} from './ui-icons.js';
import {readGesture} from './gesture.js';
import {swordProfile,SWORD_BUILDS} from './swords.js';
import {createSwordDesk} from './sword-desk.js';
import {powerReadout,buildReadout} from './power-readout.js';
import { mutationMatches, mutationTitle } from './hybrids.js';
import { ITEMS,SLOTS,loadEquipment,normalizeEquipment,randomEquipment,buyEquipment } from './equipment.js';
import { corePalette } from './harmony.js';
import {dashElement,drawShopDemo,drawShopCardArt,drawPreviewScene,evaluatePreviewPose,drawEquipmentStory} from './art/splatr-art-engine.js';
const drawLabCard=(ctx,width,height,equipment,slot,time=0,active=false,motion=true)=>drawShopCardArt(ctx,width,height,{equipment,slot,time,selected:active,motion});
const drawLabScene=(ctx,equipment,time,mode,scene,options)=>drawPreviewScene(ctx,{equipment,time,mode,state:scene.state,options});
import {createLabScene} from './lab-scene.js';
const choreography=(time,mode)=>evaluatePreviewPose(mode,time).pose;
import {labPoint,labPullTarget} from './lab-input.js';

export function createCustomize({storage,unlimited=false,wallet,ownedParts,purchase,resetInput,motion=()=>true,snap=()=>{}}){
 let state=loadEquipment(storage.get('equipment','{}')),slot='head',selected=state.equipped.head,action='slice',openedAt=0,forgeAt=-Infinity,fusionAt=-Infinity,lastMutation='',selectedPreset=0,hovered=null,frameNo=0,lastTime=0,accumulator=0;
 let activePointer=null,press=null,renderedEquipment=null,recipePreview=null,pendingBuild=null;
 let demoPlaying=true,demoStarted=0,demoHeld=0,demoKey='';let cards=[],codexCards=[];const scene=createLabScene(),cursor={x:0,y:0},gaze={x:0,y:0};
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;const glyph={'lab-exit':'back','codex-close':'back','destination-parts':'mix','randomize':'dice','power-info':'info','destination-discoveries':'guide','destination-sword':'practice'}[cls];if(glyph)prependIcon(b,glyph);return b;};
 const root=el('dialog','customize shape-lab');root.setAttribute('aria-label','Shop Armory');root.dataset.section='parts';
 root.innerHTML=`<header><div class="lab-brand"><small>LOADOUTS & CUSTOMIZATION</small><h2>SHOP</h2><p>ONE CORE. YOUR BLOODLINE. A THOUSAND SILHOUETTES.</p></div><div class="custom-wallet"></div></header><div class="custom-view-switch"></div><div class="custom-layout"><section class="custom-shop"><nav aria-label="Equipment slots"></nav><div class="custom-grid"></div><article class="custom-detail" aria-live="polite"></article></section><section class="custom-lab"><div class="custom-lab-label"><b>◈ LIVE BUILD</b><span>DRAG / RELEASE / REPEAT</span></div><canvas width="640" height="400" tabindex="0" role="application" aria-label="Playable build sandbox. Tap a dummy, or pull back and release forward. Space fires toward the dummy."></canvas><div class="equipped-pills" aria-label="Equipped slot connections"></div><div class="custom-actions" aria-label="Sandbox test mode"></div><div class="custom-presets"></div><button class="custom-hybrid" type="button"></button><p class="custom-note">No run progress or currency is earned in the lab.</p><button class="custom-recipes" type="button">◈ HYBRID RECIPES <span>BUILD LIBRARY →</span></button></section></div><footer><b class="inspection-tag">INSPECT</b><span class="inspection-divider" aria-hidden="true">•</span><span class="inspection-name"></span><span class="custom-status" role="status"></span><span class="core-signature"></span></footer>`;
 root.dataset.tools='off';
 const previewToggle=button('SHOW PRACTICE CONTROLS',()=>{const on=root.dataset.tools!=='on';root.dataset.tools=on?'on':'off';previewToggle.textContent=on?'HIDE PRACTICE CONTROLS':'SHOW PRACTICE CONTROLS';previewToggle.setAttribute('aria-expanded',String(on));},'shop-preview-toggle');previewToggle.setAttribute('aria-expanded','false');root.querySelector('.custom-lab>canvas').after(previewToggle);
 root.querySelector('.custom-lab-label').firstChild.textContent='SELECTED PART / LIVE DEMO';
 const demoControls=el('div','shop-demo-controls');
 const demoMode=el('select','shop-demo-mode');demoMode.setAttribute('aria-label','Preview type');demoMode.onchange=()=>{demoKey='';};for(const [value,label]of [['story','ITEM STORY'],['dash','ELEMENTAL DASH'],['slash','WEAPON SLASH'],['arrow','DRAG ARROW']]){const option=el('option','',label);option.value=value;demoMode.append(option);}
 const demoName=el('strong','shop-demo-name'),demoState=el('span','shop-demo-state','LOOPING DEMO');
 const demoPlay=button('PAUSE',()=>{const now=performance.now();if(demoPlaying)demoHeld=now-demoStarted;else demoStarted=now-demoHeld;demoPlaying=!demoPlaying;demoPlay.textContent=demoPlaying?'PAUSE':'PLAY';demoPlay.setAttribute('aria-pressed',String(demoPlaying));},'shop-demo-play');demoPlay.setAttribute('aria-label','Play or pause the selected item demonstration');demoPlay.setAttribute('aria-pressed','true');demoControls.append(demoMode,demoState,demoPlay);root.querySelector('.custom-lab-label').after(demoName);root.querySelector('.custom-lab>canvas').after(demoControls);
 root.querySelector('.custom-shop>nav').after(root.querySelector('.custom-detail'));
 document.body.append(root);
 const codex=el('dialog','mutation-codex');codex.setAttribute('aria-label','Build library');codex.innerHTML='<header><div><small>THE ALCHEMY ARCHIVE</small><h2>DISCOVERIES</h2><p>Mix to discover.</p></div></header><div class="codex-grid"></div>';
 codex.querySelector('header small').textContent='YOUR MUTATION JOURNAL';
 codex.querySelector('header').append(button('BACK',()=>codex.close(),'codex-close'));document.body.append(codex);
 const swordDesk=createSwordDesk({resetInput,motion});
 const destinations=el('div','shop-destinations');destinations.setAttribute('aria-label','Shop destinations');
 destinations.append(button('MIX PARTS',()=>{root.dataset.section='parts';root.dataset.pane='shop';recipePreview=null;render();},'destination-parts'),button('DISCOVERIES',()=>openCodex(),'destination-discoveries'),button('PRACTICE',()=>swordDesk.open(previewBuild(),state.equipped),'destination-sword'));root.querySelector('header').append(destinations);
 const mixIntro=el('p','mix-intro','MIX · TRY · EQUIP');mixIntro.prepend(iconNode('mix'));root.querySelector('.custom-shop').prepend(mixIntro);
 const discoveryNotice=el('p','mix-discovery');discoveryNotice.setAttribute('role','status');root.querySelector('.custom-lab-label').after(discoveryNotice);let lastDiscovery='';
 const powerSheet=el('dialog','power-sheet');powerSheet.setAttribute('aria-label','Power details');document.body.append(powerSheet);
 function showPower(it){const p=powerReadout(it);powerSheet.replaceChildren(el('small','',p.trigger),el('h2','',`${p.icon} ${p.title}`),el('h3','',it.name),el('p','power-sheet-chips',p.chips.join(' · ')),el('p','',it.detail),button('BACK',()=>powerSheet.close()));powerSheet.showModal();}
 powerSheet.addEventListener('keydown',e=>e.stopPropagation());powerSheet.addEventListener('keyup',e=>e.stopPropagation());
 const save=()=>{for(const h of mutationMatches(state.equipped))if(h.complete&&!state.discovered.includes(h.id)){state.discovered.push(h.id);lastDiscovery=h.title;}storage.set('equipment',JSON.stringify(state));};
 function sync(){for(const id of ownedParts())if(ITEMS.some(x=>x.id===id)&&!state.owned.includes(id))state.owned.push(id);save();}
 function previewBuild(){return normalizeEquipment(recipePreview?{...state.equipped,...recipePreview.parts}:{...state.equipped,[slot]:selected});}
 function status(text){root.querySelector('.custom-status').textContent='— '+text;}
 function inspect(){const it=ITEMS.find(x=>x.id===selected);root.querySelector('.inspection-name').textContent=it.name.toUpperCase();status(state.equipped[slot]===selected?'EQUIPPED':state.owned.includes(selected)?'OWNED · EQUIP TO USE':'PREVIEW · BUY, THEN EQUIP');}

 function snapTo(){forgeAt=performance.now();snap();const key=mutationMatches(previewBuild()).filter(h=>h.complete).map(h=>h.id).join('|');if(key&&key!==lastMutation)fusionAt=forgeAt;lastMutation=key;}
 root.querySelector('header').append(button('BACK',()=>root.close(),'lab-exit'));
 const view=root.querySelector('.custom-view-switch');view.append(button('SHOP',()=>root.dataset.pane='shop'),button('PREVIEW',()=>root.dataset.pane='preview'));root.dataset.pane='shop';prependIcon(view.firstElementChild,'shop');prependIcon(view.lastElementChild,'play');
 root.addEventListener('close',()=>{clearDrag();resetInput();scene.reset();});
 for(const dialog of [root,codex]){dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());}
 for(const s of SLOTS){const b=button(s==='trajectory'?'VECTOR':s.toUpperCase(),()=>{recipePreview=null;slot=s;selected=state.equipped[s];if(s==='dash')demoMode.value='dash';else if(s==='pointer')demoMode.value='arrow';else if(s==='radar'||s==='trajectory')demoMode.value='story';root.querySelector('.custom-grid').scrollTop=0;render();});prependIcon(b,s==='slash'?'crescent':s==='dash'?'bolt':['pointer','radar','trajectory'].includes(s)?'target':s);b.dataset.slot=s;if(s==='trajectory')b.setAttribute('aria-label','Trajectory viewer');root.querySelector('.custom-shop>nav').append(b);}
 for(const mode of ['slice','aim','dash','bounce','hit']){const b=button(mode.toUpperCase(),()=>{clearDrag();action=mode;openedAt=performance.now();scene.reset();updateModes();});prependIcon(b,{slice:'blade',aim:'target',dash:'bolt',bounce:'bank',hit:'shield'}[mode]);b.dataset.action=mode;root.querySelector('.custom-actions').append(b);}
 function updateModes(){for(const b of root.querySelectorAll('[data-action]'))b.setAttribute('aria-pressed',String(b.dataset.action===action));}
 const presets=root.querySelector('.custom-presets');
 for(let i=0;i<3;i++){
  const b=button(String(i+1),e=>{recipePreview=null;selectedPreset=i;if(e.shiftKey||!state.presets[i])storePreset(i);else{state.equipped=normalizeEquipment(state.presets[i],state.owned);selected=state.equipped[slot];save();snapTo();render();status(`PRESET ${i+1} LOADED / Shift-click a chip or use the store arrow to replace it.`);}},'preset-chip');
  b.dataset.preset=String(i);b.setAttribute('aria-label',`Preset ${i+1}. Click to load, Shift-click to save.`);b.oncontextmenu=e=>{e.preventDefault();selectedPreset=i;storePreset(i);};presets.append(b);
 }
 presets.append(button('',()=>storePreset(selectedPreset),'preset-store'),button('MIX',()=>{recipePreview=null;state.equipped=randomEquipment(state.owned);selected=state.equipped[slot];save();snapTo();render();status('NEW BLOODLINE / Owned parts only. Presets unchanged.');},'randomize'));
 presets.querySelector('.preset-store').setAttribute('aria-label','Save preset');presets.querySelector('.preset-store').title='Save preset';prependIcon(presets.querySelector('.preset-store'),'save');
 presets.querySelector('.preset-store').setAttribute('aria-label','Save current build to selected preset');
 function storePreset(i){if(state.presets[i]&&!confirm(`Replace preset ${i+1}?`))return;state.presets[i]={...state.equipped};save();render();status(`PRESET ${i+1} STORED / Click its chip to recall this build.`);}
 function renderPills(eq){const host=root.querySelector('.equipped-pills');host.replaceChildren();const matches=mutationMatches(eq).filter(x=>x.complete),linked=new Set(matches.flatMap(x=>Object.keys(x.parts)));
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${SLOTS.length*80} 48`);svg.setAttribute('aria-hidden','true');
  for(const h of matches){const indices=Object.keys(h.parts).map(s=>SLOTS.indexOf(s)).sort((a,b)=>a-b);for(let i=1;i<indices.length;i++){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${40+indices[i-1]*80} 10 V${32+(i%2)*6} H${40+indices[i]*80} V10`);svg.append(path);}}
  host.append(svg);for(const s of SLOTS){const pill=el('span',linked.has(s)?'linked':'',s.toUpperCase());pill.title=ITEMS.find(x=>x.id===eq[s]).name;host.append(pill);}
  for(const nav of root.querySelectorAll('[data-slot]'))nav.dataset.linked=String(linked.has(nav.dataset.slot));
 }
 function render(){
  const savedScroll=root.querySelector('.custom-grid').scrollTop;
  for(const b of destinations.children)b.setAttribute('aria-pressed',String(b.classList.contains('destination-'+root.dataset.section)));
  const eq=previewBuild(),palette=corePalette(eq.core);renderedEquipment=eq;root.dataset.motion=String(motion());root.style.setProperty('--core',palette.primary);root.style.setProperty('--core-secondary',palette.secondary);root.querySelector('.custom-wallet').textContent=unlimited?'∞ SANDBOX CREDITS':`${wallet().toLocaleString()} CREDITS`;prependIcon(root.querySelector('.custom-wallet'),'coin');
  for(const b of root.querySelectorAll('[data-slot]'))b.setAttribute('aria-pressed',String(b.dataset.slot===slot));
  const trying=!!recipePreview||selected!==state.equipped[slot];root.dataset.preview=String(trying);root.querySelector('.custom-lab-label b').textContent=trying?'FREE PREVIEW':'YOUR EQUIPPED BUILD';root.querySelector('.custom-note').textContent=trying?'Trying a part is free. Buy to own it, then Equip to use it.':'Tap to cut. Pull back to launch forward. Your equipped parts are saved.';
  discoveryNotice.textContent=lastDiscovery?`DISCOVERED / ${lastDiscovery}`:'';discoveryNotice.hidden=!lastDiscovery;
  const sword=swordProfile(eq);root.querySelector('.custom-hybrid').textContent=`${sword.tier.toUpperCase()} / ${sword.name} · ${sword.buildTitle}`;root.querySelector('.core-signature').textContent=`${eq.core.toUpperCase()} / CORE BLOODLINE`;
  root.querySelector('.custom-lab-label span').textContent=buildReadout(eq).label;root.dataset.sword=sword.family;root.dataset.tier=sword.tier;
  renderPills(eq);updateModes();for(const b of presets.querySelectorAll('[data-preset]')){b.setAttribute('aria-pressed',String(Number(b.dataset.preset)===selectedPreset));b.dataset.filled=String(!!state.presets[Number(b.dataset.preset)]);}
  const grid=root.querySelector('.custom-grid');grid.replaceChildren();cards=[];
  for(const it of ITEMS.filter(x=>x.slot===slot)){
   const b=button('',()=>{recipePreview=null;lastDiscovery='';selected=it.id;snapTo();render();inspect(it);root.querySelector(`[data-item="${it.id}"]`)?.focus({preventScroll:true});},'custom-card');b.dataset.item=it.id;b.setAttribute('aria-pressed',String(selected===it.id));b.setAttribute('aria-label',`${it.name}, ${state.owned.includes(it.id)?'owned':it.price===null?'challenge locked':it.price+' CREDITS'}`);
   const canvas=el('canvas');canvas.width=300;canvas.height=184;const label=el('div','card-caption');label.append(el('strong','',it.name),el('small','power-card-tag',powerReadout(it).short),el('span','',state.equipped[slot]===it.id?'✓ EQUIPPED':state.owned.includes(it.id)?'OWNED':it.price===null?'CHALLENGE':`${it.price} CREDITS`));const role=storyRole(it),badge=el('span','part-role');badge.append(iconNode(role.icon));badge.title=role.label+(role.cosmetic?' · No combat change':'');badge.setAttribute('aria-label',badge.title);b.append(canvas,label,badge);grid.append(b);
   const entry={button:b,canvas,eq:normalizeEquipment({...state.equipped,[slot]:it.id}),slot,id:it.id,started:0,lastStory:null};cards.push(entry);b.onpointerenter=()=>{hovered=it.id;entry.started=performance.now();inspect(it);};b.onpointerleave=()=>{entry.started=0;hovered=null;inspect();};b.onblur=()=>{entry.started=0;hovered=null;};b.onfocus=()=>{hovered=it.id;entry.started=performance.now();inspect(it);};drawLabCard(canvas.getContext('2d'),300,184,entry.eq,slot,18,selected===it.id,false);
  }
  const it=ITEMS.find(x=>x.id===selected),detail=root.querySelector('.custom-detail'),power=powerReadout(it);detail.replaceChildren();
  const copy=el('div','detail-copy');
  if(recipePreview){
   copy.append(el('small','',`${sword.tier.toUpperCase()} / ${sword.build?sword.family.toUpperCase()+' SWORD':'VISUAL FUSION'} / TRY-ON`),el('h3','',recipePreview.title),el('p','power-quick',sword.build?sword.strength:'PART POWERS ONLY / STANDARD BLADE'));
   const missing=Object.values(recipePreview.parts).filter(id=>!state.owned.includes(id));
   const apply=button(missing.length?`${missing.length} PARTS NEEDED`:'EQUIP BUILD',()=>{
    if(missing.length){const item=ITEMS.find(x=>x.id===missing[0]);recipePreview=null;slot=item.slot;selected=item.id;render();status('MISSING PART / Buy or unlock, then try the recipe again.');return;}
    state.equipped=normalizeEquipment({...state.equipped,...recipePreview.parts},state.owned);recipePreview=null;pendingBuild=null;selected=state.equipped[slot];save();snapTo();render();status(`BUILD EQUIPPED / ${swordProfile(state.equipped).name} active next run.`);
   },'equip-part');
   const back=button('BACK',()=>{recipePreview=null;selected=state.equipped[slot];render();},'power-info');const test=button('PRACTICE',()=>swordDesk.open(eq,state.equipped),'power-info');detail.append(copy,back,test,apply);
  }else{
   copy.append(el('small','',`${power.icon} ${power.title} / ${power.trigger}`),el('h3','',it.name));
   const chips=el('p','power-quick');for(const text of power.chips)chips.append(el('b',text.includes('−')||text.includes('MAX HEALTH 1')?'power-cost':'',text));copy.append(chips);
   const owned=state.owned.includes(it.id);const equip=button(owned?'EQUIP':it.price===null?'CHALLENGE LOCKED':`BUY / ${it.price} CREDITS`,()=>{
    if(!state.owned.includes(selected)){const receipt=buyEquipment(state,selected,wallet());if(!receipt)return status('NOT ENOUGH CREDITS / Earn CREDITS every round. Quests and Vaults add bonuses.');if(!purchase(selected,it.price))return status('PURCHASE UNAVAILABLE / Reopen to refresh.');state=receipt.state;save();render();return status(pendingBuild?`${it.name} purchased. Return to your build to continue.`:'OWNED · EQUIP TO USE');}
    state.equipped=normalizeEquipment({...state.equipped,[slot]:selected},state.owned);save();snapTo();render();status('EQUIPPED');
   },'equip-part');equip.disabled=(!owned&&(it.price===null||wallet()<it.price))||(owned&&state.equipped[slot]===selected);if(!owned&&it.price!==null&&wallet()<it.price)equip.textContent=`NEED ${it.price-wallet()} MORE`;if(owned&&state.equipped[slot]===selected)equip.textContent='EQUIPPED';
   if(swordProfile(state.equipped).build&&!sword.build){copy.querySelector('small').textContent+=' / BREAKS BUILD';}
   prependIcon(equip,owned?'check':it.price===null?'lock':'coin');const info=button('',()=>showPower(it),'power-info');info.setAttribute('aria-label',`Full details for ${it.name}`);
   detail.append(copy,info,equip);
  }
  root.querySelector('.return-to-build')?.remove();
  if(root.dataset.section==='parts'&&pendingBuild){const back=button(`BACK TO ${pendingBuild.title.toUpperCase()}`,()=>{recipePreview=pendingBuild;root.dataset.section='parts';root.dataset.pane='shop';render();},'return-to-build');root.querySelector('.custom-detail').append(back);}
  root.querySelector('.inspection-tag').textContent='PART';inspect();
 }
 let codexFilter='all';
 const filters=el('nav','build-filters');filters.setAttribute('aria-label','Discovery filters');for(const [id,label]of [['all','ALL'],['owned','DISCOVERED']]){const b=button(label,()=>{codexFilter=id;openCodex();});b.dataset.filter=id;filters.append(b);}codex.querySelector('header').after(filters);
 function openCodex(){clearDrag();for(const b of filters.children)b.setAttribute('aria-pressed',String(b.dataset.filter===codexFilter));codexCards=[];const grid=codex.querySelector('.codex-grid');grid.replaceChildren();const eq=previewBuild();for(const h of mutationMatches(eq).sort((a,b)=>a.id.localeCompare(b.id))){
  const build=SWORD_BUILDS.find(b=>b.id===h.id),style=build?swordProfile(normalizeEquipment({...eq,...build.parts})):null,owned=Object.values(h.parts).every(id=>state.owned.includes(id));
  const known=state.discovered.includes(h.id)||mutationMatches(state.equipped).some(x=>x.id===h.id&&x.complete);
  if(codexFilter==='owned'&&!known||codexFilter==='apex'&&build?.tier!=='apex'||codexFilter==='zenith'&&build?.tier!=='zenith'||codexFilter==='sparks'&&build)continue;
  const article=el('article',`codex-card ${known?'discovered':'unknown'}`);article.dataset.mutation=h.id;
  const canvas=el('canvas');canvas.width=320;canvas.height=190;const label=el('small','',known?(build?build.tier.toUpperCase():'SPARK'):'UNDISCOVERED'),title=el('h3','',known?h.title:'UNKNOWN MUTATION'),hint=el('p','',known?'Found by mixing your parts.':'Try different combinations.');
  const ingredients=el('div','codex-ingredients');if(known)for(const [s,id] of Object.entries(h.parts))ingredients.append(el('span',eq[s]===id?'matched':'',ITEMS.find(x=>x.id===id).name));

  const behavior=el('p','build-behavior',style?style.strength:'Two-part visual fusion. No signature sword.');const tradeoff=el('p','build-tradeoff',style?style.cost:'Individual part powers still apply.');const ownership=el('span','build-ownership',owned?'ALL PARTS OWNED':`${Object.values(h.parts).filter(id=>!state.owned.includes(id)).length} PARTS MISSING`);article.append(canvas,label,title,hint);if(known)article.append(behavior,tradeoff,ingredients); grid.append(article);codexCards.push({canvas,eq:normalizeEquipment(known?h.parts:{}),known});
 }if(!grid.children.length)grid.append(el('p','discovery-empty','No discoveries yet. Mix and equip parts, then test your creature. Any mutation you find will appear here.'));codex.showModal();}
 root.querySelector('.custom-recipes').textContent='YOUR DISCOVERIES';root.querySelector('.custom-recipes').onclick=openCodex;root.querySelector('.custom-hybrid').onclick=()=>swordDesk.open(previewBuild(),state.equipped);
 const gridViewport=root.querySelector('.custom-grid');
 function sizeCards(){const h=gridViewport.clientHeight;if(h>0)gridViewport.style.setProperty('--card-height',`${Math.floor((h-18)/2)}px`);}
 new ResizeObserver(sizeCards).observe(gridViewport);
 const canvas=root.querySelector('.custom-lab canvas');
 function point(e){return labPoint(canvas.getBoundingClientRect(),e.clientX,e.clientY);}
 function clearDrag(){const id=activePointer;activePointer=null;press=null;scene.state.drag=null;if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
 function adoptAutoPose(){if(!scene.state.manual)scene.adoptPose(choreography(motion()?(performance.now()-openedAt)/16.667:18,action));}
 canvas.onpointerdown=e=>{if(activePointer!==null||e.button!==0)return;const p=point(e);if(!p.inside)return;e.preventDefault();canvas.focus({preventScroll:true});activePointer=e.pointerId;press={x:e.clientX,y:e.clientY,toX:e.clientX,toY:e.clientY,type:e.pointerType,dragged:false};canvas.setPointerCapture(e.pointerId);adoptAutoPose();scene.aim(p.x,p.y);};
 canvas.onpointermove=e=>{const p=point(e);cursor.x=(p.x-320)/250;cursor.y=(p.y-200)/190;if(e.pointerId===activePointer){press.toX=e.clientX;press.toY=e.clientY;const g=readGesture(press);press.dragged=g.dragged;const bounds=canvas.getBoundingClientRect(),scale=1/Math.min(bounds.width/640,bounds.height/400);const target=g.kind==='tap'?p:labPullTarget(scene.state,g,scale);scene.aim(target.x,target.y);}};
 canvas.onpointerleave=()=>{cursor.x=cursor.y=0;};
 canvas.onpointerup=e=>{if(e.pointerId!==activePointer)return;const p=point(e);press.toX=e.clientX;press.toY=e.clientY;const g=readGesture(press),bounds=canvas.getBoundingClientRect(),scale=1/Math.min(bounds.width/640,bounds.height/400);const target=g.kind==='tap'?p:labPullTarget(scene.state,g,scale);const fired=g.kind!=='cancel'&&scene.fire(target.x,target.y);clearDrag();if(fired)status('MANUAL TEST / Drag again to redirect. Dummy cuts never earn score or CREDITS.');};
 canvas.onpointercancel=e=>{if(e.pointerId===activePointer)clearDrag();};
 canvas.onlostpointercapture=e=>{if(e.pointerId===activePointer)clearDrag();};
 canvas.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();if(e.repeat)return;clearDrag();adoptAutoPose();scene.fire(scene.state.dummy.x,scene.state.dummy.y);}};
 function frame(now){
  const dt=Math.min(100,now-(lastTime||now));lastTime=now;frameNo++;
  if(root.open&&!codex.open&&!swordDesk.isOpen){accumulator+=dt;while(accumulator>=16.667){scene.tick();accumulator-=16.667;}gaze.x+=(cursor.x-gaze.x)*.1;gaze.y+=(cursor.y-gaze.y)*.1;
   canvas.dataset.hits=String(scene.state.hits);canvas.dataset.testMode=scene.state.drag?'aiming':scene.state.manual?'manual':action;canvas.dataset.playerX=String(scene.state.x);canvas.dataset.playerY=String(scene.state.y);root.dataset.motion=String(motion());
   const storyIdle=root.dataset.tools!=='on'&&!scene.state.manual&&!scene.state.drag;const t=motion()?(now-openedAt)/16.667:0;if(!storyIdle)drawLabScene(canvas.getContext('2d'),renderedEquipment,t,action,scene,{cursor:gaze,motion:motion(),forgeAt,now,slot,fusionElapsed:now-fusionAt,sword:swordProfile(renderedEquipment),pressOrigin:press?{...labPoint(canvas.getBoundingClientRect(),press.x,press.y),power:Math.min(1,Math.hypot(press.toX-press.x,press.toY-press.y)/150),cancel:readGesture(press).kind==='cancel'}:null});
   if(storyIdle){
    const id=hovered||selected,key=slot+':'+id;if(key!==demoKey){demoKey=key;demoStarted=now;demoHeld=0;}
    const it=ITEMS.find(it=>it.id===id&&it.slot===slot);demoName.textContent=it?.name||'YOUR BUILD';demoPlay.disabled=!motion()||demoMode.value==='arrow';demoState.textContent=demoMode.value==='arrow'?'STATIC PREVIEW':!motion()?'STILL / REDUCED':demoPlaying?'LOOPING DEMO':'PAUSED';
    const frame=shopDemoFrame(demoPlaying?now-demoStarted:demoHeld,motion());
    const storyEquipment=normalizeEquipment({...renderedEquipment,[slot]:id});root.dataset.previewElement=dashElement(storyEquipment,swordProfile(storyEquipment));
    drawShopDemo(canvas.getContext('2d'),640,400,{id,slot,equipment:storyEquipment,sword:swordProfile(storyEquipment),time:frame.time,motion:motion(),veil:frame.veil,demoMode:demoMode.value});
   }



  }
  if(codex.open&&frameNo%2===0)for(const entry of codexCards){const bounds=entry.canvas.getBoundingClientRect(),viewport=codex.getBoundingClientRect();if(bounds.bottom<viewport.top||bounds.top>viewport.bottom)continue;const c=entry.canvas.getContext('2d');drawShopCardArt(c,320,190,{equipment:entry.eq,slot:'body',time:motion()?now/16.667:0,selected:entry.known,motion:motion(),locked:!entry.known,sword:swordProfile(entry.eq)});}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 return {unlock(id){if(!['oni','glass'].includes(id)||state.owned.includes(id))return false;state.owned.push(id);save();return true;},open(){recipePreview=null;pendingBuild=null;root.dataset.section='parts';root.dataset.pane='shop';root.dataset.tools='off';previewToggle.textContent='SHOW PRACTICE CONTROLS';previewToggle.setAttribute('aria-expanded','false');lastDiscovery='';sync();selected=state.equipped[slot];demoMode.value=slot==='pointer'?'arrow':'dash';openedAt=performance.now();demoStarted=openedAt;demoKey='';demoPlaying=true;demoPlay.textContent='PAUSE';demoPlay.setAttribute('aria-pressed','true');scene.reset();render();resetInput();root.showModal();},snapshot(){sync();return normalizeEquipment(state.equipped,state.owned);},get isOpen(){return root.open||codex.open||swordDesk.isOpen;}};
}
