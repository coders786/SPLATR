import {SWORD_BUILDS,swordProfile} from './swords.js';
import {ITEMS,normalizeEquipment} from './equipment.js';
import {drawShopCardArt} from './art/splatr-art-engine.js';

/** Builds-first navigation. Ownership and purchases stay in the existing controller. */
export function createBuildHome({root,getModel,onSelect,onEquip,onPart,onSword,onLibrary,motion}){
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
 const host=el('section','armory-builds');host.setAttribute('aria-label','Build loadouts');
 const heading=el('div','build-home-heading'),title=el('div');title.append(el('small','','1 CHOOSE · 2 GET PARTS · 3 EQUIP'),el('h3','','CHOOSE A BUILD'));
 heading.append(title);const advanced=el('details','build-more');advanced.append(el('summary','','More options'));const filters=el('nav','build-home-filters');filters.setAttribute('aria-label','Loadout filters');let filter='all',art=[],showMissing=false;
 for(const [id,label]of [['all','ALL'],['owned','OWNED'],['apex','APEX'],['zenith','ZENITH']]){const b=button(label,()=>{filter=id;render();});b.dataset.buildFilter=id;if(['apex','zenith'].includes(id))advanced.append(b);else filters.append(b);}
 advanced.append(button('Recipe library',onLibrary,'build-home-archive'));filters.append(advanced);const intro=el('p','shop-explainer','A build combines matching parts to unlock a signature sword. Select one to preview for free.');const list=el('div','build-home-list'),detail=el('article','build-home-detail');detail.setAttribute('aria-live','polite');host.append(heading,intro,filters,list,detail);root.querySelector('.custom-layout').prepend(host);
 function render(){
  const model=getModel(),{equipment,owned,recipe}=model,current=swordProfile(equipment),preview=swordProfile(model.preview);
  const oldScroll=list.scrollTop;art=[];for(const b of filters.querySelectorAll('[data-build-filter]'))b.setAttribute('aria-pressed',String(b.dataset.buildFilter===filter));
  list.replaceChildren();
  const currentCard=button('',()=>{showMissing=false;onSelect(null);root.querySelector('[data-build="current"]')?.focus({preventScroll:true});},'build-current');currentCard.dataset.build='current';currentCard.setAttribute('aria-pressed',String(!recipe));currentCard.append(el('small','','CURRENTLY EQUIPPED'),el('b','',current.buildTitle==='MIXED LOADOUT'?'FIELD KIT':current.buildTitle),el('span','',`${current.tier.toUpperCase()} / ${current.name}`));list.append(currentCard);
  let visible=0;
  for(const build of SWORD_BUILDS){
   const missing=Object.values(build.parts).filter(id=>!owned.includes(id));const price=missing.reduce((sum,id)=>sum+(ITEMS.find(x=>x.id===id)?.price||0),0),locked=missing.some(id=>ITEMS.find(x=>x.id===id)?.price===null);if(filter==='owned'&&missing.length||filter==='apex'&&build.tier!=='apex'||filter==='zenith'&&build.tier!=='zenith')continue;
   visible++;const eq=normalizeEquipment({...equipment,...build.parts}),sword=swordProfile(eq),selected=recipe?.id===build.id;
   const card=button('',()=>{showMissing=false;onSelect(build);root.querySelector(`[data-build="${build.id}"]`)?.focus({preventScroll:true});},'build-home-card');card.dataset.build=build.id;card.dataset.tier=build.tier;card.setAttribute('aria-pressed',String(selected));
   card.setAttribute('aria-label',`${build.title}, ${build.tier}, ${sword.family}, ${missing.length?missing.length+' parts missing':'all parts owned'}`);
   const canvas=el('canvas');canvas.width=240;canvas.height=150;const text=el('div');text.append(el('small','',`${build.tier.toUpperCase()} / ${sword.family.toUpperCase()}`),el('strong','',build.title),el('span','',missing.length?`${price.toLocaleString()} CREDITS${locked?' + unlock':''} · ${missing.length} parts`:'OWNED · READY TO EQUIP'));
   card.append(canvas,text);list.append(card);art.push({canvas,eq,sword,selected});drawShopCardArt(canvas.getContext('2d'),240,150,{equipment:eq,slot:'body',sword,time:0,motion:false,selected});
  }
  if(!visible)list.append(el('p','build-home-empty','No complete builds owned yet. Your Field Kit is ready to play. Browse All to inspect recipes; no purchase happens on preview.'));
  detail.replaceChildren();
  const summary=el('div','build-home-summary');summary.append(el('small','',recipe?'FREE PREVIEW · NOT EQUIPPED':'EQUIPPED · READY TO PLAY'),el('h4','',recipe?recipe.title:preview.name),el('p','build-strength',preview.strength),el('p','build-cost',preview.cost));
  const comparison=el('p','build-comparison',recipe?`Signature: ${preview.name}. Your saved build stays unchanged until you equip.`:'You can play now. Buying a build is optional.');summary.append(comparison);
  const actions=el('div','build-home-actions'),missing=recipe?Object.values(recipe.parts).filter(id=>!owned.includes(id)):[];
  const total=missing.reduce((sum,id)=>sum+(ITEMS.find(x=>x.id===id)?.price||0),0),challenge=missing.some(id=>ITEMS.find(x=>x.id===id)?.price===null);
  if(missing.length)summary.append(el('p','build-price',`Remaining cost: ${total.toLocaleString()} CREDITS${challenge?' + challenge unlock':''}${model.wallet<total?` · Need ${(total-model.wallet).toLocaleString()} more`:''}`));
  const equipped=recipe&&Object.entries(recipe.parts).every(([slot,id])=>equipment[slot]===id);
  const equip=button(!recipe||equipped?'EQUIPPED':missing.length?showMissing?'HIDE PARTS':`GET ${missing.length} PARTS`:'EQUIP BUILD',()=>{if(missing.length){showMissing=!showMissing;render();detail.querySelector('.build-missing')?.scrollIntoView({block:'nearest'});}else {onEquip(recipe);root.querySelector('[data-build="current"]')?.focus({preventScroll:true});}},'build-home-equip');equip.disabled=!recipe||equipped;
  actions.append(equip,button('TRY SWORD',()=>onSword(model.preview),'build-home-test'));detail.append(summary,actions);
  if(missing.length&&showMissing){const checklist=el('section','build-missing');checklist.append(el('small','','CHOOSE A PART TO BUY · EQUIP AFTER ALL PARTS ARE OWNED'));
   for(const id of missing){const item=ITEMS.find(x=>x.id===id),row=button('',()=>onPart(id,recipe));row.dataset.missingPart=id;row.append(el('span','',item.name),el('b','',item.price===null?'QUEST UNLOCK':`${item.price} CREDITS`));checklist.append(row);}detail.append(checklist);
  }
  list.scrollTop=oldScroll;
 }
 function draw(now){if(root.dataset.section!=='builds'||root.dataset.pane==='preview')return;const viewport=list.getBoundingClientRect();for(const entry of art){const box=entry.canvas.getBoundingClientRect();if(box.bottom<viewport.top||box.top>viewport.bottom)continue;drawShopCardArt(entry.canvas.getContext('2d'),240,150,{equipment:entry.eq,slot:'body',sword:entry.sword,time:motion()?now/16.667:0,motion:motion(),selected:entry.selected});}}
 return {render,draw,host};
}
