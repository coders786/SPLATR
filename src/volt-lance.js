/** C62 local movement ownership and finite first-contact conduction.
 * No renderer, RNG, persistence or primary-resource authority. */
import {eyeSight} from './eye-toolkit.js';
export const VOLT=Object.freeze({gain:.12,hold:4,recover:6,width:.85,range:120,coilRange:160,flash:6});
const kinds=new Set(['fang','pulse','prism','fork','bastion','rift','well','crown']);
export const voltEligible=e=>!!e&&e.hp>0&&kinds.has(e.kind)&&!e.paper&&!e.pinned&&!e.tutorialProtected&&!e.tutorialTargetPlayer;
const same=(a,b)=>!!a&&Math.hypot(a.x-b.x,a.y-b.y)<1e-6;
/** Owns a velocity-vector contribution, not a radial speed target. Gravity
 * remains independent. Caps scale its ownership by the same actual factor.
 * Any unrelated velocity writer/contact takes ownership; no later clawback. */
export function createVoltBurst(){
 let extra={x:0,y:0},expected=null,born=0,last=0,reason=null,initial=0;
 const clear=(why=null)=>{extra={x:0,y:0};expected=null;reason=why;};
 return {
  clear,
  baseVelocity(v){return same(expected,v)?{x:v.x-extra.x,y:v.y-extra.y}:{...v};},
  launch(v,{now=0,limit=42,hyper=false}={}){
   clear();born=last=now;const speed=Math.hypot(v.x,v.y);
   if(hyper||!Number.isFinite(speed)||speed<.001||speed>limit+1e-7||!Number.isFinite(now)){reason='protected';initial=0;return {...v};}
   extra={x:v.x*VOLT.gain,y:v.y*VOLT.gain};initial=Math.hypot(extra.x,extra.y);expected={x:v.x+extra.x,y:v.y+extra.y};return {...expected};
  },
  advance(v,now,dt,{hyper=false}={}){
   if(!expected||!(dt>0)||!Number.isFinite(now+dt))return {...v};
   if(hyper||!same(expected,v)){clear(hyper?'hyper':'external');return {...v};}
   const end=Math.max(last,now+dt),a=Math.max(last,born+VOLT.hold),b=Math.min(end,born+VOLT.hold+VOLT.recover);
   if(b>a){const remain=Math.max(1e-9,born+VOLT.hold+VOLT.recover-a),ratio=Math.min(1,(b-a)/remain),removed={x:extra.x*ratio,y:extra.y*ratio};extra={x:extra.x-removed.x,y:extra.y-removed.y};expected={x:v.x-removed.x,y:v.y-removed.y};}
   last=end;const result={...expected};if(end>=born+VOLT.hold+VOLT.recover)clear('complete');
   return result;
  },
  observe(v,{discontinuity=false,velocityScale=1}={}){
   if(!expected)return;
   if(discontinuity){clear('contact');return;}
   const factor=Math.max(0,Math.min(1,velocityScale));extra={x:extra.x*factor,y:extra.y*factor};expected={...v};
   if(Math.hypot(extra.x,extra.y)<1e-8)clear('complete');
  },
  view(now=0){const amount=Math.hypot(extra.x,extra.y);return Object.freeze({amount,initial,born,phase:amount>1e-8?(now<born+VOLT.hold?'burst':'recover'):'idle',reason});},
 };
}
export function createVoltConduction(){
 let shot=-1,spent=true,last=null,serial=0;
 return {
  launch(id){shot=id;spent=false;},
  clear(){shot=-1;spent=true;last=null;},
  contact(center,{primary=false,now=0,enemies=new Map(),geometry=[],coil=false,hit=()=>{},makeSource=()=>null}={}){
   if(!primary||spent||shot<0||!Number.isFinite(now)||!center||(!voltEligible(center)&&!(center.hp<=0&&kinds.has(center.kind)&&!center.paper&&!center.pinned&&!center.tutorialProtected&&!center.tutorialTargetPlayer)))return false;
   spent=true;const origin={x:center.x,y:center.y},used=new Set([center]),links=[],id=++serial;
   // Reserve the complete distinct-target set before any child can mutate it.
   for(const [role,range]of coil?[['volt',VOLT.range],['coil',VOLT.coilRange]]:[['volt',VOLT.range]]){
    const target=[...new Set(enemies.values())].filter(e=>!used.has(e)&&voltEligible(e)&&Math.hypot(e.x-origin.x,e.y-origin.y)<=range&&eyeSight(origin,e,geometry))
     .sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||String(a.id).localeCompare(String(b.id)))[0];
    if(target){used.add(target);links.push({target,role,range});}
   }
   const source=links.length?makeSource(shot):null,receipt=[];
   for(const {target,role,range}of links)if(enemies.get(target.id)===target&&voltEligible(target)){
    const point={id:target.id,x:target.x,y:target.y,role,range};hit(target,{target,shot,source,index:receipt.length,conductionId:id});receipt.push(Object.freeze(point));
   }
   last=Object.freeze({id,sourceShot:shot,born:now,expires:now+VOLT.flash,origin:Object.freeze(origin),links:Object.freeze(receipt),coil});return true;
  },
  view(now=0){return Object.freeze({ready:!spent,sourceShot:shot,arc:last&&now<last.expires?last:null});},
 };
}
