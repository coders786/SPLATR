/** Positive width is bounded before independent narrowing and temporary width.
 * Existing sword-family geometry and reach are not reinterpreted here. */
export const PRIMARY_WIDTH_CAP=1.35;
export const INK_WIDTH=1.12;
export function positiveWidth(contributions=[]){
 let total=1;
 const entries=contributions.map(({id,factor})=>{
  const requested=Math.max(1,factor),before=total;total=Math.min(PRIMARY_WIDTH_CAP,total*requested);
  return Object.freeze({id,requested,applied:total/before,capLimited:total+1e-10<before*requested});
 });
 return Object.freeze({total,entries:Object.freeze(entries),cap:PRIMARY_WIDTH_CAP});
}
export function primaryWidth(angle,rules,shot=null){
 const head=Math.abs(Math.sin(angle))<=Math.sin(25*Math.PI/180)?rules.horizontalWidth:1;
 const resolve=near=>positiveWidth([{id:'head',factor:head},{id:'core',factor:near?rules.closeWidth:1},{id:'dash',factor:rules.inkWidth||1},{id:'slash',factor:1}]);
 const far=resolve(false),near=resolve(true),narrowing=rules.cutWidth*(rules.dashNarrowing??1)*(shot?.widthScale??1);
 return Object.freeze({far,near,narrowing,width:far.total*narrowing,closeWidth:near.total/far.total,
  // Preserve the legacy near-band distance while decoupling its width gain.
  // This chunk deliberately caps coverage, not the player's body or distance.
  closeRadius:100*rules.closeWidth});
}
