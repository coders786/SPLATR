/** Screen-pixel gesture classification. A pull latches once, never falls back
 * to a tap; returning it to the inner dead zone cancels. Hysteresis prevents a
 * committed pull from dropping when a thumb relaxes just below acquisition. Mouse/touch share semantics. */
export function gestureSlop(type='mouse'){return type==='touch'?20:14;}
export function readGesture({x,y,toX,toY,dragged=false,type='mouse'}){
 const dx=toX-x,dy=toY-y,distance=Math.hypot(dx,dy),slop=gestureSlop(type);
 if(![dx,dy,distance].every(Number.isFinite))return {kind:'cancel',dragged:true,dx:0,dy:0,slop};
 const latched=dragged||distance>=slop,cancelRadius=slop*.5;
 return {kind:!latched?'tap':distance<cancelRadius?'cancel':'pull',dragged:latched,dx:-dx,dy:-dy,slop,cancelRadius};
}
