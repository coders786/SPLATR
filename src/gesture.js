/** Screen-pixel gesture classification. A pull latches once, never falls back
 * to a tap; returning it to the inner dead zone cancels. Hysteresis prevents a
 * committed pull from dropping when a thumb relaxes just below acquisition. Mouse/touch share semantics. */
/** The minimum drag before a pull can exist. 8px screen space, mouse or
 * touch: crisp enough that a resting thumb or a jittering mouse never
 * misfires a launch, small enough that a deliberate flick always registers. */
export function gestureSlop(type='mouse'){return 8;}
export function readGesture({x,y,toX,toY,dragged=false,type='mouse',scaleX=1,scaleY=1}){
 // The raw client delta is CSS pixels. Map it into canvas pixels with the
 // factor measured at pointerdown -- this is what keeps the vector honest
 // when the display box differs from the layout box, and it is already
 // camera- and zoom-immune because the camera never moves the origin.
 const sx=Number.isFinite(scaleX)&&scaleX>0?scaleX:1, sy=Number.isFinite(scaleY)&&scaleY>0?scaleY:1;
 const dx=(toX-x)*sx,dy=(toY-y)*sy,distance=Math.hypot(dx,dy),slop=gestureSlop(type);
 if(![dx,dy,distance].every(Number.isFinite))return {kind:'cancel',dragged:true,dx:0,dy:0,slop};
 const latched=dragged||distance>=slop,cancelRadius=slop*.5;
 return {kind:!latched?'tap':distance<cancelRadius?'cancel':'pull',dragged:latched,dx:-dx,dy:-dy,slop,cancelRadius};
}
