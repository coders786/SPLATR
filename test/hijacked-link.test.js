import test from 'node:test';
import assert from 'node:assert/strict';
import {hijackLink,stepHijackedLinks,HIJACKED_LINK} from '../src/hijacked-link.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';

test('a severed node turns its line friendly, warns first, hits each enemy once, and ends with its partner',()=>{
 const links=[],first={id:'a',kind:'prism',x:0,y:0},partner={id:'b',kind:'prism',x:200,y:0,hp:1},target={id:'c',kind:'fang',x:100,y:3,r:10,hp:1};
 const enemies=new Map([[partner.id,partner],[target.id,target]]),cells=new Map([['one',{link:{a:'a',b:'b'}}]]);const events=[];
 assert.ok(hijackLink(links,cells,enemies,first,1));
 for(let i=0;i<HIJACKED_LINK.warmup-1;i++)stepHijackedLinks(links,{enemies,onHit:e=>events.push(e.id)});assert.deepEqual(events,[]);
 for(let i=0;i<5;i++)stepHijackedLinks(links,{enemies,onHit:e=>events.push(e.id)});assert.deepEqual(events,['c']);
 enemies.delete('b');stepHijackedLinks(links,{enemies});assert.equal(links.length,0);
});

test('an actual continuous-wave Prism kill hijacks its real partner link',()=>{
 const events=[],r=createRun(2,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true});
 try{
  r.state.phase='playing';r.state.invul=99999;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();
  const prisms=[...r.combat.enemies.values()].filter(e=>e.kind==='prism');assert.ok(prisms.length>=2);
  for(const e of [...r.combat.enemies.values()])if(!prisms.includes(e))r.combat.remove(e);
  prisms[0].pinned=prisms[1].pinned=true;r.state.wave.entry=0;r.state.edge=r.state.edgeMax;
  placePlayer(r.world,{x:prisms[0].x,y:prisms[0].y+120});stopPlayer(r.world);assert.ok(r.dash({x:0,y:-42,power:1}));
  for(let i=0;i<30&&!r.state.friendlyLinks.length;i++)r.tick();
  assert.equal(r.state.friendlyLinks.length,1);assert.equal(r.state.friendlyLinks[0].partner,prisms[1].id);assert.ok(events.some(e=>e.type==='linkHijack'));
 }finally{r.dispose();}
});
