import {drawFieldSpecimen} from './art/splatr-art-engine.js';
export function drawSpecimen(canvas,kind){return drawFieldSpecimen(canvas.getContext('2d'),canvas.width,canvas.height,kind);}
