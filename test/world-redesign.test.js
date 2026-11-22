import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {legacy_atmosphere,drawWorldBackdrop,ITEMS} from '../src/art/splatr-art-engine.js';
function capture({x=0,y=0,scale=1,seed=41,band=1,time=0}={}){
 const canvas=createCanvas(640,400),c=canvas.getContext('2d');c.translate(1,2);c.globalAlpha=.8;const before=c.getTransform();
 const backdrop=legacy_atmosphere.createBackdrop(c),v=Object.freeze({width:640,height:400,scale,panX:x,panY:y});backdrop.world(v,seed,band,time);
 assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.8);
 return {png:canvas.toBuffer('image/png').toString('base64'),pixels:c.getImageData(0,0,640,400).data};
}
test('industrial district is deterministic, camera-relative, seed- and sector-specific',()=>{
 assert.equal(capture().png,capture().png);const base=capture().png;
 for(const variant of [{x:300},{y:-1000},{y:2200},{seed:42},{band:2},{scale:.7}])assert.notEqual(capture(variant).png,base,JSON.stringify(variant));
});
test('crossing the origin tile boundary has no large image jump',()=>{
 const a=capture({x:-.1,y:-.1}).pixels,b=capture({x:.1,y:.1}).pixels,far=capture({x:300,y:-800}).pixels;
 const delta=(a,b)=>{let total=0;for(let i=0;i<a.length;i+=4)total+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return total/(a.length*.75);};
 assert.ok(delta(a,b)<delta(a,far)*.2);assert.ok(delta(a,b)<1);
});
test('default public backdrop and gameplay backdrop use the same district geometry',()=>{
 const a=createCanvas(640,400),b=createCanvas(640,400),x=240,y=-900;
 drawWorldBackdrop(a.getContext('2d'),640,400,'twilight',0,{x,y});
 legacy_atmosphere.createBackdrop(b.getContext('2d')).world({width:640,height:400,scale:1,panX:x,panY:y},41,1,0);
 assert.equal(a.toBuffer('image/png').toString('base64'),b.toBuffer('image/png').toString('base64'));
});
test('all six world backdrops preserve caller state across sizes and camera offsets',()=>{
 for(const world of ITEMS.filter(x=>x.slot==='world'))for(const [w,h]of [[640,400],[550,720],[860,440]]){
  const c=createCanvas(w,h).getContext('2d');c.translate(3,4);const before=c.getTransform();drawWorldBackdrop(c,w,h,world.id,32,Object.freeze({x:-1230,y:-4000,scale:.8}));assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,1);
 }
});

test('district culls invisible machinery to bound per-frame draw work',async()=>{
 const {createDisplay}=await import('./support/display.js');
 for(const y of [0,-1300,-4000]){
  const {ctx}=createDisplay(880,710);
  legacy_atmosphere.createBackdrop(ctx).world({width:880,height:710,scale:1,panX:0,panY:y},41,1,0);
  assert.ok(ctx.__ops.length<260,`${y}: ${ctx.__ops.length} painted primitives`);
 }
});
