/** Player-facing language: describe the action, not invented equipment lore. */
const entries={
 reach:['LONGER CUT','Reach farther enemies','Reach +20%',''],
 fleet:['FASTER DASH','Cross the field faster','Speed +15%',''],
 comet:['SHORT-BLADE RUSH','Dash faster, cut closer','Speed +25%','Reach −15%'],
 breaker:['BREAK ARMOR','Remove an extra plate','Breaks +1 plate',''],
 cleaver:['HEAVY CUT','Break more armor','Breaks +2 plates','Shorter slash (−0.07s)'],
 linger:['LONGER SLASH','Keep cutting after launch','Slash time +0.13s',''],
 bounty:['MORE SCORE','Earn more cut points','Score +25%',''],
 duelist:['RISKY SCORE','More score, less protection','Score +50%','Less protection (−0.07s)'],
 guard:['SAFER CUTS','More time to exit the cut target','Exit window +0.13s',''],
 barrier:['BLOCK A HIT','A shield takes one hit','Blocks 1 hit',''],
 bastion:['BLOCK TWO HITS','Two shields, slower dash','Blocks 2 hits','Speed −10%'],
};
export const BUFF_PRESENTATION=Object.freeze(Object.fromEntries(Object.entries(entries).map(([id,[name,effect,stat,cost]])=>[id,Object.freeze({name,effect,stat,cost})])));

/** One stat source for the chooser, accessibility copy and active HUD.
 * Lucky labels derive from applied numbers, never a separately authored string. */
export function buffPresentation(buff){
 const base=BUFF_PRESENTATION[buff?.id];if(!base)return null;
 if(!buff.lucky)return {...base,lucky:false,accessibleName:base.name};
 const percent=value=>Math.round((value-1)*100);
 const stats={fleet:()=>`Speed +${percent(buff.speed)}%`,reach:()=>`Reach +${percent(buff.reach)}%`,bounty:()=>`Score +${percent(buff.score)}%`,linger:()=>`Slash time +${(buff.blade/60).toFixed(2)}s`,guard:()=>`Exit window +${(buff.guard/60).toFixed(2)}s`};
 const stat=stats[buff.id]?.();
 const valid=!!stat&&!/NaN|Infinity/.test(stat);
 return {...base,stat:valid?stat:base.stat,lucky:valid,accessibleName:valid?`${base.name}. Lucky roll`:base.name,usualStat:base.stat};
}
