/** Credits are per defeated full-size enemy, never per hit, fragment or speed. */
export const ENEMY_CREDITS=Object.freeze({fang:2,prism:3,fork:3,bastion:4,crown:10,pulse:3,rift:4,well:4});
export const ENEMY_NAMES=Object.freeze({fang:'Fang',prism:'Prism',fork:'Fork',bastion:'Armor',crown:'Crown',pulse:'Pulse',rift:'Rift',well:'Well',fragment:'Fragments'});
export function createKillLedger(){return {kills:0,credits:0,points:0,rows:{}};}
export function recordEnemyReward(previous,{kind,small=false,paper=false,points=0}={}){
 if(paper||!Object.hasOwn(ENEMY_CREDITS,kind))return previous;
 const key=small?'fragment':kind,old=previous.rows[key]||{kills:0,credits:0,points:0};
 const credit=Math.min(10000-previous.credits,small?0:ENEMY_CREDITS[kind]),score=Number.isFinite(points)?Math.max(0,Math.floor(points)):0;
 return {kills:previous.kills+1,credits:previous.credits+credit,points:previous.points+score,rows:{...previous.rows,[key]:{kills:old.kills+1,credits:old.credits+credit,points:old.points+score}}};
}
