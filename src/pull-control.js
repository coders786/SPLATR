import {readGesture} from './gesture.js';
import {MOVEMENT} from './movement-model.js';
/** Immutable screen-space session. Event sampling owns latching, never drawing. */
export function beginPull({x,y,type='mouse',travel=120,scaleX=1,scaleY=1,...metadata}){
 return {...metadata,x,y,toX:x,toY:y,scaleX,scaleY,type,travel:Math.max(32,travel),dragged:false};
}
export function movePull(session,x,y){
 const next={...session,toX:x,toY:y};
 next.dragged=readGesture(next).dragged;
 return next;
}
/** A single response curve from CSS distance to launch speed, no world zoom. */
export function resolvePull(session){
 const gesture=readGesture(session);
 if(gesture.kind!=='pull')return {gesture,vector:null};
 const distance=Math.hypot(gesture.dx,gesture.dy);
 const t=Math.min(1,Math.max(0,(distance-gesture.cancelRadius)/(session.travel-gesture.cancelRadius)));
 const power=.28+.72*t*t*(3-2*t),speed=MOVEMENT.maxSpeed*power;
 return {gesture,vector:{x:gesture.dx/distance*speed,y:gesture.dy/distance*speed,power}};
}
