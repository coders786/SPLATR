/** Explicit adapters for primary-only precision. Legacy geometry/base damage
 * remain separate: future reach perks must not silently widen this corridor. */
import {primaryWidth} from './primary-width.js';
import {sweepGeometry} from './slice-safe.js';
export const SNIPER=Object.freeze({power:.9,width:.9,plates:1});
export const EXTRA_PLATE_CAP=2;
export function precisionShot(eyes,power=0,shot=0){
 const eligible=eyes==='sniper'&&Number.isFinite(power)&&power>=SNIPER.power;
 return {shot,power,eligible,spent:false,widthScale:eligible?SNIPER.width:1};
}
/** Family geometry and temporary gains retain their established order; positive
 * part width caps before independent narrowing, separately for far/near bands. */
export function primaryGeometry({angle=0,rules,sword,reach=1,width=1,shot=null}={}){
 const composition=primaryWidth(angle,rules,shot),options={reach:reach*sword.reach,width:composition.width*sword.width*width,closeWidth:composition.closeWidth,closeRadius:composition.closeRadius};
 return {...options,composition,geometry:sweepGeometry(options)};
}
export function legacyPrimaryBase({secondary=false,drive=false,fromShear=false,kind='',armorDamage=1,swordArmor=0,shearDamage=1}={}){
 return secondary?1:drive?3:!fromShear&&['crown','bastion'].includes(kind)?armorDamage+swordArmor:fromShear?shearDamage:1;
}
/** Stable contribution receipt; eligibility consumes a first-contact perk even
 * at zero marginal room. Boss exclusions never enter this function. */
export function extraPlateReceipt(contributions=[],cap=EXTRA_PLATE_CAP){
 let total=0;
 const entries=contributions.map(({id,plates})=>{const requested=Math.max(0,plates),applied=Math.max(0,Math.min(requested,cap-total));total+=applied;return Object.freeze({id,requested,applied,capLimited:applied<requested});});
 return Object.freeze({total,entries:Object.freeze(entries)});
}
export function commitPrecision(shot,{primary=false,kind='',other=[]}={}){
 if(!primary||!shot?.eligible||shot.spent||!['crown','bastion'].includes(kind))return null;
 shot.spent=true;
 const receipt=extraPlateReceipt([...other,{id:'sniper',plates:SNIPER.plates}]);
 return Object.freeze({...receipt,shot:shot.shot,kind,consumed:true});
}
