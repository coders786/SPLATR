// Browser boundary only. Canvas artwork, camera and visual animation are owned
// by the standalone engine; this adapter supplies measurements and lifecycle.
import {createArtRenderer,legacy_renderer} from './art/splatr-art-engine.js';
export const {traceDraws,MERGE_R,MERGE_AGE,recordPopup}=legacy_renderer;
export function createRenderer(canvas){
  const ctx=canvas.getContext('2d',{alpha:false});
  const inset=(name,fallback)=>{
    try{const n=parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));return Number.isFinite(n)?n:fallback;}catch{return fallback;}
  };
  let engine;
  function resize(){
    const box=canvas.getBoundingClientRect(),w=Math.max(1,box.width),h=Math.max(1,box.height);
    const dpr=Math.min(globalThis.devicePixelRatio||1,2,Math.sqrt(2600000/(w*h)));
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const top=inset('--top',32),gutter=inset('--gutter',20);
    if(engine)engine.resize(w,h,canvas.width,canvas.height,top,gutter);
    else engine=createArtRenderer(ctx,{width:canvas.width,height:canvas.height,cssWidth:w,cssHeight:h,top,gutter});
  }
  resize();
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const syncScene=()=>{if(engine.scene)canvas.dataset.scene=engine.scene;else delete canvas.dataset.scene;};
  return new Proxy(engine,{get(target,key){
    if(key==='dispose')return ()=>{observer.disconnect();target.dispose();};
    if(key==='tick'||key==='draw')return (...args)=>{const result=target[key](...args);if(key==='tick')args[0].setView?.(target.viewSnapshot());syncScene();return result;};
    return Reflect.get(target,key);
  }});
}
