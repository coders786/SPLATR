import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawEnemyWarning} from '../src/art/splatr-art-engine.js';

function render(kind,{time=0,motion=false,mode='tell',scale=1}={}){
 const canvas=createCanvas(700,700),c=canvas.getContext('2d'),arcs=[],segments=[];
 const nativeArc=c.arc.bind(c),nativeLine=c.lineTo.bind(c);
 c.arc=(x,y,r,...rest)=>{arcs.push({x,y,r});return nativeArc(x,y,r,...rest);};
 c.lineTo=(x,y)=>{segments.push([x,y]);return nativeLine(x,y);};
 const enemy={kind,x:350,y:350,r:24,mode,clock:38,span:76,aim:0,tx:500,ty:350,lungeSpeed:10.8};
 drawEnemyWarning(c,enemy,{x:350,y:350,r:24},time,scale,motion);
 return {pixels:canvas.toBuffer('image/png'),arcs,segments};
}
test('warnings communicate different real mechanics and are stable with reduced motion',()=>{
 const kinds=['fang','pulse','prism','crown','rift','well'],images=kinds.map(k=>render(k).pixels.toString('base64'));
 assert.equal(new Set(images).size,kinds.length);
 assert.deepEqual(render('well',{time:0}).pixels,render('well',{time:600}).pixels);
 const pulse=render('pulse');assert.ok(pulse.arcs.some(a=>a.r>24),'Pulse tell shows a local ring wind-up');
 const well=render('well');assert.ok(well.arcs.some(a=>a.r===234),'Well field matches the actual pull radius');
 assert.ok(render('crown').segments.length>render('prism').segments.length,'radial Crown has more sightlines than single Prism');
 assert.ok(render('prism').segments.some(([x,y])=>x===1190&&y===350),'Prism sightline follows the locked aim');
 assert.ok(render('pulse',{mode:'idle'}).arcs.length===0,'no fake Pulse warning during idle');
});

test('Fang warning follows the actual rail-clamped charge path including a wall slide',async()=>{
 const {drawFangIntent}=await import('../src/art/splatr-art-engine.js');const c=createCanvas(500,500).getContext('2d'),points=[],lineTo=c.lineTo.bind(c);
 c.lineTo=(x,y)=>{points.push([x,y]);lineTo(x,y);};
 drawFangIntent(c,{x:180,y:100,r:20,aim:Math.PI/4,lungeSpeed:10,scale:1,arena:{x:0,y:0,w:220,h:500}});
 assert.equal(points.length,2);assert.ok(Math.abs(points[0][0]-200)<1e-8);assert.ok(Math.abs(points[0][1]-120)<1e-8);
 assert.ok(Math.abs(points[1][0]-200)<1e-8);assert.ok(points[1][1]>points[0][1]+100,'projection continues along rail like movement');
});

test('off-screen threats get camera-only, labeled direction notices',async()=>{
 const {enemyThreatIndicators,drawEnemyThreatIndicators,enemyAttackZone}=await import('../src/art/splatr-art-engine.js');
 const v={x:0,y:0,w:400,h:300,width:400,height:300,scale:1},enemies=new Map([
  ['fang',{id:'fang',kind:'fang',mode:'tell',x:500,y:150}],
  ['rift',{id:'rift',kind:'rift',mode:'tell',x:200,y:150,attackZone:enemyAttackZone('rift',200,-90)}],
  ['idle',{id:'idle',kind:'pulse',mode:'idle',x:-100,y:100}]
 ]),combat={enemies,hazards:[],links:[]};
 const notices=enemyThreatIndicators(v,combat);assert.deepEqual(notices.map(x=>x.label).sort(),['FANG','RIFT']);assert.ok(notices.some(x=>x.state==='LANDING'));assert.ok(notices.every(x=>x.x>=0&&x.x<=400&&x.y>=0&&x.y<=300));
 const canvas=createCanvas(400,300),c=canvas.getContext('2d'),before=c.getTransform();drawEnemyThreatIndicators(c,v,combat);assert.deepEqual(c.getTransform(),before);assert.ok(canvas.toBuffer('image/png').length>500);
});
