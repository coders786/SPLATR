import {isCosmeticSlot} from './cosmetic-slots.js';
import {ITEMS} from './art/splatr-art-engine.js';
/** Player-facing copy only. Never changes timing, damage or saved equipment. */
export function secondsLabel(ticks){
 const n=Number(ticks)/60;
 return `${Number(n.toFixed(n<.1?2:2))}s`;
}
/** Legacy display boundary; internal rules/tests keep their exact tick units. */
export function playerText(text=''){
 return String(text)
  .replace(/\btime ticks\b/gi,'time markers')
  .replace(/\b(six|four|three|two|one) simulation ticks?\b/gi,(_,n)=>`about ${secondsLabel({six:6,four:4,three:3,two:2,one:1}[n.toLowerCase()])}`)
  .replace(/\b(\d+(?:\.\d+)?)\s*[- ](?:world[- ]|simulation |aim )?ticks?\b/gi,(_,n)=>secondsLabel(n))
  .replace(/\b(\d+(?:\.\d+)?)\s+(?:world |simulation |aim )?ticks?\b/gi,(_,n)=>secondsLabel(n))
  .replace(/\b(\d+)T\b/g,(_,n)=>secondsLabel(n))
  .replace(/\bticks\b/gi,'moments').replace(/\btick\b/gi,'moment')
  .replace(/\bsimulation\b/gi,'play').replace(/\bprimary\b/gi,'direct')
  .replace(/\bsecondaries\b/gi,'follow-up attacks').replace(/\bsecondary\b/gi,'follow-up')
  .replace(/\bworld time\b/gi,'game time').replace(/\bworld clock\b/gi,'game speed')
  .replace(/\baccepted launch\b/gi,'successful dash').replace(/\blegal (?:relaunch|launch)\b/gi,'dash')
  .replace(/\bmarginal\b/gi,'extra').replace(/\bcollider\b/gi,'hitbox');
}
// Each card explains the visual metaphor, an action, and its actual boundary.
// No unreleased elemental/status powers are advertised here.
const entries={
 none:['Go light.','No headgear, no extra rules.','Play your usual way.','A clean silhouette, with no stat changes.'],
 halo:['Hang in the air.','While you aim during a fall, gravity is 15% lighter.','Hold aim on your way down.','The floating ring means a gentler fall, not flight.'],
 neko:['Keep the combo alive.','You get about 0.2s more to land your next combo kill.','Cut again before your combo fades.','The ears suggest quick reactions. They do not improve aim.'],
 viper:['Fast, sharp, committed.','Dash 20% faster through a 15% narrower cutting lane.','Line up a clean, straight approach.','The swept horns suggest speed. Your cut ends sooner to keep its straight-line reach in check.'],
 oni:['Make your last heart count.','Kills earn 50% more score while you have just 1 health.','Play carefully when you are one hit from defeat.','The broken horn is a last-stand reward, not protection. Unlock it by defeating a Crown at 1 health.'],
 crown:['Break through armor.','Strip 2 armor plates per direct hit from a Crown or Bastion.','Dash into an armored target.','The heavy crown costs 8% launch speed. It does not add health.'],
 samurai:['Sweep a wider lane.','Nearly horizontal cuts are 20% wider.','Aim mostly left or right, within 25° of level.','Steep cuts keep their usual width. Width bonuses together stop at +35%, before narrower-shot tradeoffs.'],
 coil:['One cut. One extra zap.','A direct cut zaps one nearby enemy for 1 plate.','Cut with another enemy close by.','The coil releases one short arc, within 160px. The zap cannot create more zaps.'],
 beacon:['See the rush coming.','An amber warning marks a Fang as it prepares to charge.','Watch for the warning before choosing your next cut.','The lamp warns you. It does not stop the Fang or block damage.'],
 ninja:['Read the fight.','Expressive slits keep your face clear and readable.','Aim, dash and blink as usual.','No hidden accuracy or focus bonus.'],
 visor:['Aim for longer.','Holding aim uses 10% less focus.','Hold aim when you need more time to line up a cut.','The glass lights while you aim. It adds no target lock or extra slowdown.'],
 blaze:['Turn Overdrive into another dash.','Entering Overdrive returns 1 extra EDGE after the usual kill refill.','Build a combo until Overdrive starts.','Flame-cut eyes glow hot in Overdrive. Full EDGE means no extra refill saved for later.'],
 glitch:['Reconnect your focus.','Focus recovers 12% faster when you are not aiming.','Let go of aim to recover.','The broken circuit closes while focus really returns. It stays quiet when focus is full.'],
 smug:['A little more breathing room.','You get about 0.2s more between combo kills.','Keep cutting before your combo expires.','Half lids open gold in Overdrive. Their expression does not grant another bonus.'],
 hypno:['Make a Fang hesitate.','Hold aim for 0.3s to delay one nearby idle Fang’s next attack for about 0.2s of game time.','Keep a Fang within 140px and clear of walls.','Spirals converge on one Fang per hold. It keeps moving; attacks already started continue. That Fang resists another daze for 1.5s of game time.'],
 sniper:['Line up a plate-piercing shot.','At 90% power or more, your first direct hit on a Crown or Bastion breaks 1 extra plate.','Pull to at least 90% power, then release toward armor.','The shot is 10% narrower. Bosses resist. No homing or score bonus; extra equipment plates share a +2 limit.'],
 paper:['Folded, not armored.','A light paper shell with no stat change.','Use your normal cuts and rebounds.','The folds are part of the character, not extra protection.'],
 obsidian:['Take the fight airborne.','Airborne kills earn 8% more score.','Cut enemies while off the ground.','Dark stone and bright seams make an aerial hunter, not an armored tank.'],
 hologram:['Slip past one needle.','At the very start of a dash, pass through one Prism or Crown needle.','Time your dash as a needle reaches you.','The opening is about 0.07s of game time, then recharges for 2s after use. Walls, enemies, bosses, beams, rings and danger zones still hit normally.'],
 prism:['Bank, then fire.','A side-wall rebound sends out two upward needles that damage Fangs.','Hit a side wall with enemies above you.','Crystal tips fire at most once every 0.75s of game time. They do not grant wall immunity.'],
 iron:['Survive one rush.','Block one Fang rush per run and get pushed clear.','Keep the guard for a dangerous charge.','The iron shield is spent after one block. It does not stop every hazard.'],
 lava:['Keep the heat going.','Get about 0.3s more between combo kills.','Keep cutting before the combo cools off.','Glowing cracks show combo heat. They do not burn enemies.'],
 gold:['Every cut pays better.','Every kill earns 10% more score.','Cut as usual.','Gold means score, not armor. All equipment score bonuses together stop at +25%.'],
 chamfer:['Glance off armor.','Armor hits push you back 20% less.','Dash into armor with forward momentum.','Sloped edges soften the shove. They do not add health or break extra plates.'],
 notched:['Let the vents work.','Focus recovers 12% faster when you are not aiming.','Release aim while some focus is missing.','The vents open only while focus returns. Recovery bonuses together stop at +40%.'],
 segmented:['Store the impact.','Save 20% of forward speed lost on your first armor shove, up to 4 speed.','Dash again within about 0.75s to use the stored boost.','The spring gives back lost speed once. It cannot launch you faster than the hit allowed.'],
 standard:['A balanced heart.','Start with 3 EDGE and 3 health.','Build around your favorite parts.','No hidden damage boost or signature attack.'],
 time:['Recover after a kill.','A kill doubles passive focus recovery for 2s.','Let go of aim after a kill to use the recovery.','The crystal helps focus return. It does not add a second layer of slow motion.'],
 riot:['Reach Rush sooner.','Enter Rush every 4 combo kills instead of 6; sustained speed can also start Rush.','Keep a clean run of kills going.','The reactor trades a faster buildup for only 2 maximum EDGE.'],
 glass:['Double the reward. One heart.','Earn double score, but your maximum health is 1.','Avoid every dangerous contact.','The fragile cartridge never gains extra health from repairs. Unlock by reaching Wave 5.'],
 grav:['Pull toward your aim.','While aiming, gently draw small nearby Fangs toward your aiming line.','Hold a useful angle with small Fangs within 220px.','The gravity chamber moves enemies slowly. It never steers your shot or pulls bosses.'],
 magnet:['Win the close pass.','Cuts within 100px are 20% wider.','Pass close to your target.','Width bonuses together stop at +35%. The magnet does not drag enemies across the arena.'],
 echo:['Leave a blade behind.','Every third direct combo kill leaves a ghost blade for 0.5s of game time.','Chain three direct kills near other Fangs.','The memory stays where it was created and cuts each nearby Fang once. It does not follow you.'],
 ribbon:['A clean finish.','Your original ribbon follows your movement.','Dash and rebound as usual.','Cloth adds no extra force or damage.'],
 wings:['Touch a wall. Get a dash back.','Your first side-wall contact while airborne refills 1 EDGE.','Bank off a side wall before touching the floor.','The latch resets on floor contact. Wings do not let you fly.'],
 ghost:['Let the cut linger.','Your dash can keep cutting for an extra 0.1s of game time.','Catch a target a little later along your dash.','The scarf is not another blade. One shot cannot hit the same enemy again.'],
 'viper-tails':['Lose less speed when turning.','Keep 15% of the speed you would normally lose on a steering dash.','Redirect while already moving.','Taut twin tails help preserve momentum. This is not 15% extra speed and adds nothing from rest.'],
 anchor:['Make the floor kick harder.','Floor rebounds are 15% stronger and clear Fangs within 170px.','Use a floor rebound with Fangs nearby.','The weight strengthens the existing rebound. There is no new slam button.'],
 thrusters:['Boost a good rebound.','Qualifying rail rebounds are 8% stronger.','Bank off a rail with useful speed.','Dry nozzles fire only when the rebound gains speed. The existing speed limit still applies.'],
 spectrum:['Three cuts refill a dash.','Three direct kills in one combo return 1 extra EDGE.','Keep the three colored bands filled through one combo.','Recharges for 2s of game time. Follow-up attacks do not count; full EDGE does not save a refill for later.'],
 razor:['A clean white cut.','The standard cutting flash with no extra modifier.','Dash through your target.','Its shards are an impact effect, not extra damage.'],
 katana:['A brushstroke that lingers.','Your dash can cut for about 0.03s longer in game time.','Catch a target just beyond the usual end of a cut.','Ink is a visual trail, not a second damaging attack.'],
 laser:['Hold the cutting line.','Your dash can cut for about 0.05s longer in game time.','Line up your dash as usual.','The bright scar lasts longer than the damaging cut. It is not a ranged laser beam.'],
 'glitch-fx':['A split-second longer cut.','Your dash can cut for about 0.03s longer in game time.','Cut along your normal dash path.','Red and cyan tears do not repeat the hit.'],
 confetti:['Make one cut count twice.','Multi-kills earn 12% more score.','Cut more than one enemy in a shot.','Gold fragments are a celebration, not damaging shrapnel.'],
 comic:['Keep the combo rolling.','Get about 0.3s more between combo kills.','Cut again before your combo runs out.','The starburst celebrates contact. It does not explode into extra damage.'],
 pixel:['A little extra cutting time.','Your dash can cut for about 0.03s longer in game time.','Use your usual cutting lane.','Falling squares are harmless debris.'],
 'dash-auto':['Your build, in motion.','Your dash trail follows your equipment and sword.','Dash as usual.','No extra speed, damage or hidden elemental effect.'],
 'dash-ink':['Catch the edge of a wider cut.','Your cutting lane is up to 12% wider.','Line up a target just beside your usual dash line.','Width bonuses together stop at +35%, before narrower-shot tradeoffs. No extra cutting time, bigger body or lingering ink damage.'],
 'dash-fire':['Leave the armor burning.','Your first direct contact sets its surviving target and up to 2 nearby enemies on fire. Each can take up to 2 delayed fire hits.','Cut into a group. Fire strikes after 0.3s and 0.6s of game time.','Your shot is 10% narrower. Walls block spread; bosses resist. Burns do not stack, refill EDGE, extend combos or create follow-up attacks.'],
 'dash-lightning':['Launch sharp. Link the hit.','A brief 12% launch burst leads into a narrower cut. Your first direct hit can arc for 1 extra hit to a nearby enemy.','Aim precisely: your cutting lane is 15% narrower. Hit near a group; walls block the arc. Coil can add one different victim at its longer reach.','Burst lasts about 0.07s, then eases out over 0.1s. Faster bank and Hyper motion stay protected. One contact attempt per dash; no homing, repeated shocks, EDGE refill or extra score at speed. Bosses resist the arc.'],
 'dash-ice':['Stop a rush. Keep your opening.','Your first direct hit chills its surviving target and up to 1 nearby enemy. Fangs freeze for 0.3s; heavier enemies move 30% slower for 0.4s.','Hit armor beside a Fang. Frozen Fangs pause their movement and attack countdown, then resume.','Walls block spread; bosses resist. Heavy attacks still charge. Already-fired shots and frozen rushing bodies remain dangerous. After thaw, enemies resist cold for 1.5s. Burns are not added, and aiming no longer costs less focus.'],
 'dash-water':['Recover your flow.','Focus recovers 10% faster when you are not aiming.','Release aim to recover.','The water ribbon does not push enemies or change rebounds.'],
 'dash-void':['Draw them in. Collapse the center.','Your first direct hit opens a short-lived pull field for up to 3 nearby enemies. Selected enemies still inside its small center after 0.3s take 1 extra hit.','Cut into a group. The large broken ring pulls; only the small solid core can hurt.','Walls and bosses resist. One field at a time; ready again 0.6s after it opens. Pull distance is limited. No projectile absorption, protection, combo extension or EDGE refill. No extra score for defeating armor.'],
 'dash-echo':['Leave a cut behind.','Your dash records a short, thin traveled path. After 0.2s it cuts that old path once, dealing 1 extra hit to up to 2 enemies there.','Lead enemies onto the outlined path. The bright replay strikes where you traveled, not beside your current position.','One pending replay; busy launches do not queue another. Walls, banks and jumps in position stop recording. No rewind, homing, protection, EDGE refill or combo extension. The old extra combo time is removed.'],
 'pointer-reticle':['Know where the pull starts.','Marks the point where you begin aiming.','Press, pull back, then release.','The reticle adds no damage or target lock.'],
 'pointer-diamond':['A sharper-looking start.','Your dash can cut for about 0.02s longer in game time.','Use the diamond as your aiming origin.','The diamond does not become a projectile.'],
 'pointer-orbit':['Return to focus.','Focus recovers 10% faster when not aiming.','Release your pull to recover.','Orbiting marks are not an enemy-pulling field.'],
 'pointer-cross':['Spend less focus.','Aiming uses 8% less focus.','Hold your pull to line up the shot.','The crosshair does not lock on or add another slowdown.'],
 'radar-base':['See nearby targets.','Marks nearby off-screen enemies with red edge arrows.','Follow the arrow to the target.','Only contacts within the basic radar range are shown.'],
 'radar-1':['See farther targets.','Edge arrows detect enemies 35% farther away.','Follow the arrows to targets.','It expands radar, not the camera or your attack range.'],
 'radar-2':['Spot distant hazards.','Edge arrows reach 70% farther and mark off-screen projectiles and danger zones.','Watch for the red hazard dot on an arrow.','Warnings do not block hazards.'],
 'radar-3':['See charging threats.','Edge arrows reach 120% farther and highlight enemy wind-ups, charges and active hazards.','Look for bright warning arrows before committing.','Markers describe the current fight, not guaranteed future positions.'],
 'trajectory-base':['See the start of your flight.','Shows a short predicted path while aiming.','Pull back to see where the shot begins.','The path stops at the first wall or solid surface.'],
 'trajectory-1':['Plan farther ahead.','Shows more of your predicted launch path.','Look along the line before releasing.','It does not predict rebounds or moving enemies.'],
 'trajectory-2':['Find the first impact.','Adds travel-time marks and a first-impact marker to a longer path.','Look for the marker at the end of the line.','It describes the current scene. Moving enemies can change the result.'],
 'trajectory-3':['Know the approach.','Shows the longest path, impact marker, speed, angle and estimated travel time.','Read the path before a difficult launch.','No promised ricochet or guaranteed hit on a moving enemy.'],
 twilight:['The original arena.','The familiar industrial backdrop with no world modifier.','Play your normal route.','Scenery is not extra collision geometry.'],
 tokyo:['A city built for speed.','High-speed kills earn 8% more score.','Cut at speed 18 or more.','Neon rain does not hide or recolor danger warnings.'],
 foundry:['Make armored kills pay.','Kills against armored foes earn 12% more score.','Take down Crowns, Bastions and bosses.','Furnaces are scenery. They do not burn enemies or prime your blade.'],
 manga:['Make the multi-cut panel.','Multi-kills earn 10% more score.','Cut several enemies in one shot.','Printed impact marks do not add explosions or damage.'],
 synth:['Find your rhythm again.','Focus recovers 15% faster when you are not aiming.','Release aim between cuts.','The grid does not refill EDGE or change the arena floor.'],
 void:['Make the boss count.','Boss kills earn 15% more score.','Defeat the Landlord.','The broken orbital gate is scenery, not a gravity well.'],
};
export const SHOP_ABILITIES=Object.freeze(Object.fromEntries(Object.entries(entries).map(([id,[headline,effect,use,limit]])=>{
 const item=ITEMS.find(x=>x.id===id);
 return [id,Object.freeze(isCosmeticSlot(item?.slot)?{headline:`${item.name} appearance.`,effect:'Changes the look only. No gameplay modifiers.',use:'Equip it to use this look in your next run.',limit:'Does not change damage, movement, score, abilities or sword builds.'}:{headline,effect,use,limit})];
})));
export function shopAbility(id){const value=SHOP_ABILITIES[id];if(!Object.hasOwn(SHOP_ABILITIES,id))throw new RangeError('Unknown shop item');return value;}
export function readablePower(raw,id){
 const copy=shopAbility(id);
 const effect=id==='notched'?`With your other parts, the vents add ${raw.chips[0].match(/[+][0-9]+%/)[0]} focus recovery. Your total recovery bonus is ${raw.chips[1].match(/[+][0-9]+%/)[0]}.`:copy.effect;
 return Object.freeze({...raw,title:playerText(raw.title),trigger:playerText(raw.trigger),short:playerText(raw.short),chips:Object.freeze(raw.chips.map(playerText)),detail:`${effect} ${copy.limit}${raw.buildNote?' '+raw.buildNote:''}${/cap at \+25%/.test(raw.detail)?' Equipment score bonuses together stop at +25%.':''}${/caps at 30%/.test(raw.detail)?' Aim savings together stop at 30%.':''}${/caps at 40%/.test(raw.detail)&&id!=='notched'?' Recovery bonuses together stop at +40%.':''}`});
}

/** A cached shop-only adapter. Does not patch the real context or live renderer. */
const readableContexts=new WeakMap();
export function playerCanvas(context){
 if(!context)return context;if(readableContexts.has(context))return readableContexts.get(context);
 const methods=new Map(),view=new Proxy(context,{
  get(target,key){const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;
   if(!methods.has(key))methods.set(key,['fillText','strokeText'].includes(key)?(text,...args)=>value.call(target,playerText(text),...args):value.bind(target));return methods.get(key);},
  set(target,key,value){return Reflect.set(target,key,value,target);},
 });readableContexts.set(context,view);return view;
}
