/** Original 24px pictograms. Familiar silhouettes; SPLATR's cut corners and one
 * accent seam. No fonts, emoji, network assets or build/recipe information. */
const raw={
 crescent:['M21 3Q9 3 3 21 15 18 21 3Z','M6 17Q12 7 19 5'],
 magnet:['M4 3H9V12A3 3 0 0 0 15 12V3H20V12A8 8 0 0 1 4 12Z','M4 7H9M15 7H20'],
 clock:['M22 12A10 10 0 1 1 2 12 10 10 0 0 1 22 12','M12 5V12L17 15'],
 sparkle:['M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9Z','M20 2V6M18 4H22'],
 rocket:['M9 16 6 12 13 3 21 2 20 10 12 18ZM7 11 3 12 2 17 7 16M13 17 12 22 17 21 18 16','M15 7H16M5 19 2 22M8 20 6 22'],
 hammer:['M4 3H14L18 7 12 13 3 6ZM12 12 20 20 22 18 14 10','M5 4 11 10'],
 glass:['M5 3H19L17 12 12 16 7 12ZM12 16V22M8 22H16','M12 4 10 8 14 10 11 14'],
 twinshield:['M9 2 17 5V11L14 16 9 19 4 16 1 11V5ZM16 9 23 12V17L20 21 16 23 12 20','M6 9 9 12 13 7M17 15V19'],

 target:['M22 12A10 10 0 1 1 2 12 10 10 0 0 1 22 12M18 12A6 6 0 1 1 6 12 6 6 0 0 1 18 12','M12 8V16M8 12H16'],
 info:['M22 12A10 10 0 1 1 2 12 10 10 0 0 1 22 12','M12 11V17M12 6V7'],
 dice:['M5 3H19L22 6V19L19 22H5L2 19V6Z','M7 7H8M16 7H17M11 12H13M7 17H8M16 17H17'],
 save:['M4 3H17L21 7V21H3V4ZM8 3V10H16V3M8 21V15H16V21','M12 5V8'],
 lock:['M5 10H19V21H5ZM8 10V6A4 4 0 0 1 16 6V10','M12 14V17'],
 mix:['M3 5H7L17 19H21M3 19H7L17 5H21M17 2 21 5 17 8','M17 16 21 19 17 22'],

 play:['M7 4 21 12 7 20Z','M7 4V20'],
 pause:['M6 4H10V20H6ZM15 4H19V20H15Z','M6 4H10M15 4H19'],
 forward:['M3 12H21M14 5 21 12 14 19','M17 8 21 12'],
 tap:['M8 13V6A2 2 0 0 1 12 6V12L15 11 20 14V19L17 22H10L4 16 5 13 8 15','M7 2 5 1M14 2 16 1M4 7H1'],
 pull:['M2 6H14M6 2 2 6 6 10M10 15V10A2 2 0 0 1 14 10V14L18 13 22 16V20L19 23H13L7 18 8 15 10 17','M2 6H10'],
 release:['M2 5H22M18 1 22 5 18 9M9 13V10M12 13V9M15 14V11M6 15 8 18V22H17L19 17V13','M4 10 2 12M21 12 23 14'],
 back:['M14 5 7 12 14 19M7 12H21','M7 12 11 8'],
 retry:['M5 7A8 8 0 1 1 4 15M5 3V8H10','M5 8 8 5'],
 shop:['M5 8H19L21 20 18 22H5L3 20Z','M8 9V6A4 4 0 0 1 16 6V9'],
 settings:['M9 3H15L16 6 19 7 22 11 20 14 19 18 15 19 14 22H10L9 19 5 18 4 14 2 11 5 7 8 6ZM16 12A4 4 0 1 1 8 12 4 4 0 0 1 16 12','M10 12H14'],
 guide:['M12 6V21M3 4 12 6 21 4V19L12 21 3 19Z','M6 9 9 10M15 10 18 9'],
 learn:['M3 10 12 5 21 10 12 15ZM6 12V18Q12 22 18 18V12','M21 10V17'],
 practice:['M3 5H21V19H3ZM8 19V22M16 19V22','M9 9 16 12 9 16Z'],
 sound:['M11 5 6 9H3V15H6L11 19ZM15 8Q20 12 15 16','M18 5Q25 12 18 19'],
 mute:['M11 5 6 9H3V15H6L11 19Z','M16 9 22 15M22 9 16 15'],
 full:['M8 3H3V8M16 3H21V8M3 16V21H8M16 21H21V16','M4 4 8 8M20 20 16 16'],
 trophy:['M6 3H18L17 11Q12 19 7 11ZM6 6H2L3 10 7 12M18 6H22L21 10 17 12M12 16V21M8 21H16','M9 6H15'],
 speed:['M3 18A10 10 0 0 1 21 18M4 18H8M16 18H20','M12 17 18 7M11 17H13'],
 bolt:['M13 2 4 14H11L10 22 21 9H13Z','M13 2 10 8'],
 bank:['M21 3V21M3 19 15 7 19 11 10 20M15 7V13M15 7H9','M21 5V11'],
 breach:['M8 3H17L21 7V20H5V7ZM13 3 10 9 15 12 10 17 13 20','M1 12H8M4 9 8 12 4 15'],
 land:['M3 17H21L19 21H5ZM12 2V13M7 9 12 14 17 9','M7 18H11M14 18H18'],
 blade:['M7 17 17 3 22 2 21 7 9 19M5 15 11 21M3 21 7 17','M12 12 19 5'],
 reach:['M3 17 13 3 18 2 17 7 5 19M2 16 7 21','M14 19H23M19 15 23 19 19 23'],
 breaker:['M12 2 21 6V13L18 18 12 22 6 18 3 13V6ZM13 4 9 10 15 13 10 20','M1 10H5M20 10H23'],
 linger:['M3 15 11 3 16 2 15 7 5 18M2 15 7 20M22 17A6 6 0 1 1 10 17 6 6 0 0 1 22 17','M16 13V17L19 19'],
 shield:['M12 2 21 6V13L18 18 12 22 6 18 3 13V6Z','M8 12 11 15 17 9'],
 guard:['M10 2 19 6V11M14 20 10 22 4 18 1 12V6ZM23 16A7 7 0 1 1 9 16 7 7 0 0 1 23 16','M16 12V16L19 18'],
 score:['M12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8Z','M9 12H15M12 9V15'],
 coin:['M21 12A9 9 0 1 1 3 12 9 9 0 0 1 21 12M17 12A5 5 0 1 1 7 12 5 5 0 0 1 17 12','M10 9H14M10 15H14M12 8V16'],
 check:['M3 12 9 18 21 5','M3 12 9 18'],
 head:['M3 6 8 10 12 3 16 10 21 6 19 20H5Z','M6 16H18'],
 eyes:['M2 8 22 6 19 16 5 18ZM5 11 10 13 18 10','M11 9V15'],
 body:['M12 2 22 7V17L12 22 2 17V7ZM2 7 12 12 22 7M12 12V22','M12 2V7'],
 core:['M12 2 22 12 12 22 2 12ZM12 7 17 12 12 17 7 12Z','M12 2V7M17 12H22'],
 tail:['M3 15 21 3 16 15 9 18 4 22 5 16M9 11 5 7 2 8 5 16','M9 14 17 7'],
 world:['M2 16H22M5 16A7 7 0 0 1 19 16M3 20H21','M12 2V5M3 7 5 9M21 7 19 9'],
};
export const UI_ICONS=Object.freeze(Object.fromEntries(Object.entries(raw).map(([name,paths])=>[name,Object.freeze([...paths])])));
export const BUFF_ICONS=Object.freeze({fleet:'speed',reach:'reach',breaker:'breaker',linger:'linger',bounty:'score',guard:'guard',barrier:'shield',comet:'rocket',cleaver:'hammer',duelist:'glass',bastion:'twinshield'});
export const STAGE_ICONS=Object.freeze({pace:'speed',launch:'bolt',surge:'bank',recharge:'retry',breach:'breach',land:'land',complete:'check'});
export function iconPaths(name){const paths=UI_ICONS[name];if(!paths)throw new RangeError(`Unknown UI icon: ${name}`);return paths.map((d,i)=>`<path d="${d}"${i?' stroke="var(--icon-accent,currentColor)"':''}/>`).join('');}
export function iconMarkup(name){return `<svg class="ui-icon" data-ui-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths(name)}</svg>`;}
export function iconNode(name,doc=document){const host=doc.createElement('span');host.innerHTML=iconMarkup(name);return host.firstElementChild;}
export function prependIcon(element,name){if(!element)return;element.querySelector(':scope > svg.ui-icon,:scope > svg.icon')?.remove();element.prepend(iconNode(name,element.ownerDocument));element.dataset.icon=name;}
/** Preserve the existing sprite IDs and audio/fullscreen adapters. */
export function installIconSprite(doc=document){for(const [id,name]of Object.entries({play:'play',pause:'pause',arrow:'forward',guide:'guide',options:'settings',sound:'sound',mute:'mute',full:'full',trophy:'trophy'})){const symbol=doc.getElementById(`i-${id}`);if(symbol)symbol.innerHTML=iconPaths(name);}}
