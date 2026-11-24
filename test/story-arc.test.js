import test from 'node:test';
import assert from 'node:assert/strict';
import {SHORT_STORY,WAVE_STORY,storyChipForWave,storyForWave} from '../src/story-arc.js';

test('the short story is shaped into five wave chapters',()=>{
 assert.match(SHORT_STORY,/Watcher/);
 assert.match(SHORT_STORY,/Monolith/);
 assert.equal(WAVE_STORY.length,5);
 assert.deepEqual(WAVE_STORY.map(x=>x.id),['seal','eye','conduits','seam','last-seal']);
 for(const beat of WAVE_STORY){
  assert.ok(beat.title&&beat.line&&beat.chip,`${beat.sector} has a story beat`);
  assert.ok(beat.chip.split(/\s+/).length<=4,`${beat.chip} stays a chip`);
 }
});

test('story lookup holds the final chapter without inventing another wave',()=>{
 assert.equal(storyForWave(1).id,'seal');
 assert.equal(storyForWave(4).id,'seam');
 assert.equal(storyForWave(99).id,'last-seal');
 assert.equal(storyChipForWave(2),'IT SEES YOU.');
});
