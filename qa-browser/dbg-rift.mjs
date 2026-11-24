import {createTeachingSession} from '../src/teaching.js';
const events=[],s=createTeachingSession({scenario:'rift',emit:(t,d)=>events.push(t)});
for(let i=0;i<400&&!s.waiting;i++)s.tick();
const e=[...s.run.combat.enemies.values()][0];
console.log('waiting',s.waiting,'step',s.step?.[0],'e.mode',e.mode,'attackZone',!!e.attackZone,'hazards',s.run.combat.hazards.map(h=>h.kind));
console.log('events',events.join(','));
console.log('player',JSON.stringify(s.run.world.player.position),'rift',e.x.toFixed(1),e.y.toFixed(1));
