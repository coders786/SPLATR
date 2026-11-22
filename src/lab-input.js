// The preview is letterboxed with object-fit:contain. Pointer positions must use
// the drawn canvas rectangle, not the surrounding CSS element's full bounds.
export function labPoint(bounds,clientX,clientY){
 const scale=Math.min(bounds.width/640,bounds.height/400);
 if(!(scale>0)||!Number.isFinite(clientX)||!Number.isFinite(clientY))return {x:0,y:0,inside:false};
 const x=(clientX-bounds.left-(bounds.width-640*scale)/2)/scale;
 const y=(clientY-bounds.top-(bounds.height-400*scale)/2)/scale;
 return {x,y,inside:x>=0&&x<=640&&y>=0&&y<=400};
}

// Fit an outgoing pull ray inside the preview without changing its bearing.
export function labPullTarget(state,gesture,scale=1){
 const dx=gesture.dx*scale,dy=gesture.dy*scale;let k=1;
 if(dx>0)k=Math.min(k,(620-state.x)/dx);if(dx<0)k=Math.min(k,(20-state.x)/dx);
 if(dy>0)k=Math.min(k,(300-state.y)/dy);if(dy<0)k=Math.min(k,(30-state.y)/dy);
 k=Math.max(0,k);return {x:state.x+dx*k,y:state.y+dy*k};
}
