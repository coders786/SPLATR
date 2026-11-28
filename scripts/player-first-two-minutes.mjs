// A player-lens, screen/visible-UI-only walkthrough, not a blind human playtest.
// Real wall-clock playback: no seeded saves, debug state, renderer calls or clock overrides.
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
const out=process.env.QA_OUT_DIR||'.arena/player-review/session',base=process.env.PREVIEW_URL||'http://127.0.0.1:5188';mkdirSync(`${out}/frames`,{recursive:true});mkdirSync(`${out}/sheets`,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
const rows=[],actions=[],errors=[];let start=0,lastAction=-99999,changedAt=0,lastText='',started=false,skipped=false,endedAt=0;
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
// Detect small pink enemy groups in the actual screenshot, not game objects.
async function visiblePinkTargets(bytes,origin={x:600,y:470}){const im=await loadImage(bytes),cv=createCanvas(1280,720),c=cv.getContext('2d');c.drawImage(im,0,0);const {data}=c.getImageData(0,0,1280,720),cells=new Map();for(let y=100;y<675;y+=2)for(let x=30;x<1250;x+=2){const i=(y*1280+x)*4,r=data[i],g=data[i+1],b=data[i+2];if(r>150&&g<145&&b>60&&r>g*1.3&&b<r*1.08){const k=`${Math.floor(x/48)},${Math.floor(y/48)}`,v=cells.get(k)||{x:0,y:0,n:0};v.x+=x;v.y+=y;v.n++;cells.set(k,v);}}return [...cells.values()].filter(v=>v.n>=5&&v.n<350).map(v=>({x:Math.round(v.x/v.n),y:Math.round(v.y/v.n),n:v.n})).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y));}
try{
 const page=await browser.newPage();await page.setViewport({width:1280,height:720,deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);start=Date.now();
 for(let i=0;i<216;i++){
  await sleep(start+i*550-Date.now());const at=Date.now()-start;if(at>=120000)break;
  const ui=await page.evaluate(()=>({text:document.body.innerText,buttons:[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&!e.disabled;}).map(e=>({id:e.id,text:e.innerText,label:e.getAttribute('aria-label')}))}));
  const bytes=await page.screenshot({type:'jpeg',quality:82,path:`${out}/frames/${String(i+1).padStart(3,'0')}.jpg`});rows.push({frame:i+1,at,file:`frames/${String(i+1).padStart(3,'0')}.jpg`,text:ui.text,buttons:ui.buttons,sha256:createHash('sha256').update(bytes).digest('hex')});
  const brief=ui.text.slice(0,280);if(brief!==lastText){lastText=brief;changedAt=at;console.log(`${(at/1000).toFixed(1)}s ${brief.replaceAll('\n',' | ')}`);}
  const log=(what,detail={})=>{actions.push({at:Date.now()-start,what,...detail});lastAction=at;};
  if(!started&&at>=4000){await page.click('#start-btn');started=true;log('Click START RUN');continue;}
  if(!started||at-lastAction<1200)continue;
  const has=id=>ui.buttons.some(b=>b.id===id);
  if(has('rack-skip')){
   if(at-changedAt<2600)continue;
   if(at>34000&&!skipped){await page.click('#rack-skip');skipped=true;log('Skip tutorial after repeated attempts; do not force completion');continue;}
   if(/click a shape/i.test(ui.text)){const target=(await visiblePinkTargets(bytes,{x:410,y:560}))[0]||{x:535,y:490};await page.mouse.click(target.x,target.y);log('Click visible pink shape',{target});}
   else{const target=(await visiblePinkTargets(bytes))[0];const dx=target?Math.max(-170,Math.min(170,(target.x-640)*.6)):140,dy=target?Math.max(-160,Math.min(160,(target.y-420)*.6)):-110;await page.mouse.move(640,420);await page.mouse.down();await page.mouse.move(640-dx,420-dy,{steps:8});await sleep(180);await page.mouse.up();log('Try pull-back and release toward visible threat',{target:target||null});}
   continue;
  }
  const retry=ui.buttons.find(b=>/retry|try again|again/i.test(b.text));
  if(retry){if(!endedAt)endedAt=at;if(at-endedAt>3000&&retry.id){await page.click(`#${retry.id}`);endedAt=0;log('Retry after reading run result');}continue;}
  const resume=ui.buttons.find(b=>/resume/i.test(b.text));if(resume?.id){await page.click(`#${resume.id}`);log('Resume');continue;}
  const begin=ui.buttons.find(b=>/start run|begin|let.s go|play now/i.test(b.text));if(begin?.id){await page.click(`#${begin.id}`);log('Start from visible button');continue;}
  // Alternate readable clicks with deliberate slingshot gestures. No hidden aim assist.
  const target=(await visiblePinkTargets(bytes))[0];
  if(actions.filter(a=>/visible threat|visible shape|slingshot/.test(a.what)).length%3===2){
   const dx=target?Math.max(-170,Math.min(170,target.x-640)):130,dy=target?Math.max(-170,Math.min(170,target.y-420)):-120;
   await page.mouse.move(640,420);await page.mouse.down();await page.mouse.move(640-dx,420-dy,{steps:8});await sleep(150);await page.mouse.up();log('Slingshot toward a screen-visible threat',{target:target||null});
  }else if(target){await page.mouse.click(target.x,target.y);log('Click screen-visible shape',{target});}
  else {await page.mouse.move(640,420);await page.mouse.down();await page.mouse.move(i%2?485:795,550,{steps:8});await sleep(150);await page.mouse.up();log('Explore slingshot when no obvious target is visible');}
 }
 console.log(`Captured ${rows.length} real-time frames over ${(Date.now()-start)/1000}s`);
}finally{
 writeFileSync(`${out}/session.json`,JSON.stringify({base,viewport:{width:1280,height:720},method:'Fresh browser profile, real wall clock, normal UI/input only. Scripted player-lens walkthrough, NOT a blind human participant. Targets derived from visible screenshot colors; no game-state inspection. All captures retained, including repeated/quiet scenes.',duration:Date.now()-start,frames:rows,actions,errors,distSha256:createHash('sha256').update(readFileSync('dist/index.html')).digest('hex')},null,2));await browser.close();
}
// Measure difference without altering or cherry-picking frames. Pixel threshold
// means sum of RGB channel changes >45; report full viewport and central arena.
let previous=null;const cv=createCanvas(640,360),c=cv.getContext('2d');
for(const row of rows){const im=await loadImage(`${out}/${row.file}`);c.drawImage(im,0,0,640,360);const data=c.getImageData(0,0,640,360).data;if(previous){let changed=0,arena=0,arenaN=0;for(let y=0;y<360;y++)for(let x=0;x<640;x++){const p=(y*640+x)*4,delta=Math.abs(data[p]-previous[p])+Math.abs(data[p+1]-previous[p+1])+Math.abs(data[p+2]-previous[p+2]),inside=x>40&&x<600&&y>45&&y<330;if(delta>45){changed++;if(inside)arena++;}if(inside)arenaN++;}row.difference={fullPercent:changed/(640*360)*100,arenaPercent:arena/arenaN*100};}previous=Uint8ClampedArray.from(data);}
const differences=rows.slice(1).map(r=>r.difference.fullPercent),stats={frames:rows.length,comparisons:differences.length,atLeast20Percent:differences.filter(d=>d>=20).length,below20Percent:differences.filter(d=>d<20).length,mean:differences.reduce((a,b)=>a+b,0)/differences.length,min:Math.min(...differences),max:Math.max(...differences)};
writeFileSync(`${out}/difference.json`,JSON.stringify({definition:'Consecutive captured full viewports, downsampled to640x360. A pixel counts as changed when summed absolute RGB difference exceeds45. This is an explicit metric, not a perception score. No frames discarded to meet20%.',stats,frames:rows.map(({frame,at,file,difference})=>({frame,at,file,difference}))},null,2));
for(let start=0;start<rows.length;start+=12){const batch=rows.slice(start,start+12),cv=createCanvas(1920,60+Math.ceil(batch.length/3)*390),c=cv.getContext('2d');c.fillStyle='#111f29';c.fillRect(0,0,cv.width,cv.height);c.font='bold 26px sans-serif';c.fillStyle='#ebeedf';c.fillText(`ACTUAL FIRST TWO MINUTES / FRAMES ${start+1}–${start+batch.length}`,20,38);for(const [j,row]of batch.entries()){const x=(j%3)*640,y=60+Math.floor(j/3)*390;c.drawImage(await loadImage(`${out}/${row.file}`),x+5,y+28,630,354);c.font='18px sans-serif';c.fillStyle='#d7e2c7';c.fillText(`#${row.frame} / ${(row.at/1000).toFixed(2)}s / ${row.difference?row.difference.fullPercent.toFixed(1)+'% changed':'first frame'}`,x+10,y+21);}writeFileSync(`${out}/sheets/${String(Math.floor(start/12)+1).padStart(2,'0')}.jpg`,cv.toBuffer('image/jpeg',90));}
console.log(JSON.stringify(stats));
