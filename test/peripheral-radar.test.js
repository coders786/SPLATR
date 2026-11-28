import test from 'node:test';
import assert from 'node:assert/strict';
import {peripheralRadar} from '../src/art/splatr-art-engine.js';
const view={x:0,y:0,width:400,height:300,w:400,h:300,scale:1};
const player={x:200,y:150};
const enemy=(id,x,y,mode='idle')=>({id,x,y,mode,kind:'fang'});
const combat=(enemies=[],hazards=[])=>({enemies:new Map(enemies.map(e=>[e.id,e])),hazards,links:[]});
test('edge radar shows nearby offscreen enemies, not visible bodies',()=>{
 const items=peripheralRadar(view,player,combat([enemy('visible',250,100),enemy('right',500,100),enemy('left',-100,100)]));
 assert.deepEqual(items.map(x=>x.id).sort(),['left','right']);
 assert.ok(items.find(x=>x.id==='right').x>350);
 assert.ok(items.find(x=>x.id==='left').x<50);
 assert.ok(items.every(x=>x.x>=0&&x.x<=400&&x.y>=0&&x.y<=300));
});
test('upgraded radar preserves range and adds real hazards and charging alerts',()=>{
 const enemies=[enemy('far',800,100,'tell')];
 const hazards=[{kind:'needle',x:500,y:100,attackId:'live'}, {kind:'needle',x:500,y:130,attackId:'dust',cosmetic:true}, {kind:'needle',x:500,y:90,attackId:'spent',spent:true}];
 assert.equal(peripheralRadar(view,player,combat(enemies,hazards),'radar-base').length,0);
 const tier2=peripheralRadar(view,player,combat(enemies,hazards),'radar-2');
 assert.deepEqual(tier2.map(x=>x.id).sort(),['far','live']);
 assert.equal(tier2.find(x=>x.id==='far').active,false);
 assert.equal(tier2.find(x=>x.id==='live').kind,'hazard');
 assert.equal(peripheralRadar(view,player,combat(enemies,hazards),'radar-3').find(x=>x.id==='far').active,true);
});
test('peripheral markers stay bounded and are capped during crowded waves',()=>{
 const enemies=Array.from({length:100},(_,i)=>enemy(String(i),-40-i,60));
 const items=peripheralRadar(view,player,combat(enemies),'radar-3');
 assert.equal(items.length,12);assert.ok(items.every(x=>Number.isFinite(x.angle)));
});
