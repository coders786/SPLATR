import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCell } from '../src/levels.js';
import { createRun } from '../src/run.js';
import { createPhysics, destroyPhysics } from '../src/physics.js';
import { createCombat } from '../src/slasher.js';
import { TYPES } from '../src/shapes.js';
import { createCamera,frameRun,toScreen } from '../src/camera.js';
import { openingFacing } from '../src/levels.js';

// Check silhouettes, not just mean centre-to-centre distance. A new row
// cannot hide an overlapping pair at its seam with an older cell.
test('clear air between primary spawns in the opener, across cell seams, and in mature districts',()=>{
  const gaps=[];
  for (const staged of [true,false])for(let seed=0;seed<32;seed++){
    const near=[];for(let y=0;y<18;y++)for(let x=-2;x<=2;x++)near.push(...makeCell(seed,x,y,staged).spawns);
    for(const a of near){
      let gap=Infinity;
      for(const b of near)if(a!==b)gap=Math.min(gap, Math.hypot(a.x-b.x,a.y-b.y)-TYPES[a.kind].r*(a.size||1)-TYPES[b.kind].r*(b.size||1));
      assert.ok(gap>=290,`seed ${seed} ${a.id} only ${gap} clear units`);gaps.push(gap);
    }
  }
  gaps.sort((a,b)=>a-b);assert.ok(gaps[Math.floor(gaps.length/2)]>=440);
});

test('late volleys share admission beats with links and idle actors do not pile up at the cube',t=>{
  const w=createPhysics({spawn:{x:0,y:0}});let now=0;
  const starts=[],c=createCombat(w,()=>starts.push(now)),cells=new Map();t.after(()=>{c.dispose();destroyPhysics(w);});
  for(let i=0;i<4;i++){
    const x=(i-1.5)*260;
    c.add({id:'a'+i,kind:'prism',x,y:-200,delay:0});c.add({id:'b'+i,kind:'prism',x,y:240,delay:0});
    cells.set(i,{link:{a:'a'+i,b:'b'+i,period:250}});
  }
  let before=new Set(),beams=0;
  for(;now<1200;now++){
    c.move(1,9);c.linkAttacks(cells,1,()=>{});c.attacks(1,()=>{});
    const active=new Set(c.links.map(l=>l.a.id));
    for(const id of active)if(!before.has(id)){starts.push(now);beams++;}
    before=active;assert.ok(c.links.length+[...c.enemies.values()].filter(e=>e.mode!=='idle').length<=2);
  }
  assert.ok(beams>0 && starts.length>10);assert.ok(starts.slice(1).every((n,i)=>n-starts[i]>=54));
  for(const e of c.enemies.values())assert.ok(Math.hypot(e.x-e.postX,e.y-e.postY)<130);
});

test('a paid cut buys a decision beat, not auto-aim, free focus, or a lockout on the next input', t=>{
  const g=createRun(42),s=g.state;t.after(()=>g.dispose());g.dash(g.suggestion());
  while(!s.kills && s.elapsed<20)g.tick();assert.equal(s.kills,1);
  const at=g.world.clock;
  for(let i=0;i<37;i++)g.tick();assert.ok(g.world.clock-at<12);assert.equal(s.shots,1);assert.equal(s.focus,1);assert.equal(s.held,false);
  assert.ok(g.dash({x:15,y:-21}));assert.equal(s.breath,0);assert.equal(g.world.engine.timing.timeScale,1);
  g.tick();assert.ok(g.world.player.velocity.x>14);g.focus(true);for(let t=0;t<35;t++)g.tick();assert.equal(g.world.engine.timing.timeScale,.15);assert.ok(s.focus<.85);
});

test('one deliberate visible-target decision per second can cross the early field on phone and desktop',()=>{
  for(const [w,h]of [[390,844],[880,710]])for(const seed of [1,11,19,42,71,98,103,31415]){
    const g=createRun(seed,()=>{},{staged:true}),cam=createCamera();cam.resize(w,h);cam.reset(g.world.player.position,openingFacing(seed));
    try{
      for(let i=0;i<720;i++){
        if(i%60===0){const p=g.world.player.position,rank=e=>Math.hypot(e.x-p.x,e.y-p.y)+(e.y>p.y+50?700:0);
          const visible=[...g.combat.enemies.values()].filter(e=>{const q=toScreen(cam.view(1),e);return q.x>12&&q.x<w-12&&q.y>50&&q.y<h-35;}).sort((a,b)=>rank(a)-rank(b));
          g.dash(visible.length?g.aimAt(visible[0]):{x:0,y:-30,power:.86});}
        g.tick();frameRun(cam,g);
      }
      assert.equal(g.state.phase,'playing',`${w}px, seed ${seed}`);assert.ok(g.state.kills>=8 && g.state.band>=2);
    }finally{g.dispose();}
  }
});
