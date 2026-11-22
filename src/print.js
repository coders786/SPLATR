import {drawBestStrokeMini} from './art/splatr-art-engine.js';
export function drawStrokePrint(canvas,stroke){const label=drawBestStrokeMini(canvas.getContext('2d'),canvas.width,canvas.height,stroke);canvas.setAttribute('aria-label',label);}
