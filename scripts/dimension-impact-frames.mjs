// Real renderer frames, not a mockup. Outputs are ignored local QA artifacts.
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRun} from '../src/run.js';
import {createArtRenderer} from '../src/art/splatr-art-engine.js';
const output=process.env.CAPTURE_DIR||'.arena/dimension-impact';mkdirSync(output,{recursive:true});
const w=960,h=540;
globalThis.document={createElement:()=>createCanvas(1,1)};
for(const [label,age,motion,level] of [['ink',1,true,'full'],['fracture',7,true,'full'],['release',18,true,'full'],['low',7,true,'low'],['reduced',7,false,'full']]){
 const surface=createCanvas(w,h),ctx=surface.getContext('2d'),run=createRun(19,()=>{},{waveMode:true,continuous:true});
 const renderer=createArtRenderer(ctx,{width:w,height:h,cssWidth:w,cssHeight:h});
 try{
  renderer.reset(19);renderer.field(run.world.player.position);renderer.setShakeLevel(level);
  renderer.event('dimensionBreak',{...run.world.player.position},motion);
  for(let i=0;i<age;i++)renderer.tick(run,motion);
  renderer.draw(run,1,null,motion);
  writeFileSync(`${output}/${label}.png`,surface.toBuffer('image/png'));
 }finally{renderer.dispose();run.dispose();}
}
console.log(`Saved renderer frames to ${output}`);
