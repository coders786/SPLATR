/** Smooth action, readable result hold, brief dissolve. No reverse playback. */
export function shopDemoFrame(elapsed=0,animate=true){
 if(!animate)return {time:1100,veil:0};
 const t=((elapsed%3000)+3000)%3000;
 return {time:Math.min(1100,Math.max(0,t-120)*1100/1250),veil:t>2750?(t-2750)/250:t<120?1-t/120:0};
}
