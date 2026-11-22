import {powerReadout}from'./power-readout.js';
export function storyRole(item){
 const groups={coil:['bolt','CHAIN'],crown:['shield','ARMOR'],iron:['shield','GUARD'],grav:['magnet','PULL'],magnet:['magnet','CLOSE CUT'],halo:['clock','FOCUS'],time:['clock','FOCUS'],prism:['bank','WALL'],wings:['bank','WALL'],thrusters:['bank','WALL'],anchor:['land','FLOOR'],oni:['glass','LAST HULL'],glass:['glass','1 HULL'],riot:['bolt','4 KILLS'],viper:['rocket','SPEED'],samurai:['blade','WIDE'],echo:['linger','ECHO'],ghost:['linger','LATE CUT'],beacon:['target','WARN'],standard:['core','BALANCED']};
 const [icon,label]=groups[item.id]||['sparkle','STYLE'];return Object.freeze({icon,label,stat:powerReadout(item).short,cosmetic:powerReadout(item).cosmetic});
}
