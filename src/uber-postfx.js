/** Canvas-game equivalent of a PostFXPipeline. One draw, no FBO ping-pong,
 * exactly three source reads. DOM HUD is never thresholded or displaced. */
export const UBER_FRAGMENT=`
precision mediump float;
uniform sampler2D uScene;
uniform vec2 uFocusPos;
uniform vec2 uResolution;
uniform float uGlitch;
uniform float uChromatic;
uniform float uGloom;
uniform float uBloom;
uniform float uImpactMode;
uniform float uTime;
varying vec2 vUV;
void main(){
 vec2 uv=vUV;
 float line=floor(uv.y*72.0);
 float tear=step(.72,fract(sin(line*91.7+floor(uTime*18.0))*4375.5));
 uv.x+=tear*sin(line*3.17+uTime)*uGlitch*.024;
 uv=clamp(uv,vec2(.001),vec2(.999));
 vec2 delta=(uv-vec2(.5))*uChromatic;
 // The only three texture lookups in this shader.
 vec4 mid=texture2D(uScene,uv);
 vec3 rgb=vec3(texture2D(uScene,clamp(uv-delta,0.001,0.999)).r,mid.g,texture2D(uScene,clamp(uv+delta,0.001,0.999)).b);
 float lum=dot(rgb,vec3(.2126,.7152,.0722));
 float shadow=1.0-smoothstep(.04,.4,lum);
 rgb=mix(rgb,vec3(lum),shadow*uGloom*.5)*(1.0-shadow*uGloom*.16);
 rgb+=rgb*smoothstep(.58,1.0,lum)*uBloom;
 vec2 focusDelta=uv-uFocusPos;
 focusDelta.x*=uResolution.x/max(1.0,uResolution.y);
 rgb*=1.0-smoothstep(.3,1.25,length(focusDelta))*.16;
 if(uImpactMode>0.5){
  float bw=step(.45,lum);
  if(uImpactMode>1.5)bw=1.0-bw;
  rgb=vec3(bw);
 }
 gl_FragColor=vec4(clamp(rgb,0.0,1.0),1.0);
}`;
const VERTEX=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=vec2((aPosition.x+1.0)*.5,1.0-(aPosition.y+1.0)*.5);gl_Position=vec4(aPosition,0.0,1.0);}`;
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
  this.mode='off';this.gl=null;this.output=null;this.lost=false;this.failed=false;this.enabled=false;this.disposed=false;this.envelope=createImpactUniforms();
  this.originalOpacity=source.style?.opacity||'';
  this.lostHandler=e=>{e.preventDefault();this.lost=true;this.show(false);this.onContextState('lost');};
  this.restoreHandler=()=>{this.lost=false;this.failed=false;try{this.initResources();this.onContextState('restored');}catch{this.failed=true;this.onContextState('failed');}this.show(false);};
 }
 setMode(mode='auto'){
  this.mode=['auto','on','off'].includes(mode)?mode:'auto';
  this.enabled=!this.disposed&&postFXAllowed(this.mode,this.capabilities);
  if(this.enabled&&!this.gl&&!this.failed)this.initialize();
  if(!this.enabled){this.envelope.reset();this.show(false);const wasLost=this.lost;this.release();this.lost=false;this.failed=false;if(wasLost)this.onContextState('disabled');}
 }
 initialize(){
  if(!this.surface||!this.source.parentNode)return;
  try{
   this.output=this.surface();this.output.className='uber-postfx';this.output.setAttribute('aria-hidden','true');
   const gl=this.output.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance',failIfMajorPerformanceCaveat:this.mode!=='on'});
   if(!gl)throw new Error('WebGL unavailable');this.gl=gl;
   this.output.addEventListener('webglcontextlost',this.lostHandler);this.output.addEventListener('webglcontextrestored',this.restoreHandler);
   this.source.after(this.output);this.initResources();this.show(false);
  }catch{this.release();this.failed=true;this.show(false);}
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
  this.locations=Object.fromEntries(['uScene','uFocusPos','uResolution','uGlitch','uChromatic','uGloom','uBloom','uImpactMode','uTime'].map(n=>[n,g.getUniformLocation(this.program,n)]));
  this.size='';
 }
 triggerImpactFrame(durationMs){return this.enabled&&this.envelope.triggerImpactFrame(durationMs);}
 tick(motion=true){this.envelope.tick(motion);}
 show(on){if(this.output)this.output.style.display=on?'block':'none';if(this.source.style)this.source.style.opacity=on?'0':this.originalOpacity;}
 present({focus={x:.5,y:.5},motion=true,now=0}={}){
  const g=this.gl;if(!this.enabled||this.failed||this.lost||!g||this.disposed){this.show(false);return false;}
  try{
   const w=this.source.width,h=this.source.height;if(!w||!h)return false;
   const size=`${w}:${h}`;if(this.size!==size){this.output.width=w;this.output.height=h;this.size=size;}
   g.viewport(0,0,w,h);g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.enableVertexAttribArray(this.attribute);g.vertexAttribPointer(this.attribute,2,g.FLOAT,false,0,0);
   g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.texture);
   // One upload of the existing renderer's scene; no intermediate render targets.
   g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.source);
   const e=motion?this.envelope.read():{impact:0,glitch:0,chromatic:0};
   g.uniform1i(this.locations.uScene,0);g.uniform2f(this.locations.uFocusPos,Math.max(0,Math.min(1,Number.isFinite(focus.x)?focus.x:.5)),Math.max(0,Math.min(1,Number.isFinite(focus.y)?focus.y:.5)));g.uniform2f(this.locations.uResolution,w,h);
   for(const [n,value]of Object.entries({uImpactMode:e.impact,uGlitch:e.glitch,uChromatic:e.chromatic,uGloom:.18,uBloom:.14,uTime:now/1000}))g.uniform1f(this.locations[n],value);
   g.drawArrays(g.TRIANGLE_STRIP,0,4);this.show(true);return true;
  }catch{this.failed=true;this.show(false);return false;}
 }
 release(){
  const g=this.gl;if(g&&!this.lost){if(this.texture)g.deleteTexture(this.texture);if(this.buffer)g.deleteBuffer(this.buffer);if(this.program)g.deleteProgram(this.program);}
  if(this.output){this.output.removeEventListener('webglcontextlost',this.lostHandler);this.output.removeEventListener('webglcontextrestored',this.restoreHandler);this.output.remove();}
  this.gl=null;this.output=null;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.show(false);this.release();this.envelope.reset();}
}
