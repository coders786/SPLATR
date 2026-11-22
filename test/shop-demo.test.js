import test from 'node:test';
import assert from 'node:assert/strict';
import {shopDemoFrame} from '../src/shop-demo.js';
test('shop demonstration loops with a readable hold and covered reset',()=>{assert.equal(shopDemoFrame(1370).time,1100);assert.equal(shopDemoFrame(2600).time,1100);assert.equal(shopDemoFrame(3000).veil,1);assert.deepEqual(shopDemoFrame(3400),shopDemoFrame(400));assert.ok(shopDemoFrame(800).time>shopDemoFrame(400).time);});
test('reduced motion stays at the result without fading',()=>{for(const t of [0,200,2900,9000])assert.deepEqual(shopDemoFrame(t,false),{time:1100,veil:0});});
