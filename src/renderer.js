// Browser boundary only. Artwork and simulation remain independent of WebGL.
import {createArtRenderer,legacy_renderer} from './art/splatr-art-engine.js';
import {renderBudget} from './render-budget.js';
import {UberPostFX} from './uber-postfx.js';
import {projectCombatLens} from './combat-postfx.js';
export const {traceDraws,MERGE_R,MERGE_AGE,recordPopup}=legacy_renderer;
export function createRenderer(canvas,{postfx='off'}={}){
  const ctx=canvas.getContext('2d',{alpha:false});
  const makeSurface=canvas.ownerDocument?()=>canvas.ownerDocument.createElement('canvas'):null;
  let contextListener=()=>{},disposed=false,lastMotion=true;
  const fx=new UberPostFX(canvas,{surface:makeSurface,capabilities:{memory:globalThis.navigator?.deviceMemory??2,cores:globalThis.navigator?.hardwareConcurrency??2},onContextState:state=>contextListener(state)});
  fx.setMode(postfx);
  const inset=(name,fallback)=>{
    try{const n=parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));return Number.isFinite(n)?n:fallback;}catch{return fallback;}
  };
  let engine;
  function resize(){
    if(disposed)return;
    const box=canvas.getBoundingClientRect(),w=Math.max(1,box.width),h=Math.max(1,box.height);
    const budget=renderBudget(w,h,globalThis.devicePixelRatio||1);
    canvas.width=budget.width;canvas.height=budget.height;
    const top=inset('--top',32),gutter=inset('--gutter',20);
    if(engine)engine.resize(w,h,canvas.width,canvas.height,top,gutter);
    else engine=createArtRenderer(ctx,{width:canvas.width,height:canvas.height,cssWidth:w,cssHeight:h,top,gutter,surface:makeSurface});
  }
  resize();
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const syncScene=()=>{if(engine.scene)canvas.dataset.scene=engine.scene;else delete canvas.dataset.scene;};
  return new Proxy(engine,{get(target,key){
    if(key==='dispose')return ()=>{if(disposed)return;disposed=true;observer.disconnect();fx.dispose();target.dispose();};
    if(key==='setPostFXMode')return mode=>fx.setMode(mode);
    if(key==='onGraphicsContext')return fn=>{contextListener=fn||(()=>{});};
    if(key==='triggerImpactFrame')return durationMs=>fx.triggerImpactFrame(durationMs);
    if(key==='postFXState')return ()=>({mode:fx.mode,active:fx.enabled&&!!fx.gl&&!fx.failed&&!fx.lost,lost:fx.lost,uniforms:fx.envelope.read(),combat:fx.combat.read(lastMotion),failed:fx.failed,failureReason:fx.failureReason});
    if(key==='reset'||key==='field')return (...args)=>{fx.reset();return target[key](...args);};
    if(key==='title')return (...args)=>{fx.show(false);return target.title(...args);};
    if(key==='event')return (...args)=>{
      const before=target.effectState().dimensionImpact;
      fx.event(args[0],args[1]);
      const result=target.event(...args),after=target.effectState().dimensionImpact;
      if(!before&&after?.age===0)fx.triggerImpactFrame();
      return result;
    };
    if(key==='tick'||key==='draw')return (...args)=>{
      const result=target[key](...args);
      if(key==='tick'){args[0].setView?.(target.viewSnapshot());fx.tick(lastMotion,args[0].state,args[1]!==false&&target.shakeState().level==='full');}
      else{
        const run=args[0],view=target.viewSnapshot();lastMotion=args[3]!==false;
        if(run.state.phase==='playing')fx.present({...projectCombatLens(run,view,args[2]),motion:lastMotion,now:run.world.clock*1000/60});else fx.show(false);
      }
      syncScene();return result;
    };
    return Reflect.get(target,key);
  }});
}
