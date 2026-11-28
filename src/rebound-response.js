import {MOVEMENT} from './movement-model.js';
/** The side rail owns only its normal component. A falling approach keeps its
 * downward tangent instead of being rewritten to a flat -4px upward shot.
 * Normal retention, modest lift and total cap are independent of cosmetics. */
export function sideRebound(velocity,inward,{shattered=false,restitution=1.3,ceiling=320}={}){
 const x=Number.isFinite(velocity?.x)?velocity.x:0,y=Number.isFinite(velocity?.y)?velocity.y:0;
 const normal=inward<0?-1:1;
 const limit=Number.isFinite(ceiling)&&ceiling>0?Math.min(320,ceiling):320;
 const bounce=Number.isFinite(restitution)?Math.max(1,Math.min(1.5,restitution)):1.3;
 const vx=Math.abs(x)*(shattered?bounce:MOVEMENT.wallKeep)*normal;
 const vy=y>0?y*.96-MOVEMENT.wallHop:Math.min(y,-MOVEMENT.wallHop);
 const speed=Math.hypot(vx,vy),k=speed>limit?limit/speed:1;
 return {x:vx*k,y:vy*k};
}
