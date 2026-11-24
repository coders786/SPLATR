/** Pure wave-bank recognition and steering. No physics/DOM/store imports.
 * Distances are world pixels, speeds px/nominal tick, time simulation ticks. */
export const CLEAN_BANK = Object.freeze({travel:140,clearance:64,cooldown:24,corner:90,chainWindow:180,slowGrace:90,maxSteer:Math.PI/3});
export function createCleanBanks(){return {ticks:0,travel:0,away:true,armed:false,shot:0,total:0,chain:0,best:0,lastSide:null,lastAt:-Infinity,slow:0,flash:0,steered:false,retention:0};}
export function steerBank(velocity,normal,aim){
 const speed=Math.hypot(velocity.x,velocity.y),n=Math.hypot(normal.x,normal.y),a=aim&&Math.hypot(aim.x,aim.y);
 if(!speed||!n||!a||![speed,n,a].every(Number.isFinite))return {...velocity};
 const nx=normal.x/n,ny=normal.y/n,ax=aim.x/a,ay=aim.y/a;
 if(ax*nx+ay*ny<=0)return {...velocity}; // Never turn a bank back into its wall.
 const angle=Math.max(-CLEAN_BANK.maxSteer,Math.min(CLEAN_BANK.maxSteer,Math.atan2(ay*nx-ax*ny,ax*nx+ay*ny)));
 return {x:speed*(nx*Math.cos(angle)-ny*Math.sin(angle)),y:speed*(ny*Math.cos(angle)+nx*Math.sin(angle))};
}
export function stepCleanBanks(previous,{dt=1,active=true,distance=0,speed=0,target=18,shot=0,clearance=Infinity,contact=null,arena=null}={}){
 const p={...previous};if(!active)return {state:p,event:null};
 const t=Number.isFinite(dt)?Math.max(0,Math.min(1,dt)):0;if(!t)return {state:p,event:null};
 p.ticks+=t;p.flash=Math.max(0,p.flash-t);
 if(shot>p.shot){p.shot=shot;p.armed=true;}
 const moved=Number.isFinite(distance)?Math.max(0,distance):0;
 if(clearance>=CLEAN_BANK.clearance)p.away=true;
 if(p.away)p.travel+=Math.min(moved,Math.max(0,Number.isFinite(speed)?speed:0)*t);
 p.slow=speed<target?p.slow+t:0;
 if(p.slow>CLEAN_BANK.slowGrace||p.ticks-p.lastAt>CLEAN_BANK.chainWindow)p.chain=0;
 if(contact?.side==='bottom'){p.armed=false;p.chain=0;return {state:p,event:null};}
 if(!contact||!['left','right','top'].includes(contact.side)||!p.armed)return {state:p,event:null};
 const incoming=Math.hypot(contact.incomingX,contact.incomingY),outgoing=Math.hypot(contact.outgoingX,contact.outgoingY);
 const normalSpeed=-(contact.incomingX*contact.nx+contact.incomingY*contact.ny);
 const corner=arena&&(contact.side==='top'?Math.min(contact.x-arena.x,arena.x+arena.w-contact.x):Math.min(contact.y-arena.y,arena.y+arena.h-contact.y))<CLEAN_BANK.corner;
 const separated=p.lastSide===null||p.away&&p.travel>=CLEAN_BANK.travel;
 if(corner||!Number.isFinite(incoming)||!Number.isFinite(outgoing)||incoming<target||normalSpeed<target*.5||outgoing<incoming*.7||!separated||p.ticks-p.lastAt<CLEAN_BANK.cooldown)return {state:p,event:null};
 p.total++;p.chain++;p.best=Math.max(p.best,p.chain);p.lastSide=contact.side;p.lastAt=p.ticks;p.travel=0;p.away=false;p.flash=54;p.retention=Math.min(1,outgoing/incoming);p.steered=false;
 return {state:p,event:{side:contact.side,incoming,outgoing,arrivalSpeed:incoming,exitSpeed:outgoing,retention:p.retention,total:p.total,chain:p.chain,paceTarget:target,paceQualified:true,x:contact.x,y:contact.y,nx:contact.nx,ny:contact.ny}};
}
