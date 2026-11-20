import { createRun } from './src/run.js';
const g = createRun(1, ()=>{}, {staged:true});
let worstAngle = 0, worstAt = 0;
for (let t=0;t<1200;t++){
  if (g.world.clock % 40 < 1) g.dash(g.suggestion());
  g.tick();
  const a = Math.abs(g.world.player.angle);
  if (a > worstAngle) { worstAngle = a; worstAt = t; }
}
const deg = worstAngle * 180 / Math.PI;
console.log('worst |angle| =', worstAngle.toFixed(6), 'rad =', deg.toFixed(2), 'deg at tick', worstAt);
