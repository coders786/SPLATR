/** Landmark descriptions only. Existing world-item perks are described by shopAbility. */
export const WORLD_GUIDES=Object.freeze({
 twilight:Object.freeze({district:'THE LOCKWORKS',name:'The Watcher’s gate',feature:'A monumental turbine, suspended bridges and gold-lit machinery.',accent:'#e1c18a',sky:'#173343'}),
 tokyo:Object.freeze({district:'RAIN DISTRICT',name:'Above the sleeping city',feature:'A ringed moon, antenna towers and rain-striped rooftops.',accent:'#8bdbe1',sky:'#17394c'}),
 foundry:Object.freeze({district:'THE EMBER WORKS',name:'Inside the furnace',feature:'A suspended crucible, hot spillways and heavy iron ribs.',accent:'#ffb579',sky:'#4b2827'}),
 manga:Object.freeze({district:'INK DISTRICT',name:'A world drawn by hand',feature:'Paper panels, a rising ink sun and sharply hatched architecture.',accent:'#dfd0ad',sky:'#4b4842'}),
 synth:Object.freeze({district:'AFTERGLOW',name:'Chase the last light',feature:'A striped sunset, floating arches and a luminous violet horizon.',accent:'#efa5d5',sky:'#432745'}),
 void:Object.freeze({district:'THE HOLLOW',name:'At the edge of everything',feature:'An eclipsed star, broken orbital ribs and drifting dark monoliths.',accent:'#aab6f0',sky:'#252a4b'})
});
export const worldGuide=id=>WORLD_GUIDES[id]||WORLD_GUIDES.twilight;
