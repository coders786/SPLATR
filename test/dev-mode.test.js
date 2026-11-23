import test from 'node:test';
import assert from 'node:assert/strict';
import {isDevMode,modeURL,createProfileStorage,refillForTesting} from '../src/dev-mode.js';

test('sandbox is opt-in, URL switch preserves unrelated query and hash', () => {
  const normal='https://example.com/game?lang=en#start';
  const dev=modeURL(normal,true);
  assert.equal(isDevMode(normal),false);
  assert.equal(isDevMode(dev),true);
  assert.equal(isDevMode('https://example.com/?dev=0'),false);
  assert.equal(modeURL(dev,false),normal);
});
test('sandbox storage cannot overwrite normal progression and survives new adapters', () => {
  const data=new Map(), backend=()=>({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
  const normal=createProfileStorage(backend), dev=createProfileStorage(backend,true);
  for(const key of ['quests','equipment','best','started','fieldMix']) {normal.set(key,'normal');dev.set(key,'sandbox');}
  const reload=createProfileStorage(backend,true);
  for(const key of ['quests','equipment','best','started','fieldMix']) {assert.equal(normal.get(key,''),'normal');assert.equal(reload.get(key,''),'sandbox');}
  assert.equal(createProfileStorage(()=>{throw Error('blocked')},true).get('test','fallback'),'fallback');
  assert.doesNotThrow(()=>createProfileStorage(()=>{throw Error('blocked')},true).set('test',1));
});
test('refill respects each build maximum and only works in an active run', () => {
  const state={phase:'playing',hp:0,hpMax:1,edge:0,edgeMax:2,recharge:8,focus:0,depleted:true};
  assert.equal(refillForTesting({state}),true);
  assert.deepEqual(state,{phase:'playing',hp:1,hpMax:1,edge:2,edgeMax:2,recharge:0,focus:1,depleted:false});
  state.phase='dead';assert.equal(refillForTesting({state}),false);assert.equal(refillForTesting(null),false);
});

test('unavailable storage retains failed writes for the current session',()=>{
 const store=createProfileStorage(()=>{throw Error('blocked')});
 store.set('tutorialStarted',1);store.set('tutorialCompleted',1);
 assert.equal(store.get('tutorialStarted','0'),'1');assert.equal(store.get('tutorialCompleted','0'),'1');
});
