/** Desktop intent is chosen ON PRESS, never by crossing a distance threshold.
 * Plain left button is an inverted, distance-powered spring. Shift+left is an
 * explicit direct shot. Holding either longer never changes its power/model. */
export const MOUSE_AIM=Object.freeze({baseSpeed:31.7,maxSpeed:42,deadZone:6,minTravel:72,maxTravel:140});
export function mousePoint(session){
 const sx=Number.isFinite(session.scaleX)&&session.scaleX>0?session.scaleX:1,sy=Number.isFinite(session.scaleY)&&session.scaleY>0?session.scaleY:1;
 return {x:(session.toX-(session.left||0))*sx,y:(session.toY-(session.top||0))*sy};
}
/** CSS/canvas-space spring, independent of camera, frame rate and hold age.
 * A continuous zero-based curve replaces the old minimum 28% launch cliff. */
export function mousePull(session){
 const sx=Number.isFinite(session.scaleX)&&session.scaleX>0?session.scaleX:1,sy=Number.isFinite(session.scaleY)&&session.scaleY>0?session.scaleY:1;
 const dx=(session.x-session.toX)*sx,dy=(session.y-session.toY)*sy,distance=Math.hypot(dx,dy);
 const travel=Math.max(MOUSE_AIM.minTravel,Math.min(MOUSE_AIM.maxTravel,Number(session.travel)||120));
 if(!Number.isFinite(distance)||distance<=MOUSE_AIM.deadZone)return null;
 const t=Math.min(1,(distance-MOUSE_AIM.deadZone)/(travel-MOUSE_AIM.deadZone));
 // Keep the response continuous at the dead zone but make a short,
 // intentional pull strong enough to move the cube, not vanish to friction.
 const power=Math.sqrt(t),speed=MOUSE_AIM.maxSpeed*power;
 return {x:dx/distance*speed,y:dy/distance*speed,power};
}
