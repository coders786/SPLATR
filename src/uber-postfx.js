/** Canvas-game equivalent of a PostFXPipeline. One draw, no FBO ping-pong,
 * exactly three source reads. DOM HUD is never thresholded or displaced. */
import {createCombatLens} from './combat-postfx.js';
export const UBER_FRAGMENT=`
precision mediump float;
uniform sampler2D uScene;
uniform vec2 uFocusPos;
uniform vec2 uAimPos;
uniform float uAiming;
uniform vec3 uProtect[8];
uniform vec2 uResolution;
uniform float uGlitch;
uniform float uChromatic;
uniform float uPixelScale;
uniform vec2 uLensAxis;
uniform float uTravel;
uniform float uGloom;
uniform float uBloom;
uniform float uImpactMode;
uniform float uTime;
uniform float uBlur;
uniform float uContrast;
uniform float uSaturation;
uniform float uVignette;
uniform float uTint;
uniform float uGrain;
uniform float uIntensity;
uniform float uEnergy;
uniform float uDamage;
uniform float uLaunch;
uniform float uClarity;
varying vec2 vUV;
vec2 aspect(vec2 p){return p*vec2(uResolution.x/max(1.0,uResolution.y),1.0);}
float actorMask(vec2 uv,vec3 actor){return 1.0-smoothstep(actor.z*.7,actor.z,length(aspect(uv-actor.xy)));}
void main(){
 vec2 uv=vUV;
 float line=floor(uv.y*72.0);
 float tear=step(.72,fract(sin(line*91.7+floor(uTime*18.0))*4375.5));
 uv.x+=tear*sin(line*3.17+uTime)*uGlitch*.024;
 uv=clamp(uv,vec2(.001),vec2(.999));
 vec2 focusDelta=aspect(uv-uFocusPos);
 float peripheral=smoothstep(.08,.32,length(focusDelta));
 float protectedActor=max(max(max(actorMask(uv,uProtect[0]),actorMask(uv,uProtect[1])),max(actorMask(uv,uProtect[2]),actorMask(uv,uProtect[3]))),max(max(actorMask(uv,uProtect[4]),actorMask(uv,uProtect[5])),max(actorMask(uv,uProtect[6]),actorMask(uv,uProtect[7]))));
 vec2 ab=aspect(uAimPos-uFocusPos),ap=aspect(uv-uFocusPos);
 float along=clamp(dot(ap,ab)/max(.00001,dot(ab,ab)),0.0,1.0);
 float aimMask=(1.0-smoothstep(.018,.055,length(ap-ab*along)))*uAiming;
 float spatial=peripheral*(1.0-protectedActor)*(1.0-aimMask);
 // One spatial gate, not two: the old offset AND blend attenuated each
 // other and made the requested aberration almost disappear near the action.
 // Dispersion leans with actual travel, but remains radial when stationary.
 vec2 direction=normalize(focusDelta+uLensAxis*uTravel*.22+vec2(.0001));
 float distancePx=min(3.2,uChromatic+uTravel*.35+uBlur*.5)*uPixelScale;
 vec2 delta=direction*distancePx/max(vec2(1.0),uResolution);
 // Exactly three scene reads: shared by chromatic split and slight softening.
 vec4 mid=texture2D(uScene,uv);
 vec3 left=texture2D(uScene,clamp(uv-delta,0.001,0.999)).rgb;
 vec3 right=texture2D(uScene,clamp(uv+delta,0.001,0.999)).rgb;
 // Red/pink danger and bright projectiles remain sharp even beyond the eight
 // spatial actor masks. DOM HUD and input SVG are outside this pass entirely.
 float red=max(mid.r-max(mid.g,mid.b)*.88,max(left.r-max(left.g,left.b)*.88,right.r-max(right.g,right.b)*.88));
 float danger=smoothstep(.035,.16,red);
 float bright=smoothstep(.72,.93,max(mid.r,max(mid.g,mid.b)));
 float edge=smoothstep(.012,.18,length(left-right));
 float effect=spatial*(1.0-max(danger,bright))*(.45+.55*edge);
 vec3 split=vec3(left.r,mid.g,right.b);
 vec3 soft=(left+mid.rgb*2.0+right)*.25;
 vec3 rgb=mix(mid.rgb,mix(split,soft,uBlur*.32),effect);
 // Reuse the same taps for edge definition, never sharpen danger or actors.
 rgb+=clamp(mid.rgb-(left+right)*.5,vec3(-.06),vec3(.06))*uClarity*effect;
 float lum=dot(rgb,vec3(.2126,.7152,.0722));
 rgb=(rgb-vec3(.42))*uContrast+vec3(.42);
 rgb=mix(vec3(dot(rgb,vec3(.2126,.7152,.0722))),rgb,uSaturation);
 float shadow=1.0-smoothstep(.04,.4,lum);
 rgb=mix(rgb,vec3(lum),shadow*uGloom*.25)*(1.0-shadow*uGloom*.06);
 rgb+=rgb*smoothstep(.58,1.0,lum)*uBloom;
 // A tiny highlight halo is reconstructed from the same neighboring samples;
 // it costs no extra texture fetches or render targets and never floods danger.
 vec3 neighborGlow=max(max(left,right)-mid.rgb,vec3(0.0));
 rgb+=neighborGlow*smoothstep(.60,.95,max(max(left.r,left.g),max(right.r,right.g)))*uBloom*.32*effect;
 rgb+=vec3(uTint*.4,uTint*.12,-uTint*.3)*(1.0-lum)*effect;
 rgb*=1.0-smoothstep(.25,1.0,length(focusDelta))*uVignette*(1.0-max(danger,protectedActor)*.8);
 float grain=fract(sin(dot(uv*uResolution,vec2(12.9898,78.233)))*43758.5453)-.5;
 rgb+=grain*uGrain*effect;
 // A restrained teal-shadow / warm-highlight grade gives the arena depth.
 // These washes live only on the scene; the HUD and interaction layer stay crisp.
 float highlights=smoothstep(.36,.86,lum);
 rgb+=vec3(-.012,.017,.021)*shadow*(1.0-danger);
 rgb+=vec3(.025,.018,-.012)*highlights*(1.0-danger);
 float rim=smoothstep(.28,.88,length(focusDelta))*spatial*(1.0-danger);
 rgb+=vec3(.025,.055,.018)*rim*uEnergy;
 rgb+=vec3(.055,-.016,-.012)*rim*uDamage;
 rgb+=vec3(.018,.025,.008)*rim*uLaunch;
 // One bounded strength control blends the whole grade against the untouched scene.
 rgb=mix(mid.rgb,rgb,uIntensity);
 if(uImpactMode>0.5){
  float bw=step(.45,lum);
  if(uImpactMode>1.5)bw=1.0-bw;
  rgb=vec3(bw);
 }
 gl_FragColor=vec4(clamp(rgb,0.0,1.0),1.0);
}`;
const VERTEX=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=vec2((aPosition.x+1.0)*.5,1.0-(aPosition.y+1.0)*.5);gl_Position=vec4(aPosition,0.0,1.0);}`;
export function postFXPixelScale(backing,css){return Number.isFinite(backing)&&backing>0&&Number.isFinite(css)&&css>0?Math.max(.01,Math.min(1,backing/css)):1;}
export function postFXAllowed(mode,{memory=2,cores=2}={}){return mode==='on'||mode==='auto'&&memory>2&&cores>2;}
export function createImpactUniforms(){
 let age=0,total=0,cooldown=0,fresh=false;
 return {
  triggerImpactFrame(durationMs=1000/15){if(cooldown)return false;total=Math.max(2,Math.min(8,Math.round((Number.isFinite(durationMs)?durationMs:1000/15)/(1000/60))));age=0;fresh=true;cooldown=90;return true;},
  tick(enabled=true){if(cooldown)cooldown--;if(fresh)fresh=false;else if(total)age++;if(!enabled||age>=total)total=0;},
  read:()=>({impact:total?(age<total/2?2:1):0,glitch:total?.85:0,chromatic:total?.012:0}),
  reset(){age=total=cooldown=0;fresh=false;},
 };
}
/** Unsupported/low-memory devices keep the original 2D surface without even
 * allocating a WebGL context. Explicit On is available for comparison/testing. */
export class UberPostFX {
 constructor(source,{surface,capabilities={},onContextState=()=>{}}={}){
  this.source=source;this.surface=surface;this.capabilities=capabilities;this.onContextState=onContextState;
  this.mode='off';this.intensity='balanced';this.gl=null;this.output=null;this.lost=false;this.failed=false;this.failureReason=null;this.enabled=false;this.disposed=false;this.envelope=createImpactUniforms();this.combat=createCombatLens();
  this.originalOpacity=source.style?.opacity||'';
  this.lostHandler=e=>{e.preventDefault();this.lost=true;this.show(false);this.onContextState('lost');};
  this.restoreHandler=()=>{this.lost=false;this.failed=false;try{this.initResources();this.onContextState('restored');}catch{this.failed=true;this.onContextState('failed');}this.show(false);};
 }
 setMode(mode='auto'){
  this.mode=['auto','on','off'].includes(mode)?mode:'auto';
  this.enabled=!this.disposed&&postFXAllowed(this.mode,this.capabilities);
  if(this.enabled&&!this.gl&&!this.failed)this.initialize();
  if(!this.enabled){this.envelope.reset();this.combat.reset();this.show(false);const wasLost=this.lost;this.release();this.lost=false;this.failed=false;if(wasLost)this.onContextState('disabled');}
 }
 setIntensity(intensity='balanced'){this.intensity=['soft','balanced','vivid'].includes(intensity)?intensity:'balanced';}
 initialize(){
  if(!this.surface||!this.source.parentNode)return;
  try{
   this.output=this.surface();this.output.className='uber-postfx';this.output.setAttribute('aria-hidden','true');
   const gl=this.output.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance',failIfMajorPerformanceCaveat:this.mode!=='on'});
   if(!gl)throw new Error('WebGL unavailable');this.gl=gl;
   this.output.addEventListener('webglcontextlost',this.lostHandler);this.output.addEventListener('webglcontextrestored',this.restoreHandler);
   this.source.after(this.output);this.initResources();this.show(false);
  }catch(error){this.failureReason=String(error?.message||error);this.release();this.failed=true;this.show(false);}
 }
 initResources(){
  const g=this.gl;if(!g)return;
  const compile=(type,text)=>{const s=g.createShader(type);g.shaderSource(s,text);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS)){const message=g.getShaderInfoLog(s);g.deleteShader(s);throw new Error(message);}return s;};
  let vs,fs;
  try{
   vs=compile(g.VERTEX_SHADER,VERTEX);fs=compile(g.FRAGMENT_SHADER,UBER_FRAGMENT);
   this.program=g.createProgram();g.attachShader(this.program,vs);g.attachShader(this.program,fs);g.linkProgram(this.program);
   if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(this.program));
  }finally{if(vs)g.deleteShader(vs);if(fs)g.deleteShader(fs);}
  g.useProgram(this.program);this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);
  g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);
  this.attribute=g.getAttribLocation(this.program,'aPosition');this.texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.texture);
  for(const [key,value]of [[g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE],[g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE],[g.TEXTURE_MIN_FILTER,g.LINEAR],[g.TEXTURE_MAG_FILTER,g.LINEAR]])g.texParameteri(g.TEXTURE_2D,key,value);
  this.locations=Object.fromEntries(['uScene','uFocusPos','uAimPos','uAiming','uProtect[0]','uResolution','uGlitch','uChromatic','uGloom','uBloom','uImpactMode','uTime','uPixelScale','uLensAxis','uTravel','uBlur','uContrast','uSaturation','uVignette','uTint','uGrain','uIntensity','uEnergy','uDamage','uLaunch','uClarity'].map(n=>[n,g.getUniformLocation(this.program,n)]));
  this.size='';
 }
 triggerImpactFrame(durationMs){return this.enabled&&this.envelope.triggerImpactFrame(durationMs);}
 event(type,data){if(this.enabled)this.combat.event(type,data);}
 reset(){this.envelope.reset();this.combat.reset();}
 tick(motion=true,state=null,impactMotion=motion){this.envelope.tick(impactMotion);if(state&&this.enabled)this.combat.tick(state,motion);}
 show(on){if(this.output)this.output.style.display=on?'block':'none';if(this.source.style)this.source.style.opacity=on?'0':this.originalOpacity;}
 present({focus={x:.5,y:.5},aim=null,protectedActors=null,flow=null,motion=true,now=0}={}){
  const g=this.gl;if(!this.enabled||this.failed||this.lost||!g||this.disposed){this.show(false);return false;}
  try{
   const w=this.source.width,h=this.source.height;if(!w||!h)return false;
   const size=`${w}:${h}`;if(this.size!==size){this.output.width=w;this.output.height=h;this.size=size;}
   g.viewport(0,0,w,h);g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.enableVertexAttribArray(this.attribute);g.vertexAttribPointer(this.attribute,2,g.FLOAT,false,0,0);
   g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.texture);
   // One upload of the existing renderer's scene; no intermediate render targets.
   g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.source);
   const e=motion?this.envelope.read():{impact:0,glitch:0,chromatic:0},lens=this.combat.read(motion);
   g.uniform1i(this.locations.uScene,0);g.uniform2f(this.locations.uFocusPos,Math.max(0,Math.min(1,Number.isFinite(focus.x)?focus.x:.5)),Math.max(0,Math.min(1,Number.isFinite(focus.y)?focus.y:.5)));g.uniform2f(this.locations.uResolution,w,h);
   g.uniform2f(this.locations.uAimPos,Number.isFinite(aim?.x)?aim.x:focus.x,Number.isFinite(aim?.y)?aim.y:focus.y);
   g.uniform1f(this.locations.uAiming,aim?.active?1:0);
   g.uniform2f(this.locations.uLensAxis,motion&&Number.isFinite(flow?.x)?flow.x:0,motion&&Number.isFinite(flow?.y)?flow.y:0);
   const masks=protectedActors?.length===24?protectedActors:new Float32Array([-10,-10,0,-10,-10,0,-10,-10,0,-10,-10,0,-10,-10,0,-10,-10,0,-10,-10,0,-10,-10,0]);
   g.uniform3fv(this.locations['uProtect[0]'],masks);
   for(const [n,value]of Object.entries({uImpactMode:e.impact,uGlitch:e.glitch,uChromatic:Math.min(3.2,lens.chromatic+e.chromatic*45),uPixelScale:postFXPixelScale(w,this.source.clientWidth||w),uTravel:motion?Math.max(0,Math.min(1,flow?.amount||0)):0,uGloom:.1,uBloom:lens.bloom,uTime:now/1000,uBlur:lens.blur,uContrast:lens.contrast,uSaturation:lens.saturation,uVignette:lens.vignette,uTint:lens.tint,uGrain:lens.grain,uIntensity:({soft:.55,balanced:1,vivid:1.3})[this.intensity],uEnergy:lens.energy,uDamage:lens.damage,uLaunch:lens.launch,uClarity:lens.clarity}))g.uniform1f(this.locations[n],value);
   g.drawArrays(g.TRIANGLE_STRIP,0,4);this.show(true);return true;
  }catch(error){this.failureReason=String(error?.message||error);this.failed=true;this.show(false);return false;}
 }
 release(){
  const g=this.gl;if(g&&!this.lost){if(this.texture)g.deleteTexture(this.texture);if(this.buffer)g.deleteBuffer(this.buffer);if(this.program)g.deleteProgram(this.program);}
  if(this.output){this.output.removeEventListener('webglcontextlost',this.lostHandler);this.output.removeEventListener('webglcontextrestored',this.restoreHandler);this.output.remove();}
  this.gl=null;this.output=null;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.show(false);this.release();this.reset();}
}
