import test from 'node:test';
import assert from 'node:assert/strict';
import {createResumeGrace} from '../src/resume-grace.js';
import {createClock} from '../src/clock.js';

test('resume holds the world for 400ms and ramps fixed-step time without depending on frame rate',()=>{
 const totals=[];
 for(const hz of [30,60,144,240]){
  const grace=createResumeGrace(),clock=createClock();let ticks=0;grace.start(0);clock.frame(0,()=>ticks++,0);
  for(let i=1;i<=hz;i++) {const now=i*1000/hz,g=grace.advance(now);clock.frame(now,()=>ticks++,g.scale);if(now<400)assert.equal(ticks,0);}
  assert.equal(grace.active,false);totals.push(ticks);
 }
 assert.ok(Math.max(...totals)-Math.min(...totals)<=1,totals.join(','));
});
test('pause grace can be cancelled and restarted cleanly',()=>{
 const g=createResumeGrace();g.start(50);assert.equal(g.frozen,true);assert.equal(g.advance(449).phase,'hold');assert.equal(g.advance(450).phase,'ramp');assert.equal(g.frozen,false);g.cancel();assert.equal(g.active,false);assert.equal(g.advance(900).scale,1);g.start(1000);assert.equal(g.advance(1100).scale,0);
});
