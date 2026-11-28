/** Read-only combat -> lens projection. No drawing, DOM, timers or game writes. */
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:0));
export const COMBAT_LENS_LIMITS=Object.freeze({chromatic:3.2,blur:.72,contrast:1.16,protect:8});
export function createCombatLens(){
 let focus=0,streak=0,beat=0,release=0,lastChain=0,lastShots=null,held=false,hit=false,energy=0,damage=0,launch=0;
 const reset=()=>{focus=streak=beat=release=lastChain=0;lastShots=null;held=hit=false;energy=damage=launch=0;};
 const event=(type,data={})=>{if(type==='cut'&&!data?.secondary&&!data?.small)hit=true;if(type==='hurt')damage=1;if(type==='dash')launch=Math.max(launch,clamp(data?.power??1));};
 function tick(state={},motion=true){
  if(state.phase!=='playing'){reset();return;}
  const on=!!state.held;
  const live=state.chainTime>0?Math.max(0,state.chain||0):0;
  const target=live>=3?clamp((live-2)/8,.15,.9):0;
  if(!motion){focus=on?1:0;streak=target;beat=release=energy=damage=launch=0;}
  else{
   const speed=clamp(((state.movedAvg??state.moved??0)-12)/48);
   const targetEnergy=Math.max(speed,state.hyper?.85:0,state.drive>0?.5:0);
   energy+=(targetEnergy-energy)*(targetEnergy>energy?.10:.055);
   damage*=.89;launch*=.86;
   focus+=(Number(on)-focus)*(on?.14:.1);
   streak+=(target-streak)*(target>streak?.12:.07);
   beat*=.87;release*=.84;
   if(live>lastChain&&[3,5,7,10].some(n=>lastChain<n&&live>=n))beat=.8;
   if(hit&&live>=3)beat=Math.max(beat,.35);
   if(held&&!on&&lastShots!==null&&state.shots>lastShots)release=1;
  }
  hit=false;held=on;lastShots=state.shots;lastChain=live;
 }
 function read(motion=true){
  // Reduced motion keeps a modest static grade; no fringe, blur or pulses.
  const f=motion?focus:0,s=motion?streak:0,b=motion?beat:0,r=motion?release:0;
  return {focus:f,streak:s,beat:b,release:r,
   chromatic:motion?clamp(.7+f*1.05+s*.5+b*.4+r*.8,0,COMBAT_LENS_LIMITS.chromatic):0,
   blur:motion?clamp(.14+f*.42+s*.08,0,.72):0,
   contrast:1.085+f*.025+s*.035,
   saturation:1.025+s*.045,
   vignette:.075+f*.085+s*.055,
   bloom:.1+s*.07+b*.035,
   tint:s*.035-f*.025,
   grain:motion?.002:0,
   energy:motion?clamp(energy):0,damage:motion?clamp(damage):0,launch:motion?clamp(launch):0,
   clarity:.10+s*.06};
 }
 return {tick,event,read,reset};
}

/** Eight priority masks plus a protected aim segment. Radius is normalized to
 * viewport height so circles remain circular on portrait and landscape. */
export function projectCombatLens(run,view,aim=null){
 const p=run?.world?.player?.position||{x:0,y:0},v=view||{x:0,y:0,w:1,h:1};
 const w=Math.max(1,v.w||1),h=Math.max(1,v.h||1),nx=x=>(x-v.x)/w,ny=y=>(y-v.y)/h;
 const focus={x:clamp(nx(p.x)),y:clamp(ny(p.y))},candidates=[];
 const add=(e,priority)=>{if(!e||![e.x,e.y].every(Number.isFinite))return;const x=nx(e.x),y=ny(e.y);if(x<-.1||x>1.1||y<-.1||y>1.1)return;candidates.push({x,y,r:clamp(((e.r||12)+22)/h,.025,.18),priority,distance:Math.hypot(e.x-p.x,e.y-p.y)});};
 for(const e of run?.combat?.enemies?.values?.()||[])add(e,e.mode==='rush'?4:e.mode==='tell'?3:1);
 for(const e of run?.combat?.hazards||[])add(e,5);
 candidates.sort((a,b)=>b.priority-a.priority||a.distance-b.distance);
 const protectedActors=new Float32Array(24);
 for(let i=0;i<8;i++){const e=candidates[i];protectedActors.set(e?[e.x,e.y,e.r]:[-10,-10,0],i*3);}
 const length=aim?Math.hypot(aim.x||0,aim.y||0):0;
 const aiming=!!run?.state?.held&&length>.01;
 const end=aiming?{x:nx(p.x+aim.x/length*190),y:ny(p.y+aim.y/length*190)}:focus;
 const velocity=run?.world?.player?.velocity,vx=Number.isFinite(velocity?.x)?velocity.x:0,vy=Number.isFinite(velocity?.y)?velocity.y:0,speed=Math.hypot(vx,vy);
 return {focus,aim:{x:end.x,y:end.y,active:aiming},protectedActors,flow:{x:speed?vx/speed:0,y:speed?vy/speed:0,amount:clamp((speed-20)/50)}};
}
