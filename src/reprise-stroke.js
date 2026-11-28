/** C66 bounded traveled-path replay. One reserved pending source, never an
 * evicted promise. Physics supplies measured subsegments; rendering is inert. */
import Matter from 'matter-js';
import {eyeSight} from './eye-toolkit.js';
export const REPRISE=Object.freeze({length:140,samples:6,spacing:28,delay:12,width:12,targets:2,active:3,fade:3});
const kinds=new Set(['fang','pulse','prism','fork','bastion','rift','well','crown','monolith']);
export const repriseEligible=(e,allowBoss=false)=>!!e&&e.hp>0&&kinds.has(e.kind)&&!e.paper&&!e.tutorialProtected&&!e.tutorialTargetPlayer&&(!e.pinned||e.kind==='monolith')&&(e.kind!=='monolith'||allowBoss);
/** Expanded closed AABBs stop the full replay lane, including grazing walls. */
export function clipRepriseSegment(a,b,geometry=[],pad=REPRISE.width/2){
 let fraction=1;const dx=b.x-a.x,dy=b.y-a.y;
 for(const r of geometry){let lo=0,hi=1;for(const [k,d,size]of [['x',dx,'w'],['y',dy,'h']]){
  const min=r[k]-pad,max=r[k]+r[size]+pad;
  if(Math.abs(d)<1e-12){if(a[k]<min||a[k]>max){lo=2;break;}}
  else{const p=(min-a[k])/d,q=(max-a[k])/d;lo=Math.max(lo,Math.min(p,q));hi=Math.min(hi,Math.max(p,q));}
 }if(lo<=hi)fraction=Math.min(fraction,Math.max(0,lo-1e-6));}
 return {point:{x:a.x+dx*fraction,y:a.y+dy*fraction},clipped:fraction<1,fraction};
}
export function clipReprisePath(points,geometry=[]){
 if(!points.length)return [];
 const out=[{...points[0]}];
 for(let i=1;i<points.length;i++){const q=clipRepriseSegment(out.at(-1),points[i],geometry);if(Math.hypot(q.point.x-out.at(-1).x,q.point.y-out.at(-1).y)>1e-6)out.push(q.point);if(q.clipped)break;}
 return out;
}
/** Actual convex sensor queries, path-order priority, identity dedup and sight.
 * Damage is selected at replay time, not at launch/recording or near the hero. */
export function repriseCandidates(points,enemies,geometry=[],allowBoss=false){
 const eligible=[...enemies].filter(e=>repriseEligible(e,allowBoss)&&e.body),bodies=eligible.map(e=>e.body),found=new Map();let offset=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<1e-6)continue;
  for(const contact of Matter.Query.ray(bodies,a,b,REPRISE.width)){
   const e=contact.body.parent.plugin.enemy;if(!e||!eligible.includes(e))continue;
   const t=Math.max(0,Math.min(1,((e.x-a.x)*dx+(e.y-a.y)*dy)/(length*length))),on={x:a.x+dx*t,y:a.y+dy*t};
   if(!eyeSight(on,e,geometry))continue;const rank=offset+t*length;
   if(!found.has(e)||rank<found.get(e))found.set(e,rank);
  }
  offset+=length;
 }
 return [...found].sort((a,b)=>a[1]-b[1]||String(a[0].id).localeCompare(String(b[0].id))).slice(0,REPRISE.targets).map(([e])=>e);
}
export function createRepriseStroke(){
 let pending=null,last=null,serial=0;
 const path=p=>{const a=p.points.map(e=>({...e}));if(Math.hypot(p.tip.x-a.at(-1).x,p.tip.y-a.at(-1).y)>1e-6)a.push({...p.tip});return a.slice(0,REPRISE.samples);};
 const immutable=points=>Object.freeze(points.map(p=>Object.freeze({...p})));
 return {
  admit({shot=0,now=0,point,makeSource=()=>null}={}){
   if(pending||!point||![point.x,point.y,now].every(Number.isFinite))return false;
   pending={id:++serial,shot,born:now,due:now+REPRISE.delay,source:makeSource(),points:[{...point}],tip:{...point},last:{...point},length:0,next:REPRISE.spacing,sealed:null};return true;
  },
  seal(reason='discontinuity'){if(pending&&!pending.sealed)pending.sealed=reason;},
  record({from,to,start,end,discontinuity=false,geometry=[]}={}){
   const p=pending;if(!p||p.sealed||!(end>start)||start>=p.due||![from?.x,from?.y,to?.x,to?.y,start,end].every(Number.isFinite))return;
   if(Math.hypot(from.x-p.last.x,from.y-p.last.y)>1e-4){p.sealed='discontinuity';return;}
   const ratio=Math.min(1,(p.due-start)/(end-start)),raw={x:from.x+(to.x-from.x)*ratio,y:from.y+(to.y-from.y)*ratio},clip=clipRepriseSegment(from,raw,geometry),d=Math.hypot(clip.point.x-from.x,clip.point.y-from.y);
   if(d<1e-9){if(clip.clipped||discontinuity)p.sealed=clip.clipped?'wall':'discontinuity';p.last={...to};return;}
   // Preserve a measured bend instead of drawing a new diagonal shortcut.
   // Gently curving flight is sampled; a sharp turn consumes a real vertex.
   const direction={x:(clip.point.x-from.x)/d,y:(clip.point.y-from.y)/d};
   if(p.direction&&p.direction.x*direction.x+p.direction.y*direction.y<Math.cos(.06)&&Math.hypot(p.tip.x-p.points.at(-1).x,p.tip.y-p.points.at(-1).y)>1e-6){
    if(p.points.length>=REPRISE.samples-1){p.sealed='samples';return;}
    p.points.push({...p.tip});
   }
   p.direction=direction;
   const amount=Math.min(d,REPRISE.length-p.length),tip={x:from.x+(clip.point.x-from.x)*amount/d,y:from.y+(clip.point.y-from.y)*amount/d};
   // Stop rather than ever simplifying a recorded corner through a new solid.
   const safe=clipRepriseSegment(p.points.at(-1),tip,geometry);if(safe.clipped){p.tip=safe.point;p.sealed='wall';p.last={...to};return;}
   while(p.next<=p.length+amount+1e-9&&p.points.length<REPRISE.samples-1){const t=(p.next-p.length)/amount;p.points.push({x:from.x+(tip.x-from.x)*t,y:from.y+(tip.y-from.y)*t});p.next+=REPRISE.spacing;}
   p.tip=tip;p.length+=amount;p.last={...to};
   if(amount<d||p.length>=REPRISE.length-1e-8)p.sealed='length';else if(clip.clipped)p.sealed='wall';else if(discontinuity)p.sealed='discontinuity';else if(ratio<1)p.sealed='deadline';
  },
  fire(now,enemies,{geometry=[],allowBoss=false,hit=()=>{}}={}){
   if(!pending||now<pending.due)return false;
   const p=pending;pending=null;const points=clipReprisePath(path(p),geometry),victims=repriseCandidates(points,enemies.values(),geometry,allowBoss),hits=[];
   // Slot is consumed before callback; no recursive damage or mutable reuse.
   for(const target of victims)if(enemies.get(target.id)===target&&repriseEligible(target,allowBoss)){hit(target,{target,shot:p.shot,index:0,source:p.source,repriseId:p.id});hits.push(Object.freeze({id:target.id,x:target.x,y:target.y}));}
   last=Object.freeze({id:p.id,sourceShot:p.shot,born:p.born,due:p.due,path:immutable(points),hits:Object.freeze(hits),sealed:p.sealed,width:REPRISE.width});return true;
  },
  clear(){pending=null;last=null;},
  view(now=0){return Object.freeze({ready:!pending,pending:pending?Object.freeze({id:pending.id,sourceShot:pending.shot,born:pending.born,due:pending.due,path:immutable(path(pending)),length:pending.length,sealed:pending.sealed,width:REPRISE.width}):null,
   replay:last&&now<last.due+REPRISE.active+REPRISE.fade?Object.freeze({...last,phase:now<last.due+REPRISE.active?'replay':'dissolve'}):null});},
 };
}
