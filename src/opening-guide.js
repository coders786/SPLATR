/** Presentation only. The real blade/intro state, not a timer, completes it. */
export function openingGuide(state,device='mouse') {
 const n=state?.narrative;
 if(!n?.intro||!n.fracture)return null;
 return Object.freeze({title:'WATCHER HOLDS THE WAY',action:'CUT THROUGH THE OPENING',hint:device==='keys'?'Aim up with ↑, then press Space':device==='touch'?'Tap the glowing opening above you':'Drag down and release to launch up · Shift+click also works',alt:'Watcher is holding a gold barrier open above your character. Cut upward through its green center to enter the world.'});
}
export function createOpeningGuide(host) {
 const panel=document.createElement('section');panel.className='opening-guide';panel.hidden=true;panel.setAttribute('aria-label','The way into the world');
 const label=document.createElement('small'),title=document.createElement('h2'),hint=document.createElement('p');panel.append(label,title,hint);host.append(panel);
 return {update(state,device){const copy=openingGuide(state,device);panel.hidden=!copy;host.dataset.openingGuide=String(!!copy);if(copy){label.textContent=copy.title;title.textContent=copy.action;hint.textContent=copy.hint;}},dispose(){panel.remove();delete host.dataset.openingGuide;}};
}
