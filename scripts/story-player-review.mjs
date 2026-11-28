// Actual browser screenshots. Opening uses ordinary production UI; later
// sequences are explicitly staged via existing app cutscene functions in a
// response-only review hook. No repository game source is edited.
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
const out='.arena/story-player-review';mkdirSync(`${out}/frames`,{recursive:true});mkdirSync(`${out}/sheets`,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000}),rows=[],logs=[];
const hook=`
window.storyReview={get run(){return run},snapshot(){return {cutscene:run?.state.cutscene,narrative:run?.state.narrative?{chapter:run.state.narrative.chapter,emotion:run.state.narrative.emotion}:null}},async play(kind,chapter=1){
 endCutscene();const {storyForWave,MID_WAVE_STORY}=await import('/src/story-arc.js');
 const s=run.state;s.phase='playing';s.stop=0;s.inputLock=false;
 if(s.narrative){const ch=storyForWave(chapter);Object.assign(s.narrative,{intro:false,sector:chapter,chapter:ch.id,storyTitle:ch.title,storyChip:ch.chip,storyLine:ch.line,emotion:ch.emotion});}
 if(kind==='mid'){const p=run.world.player.position,target=[...run.combat.enemies.values()].find(e=>e.kind==='pulse');s.storyMoment={...MID_WAVE_STORY,targetX:target?.x??p.x+120,targetY:target?.y??p.y-100,age:0};launchCutscene(midWaveBeats(MID_WAVE_STORY.chip));}
 else if(kind==='sector')launchCutscene(sectorBeats(storyChipForWave(chapter)));
 else if(kind==='shatter')launchCutscene(SHATTER_BEATS);
 else if(kind==='ending-message')showStoryChip(LANDLORD_STORY.finishChip);
 else if(kind==='landlord-message')showStoryChip(LANDLORD_STORY.chip);
 }};
`;
try{
 for(const config of [{key:'desktop',width:1280,height:720,reduced:false,step:50},{key:'portrait',width:390,height:844,reduced:false,step:null},{key:'reduced',width:1280,height:720,reduced:true,step:null}]){
  const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width:config.width,height:config.height,deviceScaleFactor:1,hasTouch:config.width<700});page.on('pageerror',e=>logs.push({layout:config.key,type:'pageerror',message:e.message}));page.on('console',m=>{if(['warn','error'].includes(m.type()))logs.push({layout:config.key,type:m.type(),message:m.text()});});
  await page.evaluateOnNewDocument(reduced=>{if(reduced)localStorage.setItem('riot.motion','0');let clock=0,id=0;const queue=new Map();Object.defineProperty(performance,'now',{value:()=>clock});window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.storyAdvance=ms=>{const end=clock+ms;while(clock<end){clock=Math.min(end,clock+1000/60);const work=[...queue.values()];queue.clear();for(const fn of work)fn(clock);}};},config.reduced);
  // First capture the opening of the untouched production build.
  await page.goto('http://127.0.0.1:5188',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await page.click('#start-btn');await page.click('#rack-skip');
  async function sequence(name,duration,staged){
   let ats=config.step?Array.from({length:Math.floor(duration/config.step)+1},(_,i)=>i*config.step):[0,.15,.33,.52,.72,.94].map(t=>Math.round(duration*t));let elapsed=0;
   for(const at of ats){await page.evaluate(ms=>storyAdvance(ms),at-elapsed+(elapsed===0&&at===0?17:0));elapsed=at;const f=rows.length+1,file=`frames/${String(f).padStart(3,'0')}-${config.key}-${name}.jpg`,bytes=await page.screenshot({type:'jpeg',quality:85,path:`${out}/${file}`});const ui=await page.evaluate(()=>({text:document.body.innerText,chip:(()=>{const e=document.querySelector('#story-chip');return {text:e?.textContent,hidden:e?.hidden,opacity:e?getComputedStyle(e).opacity:null};})(),scene:window.storyReview?.snapshot?.()||null}));rows.push({frame:f,file,layout:config.key,sequence:name,at,duration,staged,...ui,sha256:createHash('sha256').update(bytes).digest('hex')});}
   console.log(config.key,name,ats.length,staged?'STAGED':'NORMAL PRODUCTION OPENING');
  }
  await sequence('opening',config.reduced?1440:2400,false);
  // Re-open same source through the dev server solely to expose the existing
  // cinematic entry points. This is not a claim of earned later progression.
  await page.setRequestInterception(true);page.on('request',async req=>{if(new URL(req.url()).pathname==='/src/main.js'){const res=await fetch(req.url());await req.respond({status:200,contentType:'text/javascript',body:await res.text()+hook});}else await req.continue();});
  await page.goto('http://127.0.0.1:5192',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await page.click('#start-btn');await page.click('#rack-skip');await page.evaluate(()=>storyAdvance(2600));
  for(const [name,kind,chapter,duration]of [['friend-holds-wave','mid',1,1200],['fear','sector',2,1000],['rage','sector',3,1000],['ambition','sector',4,1000],['last-vow','sector',5,1000],['shatter','shatter',5,2500]]){
   await page.evaluate(async({kind,chapter})=>{await storyReview.play(kind,chapter);},{kind,chapter});await sequence(name,config.reduced?duration*.6:duration,true);
  }
  for(const kind of ['landlord-message','ending-message']){await page.evaluate(async kind=>{await storyReview.play(kind,5);storyAdvance(200);},kind);await sequence(kind,0,true);}
  await context.close();
 }
}finally{writeFileSync(`${out}/manifest.json`,JSON.stringify({method:'Opening: ordinary START RUN then tutorial SKIP on production preview. Later sequences: current source app browser replay through response-only staging hook; genuine existing app driver/rendering, NOT naturally reached gameplay. Both animation clocks controlled for sampling. No game source edited. Audio not assessed. Ending captures are explicitly only message previews, NOT a full boss/rescue ending.',frames:rows,logs},null,2));await browser.close();}
// Every captured frame appears on a contact sheet; none is selected by hash.
for(let start=0;start<rows.length;start+=12){const batch=rows.slice(start,start+12),cv=createCanvas(1920,65+Math.ceil(batch.length/3)*390),c=cv.getContext('2d');c.fillStyle='#11212b';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#e8efdf';c.font='bold 24px sans-serif';c.fillText(`STORY / ACTUAL BROWSER FRAMES ${start+1}–${start+batch.length}`,18,36);for(const [j,row]of batch.entries()){const x=j%3*640,y=65+Math.floor(j/3)*390,im=await loadImage(`${out}/${row.file}`),scale=Math.min(630/im.width,350/im.height);c.font='16px sans-serif';c.fillStyle=row.staged?'#f1ca96':'#c9edb7';c.fillText(`#${row.frame} ${row.layout} / ${row.sequence} / ${row.at}ms${row.staged?' / STAGED':''}`,x+8,y+20);c.drawImage(im,x+5+(630-im.width*scale)/2,y+30,im.width*scale,im.height*scale);}writeFileSync(`${out}/sheets/${String(start/12+1).padStart(2,'0')}.jpg`,cv.toBuffer('image/jpeg',90));}
console.log('CAPTURED',rows.length,'screenshots;',Math.ceil(rows.length/12),'sheets.');
