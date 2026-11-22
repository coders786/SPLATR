/** Rest-only landing assist. Pure steering: no teleport, scoring or choice. */
export function platformMagnet(platform,position,velocity,{active=true,held=false,launchGrace=0,dt=1,arena=null}={}){
 const off={active:false,vx:velocity?.x||0,vy:velocity?.y||0};
 if(!active||held||launchGrace>0||!platform||![platform.x,platform.y,platform.w,position?.x,position?.y,velocity?.x,velocity?.y,dt].every(Number.isFinite)||dt<=0)return off;
 const center=platform.x+platform.w/2,top=platform.y-23;
 if(Math.hypot(position.x-center,position.y-top)>440)return off;
 let tx=center,ty=top,route='land';
 // Below the deck: move around the nearest end, then rise beside it.
 // The extra body-width clearance keeps the solid underside out of the path.
 if(position.y>top+3){
  let side=position.x<center?-1:1;
  if(arena&&platform.x-60<arena.x+30)side=1;
  if(arena&&platform.x+platform.w+60>arena.x+arena.w-30)side=-1;
  const edge=side<0?platform.x-60:platform.x+platform.w+60;
  tx=edge;ty=position.y;route='around';
  if(position.x<platform.x-37||position.x>platform.x+platform.w+37){ty=platform.y-85;route='rise';}
 }
 const dx=tx-position.x,dy=ty-position.y;
 const targetX=Math.max(-12,Math.min(12,dx*.11)),targetY=Math.max(-12,Math.min(7,dy*.13));
 const blend=1-Math.exp(-.28*Math.min(1,dt));
 return {active:true,route,targetX:tx,targetY:ty,vx:Math.max(-14,Math.min(14,velocity.x+(targetX-velocity.x)*blend)),vy:Math.max(-14,Math.min(9,velocity.y+(targetY-velocity.y)*blend))};
}
