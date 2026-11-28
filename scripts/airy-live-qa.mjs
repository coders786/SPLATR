// Native renderer with controlled real-run conditions. Not an uncontrolled
// playthrough or device-FPS measurement. Coil uses an actual admitted hit.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=`docs/airy-review/${process.env.PHASE||'live'}`;mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),rows=[];
try{for(const [width,height]of [[1280,720],[390,844]])for(const head of ['halo','neko','viper','oni','crown','samurai','coil','beacon']){
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height});await p.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5192',{waitUntil:'domcontentloaded'});
 await p.evaluate(async head=>{
 const [{createRun},{createRenderer},{placePlayer,stopPlayer},art]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js'),import('/src/art/splatr-art-engine.js')]);
 const equipment={head,body:{halo:'prism',neko:'hologram',viper:'paper',oni:'obsidian',crown:'iron',samurai:'gold',coil:'prism',beacon:'iron'}[head],core:{halo:'time',neko:'echo',viper:'standard',oni:'standard',crown:'grav',samurai:'magnet',coil:'time',beacon:'riot'}[head]},r=createRun(77,()=>{},{waveMode:true,equipment});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999,chain:0,hp:3,held:false,blade:0,slashAge:-1});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 const cv=document.createElement('canvas');Object.assign(cv.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(cv);const renderer=createRenderer(cv);renderer.setShakeLevel('off');renderer.field({x:-290,y:-390},false);
 const read=()=>art.headMechanismPose(r.state,r.combat.enemies.values(),r.world.player.velocity).headAbility;
 window.hw={r,renderer,cv,read,art,head,draw(){renderer.tick(r,true);renderer.draw(r,1,null,true);},activate(){
 if(head==='halo'){r.state.held=true;r.world.player.velocity.y=3;}
 if(head==='neko')r.state.chain=3;
 if(head==='oni')r.state.hp=1;
 if(['viper','crown','samurai','coil'].includes(head))r.dash({x:30,y:0,power:30/42});
 if(head==='beacon'){const enemy=r.combat.add({id:'telling-fang',kind:'fang',x:-160,y:-400,hp:3,pinned:true,delay:999999});Object.assign(enemy,{mode:'tell',clock:30,span:60});}
 if(head==='coil'){
 const e=r.combat.add({id:'direct',kind:'fang',x:-320,y:-400,hp:5,pinned:true,delay:999999});r.combat.add({id:'near',kind:'fang',x:-320,y:-460,hp:5,pinned:true,delay:999999});r.combat.contacts.add(e);r.state.stop=1;r.tick();
 }
 },dispose(){renderer.dispose();r.dispose();}};window.hw.draw();
 },head);
 assert.equal(await p.evaluate(()=>hw.read().active),false,head+' idle');await p.screenshot({path:`${out}/live-${width}-${head}-idle.jpg`,type:'jpeg',quality:85});
 const after=await p.evaluate(()=>{hw.activate();const state=hw.read();const data={hp:hw.r.state.hp,chain:hw.r.state.chain,blade:hw.r.state.blade,velocity:{x:hw.r.world.player.velocity.x,y:hw.r.world.player.velocity.y}};hw.draw();const same=JSON.stringify(data)===JSON.stringify({hp:hw.r.state.hp,chain:hw.r.state.chain,blade:hw.r.state.blade,velocity:{x:hw.r.world.player.velocity.x,y:hw.r.world.player.velocity.y}});return {state,data,drawReadOnly:same};});
 assert.equal(after.state.active,true,head+' actual condition');assert.ok(after.drawReadOnly);await p.screenshot({path:`${out}/live-${width}-${head}-active.jpg`,type:'jpeg',quality:85});
 const reduced=await p.evaluate(()=>{hw.renderer.draw(hw.r,1,null,false);return hw.read();});assert.equal(reduced.active,true);
 if(['halo','coil','beacon'].includes(head))await p.screenshot({path:`${out}/live-${width}-${head}-reduced.jpg`,type:'jpeg',quality:85});
 await p.evaluate(()=>hw.dispose());assert.deepEqual(errors,[]);rows.push({width,height,head,...after,reduced,errors});await p.close();
}console.log('PASS: 16 native real-run renderer conditions, idle/active, read-only draws; actual Coil relay; reduced-motion state remains truthful.');}finally{await browser.close();writeFileSync(`${out}/live-results.json`,JSON.stringify({rows,method:'Controlled real-run state + native production renderer at desktop/portrait. Coil uses actual primary contact/relay admission. Other states deliberately isolate aim, chain, health, launch, angle and threat. Not a normal playthrough or FPS benchmark.'},null,2));}
