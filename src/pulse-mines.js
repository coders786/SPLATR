import {eyeSight} from './eye-toolkit.js';
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export const PULSE_MINE=Object.freeze({cap:4,arm:45,life:240,batSpeed:16,radius:16});
export function spawnPulseMine(mines,ring,player,arena){
 if(mines.length>=PULSE_MINE.cap)return null;
 const dx=player.x-ring.x,dy=player.y-ring.y,n=Math.hypot(dx,dy)||1,margin=40;
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const m={x:clamp(ring.x+dx/n*125,arena.x+margin,arena.x+arena.w-margin),y:clamp(ring.y+dy/n*125,arena.y+margin,arena.y+arena.h-margin),age:0,life:PULSE_MINE.life,friendly:false,vx:0,vy:0};m.px=m.x;m.py=m.y;mines.push(m);return m;
}
/** Warning first; a live blade bats a mine, turning it into a friendly projectile. */
export function stepPulseMines(mines,{dt=1,player,previousPlayer=player,blade=0,angle=0,enemies,geometry=[],arena,onHurt=()=>{},onBat=()=>{},onHit=()=>{}}){
 if(!(dt>0))return;
 for(let i=mines.length-1;i>=0;i--){
  const m=mines[i];m.px=m.x;m.py=m.y;m.age+=dt;m.life-=dt;
  if(m.life<=0){mines.splice(i,1);continue;}
  if(!m.friendly){
   const dist=segmentDistance(m,previousPlayer,player);
   if(blade>0&&dist<=55&&eyeSight(player,m,geometry)){m.friendly=true;m.vx=Math.cos(angle)*PULSE_MINE.batSpeed;m.vy=Math.sin(angle)*PULSE_MINE.batSpeed;onBat(m);continue;}
   if(m.age>=PULSE_MINE.arm&&dist<=PULSE_MINE.radius+22){mines.splice(i,1);onHurt(m);}
   continue;
  }
  const end={x:m.x+m.vx*dt,y:m.y+m.vy*dt};
  if(!eyeSight(m,end,geometry)||end.x<arena.x||end.x>arena.x+arena.w||end.y<arena.y||end.y>arena.y+arena.h){mines.splice(i,1);continue;}
  m.x=end.x;m.y=end.y;
  const target=[...enemies.values()].filter(e=>e.hp>0&&e.kind!=='monolith'&&!e.paper&&!e.tutorialProtected&&segmentDistance(e,{x:m.px,y:m.py},end)<=e.r+PULSE_MINE.radius&&eyeSight(m,e,geometry)).sort((a,b)=>Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y)||String(a.id).localeCompare(String(b.id)))[0];
  if(target){mines.splice(i,1);onHit(target,m);}
 }
}
