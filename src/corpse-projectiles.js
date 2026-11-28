import {eyeSight} from './eye-toolkit.js';

export const CORPSE_SHARD=Object.freeze({speed:15,radius:10,life:36,cap:8});
const eligible=e=>e&&e.hp>0&&e.kind!=='monolith'&&!e.paper&&!e.tutorialProtected&&!e.tutorialTargetPlayer;
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function flingCorpse(shards,origin,angle,shot){
 if(!Number.isFinite(angle)||!Number.isFinite(origin?.x)||!Number.isFinite(origin?.y))return null;
 const shard={x:origin.x,y:origin.y,px:origin.x,py:origin.y,vx:Math.cos(angle)*CORPSE_SHARD.speed,vy:Math.sin(angle)*CORPSE_SHARD.speed,life:CORPSE_SHARD.life,shot,sourceId:origin.id};
 if(shards.length>=CORPSE_SHARD.cap)shards.shift();shards.push(shard);return shard;
}
/** One honest projectile: static geometry blocks it; it can strike one body. */
export function stepCorpseProjectiles(shards,{dt=1,enemies,geometry=[],arena,onHit=()=>{}}){
 if(!(dt>0))return;
 for(let i=shards.length-1;i>=0;i--){
  const s=shards[i],a={x:s.x,y:s.y},b={x:s.x+s.vx*dt,y:s.y+s.vy*dt};s.px=s.x;s.py=s.y;s.life-=dt;
  if(s.life<=0||!eyeSight(a,b,geometry)||arena&&(b.x<arena.x||b.x>arena.x+arena.w||b.y<arena.y||b.y>arena.y+arena.h)){shards.splice(i,1);continue;}
  s.x=b.x;s.y=b.y;
  const targets=[...enemies.values()].filter(e=>e.id!==s.sourceId&&eligible(e)&&segmentDistance(e,a,b)<=CORPSE_SHARD.radius+e.r&&eyeSight(a,e,geometry))
   .sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y)||String(x.id).localeCompare(String(y.id)));
  if(targets.length){shards.splice(i,1);onHit(targets[0],s);}
 }
}
