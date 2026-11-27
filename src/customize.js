import {shopAbility,playerText,playerCanvas} from './shop-language.js';
import {SHOP_GROUPS,SLOT_LABELS,shopGroup,shopItems,classifyItem,shopStudy,shopSwapNotice} from './shop-catalog.js';
import {PART_PERKS} from './part-perks.js';
import {shopDemoFrame} from './shop-demo.js';
import {storyRole} from './equipment-stories.js';
import {prependIcon,iconNode} from './ui-icons.js';
import {shopItemIconNode} from './shop-item-icons.js';
import {createShopFeedback} from './shop-feedback.js';
import {readGesture} from './gesture.js';
import {swordProfile,SWORD_BUILDS} from './swords.js';
import {createSwordDesk} from './sword-desk.js';
import {powerReadout,buildReadout} from './power-readout.js';
import { HYBRIDS, mutationMatches, mutationTitle } from './hybrids.js';
import { ITEMS,SLOTS,loadEquipment,normalizeEquipment,randomEquipment,buyEquipment } from './equipment.js';
import { corePalette } from './harmony.js';
import {drawWorldArchitectureStudy,resolveCoreMechanism,drawCoreMechanismStudy,resolveAssemblyConstruction,drawAssemblyStudy,clearAssemblyCache,createArtBake,drawShopItemStudy,drawPartPerkDemo,dashElement,drawShopDemo,drawShopCardArt,drawPreviewScene,evaluatePreviewPose,drawEquipmentStory} from './art/splatr-art-engine.js';
const drawLabCard=(ctx,width,height,equipment,slot,time=0,active=false,motion=true)=>drawShopCardArt(ctx,width,height,{equipment,slot,time,selected:active,motion});
const drawLabScene=(ctx,equipment,time,mode,scene,options)=>drawPreviewScene(ctx,{equipment,time,mode,state:scene.state,options});
import {createLabScene} from './lab-scene.js';
const choreography=(time,mode)=>evaluatePreviewPose(mode,time).pose;
import {labPoint,labPullTarget} from './lab-input.js';

export function createCustomize({storage,unlimited=false,wallet,ownedParts,purchase,resetInput,motion=()=>true,snap=()=>{}}){
 let state=loadEquipment(storage.get('equipment','{}')),slot='head',selected=state.equipped.head,action='slice',openedAt=0,forgeAt=-Infinity,fusionAt=-Infinity,lastMutation='',selectedPreset=0,hovered=null,frameNo=0,lastTime=0,accumulator=0;
 let itemFilter='all',itemQuery='',raf=0,disposed=false,lastPaint=-Infinity;
 const worldBake=createArtBake({surface:()=>document.createElement('canvas'),maxEntries:8,maxPixels:1200000});
 const thumbBake=createArtBake({surface:()=>document.createElement('canvas'),maxEntries:20});
 let activePointer=null,press=null,renderedEquipment=null,recipePreview=null,pendingBuild=null;
 let assemblyIndex=0;
 let demoPlaying=true,demoStarted=0,demoHeld=0,demoKey='';let cards=[],codexCards=[];const scene=createLabScene(),cursor={x:0,y:0},gaze={x:0,y:0};
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;const glyph={'lab-exit':'back','codex-close':'back','destination-parts':'mix','randomize':'dice','power-info':'info','destination-discoveries':'guide','destination-sword':'practice'}[cls];if(glyph)prependIcon(b,glyph);return b;};
 const root=el('dialog','customize shape-lab');root.setAttribute('aria-label','Shop Armory');root.dataset.section='parts';
 root.innerHTML=`<header><div class="lab-brand"><small>LOOK THE PART. PLAY YOUR WAY.</small><h2>SHOP</h2><p>EVERY PART HAS A PURPOSE. BUILD YOUR ADVANTAGE.</p></div><div class="custom-wallet"></div></header><div class="custom-view-switch"></div><div class="custom-layout"><section class="custom-shop"><nav aria-label="Equipment slots"></nav><div class="custom-grid"></div><article class="custom-detail" aria-live="polite"></article></section><section class="custom-lab"><div class="custom-lab-label"><b>◈ LIVE BUILD</b><span>DRAG / RELEASE / REPEAT</span></div><canvas width="640" height="400" tabindex="0" role="application" aria-label="Playable build sandbox. Tap a dummy, or pull back and release forward. Space fires toward the dummy."></canvas><div class="equipped-pills" aria-label="Equipped slot connections"></div><div class="custom-actions" aria-label="Sandbox test mode"></div><div class="custom-presets"></div><button class="custom-hybrid" type="button"></button><p class="custom-note">No run progress or currency is earned in the lab.</p><button class="custom-recipes" type="button">◈ HYBRID RECIPES <span>BUILD LIBRARY →</span></button></section></div><footer><b class="inspection-tag">INSPECT</b><span class="inspection-divider" aria-hidden="true">•</span><span class="inspection-name"></span><span class="custom-status" role="status"></span><span class="core-signature"></span></footer>`;
 const feedback=createShopFeedback(root,motion);
 const receipt=el('p','shop-receipt');receipt.setAttribute('role','status');receipt.setAttribute('aria-live','polite');receipt.setAttribute('aria-atomic','true');root.querySelector('footer').before(receipt);
 root.dataset.tools='off';
 const previewToggle=button('SHOW PRACTICE CONTROLS',()=>{const on=root.dataset.tools!=='on';root.dataset.tools=on?'on':'off';previewToggle.textContent=on?'HIDE PRACTICE CONTROLS':'SHOW PRACTICE CONTROLS';previewToggle.setAttribute('aria-expanded',String(on));if(!on){clearDrag();scene.reset();}},'shop-preview-toggle');previewToggle.setAttribute('aria-expanded','false');root.querySelector('.custom-lab>canvas').after(previewToggle);
 root.querySelector('.custom-lab-label').firstChild.textContent='SELECTED PART / LIVE DEMO';
 const demoControls=el('div','shop-demo-controls');
 const demoMode=el('select','shop-demo-mode');demoMode.setAttribute('aria-label','Preview type');demoMode.onchange=()=>{demoKey='';};for(const [value,label]of [['world','WORLD PANORAMA'],['mechanism','INSPECT THE CORE'],['assembly','INSPECT THE BUILD'],['story','SEE THE ABILITY'],['dash','ELEMENTAL DASH'],['slash','WEAPON SLASH'],['arrow','DRAG ARROW']]){const option=el('option','',label);option.value=value;demoMode.append(option);}
 const demoName=el('strong','shop-demo-name'),demoState=el('span','shop-demo-state','LOOPING DEMO');
 const demoPlay=button('PAUSE',()=>{const now=performance.now();if(demoPlaying)demoHeld=now-demoStarted;else demoStarted=now-demoHeld;demoPlaying=!demoPlaying;demoPlay.textContent=demoPlaying?'PAUSE':'PLAY';demoPlay.setAttribute('aria-pressed',String(demoPlaying));},'shop-demo-play');demoPlay.setAttribute('aria-label','Play or pause the selected item demonstration');demoPlay.setAttribute('aria-pressed','true');demoControls.append(demoMode,demoState,demoPlay);root.querySelector('.custom-lab-label').after(demoName);root.querySelector('.custom-lab>canvas').after(demoControls);
 const abilityGuide=el('article','shop-ability-guide');abilityGuide.setAttribute('aria-label','How this item works');demoControls.after(abilityGuide);
 const assemblyInspect=button('ASSEMBLY',()=>{assemblyIndex=0;enterAssembly();},'assembly-inspect');assemblyInspect.setAttribute('aria-pressed','false');root.querySelector('.custom-lab-label').append(assemblyInspect);
 const assemblyGallery=el('nav','assembly-gallery');assemblyGallery.setAttribute('aria-label','Read-only assembly reference builds');
 const assemblyPrev=button('←',()=>{assemblyIndex=(assemblyIndex+HYBRIDS.length)%(HYBRIDS.length+1);enterAssembly();},'assembly-prev');assemblyPrev.setAttribute('aria-label','Previous assembly example');
 const assemblyCurrent=button('YOUR PREVIEW',()=>{assemblyIndex=0;enterAssembly();},'assembly-current');assemblyCurrent.setAttribute('aria-label','Return to your selected parts');
 const assemblyNext=button('→',()=>{assemblyIndex=(assemblyIndex+1)%(HYBRIDS.length+1);enterAssembly();},'assembly-next');assemblyNext.setAttribute('aria-label','Next assembly example');
 assemblyGallery.append(assemblyPrev,assemblyCurrent,assemblyNext);
 const assemblyCaption=el('p','assembly-caption');assemblyCaption.setAttribute('role','status');assemblyGallery.hidden=assemblyCaption.hidden=true;
 demoControls.after(assemblyGallery,assemblyCaption);
 function enterAssembly(){clearDrag();scene.reset();root.dataset.tools='off';previewToggle.textContent='SHOW PRACTICE CONTROLS';previewToggle.setAttribute('aria-expanded','false');demoMode.value='assembly';demoKey='';lastPaint=-Infinity;root.querySelector('.custom-lab').scrollTop=0;}
 demoMode.onchange=()=>{clearDrag();scene.reset();assemblyIndex=0;demoKey='';lastPaint=-Infinity;};
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
 function showPower(it){const p=powerReadout(it,previewBuild()),copy=shopAbility(it.id);powerSheet.replaceChildren(el('small','',it.name),el('h2','',copy.headline),el('p','power-sheet-chips',p.chips.join(' · ')));for(const [label,text]of [['WHAT IT DOES',p.detail],['HOW TO USE IT',copy.use],['WATCH FOR THIS',copy.limit]]){const section=el('section');section.append(el('h3','',label),el('p','',text));powerSheet.append(section);}powerSheet.append(el('p','shop-time-note','Short timings are approximate. Some windows stretch with slow motion.'),button('BACK',()=>powerSheet.close()));powerSheet.querySelector('h2').prepend(shopItemIconNode(it.id));powerSheet.showModal();}
 powerSheet.addEventListener('keydown',e=>e.stopPropagation());powerSheet.addEventListener('keyup',e=>e.stopPropagation());
 const save=()=>{for(const h of mutationMatches(state.equipped))if(h.complete&&!state.discovered.includes(h.id)){state.discovered.push(h.id);lastDiscovery=h.title;}storage.set('equipment',JSON.stringify(state));};
 function sync(){for(const id of ownedParts())if(ITEMS.some(x=>x.id===id)&&!state.owned.includes(id))state.owned.push(id);save();}
 function previewBuild(){return normalizeEquipment(recipePreview?{...state.equipped,...recipePreview.parts}:{...state.equipped,[slot]:selected});}
 function status(text,tone='info'){root.querySelector('.custom-status').textContent='— '+text;receipt.textContent=text;receipt.dataset.tone=tone;feedback.pulse(receipt,'reveal');}
 function inspect(){const it=ITEMS.find(x=>x.id===selected);root.querySelector('.inspection-name').textContent=it.name.toUpperCase();root.querySelector('.custom-status').textContent=state.equipped[slot]===selected?'EQUIPPED':state.owned.includes(selected)?'OWNED · EQUIP TO USE':'PREVIEW · BUY, THEN EQUIP';}

 function snapTo(){forgeAt=performance.now();snap();const key=mutationMatches(previewBuild()).filter(h=>h.complete).map(h=>h.id).join('|');if(key&&key!==lastMutation)fusionAt=forgeAt;lastMutation=key;}
 root.querySelector('header').append(button('BACK',()=>root.close(),'lab-exit'));
 const view=root.querySelector('.custom-view-switch');view.append(button('SHOP',()=>root.dataset.pane='shop'),button('PREVIEW',()=>root.dataset.pane='preview'));root.dataset.pane='shop';prependIcon(view.firstElementChild,'shop');prependIcon(view.lastElementChild,'play');
 root.addEventListener('close',()=>{clearDrag();resetInput();scene.reset();});
 for(const dialog of [root,codex]){dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());}
 const groupNav=el('nav','shop-groups');groupNav.setAttribute('aria-label','Shop categories');
 root.querySelector('.custom-shop>nav').before(groupNav);
 const slotNav=root.querySelector('.custom-shop>nav:not(.shop-groups)');slotNav.classList.add('shop-slots');
 function selectSlot(next){recipePreview=null;hovered=null;slot=next;selected=state.equipped[slot];demoMode.value=slot==='slash'?'slash':slot==='world'?'world':slot==='body'?'assembly':'story';demoKey='';itemFilter='all';filter.value='all';itemQuery='';search.value='';gridViewport.scrollTop=0;render();status(`${SLOT_LABELS[slot].toUpperCase()} / Select a part to preview. Nothing is bought or equipped by browsing.`);}
 for(const group of SHOP_GROUPS){const b=button(group.label,()=>selectSlot(group.slots.includes(slot)?slot:group.slots[0]),'shop-group');b.dataset.group=group.id;prependIcon(b,group.icon);groupNav.append(b);}
 for(const s of SLOTS){const b=button(SLOT_LABELS[s],()=>selectSlot(s));prependIcon(b,s==='slash'?'crescent':s==='dash'?'bolt':['pointer','radar','trajectory'].includes(s)?'target':s);b.dataset.slot=s;b.setAttribute('aria-label',SLOT_LABELS[s]);slotNav.append(b);}
 const browse=el('div','shop-browse'),breadcrumb=el('span','shop-breadcrumb');
 const filter=el('select','shop-filter');filter.setAttribute('aria-label','Item availability');
 for(const [value,label]of [['all','All items'],['owned','Owned'],['affordable','Can afford'],['challenge','Challenges']]){const o=el('option','',label);o.value=value;filter.append(o);}
 filter.onchange=()=>{itemFilter=filter.value;render();};
 const search=el('input','shop-search');search.type='search';search.placeholder='Find a part…';search.setAttribute('aria-label','Search items in this slot');search.maxLength=80;
 search.oninput=()=>{itemQuery=search.value;gridViewport.scrollTop=0;render();};browse.append(breadcrumb,search,filter);root.querySelector('.custom-detail').after(browse);

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
  assemblyIndex=0;
  const savedScroll=root.querySelector('.custom-grid').scrollTop;
  for(const b of destinations.children)b.setAttribute('aria-pressed',String(b.classList.contains('destination-'+root.dataset.section)));
  const eq=previewBuild(),palette=corePalette(eq.core);renderedEquipment=eq;root.dataset.motion=String(motion());root.style.setProperty('--core',palette.primary);root.style.setProperty('--core-secondary',palette.secondary);root.querySelector('.custom-wallet').textContent=unlimited?'∞ SANDBOX CREDITS':`${wallet().toLocaleString()} CREDITS`;prependIcon(root.querySelector('.custom-wallet'),'coin');
  const group=shopGroup(slot);root.dataset.group=group.id;
  for(const b of groupNav.children)b.setAttribute('aria-pressed',String(b.dataset.group===group.id));
  for(const b of slotNav.children){b.hidden=!group.slots.includes(b.dataset.slot);b.setAttribute('aria-pressed',String(b.dataset.slot===slot));}
  breadcrumb.textContent=`${group.label} / ${SLOT_LABELS[slot]} · ${ITEMS.filter(i=>i.slot===slot&&state.owned.includes(i.id)).length}/${ITEMS.filter(i=>i.slot===slot).length} owned`;

  const trying=!!recipePreview||selected!==state.equipped[slot];root.dataset.preview=String(trying);root.querySelector('.custom-lab-label b').textContent=trying?'FREE PREVIEW':'YOUR EQUIPPED BUILD';root.querySelector('.custom-note').textContent=trying?'Trying a part is free. Buy to own it, then Equip to use it.':'Tap to cut. Pull back to launch forward. Your equipped parts are saved.';
  discoveryNotice.textContent=lastDiscovery?`DISCOVERED / ${lastDiscovery}`:'';discoveryNotice.hidden=!lastDiscovery;
  const sword=swordProfile(eq);root.querySelector('.custom-hybrid').textContent=`${sword.tier.toUpperCase()} / ${sword.name} · ${sword.buildTitle}`;root.querySelector('.core-signature').textContent=`${eq.core.toUpperCase()} / CORE BLOODLINE`;
  root.querySelector('.custom-lab-label span').textContent=buildReadout(eq).label;root.dataset.sword=sword.family;root.dataset.tier=sword.tier;
  renderPills(eq);updateModes();for(const b of presets.querySelectorAll('[data-preset]')){b.setAttribute('aria-pressed',String(Number(b.dataset.preset)===selectedPreset));b.dataset.filled=String(!!state.presets[Number(b.dataset.preset)]);}
  const grid=root.querySelector('.custom-grid');grid.replaceChildren();cards=[];
  for(const it of shopItems(slot,{owned:state.owned,wallet:wallet(),filter:itemFilter,query:itemQuery})){
   const b=button('',()=>{recipePreview=null;lastDiscovery='';selected=it.id;snapTo();render();inspect(it);const notice=shopSwapNotice(swordProfile(state.equipped),swordProfile(previewBuild()));status(`PREVIEW / ${it.name}. ${notice||powerReadout(it).short} · ${state.equipped[slot]===it.id?'Already equipped.':state.owned.includes(it.id)?'Owned. Equip to use next run.':'Try-on only. Buy to own, then equip.'}`,'preview');feedback.pulse(root.querySelector('.custom-detail'),'reveal');root.querySelector(`[data-item="${it.id}"]`)?.focus({preventScroll:true});},'custom-card');b.dataset.item=it.id;b.setAttribute('aria-pressed',String(selected===it.id));b.setAttribute('aria-label',`${it.name}, ${state.owned.includes(it.id)?'owned':it.price===null?'challenge locked':it.price+' CREDITS'}`);
   const canvas=el('canvas');canvas.width=300;canvas.height=184;const label=el('div','card-caption');label.append(el('strong','',it.name),el('small','power-card-tag',powerReadout(it).short),el('span','',state.equipped[slot]===it.id?'✓ EQUIPPED':state.owned.includes(it.id)?'OWNED':it.price===null?'CHALLENGE':`${it.price} CREDITS`));const category=classifyItem(it);label.append(el('small','item-class',category.label+' · '+category.trigger));const role=storyRole(it),badge=el('span','part-role');badge.append(shopItemIconNode(it.id));badge.title=it.name+' · '+role.label+(role.cosmetic?' · No combat change':'');badge.setAttribute('aria-label',badge.title);b.append(canvas,label,badge);grid.append(b);
   const entry={button:b,canvas,eq:normalizeEquipment({...state.equipped,[slot]:it.id}),slot,id:it.id,started:0,lastStory:null};cards.push(entry);b.onpointerenter=()=>{hovered=it.id;entry.started=performance.now();inspect(it);};b.onpointerleave=()=>{entry.started=0;hovered=null;inspect();};b.onblur=()=>{entry.started=0;hovered=null;};b.onfocus=()=>{hovered=it.id;entry.started=performance.now();inspect(it);};thumbBake.paint(playerCanvas(canvas.getContext('2d')),JSON.stringify(entry.eq)+':'+slot,300,184,c=>drawLabCard(c,300,184,entry.eq,slot,18,false,false));
  }
  if(!grid.children.length)grid.append(el('p','shop-empty','No matching parts. Clear search or choose All items.'));
  const it=ITEMS.find(x=>x.id===selected),detail=root.querySelector('.custom-detail'),power=powerReadout(it,eq);detail.replaceChildren();
  const ability=shopAbility(it.id);abilityGuide.replaceChildren();
  const kicker=el('small','ability-kicker','THE LOOK → THE ABILITY'),headline=el('h3','ability-headline',ability.headline);abilityGuide.append(kicker,headline);
  const guideRows=el('dl','ability-steps');for(const [label,text]of [['WHAT IT DOES',it.id==='notched'?power.detail:ability.effect],['HOW TO USE IT',ability.use],['WATCH FOR THIS',ability.limit]]){const row=el('div');row.append(el('dt','',label),el('dd','',text));guideRows.append(row);}abilityGuide.append(guideRows);
  if(trying&&!recipePreview){const current=ITEMS.find(i=>i.id===state.equipped[slot]);const compare=el('p','ability-swap');compare.append(el('span','','REPLACES'),el('strong','',current.name),el('span','','→'),el('strong','',it.name));abilityGuide.append(compare);}
  const copy=el('div','detail-copy');
  if(recipePreview){
   copy.append(el('small','',`${sword.tier.toUpperCase()} / ${sword.build?sword.family.toUpperCase()+' SWORD':'VISUAL FUSION'} / TRY-ON`),el('h3','',recipePreview.title),el('p','power-quick',sword.build?playerText(sword.strength):'PART POWERS ONLY / STANDARD BLADE'));
   const missing=Object.values(recipePreview.parts).filter(id=>!state.owned.includes(id));
   const apply=button(missing.length?`${missing.length} PARTS NEEDED`:'EQUIP BUILD',()=>{
    if(missing.length){const item=ITEMS.find(x=>x.id===missing[0]);recipePreview=null;slot=item.slot;selected=item.id;render();status('MISSING PART / Buy or unlock, then try the recipe again.');return;}
    state.equipped=normalizeEquipment({...state.equipped,...recipePreview.parts},state.owned);recipePreview=null;pendingBuild=null;selected=state.equipped[slot];save();snapTo();render();status(`BUILD EQUIPPED / ${swordProfile(state.equipped).name} active next run.`);
   },'equip-part');
   const back=button('BACK',()=>{recipePreview=null;selected=state.equipped[slot];render();},'power-info');const test=button('PRACTICE',()=>swordDesk.open(eq,state.equipped),'power-info');detail.append(copy,back,test,apply);
  }else{
   const title=el('h3','',it.name);title.prepend(shopItemIconNode(it.id));copy.append(el('small','',`${power.title} · ${power.trigger}`),title);
   const chips=el('p','power-quick');for(const text of power.chips)chips.append(el('b',text.includes('−')||text.includes('MAX HEALTH 1')?'power-cost':'',text));copy.append(chips,el('p','part-benefit',ability.effect),el('small','equip-timing','SAVED FOR YOUR NEXT RUN'));
   const owned=state.owned.includes(it.id);const equip=button(owned?'EQUIP':it.price===null?'CHALLENGE LOCKED':`BUY / ${it.price} CREDITS`,()=>{
    if(!state.owned.includes(selected)){const receipt=buyEquipment(state,selected,wallet());if(!receipt)return status('NOT ENOUGH CREDITS / Earn CREDITS from cuts, score and sectors every round.','error');if(!purchase(selected,it.price))return status('PURCHASE UNAVAILABLE / Reopen to refresh.','error');state=receipt.state;save();render();root.querySelector('.equip-part')?.focus({preventScroll:true});return status(`${it.name} BOUGHT / −${it.price} CREDITS · ${pendingBuild?'Return to your build to continue.':'Owned, not equipped. Equip to use next run.'}`,'success');}
    const previous=ITEMS.find(x=>x.id===state.equipped[slot]),notice=shopSwapNotice(swordProfile(state.equipped),swordProfile(previewBuild()));state.equipped=normalizeEquipment({...state.equipped,[slot]:selected},state.owned);save();snapTo();render();root.querySelector('.equip-part')?.focus({preventScroll:true});status(`EQUIPPED / ${previous.name} → ${it.name} · ${notice||'Saved for next run.'}`,'success');
   },'equip-part');equip.disabled=(!owned&&(it.price===null||wallet()<it.price))||(owned&&state.equipped[slot]===selected);if(!owned&&it.price!==null&&wallet()<it.price)equip.textContent=`NEED ${it.price-wallet()} MORE`;if(owned&&state.equipped[slot]===selected)equip.textContent='EQUIPPED';
   const swapNotice=shopSwapNotice(swordProfile(state.equipped),sword);if(swapNotice){const warning=el('p','shop-swap-warning',swapNotice);warning.title=swapNotice;copy.append(warning);}
   prependIcon(equip,owned?'check':it.price===null?'lock':'coin');const info=button('',()=>showPower(it),'power-info');info.setAttribute('aria-label',`Full details for ${it.name}`);
   detail.append(copy,info,equip);
  }
  root.querySelector('.return-to-build')?.remove();
  if(root.dataset.section==='parts'&&pendingBuild){const back=button(`BACK TO ${pendingBuild.title.toUpperCase()}`,()=>{recipePreview=pendingBuild;root.dataset.section='parts';root.dataset.pane='shop';render();},'return-to-build');root.querySelector('.custom-detail').append(back);}
  root.querySelector('.inspection-tag').textContent='PART';inspect();grid.scrollTop=savedScroll;lastPaint=-Infinity;
 }
 let codexFilter='all';
 const filters=el('nav','build-filters');filters.setAttribute('aria-label','Discovery filters');for(const [id,label]of [['all','ALL'],['owned','DISCOVERED']]){const b=button(label,()=>{codexFilter=id;openCodex();});b.dataset.filter=id;filters.append(b);}codex.querySelector('header').after(filters);
 function openCodex(){clearDrag();for(const b of filters.children)b.setAttribute('aria-pressed',String(b.dataset.filter===codexFilter));codexCards=[];const grid=codex.querySelector('.codex-grid');grid.replaceChildren();const eq=previewBuild();for(const h of mutationMatches(eq).sort((a,b)=>a.id.localeCompare(b.id))){
  // A discovery describes its own signature, not a more-specific recipe that
  // happens to be completed by unrelated parts in the current preview.
  const build=SWORD_BUILDS.find(b=>b.id===h.id),style=build?swordProfile(build.parts):null,owned=Object.values(h.parts).every(id=>state.owned.includes(id));
  const known=state.discovered.includes(h.id)||mutationMatches(state.equipped).some(x=>x.id===h.id&&x.complete);
  if(codexFilter==='owned'&&!known||codexFilter==='apex'&&build?.tier!=='apex'||codexFilter==='zenith'&&build?.tier!=='zenith'||codexFilter==='sparks'&&build)continue;
  const article=el('article',`codex-card ${known?'discovered':'unknown'}`);article.dataset.mutation=h.id;
  const canvas=el('canvas');canvas.width=320;canvas.height=190;const label=el('small','',known?(build?build.tier.toUpperCase():'SPARK'):'UNDISCOVERED'),title=el('h3','',known?h.title:'UNKNOWN MUTATION'),hint=el('p','',known?'Found by mixing your parts.':'Try different combinations.');
  const ingredients=el('div','codex-ingredients');if(known)for(const [s,id] of Object.entries(h.parts))ingredients.append(el('span',eq[s]===id?'matched':'',ITEMS.find(x=>x.id===id).name));

  const behavior=el('p','build-behavior',style?playerText(style.strength):'Two-part visual fusion. No signature sword.');const tradeoff=el('p','build-tradeoff',style?playerText(style.cost):'Individual part powers still apply.');const ownership=el('span','build-ownership',owned?'ALL PARTS OWNED':`${Object.values(h.parts).filter(id=>!state.owned.includes(id)).length} PARTS MISSING`);article.append(canvas,label,title,hint);if(known)article.append(behavior,tradeoff,ingredients); grid.append(article);codexCards.push({canvas,eq:normalizeEquipment(known?h.parts:{}),known});
 }if(!grid.children.length)grid.append(el('p','discovery-empty','No discoveries yet. Mix and equip parts, then test your creature. Any mutation you find will appear here.'));codex.showModal();}
 root.querySelector('.custom-recipes').textContent='YOUR DISCOVERIES';root.querySelector('.custom-recipes').onclick=openCodex;root.querySelector('.custom-hybrid').onclick=()=>swordDesk.open(previewBuild(),state.equipped);
 const gridViewport=root.querySelector('.custom-grid');
 function sizeCards(){const h=gridViewport.clientHeight;if(h>0)gridViewport.style.setProperty('--card-height',`${Math.max(130,Math.floor((h-18)/2))}px`);}
 const sizeObserver=new ResizeObserver(sizeCards);sizeObserver.observe(gridViewport);
 const canvas=root.querySelector('.custom-lab canvas');
 function point(e){return labPoint(canvas.getBoundingClientRect(),e.clientX,e.clientY);}
 function clearDrag(){const id=activePointer;activePointer=null;press=null;scene.state.drag=null;if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
 function adoptAutoPose(){if(!scene.state.manual)scene.adoptPose(choreography(motion()?(performance.now()-openedAt)/16.667:18,action));}
 canvas.onpointerdown=e=>{if(((['assembly','mechanism','world'].includes(demoMode.value)||(demoMode.value==='story'&&(['hologram','iron','prism'].includes(hovered||selected)||['head','core','tail','eyes','pointer','radar','trajectory','dash'].includes(slot))))&&root.dataset.tools!=='on')||activePointer!==null||e.button!==0)return;const p=point(e);if(!p.inside)return;e.preventDefault();canvas.focus({preventScroll:true});activePointer=e.pointerId;press={x:e.clientX,y:e.clientY,toX:e.clientX,toY:e.clientY,type:e.pointerType,dragged:false};canvas.setPointerCapture(e.pointerId);adoptAutoPose();scene.aim(p.x,p.y);};
 canvas.onpointermove=e=>{const p=point(e);cursor.x=(p.x-320)/250;cursor.y=(p.y-200)/190;if(e.pointerId===activePointer){press.toX=e.clientX;press.toY=e.clientY;const g=readGesture(press);press.dragged=g.dragged;const bounds=canvas.getBoundingClientRect(),scale=1/Math.min(bounds.width/640,bounds.height/400);const target=g.kind==='tap'?p:labPullTarget(scene.state,g,scale);scene.aim(target.x,target.y);}};
 canvas.onpointerleave=()=>{cursor.x=cursor.y=0;};
 canvas.onpointerup=e=>{if(e.pointerId!==activePointer)return;const p=point(e);press.toX=e.clientX;press.toY=e.clientY;const g=readGesture(press),bounds=canvas.getBoundingClientRect(),scale=1/Math.min(bounds.width/640,bounds.height/400);const target=g.kind==='tap'?p:labPullTarget(scene.state,g,scale);const fired=g.kind!=='cancel'&&scene.fire(target.x,target.y);clearDrag();if(fired)status('MANUAL TEST / Drag again to redirect. Dummy cuts never earn score or CREDITS.');};
 canvas.onpointercancel=e=>{if(e.pointerId===activePointer)clearDrag();};
 canvas.onlostpointercapture=e=>{if(e.pointerId===activePointer)clearDrag();};
 canvas.onkeydown=e=>{if((['assembly','mechanism','world'].includes(demoMode.value)||(demoMode.value==='story'&&(['hologram','iron','prism'].includes(hovered||selected)||['head','core','tail','eyes','pointer','radar','trajectory','dash'].includes(slot))))&&root.dataset.tools!=='on'){if(e.code==='Space')e.preventDefault();return;}if(e.code==='Space'){e.preventDefault();if(e.repeat)return;clearDrag();adoptAutoPose();scene.fire(scene.state.dummy.x,scene.state.dummy.y);}};
 function frame(now){
  raf=0;if(disposed||(!root.open&&!codex.open&&!swordDesk.isOpen)){lastTime=0;return;}
  raf=requestAnimationFrame(frame);if(document.hidden){lastTime=0;return;}
  if(now-lastPaint<1000/30)return;lastPaint=now;
  const dt=Math.min(100,now-(lastTime||now));lastTime=now;frameNo++;
  if(root.open&&!codex.open&&!swordDesk.isOpen){if(root.dataset.tools==='on'||scene.state.manual||scene.state.drag){accumulator+=dt;while(accumulator>=16.667){scene.tick();accumulator-=16.667;}}gaze.x+=(cursor.x-gaze.x)*.1;gaze.y+=(cursor.y-gaze.y)*.1;
   canvas.dataset.hits=String(scene.state.hits);canvas.dataset.testMode=scene.state.drag?'aiming':scene.state.manual?'manual':action;canvas.dataset.playerX=String(scene.state.x);canvas.dataset.playerY=String(scene.state.y);root.dataset.motion=String(motion());
   const worldActive=demoMode.value==='world'&&root.dataset.tools!=='on',assemblyActive=demoMode.value==='assembly'&&root.dataset.tools!=='on',mechanismActive=demoMode.value==='mechanism'&&root.dataset.tools!=='on',reactiveActive=demoMode.value==='story'&&root.dataset.tools!=='on'&&(['hologram','iron','prism'].includes(hovered||selected)||['head','core','tail','eyes','pointer','radar','trajectory','dash'].includes(slot))&&!scene.state.manual&&!scene.state.drag;
   if(!assemblyActive)root.querySelector('.custom-lab-label b').textContent=root.dataset.preview==='true'?'FREE PREVIEW':'YOUR EQUIPPED BUILD';
   root.dataset.world=String(worldActive);root.dataset.assembly=String(assemblyActive);root.dataset.mechanism=String(mechanismActive);root.dataset.reactive=String(reactiveActive);assemblyGallery.hidden=assemblyCaption.hidden=!assemblyActive;assemblyInspect.setAttribute('aria-pressed',String(assemblyActive));
   canvas.setAttribute('role',worldActive||assemblyActive||mechanismActive||reactiveActive?'img':'application');canvas.setAttribute('aria-label',worldActive?'Read-only world scenery tour. Camera travel is illustrative; arena geometry and powers are unchanged.':reactiveActive?(['head','core'].includes(slot)?'Illustrated item ability. This is not live combat. Show practice controls to test it.':slot==='eyes'?'Illustrated eye toolkit ability. This is not live combat. Show practice controls for manual testing.':slot==='tail'?'Illustrated tail toolkit ability. This is not live combat. Show practice controls for manual testing.':slot==='dash'?'Illustrated dash ability. Slowed example, not live combat. Show practice controls for manual testing.':['pointer','radar','trajectory'].includes(slot)?'Illustrated aiming tool. Current rules in a slowed example, not a guaranteed future hit. Show practice controls for manual testing.':'Illustrated reactive shell ability. This is not live combat. Show practice controls for manual testing.'):mechanismActive?'Core mechanism inspection. Same fitted cartridge as in play, enlarged. Preview has no live charge. Choose Part in action for powers.':assemblyActive?'Assembled character inspection. Use the example controls to browse, or show practice controls to test.':'Playable build sandbox. Tap a dummy, or pull back and release forward. Space fires toward the dummy.');
   const storyIdle=root.dataset.tools!=='on'&&!scene.state.manual&&!scene.state.drag;const t=motion()?(now-openedAt)/16.667:0;if(!storyIdle)drawLabScene(playerCanvas(canvas.getContext('2d')),renderedEquipment,t,action,scene,{cursor:gaze,motion:motion(),forgeAt,now,slot,fusionElapsed:now-fusionAt,sword:swordProfile(renderedEquipment),pressOrigin:press?{...labPoint(canvas.getBoundingClientRect(),press.x,press.y),power:Math.min(1,Math.hypot(press.toX-press.x,press.toY-press.y)/150),cancel:readGesture(press).kind==='cancel'}:null});
   if(storyIdle){
    const id=hovered||selected,key=slot+':'+id;if(key!==demoKey){demoKey=key;demoStarted=now;demoHeld=0;}
    const it=ITEMS.find(it=>it.id===id&&it.slot===slot);demoName.textContent=it?.name||'YOUR BUILD';demoPlay.disabled=!motion()||demoMode.value==='arrow';demoState.textContent=demoMode.value==='arrow'?'STATIC PREVIEW':!motion()?'STILL / REDUCED':demoPlaying?'LOOPING DEMO':'PAUSED';
    const frame=shopDemoFrame(demoPlaying?now-demoStarted:demoHeld,motion());
    const storyEquipment=normalizeEquipment({...renderedEquipment,[slot]:id});root.dataset.previewElement=dashElement(storyEquipment,swordProfile(storyEquipment));
    if(demoMode.value==='world'){
      demoName.textContent=ITEMS.find(item=>item.id===storyEquipment.world)?.name||'WORLD PANORAMA';
      demoState.textContent=motion()?(demoPlaying?'SCENERY TOUR':'PAUSED'):'STILL / REDUCED';
      drawWorldArchitectureStudy(playerCanvas(canvas.getContext('2d')),640,400,{equipment:storyEquipment,time:(demoPlaying?now-demoStarted:demoHeld)/16.667,motion:motion(),bake:worldBake});
    }
    else if(demoMode.value==='mechanism'){
      const construction=resolveCoreMechanism(storyEquipment.core);demoName.textContent=construction.title;
      demoState.textContent='INSPECTION / NO LIVE CHARGE';canvas.dataset.mechanismCore=storyEquipment.core;
      drawCoreMechanismStudy(playerCanvas(canvas.getContext('2d')),640,400,{equipment:storyEquipment,time:(demoPlaying?now-demoStarted:demoHeld)/16.667,motion:motion()});
    }
    else if(demoMode.value==='assembly'){
      const reference=assemblyIndex>0,sample=reference?HYBRIDS[assemblyIndex-1]:null,eq=sample?normalizeEquipment(sample.parts):storyEquipment,construction=resolveAssemblyConstruction(eq);
      root.querySelector('.custom-lab-label b').textContent=reference?'FREE BUILD EXAMPLE':root.dataset.preview==='true'?'FREE PREVIEW':'YOUR EQUIPPED BUILD';
      demoName.textContent=reference?'EXAMPLE / NOT EQUIPPED':it?.name||'YOUR BUILD';assemblyCurrent.textContent=reference?`EXAMPLE ${assemblyIndex} / ${HYBRIDS.length} · MY PREVIEW ↩`:'YOUR PREVIEW · 17 BUILD EXAMPLES →';
      const caption=reference?`${sample.title} / Free reference only. Shop selection, ownership and discoveries are unchanged.`:`${construction.material.name} · ${construction.material.mount}. Same construction in play; use Part in action for powers.`;
      if(assemblyCaption.textContent!==caption)assemblyCaption.textContent=caption;
      canvas.dataset.assemblyFamily=construction.family||'standard';canvas.dataset.assemblyBody=construction.body;
      drawAssemblyStudy(playerCanvas(canvas.getContext('2d')),640,400,{equipment:eq,sword:swordProfile(eq),time:(demoPlaying?now-demoStarted:demoHeld)/16.667,motion:motion(),reference});
    }
    else if(demoMode.value==='story')drawShopItemStudy(playerCanvas(canvas.getContext('2d')),640,400,{study:shopStudy(it,demoPlaying?now-demoStarted:demoHeld,motion(),storyEquipment),equipment:storyEquipment,sword:swordProfile(storyEquipment)});
    else drawShopDemo(playerCanvas(canvas.getContext('2d')),640,400,{id,slot,equipment:storyEquipment,sword:swordProfile(storyEquipment),time:frame.time,motion:motion(),veil:frame.veil,demoMode:demoMode.value});
   }



  }
  if(codex.open&&frameNo%2===0)for(const entry of codexCards){const bounds=entry.canvas.getBoundingClientRect(),viewport=codex.getBoundingClientRect();if(bounds.bottom<viewport.top||bounds.top>viewport.bottom)continue;const c=entry.playerCanvas(canvas.getContext('2d'));drawShopCardArt(c,320,190,{equipment:entry.eq,slot:'body',time:motion()?now/16.667:0,selected:entry.known,motion:motion(),locked:!entry.known,sword:swordProfile(entry.eq)});}
 }
 raf=requestAnimationFrame(frame);
 return {dispose(){disposed=true;feedback.dispose();cancelAnimationFrame(raf);sizeObserver.disconnect();worldBake.clear();thumbBake.clear();clearAssemblyCache();swordDesk.dispose?.();for(const dialog of [root,codex,powerSheet]){if(dialog.open)dialog.close();dialog.remove();}},unlock(id){if(!['oni','glass'].includes(id)||state.owned.includes(id))return false;state.owned.push(id);save();return true;},open(itemId=null,{assembly=false,mechanism=false}={}){const requested=itemId===null?null:ITEMS.find(it=>it.id===itemId);if(itemId!==null&&!requested)return false;if(requested){slot=requested.slot;itemFilter='all';filter.value='all';itemQuery='';search.value='';}recipePreview=null;pendingBuild=null;root.dataset.section='parts';root.dataset.pane='shop';root.dataset.tools='off';previewToggle.textContent='SHOW PRACTICE CONTROLS';previewToggle.setAttribute('aria-expanded','false');lastDiscovery='';sync();selected=requested?.id||state.equipped[slot];demoMode.value=mechanism?'mechanism':assembly||(!requested&&slot==='body')?'assembly':slot==='world'?'world':slot==='slash'?'slash':'story';openedAt=performance.now();demoStarted=openedAt;demoKey='';demoPlaying=true;demoPlay.textContent='PAUSE';demoPlay.setAttribute('aria-pressed','true');scene.reset();render();resetInput();root.showModal();if(requested||assembly||mechanism)root.dataset.pane='preview';if(!assembly&&!mechanism)root.querySelector(`[data-item="${selected}"]`)?.scrollIntoView({block:'nearest'});status(requested?`FREE PREVIEW / ${requested.name}. No purchase or equip has been made.`:'TRY-ON IS FREE / Select a part. Buying and equipping are separate actions.');if(!raf)raf=requestAnimationFrame(frame);},snapshot(){sync();return normalizeEquipment(state.equipped,state.owned);},get isOpen(){return root.open||codex.open||swordDesk.isOpen;}};
}
