import { cube } from './src/art.js';
// Record the filled polygons and inspect the scarf's shape.
const rec = [];
let m=[1,0,0,1,0,0], stack=[];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const ap=(x,y)=>[m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
const ctx={save(){stack.push(m.slice())},restore(){m=stack.pop()||[1,0,0,1,0,0]},
translate(x,y){m=mul(m,[1,0,0,1,x,y])},rotate(){},scale(x,y){m=mul(m,[x,0,0,y,0,0])},
set fillStyle(v){this._f=v},set strokeStyle(v){},set lineWidth(v){},set lineJoin(v){},
beginPath(){this._p=[]},moveTo(x,y){this._p=[ap(x,y)]},lineTo(x,y){this._p.push(ap(x,y))},
closePath(){},fill(){rec.push([this._f,this._p.map(p=>p.slice())])},stroke(){}};
cube(ctx,0,0,23,0,0,1,{eyes:1,lift:0});
console.log('polygons drawn:', rec.length);
for (const [fill, pts] of rec) {
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const w=(Math.max(...xs)-Math.min(...xs)).toFixed(1), h=(Math.max(...ys)-Math.min(...ys)).toFixed(1);
  console.log(' fill', fill, 'verts', pts.length, 'w', w, 'h', h);
}
