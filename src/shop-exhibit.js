/** Read-only shelf state. Selection, ownership and wearing are independent. */
export function exhibitStock(item,{owned=false,equipped=false,selected=false,coins=0}={}){
 const state=equipped?'equipped':owned?'owned':item.price===null?'locked':selected?'trying':'available';
 const label={equipped:'Equipped',owned:'Owned',locked:'Challenge',trying:'Trying',available:''}[state];
 return Object.freeze({state,label,price:owned?(equipped?'Equipped':'Owned'):item.price===null?'Unlock':`${item.price}`,shortfall:owned||item.price===null?0:Math.max(0,item.price-coins)});
}
