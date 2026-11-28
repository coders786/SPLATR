/** A deliberately slow cause → action → consequence loop. Display time only. */
export function visualStoryFrame(elapsed=0,motion=true,step=null){
 const fixed=Number.isInteger(step)&&step>=0&&step<3;
 const t=fixed?[650,2200,4100][step]:motion?((Math.max(0,Number.isFinite(elapsed)?elapsed:0)%5400)):4100;
 const beat=t<1200?0:t<3200?1:2;
 const progress=beat===0?t/1200:beat===1?(t-1200)/2000:Math.min(1,(t-3200)/1800);
 return Object.freeze({beat,progress,time:t,studyTime:beat===0?300:beat===1?1000+progress*1800:3300,shortStudyTime:beat===0?250:beat===1?500+progress*880:1900,motion:motion&&!fixed,veil:!fixed&&motion&&t>5100?(t-5100)/300:0});
}
/** Preserve each existing authority's own demonstration clock. */
export function visualStudyTime(slot,id,frame){
 if(frame.beat===2&&['dash-void','dash-echo'].includes(id))return 4100;
 return ['head','core','eyes','tail','dash','pointer','radar','trajectory'].includes(slot)?frame.studyTime:frame.shortStudyTime;
}
