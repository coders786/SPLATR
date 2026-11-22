/** Pure finite encounter plans. No renderer, physics, persistence or runtime mutation. */
const themes=Object.freeze([
 {id:'breach',name:'OPENING CUT',lesson:'Pick a lane. Cut through light targets.',color:'#dfed94'},
 {id:'crossfire',name:'CROSSFIRE',lesson:'Break either Prism to cancel its link.',color:'#c5a5ed'},
 {id:'bastion',name:'IRON LINE',lesson:'Crack armor; leave room for a second pass.',color:'#f2bf81'},
 {id:'fracture',name:'FRACTURE',lesson:'Forks split. Keep an edge for their children.',color:'#f1a191'},
 {id:'regent',name:'REGENT GUARD',lesson:'Separate the Crown from its escorts.',color:'#f59bb2'},
].map(Object.freeze));
const mixSeed=value=>{let n=value>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return (n^(n>>>16))>>>0;};
const normalize=n=>Math.max(1,Number.isFinite(n)?Math.floor(n):1);
export function encounterBrief(number,seed){
 number=normalize(number);const theme=themes[(number-1)%5],cycle=Math.floor((number-1)/5),total=Math.min(30,12+(number-1)*3);
 const counts={fang:total};
 const add=(kind,n)=>{counts[kind]=n;counts.fang-=n;};
 if(theme.id==='crossfire'){add('prism',cycle>=1?4:2);}
 if(theme.id==='bastion'){add('bastion',Math.min(5,3+cycle));add('prism',2);}
 if(theme.id==='fracture'){add('fork',Math.min(4,2+cycle));add('pulse',1);add('prism',2);}
 if(theme.id==='regent'){add('crown',1);add('bastion',3);add('prism',2);add('pulse',1);}
 if(cycle>=1&&theme.id!=='regent')add('rift',Math.min(2,cycle));
 if(cycle>=2&&theme.id!=='crossfire')add('well',1);
 // Keep the teaching spine and fifth-wave Crown, but draft extra roles
 // from the unlocked roster. Replace light bodies, never grow the budget.
 if(Number.isFinite(seed)&&number>1){
  let draft=mixSeed((seed>>>0)^Math.imul(number,2246822519));
  const roll=()=>{draft=(Math.imul(draft,1664525)+1013904223)>>>0;return draft/4294967296;};
  const roster=number<4?['bastion','pulse']:number<6?['bastion','pulse','fork']:cycle<2?['bastion','pulse','fork','rift']:['bastion','pulse','fork','rift','well'];
  const budget=1+Math.floor(roll()*Math.min(4,1+cycle+Math.floor(number/3)));
  for(let i=0;i<budget&&counts.fang>5;i++){const kind=roster[Math.floor(roll()*roster.length)];if((counts[kind]||0)>=4)continue;counts[kind]=(counts[kind]||0)+1;counts.fang--;}
 }
 const threat=Object.entries(counts).filter(([kind,n])=>kind!=='fang'&&n>0).map(([kind,n])=>`${n} ${kind.toUpperCase()}`).join(' / ')||'LIGHT TARGETS';
 return Object.freeze({...theme,number,total,cycle,milestone:theme.id==='regent',counts:Object.freeze(counts),threat});
}
export function planEncounter(seed,number,player={x:0,y:0}){
 player={x:Number.isFinite(player?.x)?player.x:0,y:Number.isFinite(player?.y)?player.y:0};
 const brief=encounterBrief(number,seed);let n=((seed>>>0)^Math.imul(brief.number,2654435761))>>>0;
 const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 const formation=['ladder','chevron','split'][Math.floor(random()*3)],positions=[];
 // 36 cells leave slack for a player-clearance exclusion even at the 30-body cap.
 for(let row=0;row<6;row++)for(let col=0;col<6;col++){
  const x=(formation==='split'?(col<3?-1:1)*(210+Math.abs(col-(col<3?2:3))*230):-650+col*260)+(random()-.5)*24;
  const y=-200-row*180+(formation==='chevron'?-Math.abs(col-2.5)*16:0)+(random()-.5)*14;
  if(Math.hypot(x-player.x,y-player.y)>=205)positions.push({x,y});
 }
 // Candidate slack is deterministic, not a random retry loop. This fallback is
 // only relevant to injected non-finite player coordinates, handled below.
 if(positions.length<brief.total)throw new RangeError('Encounter has insufficient safe spawn cells');
 // Shuffle safe cells too: runs no longer fill the same front rows first.
 for(let i=positions.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
 const kinds=[];for(const [kind,count]of Object.entries(brief.counts))if(kind!=='fang')for(let i=0;i<count;i++)kinds.push(kind);
 while(kinds.length<brief.total)kinds.push('fang');
 // Mix the enemy roles through the formation instead of hiding all hard targets
 // in the last row. Seed changes placement, never increases the budget.
 for(let i=kinds.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}
 const specs=kinds.map((kind,i)=>Object.freeze({id:`wave/${brief.number}/${i}`,kind,...positions[i],home:'wave',slot:i,wave:true,wavePlaced:true,delay:95+(i%6)*19,phase:random()*Math.PI*2}));
 const prismIds=specs.filter(e=>e.kind==='prism').map(e=>e.id),links=[];
 for(let i=0;i+1<prismIds.length;i+=2)links.push(Object.freeze({a:prismIds[i],b:prismIds[i+1],period:300+i*30,age:0}));
 return Object.freeze({...brief,formation,specs:Object.freeze(specs),links:Object.freeze(links)});
}
export function recommendWaveOffer(offers,{next,sword,hp=3,previous}={}){
 const ranked=offers.map((buff,index)=>{
  let score=0,reason='A different approach for one wave.';
  if(buff.id==='barrier'){score=hp<=1?12:hp===2?5:1;reason=hp<=1?'One hull left. Block one otherwise damaging hit.':'Insurance against the next wave’s first hit.';}
  if(buff.id==='breaker'&&((next?.counts?.bastion||0)+(next?.counts?.crown||0))>0){score=8;reason='Armored targets are in the next formation.';}
  if(buff.id==='guard'){score=hp<=1?6:2;reason='More escape time after a connected primary cut.';if(previous?.hits>0){score=Math.max(score,5);reason=`${previous.hits} hull lost. Extra escape time after cuts—not a shield.`;}}
  if(buff.id==='reach'){score=['rapier','echo'].includes(sword?.family)?5:3;reason='Set up a cutting lane from farther away.';}
  if(buff.id==='linger'){score=['reaper','cleaver'].includes(sword?.family)?5:3;reason='More active time on a committed pass.';if(previous?.shots>previous?.cuts*2&&previous?.cuts>0){score=Math.max(score,4);reason=`${previous.shots} launches for ${previous.cuts} cuts. Longer blade window; aim is unchanged.`;}}
  if(buff.id==='fleet'){score=2;reason='Cross the field faster; your aim direction stays yours.';}
  if(buff.id==='comet'){score=hp>1?2:0;reason='Faster crossings, but a shorter cutting line.';}
  if(buff.id==='cleaver'){score=((next?.counts?.bastion||0)+(next?.counts?.crown||0))>0?7:1;reason='Extra armor damage, shorter blade window.';}
  if(buff.id==='duelist'){score=hp>=3?3:0;reason='Higher score, less escape time after contact.';}
  if(buff.id==='bastion'){score=hp<=1?11:4;reason='Two blocked hits in exchange for slower launches.';}
  if(buff.id==='bounty'){score=hp>=3?3:0;reason='Trade a combat modifier for more cut score.';}
  return {id:buff.id,reason,score,index};
 }).sort((a,b)=>b.score-a.score||a.index-b.index);
 return ranked.length?Object.freeze({id:ranked[0].id,reason:ranked[0].reason}):null;
}
