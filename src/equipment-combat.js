// Bounded, deterministic equipment targeting. No renderer or persistence dependencies.
export const EQUIPMENT_LIMITS=Object.freeze({projectiles:8,echoes:3,bursts:12});
export function nearestEquipmentTarget(enemies,origin,radius,exclude=null,fangOnly=false) {
  return [...enemies].filter(e=>e.id!==exclude&&e.hp>0&&(!fangOnly||e.kind==='fang')&&Math.hypot(e.x-origin.x,e.y-origin.y)<=radius)
    .sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
export function aimPull(enemy,player,angle,dt=1) {
  if(enemy.kind!=='fang'||!enemy.small||Math.hypot(enemy.x-player.x,enemy.y-player.y)>220)return null;
  const dx=Math.cos(angle),dy=Math.sin(angle),projection=(enemy.x-player.x)*dx+(enemy.y-player.y)*dy;
  if(projection<0)return null;
  const tx=player.x+dx*projection,ty=player.y+dy*projection,d=Math.hypot(tx-enemy.x,ty-enemy.y);
  if(d<.01)return null;
  const step=Math.min(d,.35*Math.max(0,dt));return {x:enemy.x+(tx-enemy.x)/d*step,y:enemy.y+(ty-enemy.y)/d*step};
}
export function horizontalCutWidth(angle,rules){return rules.cutWidth*(Math.abs(Math.sin(angle))<=Math.sin(25*Math.PI/180)?rules.horizontalWidth:1);}
