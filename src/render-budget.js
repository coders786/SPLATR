/** Backing-store budget, independent of CSS/input/world coordinates. DPR never
 * exceeds 1; large screens downsample rather than allocating Retina surfaces. */
export const MAX_RENDER_PIXELS=921600;
export function renderBudget(width,height,dpr=1){
 const w=Math.max(1,Number.isFinite(width)?width:1),h=Math.max(1,Number.isFinite(height)?height:1);
 const scale=Math.min(1,Number.isFinite(dpr)&&dpr>0?dpr:1,Math.sqrt(MAX_RENDER_PIXELS/(w*h)));
 return Object.freeze({width:Math.max(1,Math.floor(w*scale)),height:Math.max(1,Math.floor(h*scale)),scale});
}
