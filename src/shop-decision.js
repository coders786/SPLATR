import {isCosmeticSlot} from './cosmetic-slots.js';
/** Presentation only. Purchases still go through the Armory's existing handler. */
export function shopDecision({item,owned=false,equipped=false,coins=0}) {
 const name=item.name;
 if(equipped)return Object.freeze({label:'EQUIPPED',hint:'Ready for your next run.',status:'EQUIPPED',disabled:true,aria:`${name} is equipped`});
 if(owned)return Object.freeze({label:'EQUIP FOR NEXT RUN',hint:isCosmeticSlot(item.slot)?'Owned, not equipped. Equip it to use this look.':'Owned, not equipped. Equip it to use its power.',status:'OWNED · NOT EQUIPPED',disabled:false,aria:`Equip ${name} for your next run`});
 if(item.price===null){const challenge=item.id==='oni'?'Defeat a Crown at 1 health.':item.id==='glass'?'Reach Wave 5.':'Complete its challenge.';return Object.freeze({label:'CHALLENGE LOCKED',hint:`${challenge} Trying it here is free.`,status:'FREE PREVIEW',disabled:true,aria:`${name} is challenge locked. ${challenge}`});}
 const missing=Math.max(0,item.price-coins);
 return Object.freeze({label:missing?`NEED ${missing} MORE`:`BUY · ${item.price} CREDITS`,hint:missing?`Costs ${item.price} credits. Earn credits by playing runs. Trying it here is free.`:'Buy and equip for your next run in one step.',status:'FREE PREVIEW',disabled:missing>0,aria:missing?`${name} costs ${item.price} credits. You need ${missing} more.`:`Buy ${name} for ${item.price} credits. This also equips it for your next run.`});
}
