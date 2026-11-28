import test from 'node:test';
import assert from 'node:assert/strict';
import {shopDecision} from '../src/shop-decision.js';
const item=Object.freeze({name:'Lightning Coil',price:400});
test('read-only decision copy explains the full price and exact shortfall',()=>{
 const d=shopDecision({item,coins:175});assert.equal(d.label,'NEED 225 MORE');assert.equal(d.disabled,true);assert.match(d.hint,/Costs 400 credits/);assert.match(d.hint,/Earn credits by playing runs/);assert.match(d.aria,/225 more/);assert.ok(Object.isFrozen(d));assert.equal(item.price,400);
});
test('affordable is buy, owned is equip, equipped is a disabled next-run state',()=>{
 const buy=shopDecision({item,coins:400});assert.equal(buy.label,'BUY · 400 CREDITS');assert.equal(buy.disabled,false);assert.match(buy.aria,/also equips/);
 const own=shopDecision({item,coins:0,owned:true});assert.equal(own.label,'EQUIP FOR NEXT RUN');assert.equal(own.disabled,false);assert.equal(own.status,'OWNED · NOT EQUIPPED');
 const worn=shopDecision({item,coins:0,owned:true,equipped:true});assert.equal(worn.label,'EQUIPPED');assert.equal(worn.disabled,true);assert.match(worn.hint,/next run/);
});
test('challenge items cannot be bought even with enough credits but unlocked copies can equip',()=>{
 const locked=Object.freeze({name:'Broken Oni',price:null});assert.equal(shopDecision({item:locked,coins:9999}).label,'CHALLENGE LOCKED');assert.equal(shopDecision({item:locked,coins:9999}).disabled,true);assert.equal(shopDecision({item:locked,owned:true}).disabled,false);
});
test('challenge conditions and cosmetic ownership are explained without inventing powers',()=>{
 assert.match(shopDecision({item:{id:'glass',name:'Glass Cannon',price:null}}).hint,/Reach Wave 5/);
 assert.match(shopDecision({item:{id:'oni',name:'Broken Oni',price:null}}).aria,/Crown at 1 health/);
 const cosmetic=shopDecision({item:{id:'sniper',slot:'eyes',name:'Sniper Dot',price:250},owned:true});
 assert.match(cosmetic.hint,/look/);assert.doesNotMatch(cosmetic.hint,/power/);
});
