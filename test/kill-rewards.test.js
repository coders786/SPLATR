import test from 'node:test';
import assert from 'node:assert/strict';
import {createKillLedger,recordEnemyReward} from '../src/kill-rewards.js';
import {roundReward} from '../src/round-rewards.js';
import {createRun} from '../src/run.js';
import {placePlayer} from '../src/physics.js';
test('enemy ledger separates real points, kill count and fixed credit values',()=>{
 let p=createKillLedger();const initial=p;p=recordEnemyReward(p,{kind:'fang',points:100});p=recordEnemyReward(p,{kind:'crown',points:750});p=recordEnemyReward(p,{kind:'fang',small:true,points:45});assert.equal(initial.kills,0);assert.equal(p.kills,3);assert.equal(p.credits,12);assert.equal(p.points,895);assert.equal(p.rows.fragment.credits,0);assert.equal(p.rows.crown.credits,10);
 assert.equal(recordEnemyReward(p,{kind:'fang',paper:true}),p);assert.equal(recordEnemyReward(p,{kind:'unknown'}),p);assert.equal(roundReward({killLedger:p}).cuts,12);
});
test('fragment family cannot multiply credits and pause/aiming are not ledger events',()=>{
 let p=recordEnemyReward(createKillLedger(),{kind:'fork',points:200});for(let i=0;i<100;i++)p=recordEnemyReward(p,{kind:'fang',small:true,points:45});assert.equal(p.credits,3);assert.equal(p.kills,101);
});
test('real combat writes one row per defeat; armor hits and empty launches do not pay',()=>{
 const r=createRun(41,()=>{},{waveMode:true});try{r.state.invul=99999;r.state.wave.entry=0;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.combat.add({id:'sentinel',kind:'fang',x:-750,y:-1100,r:24,wavePlaced:true});r.combat.add({id:'target',kind:'fang',x:125,y:-450,r:24,wavePlaced:true});placePlayer(r.world,{x:0,y:-450});r.dash({x:30,y:0,power:1});for(let i=0;i<15&&r.combat.enemies.has('target');i++)r.tick();assert.equal(r.state.killLedger.kills,1);assert.equal(r.state.killLedger.credits,2);assert.equal(r.state.killLedger.points,r.state.score);const before=r.state.killLedger.credits;r.dash({x:-30,y:0,power:1});assert.equal(r.state.killLedger.credits,before);
 }finally{r.dispose()}
});
