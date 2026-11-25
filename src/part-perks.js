/** Authoritative perks for previously visual-only parts. No rendering or RNG.
 * Bonuses stack additively, with hard caps; no free hits or recursive procs. */
const perk = (stat, value, title, chip, trigger, detail) => Object.freeze({stat,value,title,chip,trigger,detail});
const blade = (n) => perk('blade',n,'BLADE EXTENSION',`BLADE +${n} TICKS`,'EVERY DASH',`Adds ${n} simulation ticks to the active launch blade.`);
const grace = (n) => perk('grace',n,'CHAIN GRACE',`CHAIN +${n} TICKS`,'AFTER A KILL',`Adds ${n} simulation ticks to the chain expiry window after a kill.`);
const focus = (n) => perk('focus',n,'FOCUS EFFICIENCY',`AIM COST −${n}%`,'WHILE AIMING',`Aiming consumes ${n}% less FOCUS. Does not slow physics further.`);
const recovery = (n) => perk('recovery',n,'FOCUS RETURN',`RECOVERY +${n}%`,'NOT AIMING',`Passive FOCUS recovery is ${n}% faster when not aiming.`);
const score = (n, when, trigger) => perk(`score:${when}`,n,'PRECISION BOUNTY',`SCORE +${n}%`,trigger,`Earn ${n}% more kill score ${trigger.toLowerCase()}. All equipment score perks together cap at +25%.`);
export const PART_PERKS = Object.freeze({
  neko: grace(12), visor: focus(10), blaze: score(8,'drive','IN OVERDRIVE'),
  obsidian: score(8,'air','WHILE AIRBORNE'), hologram: focus(12),
  katana: blade(2), laser: blade(3),
  tokyo: score(8,'fast','AT SPEED 18+'), foundry: score(12,'armor','VS ARMORED FOES'),
  glitch: recovery(12), smug: grace(12), hypno: focus(15), sniper: score(10,'power','AT FULL POWER'),
  lava: grace(18), gold: score(10,'all','ON EVERY KILL'),
  'viper-tails': score(10,'fast','AT SPEED 18+'), spectrum: grace(12),
  'glitch-fx': blade(2), confetti: score(12,'multi','ON MULTI-CUTS'), comic: grace(18), pixel: blade(2),
  manga: score(10,'multi','ON MULTI-CUTS'), synth: recovery(15), void: score(15,'boss','VS LANDLORDS'),
  chamfer: blade(1), notched: focus(8), segmented: grace(12),
  'dash-ink': blade(1), 'dash-fire': blade(2), 'dash-lightning': score(10,'fast','AT SPEED 18+'),
  'dash-ice': focus(8), 'dash-water': recovery(10), 'dash-void': score(12,'armor','VS ARMORED FOES'), 'dash-echo': grace(12),
  'pointer-diamond': blade(1), 'pointer-orbit': recovery(10), 'pointer-cross': focus(8),
});
export const BASE_PARTS = Object.freeze({
  none: ['BALANCED HULL','3 BASE HEALTH'], ninja:['CLEAR SIGHT','STANDARD AIM'],
  paper:['BALANCED HULL','3 BASE HEALTH'], ribbon:['STANDARD REBOUND','FULL BANK CONTROL'],
  razor:['STANDARD BLADE','FULL BASE WINDOW'], twilight:['ARENA READ','STANDARD CONTRAST'],
  'dash-auto':['ADAPTIVE DASH','FULL BASE SPEED'], 'pointer-reticle':['FIELD AIM','POWER READOUT'],
});
export function resolvePartPerks(equipment) {
  const perks = Object.values(equipment).map(id => PART_PERKS[id]).filter(Boolean);
  const sum = stat => perks.filter(p=>p.stat===stat).reduce((n,p)=>n+p.value,0);
  return Object.freeze({
    perkBlade: Math.min(8,sum('blade')),
    chainGrace: Math.min(36,sum('grace')),
    focusDrain: 1-Math.min(30,sum('focus'))/100,
    focusRegen: 1+Math.min(40,sum('recovery'))/100,
    scorePerks: Object.freeze(perks.filter(p=>p.stat.startsWith('score:'))),
  });
}
export function perkScoreMultiplier(perks, {air=false,speed=0,power=0,drive=false,kind='',kills=0}={}) {
  const active={all:true,air,fast:speed>=18,power:power>=.9,drive,armor:['bastion','crown','monolith'].includes(kind),boss:kind==='monolith',multi:kills>=1};
  return 1+Math.min(25,perks.filter(p=>active[p.stat.slice(6)]).reduce((n,p)=>n+p.value,0))/100;
}
