import {eyeSight} from './eye-toolkit.js';
export const HIJACKED_LINK=Object.freeze({life:60,warmup:10,width:14,cap:3,targets:6});
export function hijackLink(links,cells,enemies,defeated,shot){
 if(defeated.kind!=='prism')return null;
 for(const cell of cells.values()){
  const link=cell.link;if(!link||link.a!==defeated.id&&link.b!==defeated.id)continue;
  const partner=enemies.get(link.a===defeated.id?link.b:link.a);if(!partner)return null;
  const result={x:defeated.x,y:defeated.y,partner:partner.id,shot,life:HIJACKED_LINK.life,hits:new Set()};
  if(links.length>=HIJACKED_LINK.cap)links.shift();links.push(result);return result;
 }
 return null;
}
function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function stepHijackedLinks(links,{dt=1,enemies,geometry=[],onHit=()=>{}}){
 if(!(dt>0))return;
 for(let i=links.length-1;i>=0;i--){
  const l=links[i],partner=enemies.get(l.partner);l.life-=dt;
  if(!partner||l.life<=0||!eyeSight(l,partner,geometry)){links.splice(i,1);continue;}
  if(l.life>HIJACKED_LINK.life-HIJACKED_LINK.warmup)continue;
  for(const e of enemies.values()){
   if(l.hits.size>=HIJACKED_LINK.targets)break;
   if(e===partner||e.kind==='monolith'||e.paper||e.tutorialProtected||e.tutorialTargetPlayer||e.hp<=0||l.hits.has(e.id))continue;
   if(distance(e,l,partner)>HIJACKED_LINK.width+e.r||!eyeSight(l,e,geometry))continue;
   l.hits.add(e.id);onHit(e,l);
  }
 }
}
