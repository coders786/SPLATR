import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawWorldArchitectureStudy,drawWorldBackdrop,legacy_atmosphere} from '../src/art/splatr-art-engine.js';
import {createDisplay} from './support/display.js';
const worlds=['tokyo','foundry','manga','synth','void'];
const capture=(id,{x=0,y=0,scale=1,time=0,w=640,h=400,cached=false}={})=>{
 const cv=createCanvas(w,h),c=cv.getContext('2d'),camera=Object.freeze({x,y,scale});
 if(cached){const b=legacy_atmosphere.createBackdrop(c,(w,h)=>createCanvas(w,h));b.equipment(w,h,id,time,camera);b.dispose();}
 else drawWorldBackdrop(c,w,h,id,time,camera);
 return {png:cv.toBuffer('image/png'),data:c.getImageData(0,0,w,h).data};
};
const delta=(a,b)=>{let d=0;for(let i=0;i<a.length;i+=4)d+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return d/(a.length*.75);};
for(const id of worlds){
 test(`${id}: deterministic architecture responds to both camera axes and zoom`,()=>{
  const base=capture(id);assert.deepEqual(capture(id).png,base.png);
  for(const camera of [{x:300},{y:-1300},{x:-12000,y:63000},{scale:.7}])assert.notDeepEqual(capture(id,camera).png,base.png,JSON.stringify(camera));
 });
 test(`${id}: continuous parallax across origin and both tile boundaries`,()=>{
  const far=delta(capture(id).data,capture(id,{x:300,y:-800}).data);assert.ok(far>1);
  const u=400/720;
  for(const depth of [.055,.19])for(const [x,y]of [[0,0],[1000*u/depth,(depth===.055?1600:800)*u/depth],[-1000*u/depth,-(depth===.055?1600:800)*u/depth]]){
   const d=delta(capture(id,{x:x-.1,y:y-.1}).data,capture(id,{x:x+.1,y:y+.1}).data);
   assert.ok(d<1&&d<far*.2,`${x},${y}: discontinuity ${d}`);
  }
 });
 test(`${id}: half-resolution gameplay bake closely matches public preview architecture`,()=>{
  const d=delta(capture(id,{x:173,y:-1300}).data,capture(id,{x:173,y:-1300,cached:true}).data);assert.ok(d<2,`average RGB error ${d}`);
 });
}
test('all world bakes share an explicitly released bounded working set during long camera travel',()=>{
 const made=[],c=createCanvas(640,400).getContext('2d');
 const b=legacy_atmosphere.createBackdrop(c,(w,h)=>{const cv=createCanvas(w,h);made.push(cv);return cv;});
 for(let i=0;i<180;i++){
  const id=worlds[i%5];b.equipment(640,400,id,i,{x:i*83-12000,y:-i*379,scale:.8+(i%3)*.2});
  assert.ok(b.bakeStats().entries<=24);assert.ok(b.bakeStats().pixels<=2000000);
 }
 b.dispose();assert.deepEqual(b.bakeStats(),{entries:0,pixels:0});assert.ok(made.length>5);assert.ok(made.every(cv=>cv.width===1&&cv.height===1));
});
test('cached world frames reuse static geometry instead of creating frame-by-frame surfaces',()=>{
 let surfaces=0;const c=createCanvas(640,400).getContext('2d'),b=legacy_atmosphere.createBackdrop(c,(w,h)=>{surfaces++;return createCanvas(w,h);});
 b.equipment(640,400,'tokyo',0,{x:150,y:-1000});const count=surfaces;
 for(let i=0;i<60;i++)b.equipment(640,400,'tokyo',i,{x:150+i,y:-1000-i});
 assert.equal(surfaces,count);assert.ok(count<=4);b.dispose();
});
test('world geometry is bounded even without optional raster surfaces at phone/desktop/deep cameras',()=>{
 for(const id of worlds)for(const [w,h]of [[1280,720],[390,844],[640,360]])for(const y of [-68000,0,35000]){
  const {ctx}=createDisplay(w,h);drawWorldBackdrop(ctx,w,h,id,32,{x:-430,y,scale:.65});assert.ok(ctx.__ops.length<900,`${id}/${w}/${y}: ${ctx.__ops.length}`);
 }
});
test('world wrappers restore alpha, transform, compositing, lines and dash state',()=>{
 for(const id of worlds){const c=createCanvas(640,400).getContext('2d');c.translate(10,20);c.rotate(.1);c.globalAlpha=.37;c.globalCompositeOperation='multiply';c.lineWidth=7;c.setLineDash([3,7]);const m=c.getTransform();drawWorldBackdrop(c,640,400,id,50,{x:400,y:-9000});assert.deepEqual(c.getTransform(),m);assert.equal(c.globalAlpha,.37);assert.equal(c.globalCompositeOperation,'multiply');assert.equal(c.lineWidth,7);assert.deepEqual(c.getLineDash(),[3,7]);}
});

test('world panorama is read-only and reduced motion freezes camera and atmosphere at every timestamp',()=>{
 for(const world of ['twilight',...worlds]){
  const eq=Object.freeze({world,body:'paper',core:'standard'}),draw=time=>{const cv=createCanvas(640,400);drawWorldArchitectureStudy(cv.getContext('2d'),640,400,{equipment:eq,time,motion:false});return cv.toBuffer('image/png');};
  assert.deepEqual(draw(0),draw(900));assert.deepEqual(eq,{world,body:'paper',core:'standard'});
 }
});
test('world panorama contains travel but restores the caller drawing state',()=>{
 const c=createCanvas(640,400).getContext('2d');c.translate(7,9);c.globalAlpha=.6;const m=c.getTransform();drawWorldArchitectureStudy(c,640,400,{equipment:Object.freeze({world:'tokyo'}),time:90});assert.deepEqual(c.getTransform(),m);assert.equal(c.globalAlpha,.6);
 const a=createCanvas(640,400),b=createCanvas(640,400);drawWorldArchitectureStudy(a.getContext('2d'),640,400,{equipment:{world:'tokyo'},time:0});drawWorldArchitectureStudy(b.getContext('2d'),640,400,{equipment:{world:'tokyo'},time:90});assert.notDeepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));
});
