import { arc, blade, cube, cutFigure, disk, foe, line, poly, shearInk } from './art.js';
import { clamp } from './levels.js';
import { INK } from './shapes.js';
import { projectilePoint } from './physics.js';
import { toScreen } from './camera.js';

// All the automatic teaching lives on the punched first-run ticket. These
// scenes describe actual game states, not a timer that advances a slideshow.
export function sceneFor(s, target, falling, gap) {
  if (!s.story || !['ready','playing'].includes(s.phase)) return null;
  const o=s.opening;
  if (o) {
    if (o.returning) return 'rewind';
    if (!o.rest || o.finishing) return null;
    if (!s.edge && !o.free) return 'stock';
    if (o.row===2) return target?.hp===1?'crack':'shell';
    if (o.misses) return 'retry';
    return o.row===1?'pull':'tap';
  }
  // ── THE LIVE FIELD GETS ONE CARD, NOT A ROTATING SET ─────────────────────
  //
  // Below this line were four rules that fired at ANY altitude: `net` above,
  // then `rise` (you are falling), `focus` (you jumped with no breath) and
  // `stock` (no pips). Because they were keyed to the cube's STATE rather than
  // to being new, they kept firing forever -- a player in Sector 32 who fell
  // near the floor got the bounce card again, then rose, then got it again.
  // That is the teleporting "haunted card": same card, two anchor sides, chosen
  // by whichever rule was true this frame.
  //
  // The live field now shows ONE card, once, on the transition out of the
  // Cutting Room, and never again for that run. `s.tutorialActive` is cleared
  // by `enterField()` and is never set again.
  if (!s.tutorialActive) return null;
  if(s.caught) return 'net';
  if(s.phase==='ready' && target?.sentry) return 'lane';
  if(s.net && falling && gap<400) return 'rise';
  if(s.firstAir && s.breath>0) return 'focus';
  if(s.band===1 && s.edge===0) return 'stock';
  return null;
}

const paper='#f0dfbd', ink='#232b2a', fern='#206253', seam='#aa997c', acid=INK.acid;
const smooth=(v)=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
function arrow(c,color,x,y,xx,yy,width=2,head=6){
  const a=Math.atan2(yy-y,xx-x),dx=Math.cos(a),dy=Math.sin(a);
  line(c,color,width,x,y,xx-dx*head*.6,yy-dy*head*.6);
  poly(c,color,[[xx,yy],[xx-dx*head-dy*head*.55,yy-dy*head+dx*head*.55],[xx-dx*head+dy*head*.55,yy-dy*head-dx*head*.55]]);
}
function clockFace(c,x,y,r){arc(c,fern,1.7,x,y,r);line(c,fern,1.8,x,y-r*.68,x,y,x+r*.53,y+r*.22);}
function key(c,x,y,kind,down){
  c.save();c.translate(x,y);const w=kind==='space'?33:20;
  c.fillStyle=ink;c.fillRect(-w/2,-8,w,19);
  c.fillStyle=down?acid:INK.paper;c.fillRect(2-w/2,down?-5:-8,w-4,down?13:14);
  if(kind==='space')line(c,ink,1.9,8-w/2,-.8,8-w/2,2.5,w/2-8,2.5,w/2-8,-.8);
  else if(kind==='shift')poly(c,ink,[[-6,0],[0,-6],[6,0],[2.8,0],[2.8,5],[-2.8,5],[-2.8,0]]);
  else arrow(c,ink,-5,3,5,-4,1.5,4);
  c.restore();
}
// The nib is at (0,0). A press ring appears at the contact, not at the wrist.
function hand(c,x,y,device,down,size=1){
  c.save();c.translate(x,y);c.scale(size,size);
  if(device==='keys')key(c,7,9,'space',down);
  else if(device==='touch'){
    c.rotate(-.28); c.beginPath();c.moveTo(-3,17);c.lineTo(-3,2);
    c.bezierCurveTo(-3,-2,3,-2,3,2);c.lineTo(3,12);
    c.bezierCurveTo(3,8,8,8,9,12);c.bezierCurveTo(10,9,14,10,15,14);
    c.bezierCurveTo(18,12,21,14,21,18);c.lineTo(20,29);c.lineTo(16,35);c.lineTo(2,33);
    c.lineTo(-8,21);c.bezierCurveTo(-12,15,-7,13,-3,17);c.closePath();
    c.fillStyle=INK.paper;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();
    line(c,ink,1.3,3,12,3,17);line(c,ink,1.2,9,12,9,17);line(c,ink,1.2,15,14,15,19);
    poly(c,down?acid:'#9ac3ac',[[0,30],[18,31],[16,36],[3,35]],ink,1.4);
  }else{
    poly(c,INK.paper,[[0,0],[3,25],[9,18],[15,28],[20,25],[14,16],[24,15]],ink,2.1);
    if(down)poly(c,acid,[[4,8],[6,18],[10,14],[16,13]]);
  }
  c.restore();
}
function tapMark(c,x,y,device,down){
  for(let j=0;j<3;j++){const a=-Math.PI+j*.99;line(c,fern,2,x+Math.cos(a)*8,y+Math.sin(a)*8,x+Math.cos(a)*13,y+Math.sin(a)*13);}
  hand(c,x,y,device,down,.7);
}
const flag=(c,x,y,r)=>foe(c,'fang',x,y,r,1.15,{paper:true});
const scraps=(c,k,x,y,r,opts={})=>cutFigure(c,k,x,y,r,k==='fang'&&opts.paper?1.15:0,-.49,r*.29,{twist:.09,...opts});
function stocks(c,x,y,n,f=0){
  for(let i=0;i<3;i++){
    c.fillStyle=ink;c.fillRect(x+i*12,y,10,7);
    c.fillStyle=i<n?acid:'#857f71';c.fillRect(x+i*12+1.5,y+1.5,7,4);
    if(i===n){c.fillStyle=paper;c.fillRect(x+i*12+1.5,y+1.5,7*f,4);}
  }
}
// A ruled bar, not a hazard stripe. It used to be red on red (#ab3c55 with ink
// slashes) and sat under every `net`/`rise` impression, which made the tutorial
// card the last surface in the game still drawn in the Red Line's palette. The
// card is teaching a movement, so the bar is now a cool rule -- the same family
// as the floor gauge it is illustrating.
function stripe(c,y){
  c.fillStyle='#4a5f6b';c.fillRect(-30,y,60,6);
  for(let x=-25;x<25;x+=13)line(c,'#8fa9b8',1.6,x,y+5,x+3,y+1);
}
function splitLine(c){shearInk(c,-27,15,-.43,61,6);}
// Three tiny proof impressions show cause and effect even with all animation
// disabled. They are never interactive buttons and never mask a real target.
function impression(c,scene,i,device){
  if(scene==='tap'||scene==='retry'||scene==='rewind'){
    if(i===0 && scene!=='tap'){
      cube(c,-17,8,7);arrow(c,fern,21,-11,-5,4,2,6);arc(c,seam,1.5,-17,8,12);
    }else if(i===0){flag(c,-4,-3,15);if(device==='keys')key(c,8,12,'space',true);else tapMark(c,-2,-5,device,true);}
    else if(i===1){cube(c,-21,10,8,-.17);for(let k=0;k<4;k++)disk(c,fern,-8+k*6,6-k*2.9,1.8);flag(c,21,-8,10);}
    else {scraps(c,'fang',-10,3,12,{paper:true});scraps(c,'fang',13,-7,13,{paper:true});splitLine(c);}
  }else if(scene==='pull'||scene==='focus'){
    if(i===0){
      if(scene==='focus'){clockFace(c,15,-10,8);stocks(c,-18,15,2);} else arc(c,fern,1.6,-9,-6,9);
      if(device==='keys')key(c,-7,3,scene==='focus'?'shift':'aim',true);else tapMark(c,-8,-4,device,true);
    }else if(i===1){
      if(device==='keys'){key(c,-14,5,'aim',true);arrow(c,fern,4,4,22,-10,2,7);}
      else {arc(c,seam,1.4,13,-11,5);arrow(c,fern,10,-9,-15,9,2.4,7);hand(c,-16,7,device,true,.61);}
    }else{cube(c,-15,9,8,-.24);shearInk(c,-7,8,-.57,39,6);scraps(c,'fang',20,-11,11,{paper:scene==='pull'});if(scene==='focus')stocks(c,-17,17,3);}
  }else if(scene==='shell'){
    if(i===0){foe(c,'bastion',0,0,19);}
    else if(i===1){blade(c,-24,14,-.47,12);foe(c,'bastion',4,-1,15);hand(c,6,1,device,true,.64);}
    else{foe(c,'bastion',0,0,19,0,{hp:1,fault:-.49});poly(c,'#fa9580',[[14,-18],[24,-20],[19,-15],[13,-15]],ink,1);}
  }else if(scene==='crack'){
    if(i===0)foe(c,'bastion',0,0,19,0,{hp:1,fault:-.49});
    else if(i===1){foe(c,'bastion',-4,-2,15,0,{hp:1,fault:-.49});tapMark(c,1,1,device,true);}
    else{scraps(c,'bastion',1,0,18,{hp:1,fault:-.49});splitLine(c);}
  }else if(scene==='lane'){
    if(i===0){foe(c,'fang',-14,0,16);c.setLineDash([3,3]);line(c,'#5f7f8f',2,0,0,26,0);c.setLineDash([]);}
    else if(i===1){arrow(c,'#5f7f8f',-25,0,25,0,3,8);cube(c,0,12,6);arrow(c,fern,0,5,10,-16,2,6);}
    else{scraps(c,'fang',-2,1,17);splitLine(c);}
  }else if(scene==='net'||scene==='rise'){
    stripe(c,13);
    if(i===0){cube(c,-6,-12,7,.3);arrow(c,'#5f7f8f',4,-8,10,8,2,6);}
    if(i===1){c.beginPath();c.moveTo(-29,-2);c.quadraticCurveTo(0,17,29,-2);c.strokeStyle=fern;c.lineWidth=3;c.stroke();cube(c,0,0,7,.12);}
    if(i===2){cube(c,11,-15,6,-.26);arrow(c,fern,-9,8,4,-8,3,7);line(c,seam,1.8,-28,0,-12,5,-9,2);line(c,seam,1.8,6,5,9,7,29,1);}
  }else if(scene==='stock'){
    stocks(c,-17,6,i===0?0:i===1?0:1,i===1?.6:0);
    if(i===1)clockFace(c,-1,-8,9);else if(i===0)cube(c,0,-9,8);else shearInk(c,-15,-3,-.36,36,7);
  }
}
function film(c,v,scene,device,frame,actors){
  const z=Math.min(1.22,(v.width-32)/270,v.height*.157/64),
    x=Math.round(v.width/2),bottom=Math.round(v.height-Math.max(12,v.height*.032)-32*z),
    above=Math.round(Math.min(v.height*.34,120+32*z));
  const room=y=>Math.min(...actors.map(a=>Math.max(Math.abs(a.x-x)-139*z,Math.abs(a.y-y)-33*z)-a.r));
  const y=room(bottom)<8 && room(above)>room(bottom)?above:bottom;
  c.save();c.translate(x,y);c.scale(z,z);
  const cut=[[-136,-32],[128,-32],[137,-23],[137,24],[127,33],[-130,33],[-138,24],[-138,-24]];
  c.save();c.translate(2,3);poly(c,'#182a2c',cut);c.restore();poly(c,paper,cut,ink,2);
  for(let j=0;j<3;j++){
    const px=(j-1)*85;
    if(j>0){c.setLineDash([2.5,3.5]);line(c,seam,1,px-42,-23,px-42,24);c.setLineDash([]);
      poly(c,ink,[[px-45,-3],[px-39,0],[px-45,3]]);}
    c.save();c.translate(px,0);impression(c,scene,j,device);c.restore();
    line(c,j===frame?fern:seam,j===frame?3:1,px-28,25,px+28,25);
  }
  for(const x of [-130,129])for(const y of [-20,19])disk(c,ink,x,y,2);
  c.restore();
}
function bracket(c,x,y,r){
  for(let j=0;j<4;j++)arc(c,INK.paper,1.6,x,y,r,j*Math.PI/2+.16,j*Math.PI/2+.66);
}
/** Draw in display pixels so the contact/keys remain legible at phone scale.
 * Only DRAW a ghost. This module has no world, controls, scoring or clock to
 * mutate. A held real aim immediately replaces the demo. */
export function drawStory(c,{v,p,e,shot,scene,device,age,motion,aim}){
  // A scene starts on its first impression and cycles in place. The contact
  // lands on the real target within the first fraction of a second.
  c.save();const period=168,t=motion?(age%period)/period:.39,
    stage=motion?Math.min(2,Math.floor(t*3)):scene==='crack'?2:scene==='shell'?1:0;
  const actors=[{...toScreen(v,p),r:24*v.scale+10}];
  if(e)actors.push({...toScreen(v,e),r:e.r*v.scale+9});
  film(c,v,scene,device,stage,actors);
  if(aim || scene==='stock' || scene==='rewind' || !shot){c.restore();return;}
  const b=toScreen(v,p),q=e&&toScreen(v,e),unit=Math.hypot(shot.x,shot.y)||1,
    dx=shot.x/unit,dy=shot.y/unit;
  if(scene==='net'||scene==='rise'){
    const a=b.x>v.width/2?-1:1;
    for(let j=0;j<2;j++)line(c,acid,2.5,b.x+a*(20+j*9)-6,b.y-15-j*16,b.x+a*(20+j*9),b.y-23-j*16,b.x+a*(20+j*9)+6,b.y-15-j*16);
    c.restore();return;
  }
  if(!q||q.x<12||q.x>v.width-12||q.y<24||q.y>v.height-20){c.restore();return;}
  const r=e.r*v.scale+7;
  bracket(c,q.x,q.y,r);
  const pulling=scene==='pull' || scene==='focus';
  if(pulling){
    // The actual pull is relative to a press ANYWHERE, not necessarily on
    // the cube. Fit both contact positions, even on the short landscape edge.
    const travel=clamp(Math.min(v.width,v.height)*.16,36,83),
      bx=clamp(b.x+dx*19,25+Math.max(0,dx*travel),v.width-39+Math.min(0,dx*travel)),
      by=clamp(b.y+dy*19,35+Math.max(0,dy*travel),v.height-88+Math.min(0,dy*travel)),
      f=motion?smooth((t-.13)/.34):1;
    if(device==='keys'){key(c,bx,by,'aim',true);key(c,bx,by+24,'space',t>.48);}
    else if(!motion || t<.62){
      c.save();c.setLineDash([3,4]);line(c,INK.paper,1.9,bx,by,bx-dx*travel,by-dy*travel);c.restore();
      arc(c,INK.paper,1.5,bx,by,6);arrow(c,acid,bx-dx*travel*.66,by-dy*travel*.66,bx-dx*travel,by-dy*travel,2.2,8);
      hand(c,bx-dx*travel*f,by-dy*travel*f,device,t<.49,1.05);
    }
  }else{
    const sx=q.x>v.width-70?-1:1,tipX=q.x+sx*e.r*v.scale*.4,tipY=q.y+e.r*v.scale*.38;
    if(!motion || t<.64){
      const land=motion?1-smooth(t/.18):0,pressed=!motion||t>.17&&t<.43;
      if(pressed){arc(c,acid,2.2,tipX,tipY,7);arc(c,INK.paper,1.4,tipX,tipY,13);}
      hand(c,tipX+sx*14*land+(device==='keys'?10:0),tipY+19*land+(device==='keys'?9:0),device,pressed,1.1);
    }
  }
  // An outline, not another solid playable cube. The final frame belongs to
  // the actual player: no fake kill, miss, sound, points or aim commitment.
  if(motion && t>.53 && t<.9 && scene!=='lane'){
    const span=Math.hypot(e.x-p.x,e.y-p.y)/unit;
    const u=smooth((t-.53)/.37),a=toScreen(v,projectilePoint(p,shot,span*u));
    c.save();c.translate(a.x,a.y);c.rotate(-.14);const r=clamp(19*v.scale,8,18);
    c.globalAlpha=.56*Math.sin(Math.PI*u);c.strokeStyle=INK.paper;c.lineWidth=2;c.setLineDash([6,3]);c.strokeRect(-r,-r,r*2,r*2);
    c.restore();
  }
  c.restore();
}
