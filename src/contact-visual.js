/** Presentation-only contact snapshot. Units match physics velocity per tick.
 * Capture before recoil/removal. Tangential speed must not inflate head-on force. */
export function contactVisual(attacker={},target={},fallback=0){
 const finite=n=>Number.isFinite(n)?n:0;
 const ap=attacker.position||attacker,tp=target.position||target;
 const av=attacker.velocity||attacker.body?.velocity||{x:attacker.vx,y:attacker.vy};
 const tv=target.velocity||target.body?.velocity||{x:target.vx,y:target.vy};
 const dx=finite(tp.x)-finite(ap.x),dy=finite(tp.y)-finite(ap.y),distance=Math.hypot(dx,dy);
 const nx=distance>.001?dx/distance:Math.cos(fallback),ny=distance>.001?dy/distance:Math.sin(fallback);
 const vx=finite(av.x)-finite(tv.x),vy=finite(av.y)-finite(tv.y);
 const normalSpeed=Math.min(64,Math.abs(vx*nx+vy*ny)),tangentSpeed=Math.min(64,Math.abs(vx*-ny+vy*nx));
 const strength=Math.max(0,Math.min(1,(normalSpeed-3)/35));
 return Object.freeze({normalSpeed,tangentSpeed,strength,angle:Math.atan2(ny,nx),vx:Math.max(-64,Math.min(64,vx)),vy:Math.max(-64,Math.min(64,vy)),band:normalSpeed<10?'light':normalSpeed<28?'committed':'extreme'});
}
