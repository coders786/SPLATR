/** Pure visual-only simulation. No combat, movement, RNG, DOM or storage writes.
 * Coordinates are world pixels; time uses nominal simulation ticks. */
export const DIMENSION_FIELD=Object.freeze({wakes:18,impulses:8,scars:14,wakeInterval:7,wakeLife:28,impulseLife:28,scarLife:1800});
export function createDimensionField(cycle=0){return {cycle,ticks:0,strain:0,wakeClock:0,wakes:[],impulses:[],scars:[],serial:0};}
export function settleDimensionField(field){return {...field,wakes:[],impulses:[],wakeClock:0};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function disturbDimension(field,kind,data={}){
 if(!field||!['launch','bank','cut'].includes(kind)||![data.x,data.y,data.speed].every(Number.isFinite))return field;
 if(kind==='cut'&&(data.small||data.paper||data.secondary))return field;
 const speed=Math.max(0,data.speed),normalSpeed=Number.isFinite(data.normalSpeed)?Math.max(0,data.normalSpeed):speed,ratio=clamp((kind==='bank'?normalSpeed:speed)/42,0,2),energy=clamp(ratio*ratio,0,2),angle=Number.isFinite(data.angle)?data.angle:0;
 if(speed<4)return field;
 const intensity=clamp(kind==='launch'?.12+Math.max(0,data.acceleration||0)/84:kind==='bank'?.24+energy*.28:.1+energy*.35,.1,.8);
 const item={id:field.serial+1,kind,x:data.x,y:data.y,angle,nx:data.nx||0,ny:data.ny||0,speed,normalSpeed,intensity,age:0,life:DIMENSION_FIELD.impulseLife};
 const p={...field,serial:item.id,impulses:[...field.impulses,item].slice(-DIMENSION_FIELD.impulses)};
 // Strong impacts leave local evidence; normal cuts retain a small pressure cue.
 if(kind==='bank'||kind==='cut'&&speed>=24){
  p.scars=[...field.scars,{...item,life:DIMENSION_FIELD.scarLife}].slice(-DIMENSION_FIELD.scars);
  p.strain=clamp(field.strain+intensity*(kind==='bank'?.065:.035),0,1);
 }
 return p;
}
export function stepDimensionField(field,{dt=1,active=true,x=0,y=0,vx=0,vy=0,distance=0}={}){
 if(!active)return field;
 const time=Number.isFinite(dt)?clamp(dt,0,1):0;if(!time)return field;
 const age=list=>list.map(item=>({...item,age:item.age+time})).filter(item=>item.age<item.life);
 const p={...field,ticks:field.ticks+time,wakes:age(field.wakes),impulses:age(field.impulses),scars:age(field.scars),strain:Math.max(0,field.strain-time*.000035),wakeClock:Math.min(DIMENSION_FIELD.wakeInterval,field.wakeClock+time)};
 const speed=Math.min(Math.hypot(vx,vy),Math.max(0,distance)/Math.max(.001,time));
 if([x,y,speed,distance].every(Number.isFinite)&&speed>=4&&distance>.5&&p.wakeClock>=DIMENSION_FIELD.wakeInterval){
  const angle=Math.atan2(vy,vx),item={id:field.serial+1,x,y,angle,speed,intensity:clamp(speed/84,.07,.55),age:0,life:DIMENSION_FIELD.wakeLife};
  p.serial=item.id;p.wakeClock=0;p.wakes=[...p.wakes,item].slice(-DIMENSION_FIELD.wakes);
 }
 return p;
}
