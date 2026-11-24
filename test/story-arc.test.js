import test from 'node:test';
import assert from 'node:assert/strict';
import {LANDLORD_STORY,SHORT_STORY,WAVE_STORY,storyChipForWave,storyForWave} from '../src/story-arc.js';

test('the short story is shaped into five wave chapters',()=>{
 assert.match(SHORT_STORY,/Watcher/);
 assert.match(SHORT_STORY,/Monolith/);
 for(const feeling of ['friends','Fear','Rage','Ambition','love'])assert.match(SHORT_STORY,new RegExp(feeling,'i'));
 assert.equal(WAVE_STORY.length,5);
 assert.deepEqual(WAVE_STORY.map(x=>x.id),['seal','eye','conduits','seam','last-seal']);
 for(const beat of WAVE_STORY){
  assert.ok(beat.title&&beat.line&&beat.chip&&beat.emotion,`${beat.sector} has a story beat`);
  assert.ok(['friendship','fear','rage','ambition','love'].includes(beat.emotion),`${beat.sector} has an acceptable emotional beat`);
  assert.ok(beat.chip.split(/\s+/).length<=4,`${beat.chip} stays a chip`);
 }
 assert.equal(LANDLORD_STORY.emotion,'resolve');
 assert.equal(LANDLORD_STORY.chip,'THE LANDLORD WAKES.');
 assert.ok(LANDLORD_STORY.finishChip.split(/\s+/).length<=4);
});

test('story lookup holds the final chapter without inventing another wave',()=>{
 assert.equal(storyForWave(1).id,'seal');
 assert.equal(storyForWave(4).id,'seam');
 assert.equal(storyForWave(99).id,'last-seal');
 assert.equal(storyChipForWave(2),'FEAR LOOKS BACK.');
});
