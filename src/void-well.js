/** C65 one-live-field authority. Owns selection, force budget and one pulse,
 * never renderer clocks, player physics, damage scaling or saved data. */
import {eyeSight} from './eye-toolkit.js';
export const VOID=Object.freeze({radius:110,core:28,duration:18,cooldown:36,targets:3,travel:32,aftermath:8,leash:110});
const kinds=new Set(['fang','pulse','prism','fork','bastion','rift','well','crown']);
export const voidEligible=e=>!!e&&e.hp>0&&kinds.has(e.kind)&&!e.pinned&&!e.paper&&!e.tutorialProtected&&!e.tutorialTargetPlayer;
/** Conservative swept body-AABB clipping. A field cannot teleport a sensor
 * through solids or use a huge dt to skip a wall; stop just before contact. */
export function voidMove(e,dx,dy,{geometry=[],arena=null}={}){
 if(![dx,dy,e.x,e.y].every(Number.isFinite))return {x:e.x,y:e.y};
 let t=1;const r=Math.max(0,e.r||0),start={x:e.x,y:e.y};
 for(const wall of geometry){
  let lo=0,hi=1;for(const [k,d,size]of [['x',dx,'w'],['y',dy,'h']]){
   const min=wall[k]-r,max=wall[k]+wall[size]+r;
   if(Math.abs(d)<1e-12){if(start[k]<min||start[k]>max){lo=2;break;}}
   else{const a=(min-start[k])/d,b=(max-start[k])/d;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
  }
  if(lo<=hi)t=Math.min(t,Math.max(0,lo-1e-6));
 }
 if(arena)for(const [k,d,size]of [['x',dx,'w'],['y',dy,'h']]){
  if(d>0)t=Math.min(t,Math.max(0,(arena[k]+arena[size]-r-start[k])/d));
  if(d<0)t=Math.min(t,Math.max(0,(arena[k]+r-start[k])/d));
 }
 // Respect the ordinary post leash without snapping an already-rushing body.
 if(Number.isFinite(e.postX)&&Number.isFinite(e.postY)){
  const x=e.x-e.postX,y=e.y-e.postY,limit=Math.max(VOID.leash,Math.hypot(x,y)),a=dx*dx+dy*dy,b=2*(x*dx+y*dy),c=x*x+y*y-limit*limit;
  if(a>0&&(x+dx*t)**2+(y+dy*t)**2>limit*limit){const root=(-b+Math.sqrt(Math.max(0,b*b-4*a*c)))/(2*a);t=Math.min(t,Math.max(0,root));}
 }
 return {x:e.x+dx*t,y:e.y+dy*t};
}
export function createVoidWell(){
 let shot=-1,spent=false,field=null,last=null,readyAt=-Infinity,serial=0;
 const alive=(entry,enemies)=>enemies.get(entry.target.id)===entry.target&&voidEligible(entry.target);
 return {
  launch(id){shot=id;spent=false;},
  contact(center,{primary=false,now=0,enemies=[],geometry=[],makeSource=()=>null}={}){
   if(shot<0||!primary||spent||!Number.isFinite(now)||!center||(!voidEligible(center)&&!(center.hp<=0&&kinds.has(center.kind)&&!center.pinned&&!center.paper&&!center.tutorialProtected&&!center.tutorialTargetPlayer)))return null;
   spent=true;
   if(field||now<readyAt)return null;
   const origin={x:center.x,y:center.y};
   const selected=[...new Set(enemies)].filter(e=>voidEligible(e)&&Math.hypot(e.x-origin.x,e.y-origin.y)<=VOID.radius&&eyeSight(origin,e,geometry))
    .sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||String(a.id).localeCompare(String(b.id))).slice(0,VOID.targets);
   field={...origin,id:++serial,shot,born:now,expires:now+VOID.duration,lastMotion:now,source:makeSource(shot),targets:selected.map(target=>({target,moved:0,lastMove:0}))};
   readyAt=now+VOID.cooldown;last=null;return this.view(now);
  },
  /** The continuous force uses only the not-yet-integrated world interval. */
  move(now,dt,enemies,{geometry=[],arena=null,motionScale=()=>1,commit=(e,p)=>Object.assign(e,p)}={}){
   if(!field||!(dt>0)||!Number.isFinite(dt))return;
   const start=Math.max(field.born,field.lastMotion,now),end=Math.min(field.expires,now+dt),span=Math.max(0,end-start);
   if(!span)return;field.lastMotion=end;
   for(const entry of field.targets){
    entry.lastMove=0;if(!alive(entry,enemies))continue;
    const e=entry.target,dx=field.x-e.x,dy=field.y-e.y,d=Math.hypot(dx,dy);
    if(!d||d>VOID.radius||!eyeSight(e,field,geometry))continue;
    const amount=Math.min(d,VOID.travel-entry.moved,VOID.travel/VOID.duration*span*Math.max(0,Math.min(1,motionScale(e,start,span))));
    if(amount<=0)continue;
    const p=voidMove(e,dx/d*amount,dy/d*amount,{geometry,arena}),actual=Math.hypot(p.x-e.x,p.y-e.y);
    if(actual>0){entry.moved+=actual;entry.lastMove=actual;commit(e,p);}
   }
  },
  /** No targeting replacement, early payout or reentrant double collapse. */
  finish(now,enemies,hit,geometry=[]){
   if(!field)return false;
   field.targets=field.targets.filter(entry=>alive(entry,enemies));
   if(now<field.expires)return false;
   const f=field;field=null;
   const victims=f.targets.filter(entry=>alive(entry,enemies)&&Math.hypot(entry.target.x-f.x,entry.target.y-f.y)<=VOID.core&&eyeSight(f,entry.target,geometry));
   last={x:f.x,y:f.y,born:f.born,expires:f.expires,id:f.id,sourceShot:f.shot,hits:victims.length};
   for(const entry of victims){const target=entry.target;hit(target,{target,shot:f.shot,index:0,source:f.source,fieldId:f.id});}
   return true;
  },
  owns(e,now,geometry=[]){return !!field&&now<field.expires&&field.targets.some(entry=>entry.target===e&&entry.moved<VOID.travel&&voidEligible(e)&&Math.hypot(e.x-field.x,e.y-field.y)<=VOID.radius&&eyeSight(e,field,geometry));},
  clear(){field=null;last=null;readyAt=-Infinity;shot=-1;spent=false;},
  view(now=0){
   const base={readyIn:Math.max(0,readyAt-now),shot,spent,radius:VOID.radius,core:VOID.core};
   if(field)return Object.freeze({...base,x:field.x,y:field.y,born:field.born,expires:field.expires,id:field.id,sourceShot:field.shot,phase:'pull',targets:Object.freeze(field.targets.filter(e=>voidEligible(e.target)).map(e=>Object.freeze({id:e.target.id,x:e.target.x,y:e.target.y,moved:e.moved,lastMove:e.lastMove})))});
   if(last&&now<last.expires+VOID.aftermath)return Object.freeze({...base,...last,phase:'collapse',targets:Object.freeze([])});
   return Object.freeze({...base,phase:now<readyAt?'cooldown':'ready',targets:Object.freeze([])});
  },
 };
}
