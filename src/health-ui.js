// Names match actual hurt() causes; don't describe passive contact as an attack.
const bodyContacts=new Set(['Fang','Pulse','Prism','Fork','Bastion','Rift','Well','Crown']);
export function healthDamageLabel(cause){return cause==='Fang'?'Fang rush':bodyContacts.has(cause)?`${cause} contact`:String(cause||'Enemy hit');}
export function healthDeathMessage(cause,maxHealth){
 const max=Number.isFinite(maxHealth)&&maxHealth>0?maxHealth:3;
 return `Health 0/${max} · Run over. Last hit: ${healthDamageLabel(cause)}.`;
}
