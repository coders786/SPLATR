import {createRun} from './run.js';
import {placePlayer,stopPlayer} from './physics.js';
import {normalizeEquipment} from './equipment.js';

// An isolated real run, never wired to the wallet, save data, challenge handler,
// audio, or the active game. Coordinates match the 640 x 400 Garage canvas.
const SCALE=.65, OX=320, OY=235;
const toWorld=(x,y)=>({x:(x-OX)/SCALE,y:(y-OY)/SCALE});
const toCanvas=(x,y)=>({x:OX+x*SCALE,y:OY+y*SCALE});
const targets=[{id:'garage/fang',kind:'fang',x:100,y:-85},{id:'garage/armor',kind:'bastion',x:260,y:-85}];
export function createGarageCombat(){
 const state={x:190,y:190,vx:0,vy:0,manual:0,drag:null,hits:0,dummy:{x:385,y:180,alive:true},impact:null,fragments:[]};
 let run=null,key='',age=0,respawn=new Map();
 function addTarget(spec){run.combat.add({...spec,pinned:true,delay:999999,wave:true});}
 function sync(){if(!run)return;const p=run.world.player,at=toCanvas(p.position.x,p.position.y);state.x=at.x;state.y=at.y;state.vx=p.velocity.x*SCALE;state.vy=p.velocity.y*SCALE;state.dummy.alive=targets.some(t=>run.combat.enemies.has(t.id));}
 function disposeRun(){if(run){run.dispose();run=null;}respawn.clear();}
 function configure(equipment){
  const eq=normalizeEquipment(equipment),next=JSON.stringify(eq);if(run&&key===next)return;
  disposeRun();key=next;age=0;state.hits=0;state.manual=0;state.drag=null;
  run=createRun(712,(type,d)=>{if(type==='cut'&&targets.some(t=>t.id===d.entityId)){state.hits++;respawn.set(d.entityId,60);}}, {waveMode:true,continuous:true,equipment:eq});
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
  // Keep the director's wave alive while the visible practice targets respawn.
  run.combat.add({id:'garage/sentinel',kind:'fang',x:2200,y:-3000,pinned:true,delay:999999,wave:true});
  for(const spec of targets)addTarget(spec);
  run.state.phase='playing';run.state.wave.entry=0;run.state.invul=1e9;
  placePlayer(run.world,toWorld(190,190));stopPlayer(run.world);sync();
 }
 function cancel(){state.drag=null;if(run){run.focus(false);run.setAim(null);run.cancelBufferedDash();}}
 function aim(x,y){if(!run||!Number.isFinite(x)||!Number.isFinite(y))return false;state.drag={x,y};const t=toWorld(x,y),p=run.world.player.position;run.focus(true);run.setAim({x:t.x-p.x,y:t.y-p.y});return true;}
 function fire(x,y){if(!run||!Number.isFinite(x)||!Number.isFinite(y)){cancel();return false;}const t=toWorld(x,y),p=run.world.player.position,dx=t.x-p.x,dy=t.y-p.y,n=Math.hypot(dx,dy);if(n<6){cancel();return false;}
  cancel();run.state.edge=run.state.edgeMax;run.state.stop=0;const fired=run.dash({x:dx/n*42,y:dy/n*42,power:1});if(fired)state.manual=300;return fired;
 }
 function tick(){if(!run)return;age++;if(state.manual>0)state.manual--;run.state.invul=1e9;if(state.drag&&!run.state.held)run.focus(true);run.tick();
  for(const [id,left] of respawn){if(left>1)respawn.set(id,left-1);else{respawn.delete(id);const spec=targets.find(t=>t.id===id);if(spec&&!run.combat.enemies.has(id))addTarget(spec);}}
  // Keep the practice camera usable without teleporting during an aim gesture.
  const p=run.world.player.position;if(!state.drag&&(p.x < -430 || p.x > 430 || p.y < -280 || p.y > 130)){placePlayer(run.world,toWorld(190,190));stopPlayer(run.world);}
  sync();
 }
 return {state,configure,aim,fire,tick,cancel,adoptPose(){return true;},reset(){if(run){const eq=run.state.equipment;key='';configure(eq);}else{state.drag=null;state.manual=0;state.hits=0;}},dispose(){disposeRun();key='';},get run(){return run;},get age(){return age;}};
}
