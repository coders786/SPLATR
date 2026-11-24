/**
 * SPLATR ART ENGINE — standalone ES module, contract v1.
 * Authoritative source for Canvas artwork and animation. No imports, browser
 * globals, storage, networking, assets, or game-physics writes. Callers own
 * sizing, DPR, event delivery, clocks, accessibility and persistence.
 *
 * COORDINATES / UNITS
 * Canvas coordinates: origin upper left; +x right, +y down; logical pixels.
 * Hero/enemy coordinates denote their centers; radius is half body width.
 * Angles are clockwise radians; time is nominal 60 Hz ticks, NOT milliseconds.
 * Cursor x/y are normalized [-1,1]. Forge elapsed/now are milliseconds.
 * All draw functions receive CanvasRenderingContext2D-compatible contexts.
 * They draw synchronously, load no assets, return undefined unless stated.
 * Public draw functions save/restore Canvas state (pixels are the only effect).
 * No draw/evaluation function modifies any caller-owned spec or game body.
 *
 * @typedef {Object} Equipment
 * @property {string} [head='none'] Catalogue head ID.
 * @property {string} [eyes='ninja'] Catalogue eyes ID.
 * @property {string} [body='paper'] Catalogue body ID.
 * @property {string} [core='standard'] Catalogue core ID; selects shared hue.
 * @property {string} [tail='ribbon'] Catalogue tail ID.
 * @property {string} [slash='razor'] Catalogue slash ID.
 * @property {string} [world='twilight'] Catalogue world ID.
 *
 * @typedef {Object} HeroSpec
 * @property {number} [x=0] Center x, logical px.
 * @property {number} [y=0] Center y, logical px.
 * @property {number} [radius=23] Half-width, logical px.
 * @property {number} [angle=0] Rotation, radians.
 * @property {number} [time=0] Animation clock, 60 Hz ticks.
 * @property {1|-1} [face=1] Facing direction.
 * @property {Equipment} [equipment={}] Selected visual IDs.
 * @property {{x:number,y:number}} [cursor={x:0,y:0}] Normalized gaze/tilt.
 * @property {boolean} [motion=true] False freezes breathing, blink and gaze.
 * @property {Object} [pose={}] Optional legacy animation overrides:
 * blink [0,1], breathe [-1,1], look [x,y], lean radians, lift scalar,
 * attackProgress [-1,1] normalized existing attack lifetime (-1 = idle),
 * contact boolean from an existing hit signal, reducedMotion boolean,
 * emission [0,1] CORE emission only (zero exposes cavity construction),
 * combo nonnegative chain count (WEAVING intensity), overdrive boolean,
 * aiming boolean, speed px/tick, inkPixels px, accent CSS color,
 * field {sx,sy,grip} dimensionless deformation,
 * forge {slot,progress,scale,active} dimensionless visual forge pulse.
 * @function drawCubeHero
 * @param {CanvasRenderingContext2D} ctx
 * @param {HeroSpec} spec
 * @returns {void}
 *
 * @typedef {Object} ShopSpec
 * @property {Equipment} [equipment={}] Visual build.
 * @property {'head'|'eyes'|'body'|'core'|'tail'|'slash'|'world'} [slot='body'] Crop.
 * @property {number} [time=0] Ticks.
 * @property {boolean} [hovered=false] Enables active card motion.
 * @property {boolean} [selected=false] Enables active card motion.
 * @property {boolean} [motion=true] Reduced-motion switch.
 * @property {boolean} [locked=false] Codex silhouette and question-mark overlay.
 * @function drawShopCardArt
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width Logical px.
 * @param {number} height Logical px.
 * @param {ShopSpec} spec
 * @returns {void}
 *
 * @typedef {Object} SlashSpec
 * @property {number} [x=0] Start px.
 * @property {number} [y=0] Start px.
 * @property {number} [endX=100] End px.
 * @property {number} [endY=-30] End px.
 * @property {string} [id='razor'] Slash catalogue ID.
 * @property {number} [strength=1] Opacity/intensity [0,1].
 * @property {number} [progress] Sweep progress [0,1]; defaults to a complete static cut at 0.4.
 * @property {number} [time=0] Animation clock in ticks.
 * @property {Equipment} [equipment] Optional shared CORE palette.
 * @property {boolean} [reducedMotion=false] Static sweep, no traveling flecks.
 * @property {{x:number,y:number}} [contact] Actual contact point only; omitted means no impact burst.
 * @function drawSlashEffect
 * @param {CanvasRenderingContext2D} ctx
 * @param {SlashSpec} spec
 * @returns {void}
 *
 * @typedef {Object} EnemySpec
 * @property {string} [kind='fang'] Key in legacy_shapes.TYPES.
 * @property {number} [x=0] Center px.
 * @property {number} [y=0] Center px.
 * @property {number} [radius=23] Half-width px.
 * @property {number} [angle=0] Radians.
 * @property {Object} [options={}] Visual flags: hp number, paper/torn boolean,
 * fault number, twist radians, aim radians, charge [0,1].
 * @function drawEnemyShape
 * @param {CanvasRenderingContext2D} ctx
 * @param {EnemySpec} spec
 * @returns {void}
 *
 * @function drawWorldBackdrop
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width Logical px.
 * @param {number} height Logical px.
 * @param {string} [worldId='twilight'] Catalogue world ID.
 * @param {number} [time=0] Ticks.
 * @param {{x:number,y:number}} [camera={x:0,y:0}] Parallax offset in world px; optional scale controls district geometry.
 * @returns {void}
 *
 * @typedef {Object} StrokeSpec
 * @property {{x:number,y:number}} origin World px.
 * @property {number} angle Stroke bearing, radians.
 * @property {number} shot Shot index for accessible description.
 * @property {number} kills Actual contact count.
 * @property {number} points Awarded points (display only).
 * @property {Equipment} [equipment] Build recorded with stroke.
 * @property {Array<{x:number,y:number,r:number,kind:string,angle:number,
 * cut:number,paper?:boolean,small?:boolean,fromShear?:boolean,
 * release?:boolean,hpBefore?:number,fault?:number}>} marks Recorded contacts.
 * @property {{x:number,y:number,angle:number,end:{x:number,y:number}}} [shear]
 * @function drawBestStrokeMini
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width Logical px.
 * @param {number} height Logical px.
 * @param {StrokeSpec} strokeSpec
 * @returns {string} Accessible stroke description; caller sets aria-label.
 *
 * @typedef {'slice'|'aim'|'dash'|'bounce'|'hit'} PreviewMode
 * @typedef {Object} PreviewState
 * @property {number} x Hero center px in 640x400 stage.
 * @property {number} y Hero center px.
 * @property {number} vx Toy velocity px/tick.
 * @property {number} vy Toy velocity px/tick.
 * @property {number} age Toy ticks.
 * @property {number} manual Ticks until autoplay resumes.
 * @property {number} freeze Toy hit-stop ticks.
 * @property {?{x:number,y:number}} drag Pointer in stage px.
 * @property {{x:number,y:number,alive:boolean,respawn:number}} dummy
 * @property {Array<{side:number,x:number,y:number,vx:number,vy:number,a:number}>} fragments
 * @property {number} hits Cosmetic dummy cuts; never gameplay progress.
 * @property {?{x:number,y:number,fromX:number,fromY:number,age:number}} impact
 * @function evaluatePreviewPose
 * @param {PreviewMode} [mode='slice'] Autoplay mode.
 * @param {number} [time=0] Ticks.
 * @param {{state?:PreviewState,step?:number,command?:{
 * type:'aim'|'fire'|'adopt'|'reset',x?:number,y?:number}}} [pointerState={}]
 * State is copied; command is applied before step (integer ticks, clamped 0..600).
 * Fire aims TOWARD x/y; browser adapters convert client to stage coordinates.
 * @param {{motion?:boolean}} [spec={}] False freezes autoplay at tick 18.
 * @returns {{pose:{phase:number,x:number,y:number,split:boolean,cut:boolean,
 * crouch:number,impact:boolean},target:{x:number,y:number,alive:boolean},
 * state:PreviewState|null}} New immutable-by-ownership snapshot; input untouched.
 *
 * @function drawPreviewScene
 * @param {CanvasRenderingContext2D} ctx Fixed 640x400 logical stage.
 * @param {{equipment?:Equipment,time?:number,mode?:PreviewMode,
 * state?:PreviewState,options?:{cursor?:{x:number,y:number},motion?:boolean,
 * forgeAt?:number,now?:number,slot?:string,fusionElapsed?:number}}} spec
 * @returns {void}
 *
 * @function drawFieldSpecimen
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width Logical px (canonical 312).
 * @param {number} height Logical px (canonical 166).
 * @param {string} kind Enemy catalogue key.
 * @returns {void}
 *
 * @function createArtRenderer
 * @param {CanvasRenderingContext2D} ctx
 * @param {{width:number,height:number,cssWidth?:number,cssHeight?:number,
 * top?:number,gutter?:number}} viewport Backing pixels, CSS pixels, HUD insets.
 * @returns {Object} Per-surface visual controller. resize(w,h,bw,bh,top,gutter),
 * reset(seed,room), tick(readOnlyRun,motion), draw(readOnlyRun,alpha,aim,motion,device),
 * event(type,data,motion), title(ticks), field(origin,side), onViewport(callback),
 * setShakeLevel('off'|'low'|'full'), worldPoint(cssX,cssY), dispose(); getters scene,
 * revision, animationState; questView/viewSnapshot/effectState/mapFade/shakeState
 * inspect visuals. viewSnapshot includes the latest world view and HUD insets.
 * Run is a read-only game snapshot with nearest() query; never mutated. Controller
 * owns only camera, particles and animation history. It never advances game physics.
 *
 * ITEMS/SLOTS: frozen catalogue metadata; prices/descriptions are display data.
 * HYBRIDS/SPARKS/MUTATIONS: frozen recipe descriptors, never combat multipliers.
 * corePalette(id): frozen {primary,secondary,light} CSS colors.
 * drawVaultScene(ctx,w,h,{time:milliseconds,age:seconds,ticket:{prize,bonus}})
 * drawForcePreview(ctx,partId,timeMilliseconds): fixed 100x85 composition.
 * aimVisuals: read-only release/corridor geometry and speed colors.
 * legacy_* namespaces are compatibility-only APIs for existing callers/tests.
 * All Canvas geometry, animation curves, palettes and composition live below.
 */

/**
 * One owner per event. This is deliberately data, not a second animation
 * system: tests and future art passes can inspect the contract without guessing
 * which of the many old layers is allowed to answer a moment on screen.
 */
export const VISUAL_EVENT_MAP = Object.freeze({
  dash: Object.freeze({
    source: 'state.launchAngle + state.slashAge',
    primary: 'elemental-wake',
    evidence: Object.freeze(['launch-dust', 'brake-sparks', 'measured-afterimages']),
    suppressed: Object.freeze(['cube-smear', 'lead-trail-marks', 'generic-speed-wedge', 'generic-airborne-smear'])
  }),
  slashContact: Object.freeze({
    source: 'contact.angle / state.slashAngle',
    primary: 'blade-or-sword',
    evidence: Object.freeze(['one-local-contact-burst', 'actual-shards']),
    suppressed: Object.freeze(['generic-impact-wave-for-cut'])
  }),
  fallLanding: Object.freeze({
    source: 'state.fallAge + velocity.y / state.landAge + grounded',
    primary: 'fall-pose / landing-squash',
    evidence: Object.freeze(['upward-fall-streaks', 'grounded-ring']),
    suppressed: Object.freeze(['landing-ring-while-airborne'])
  }),
  bank: Object.freeze({
    source: 'real rail contact + inward normal',
    primary: 'dimension-frame-bite',
    evidence: Object.freeze(['measured-bank-scar', 'directional-boom-when-owned']),
    suppressed: Object.freeze(['generic-impact-wave', 'generic-boom-when-source-bank'])
  }),
  hurtDeath: Object.freeze({
    source: 'contact snapshot / fatal state',
    primary: 'local-damage-reaction',
    evidence: Object.freeze(['fracture', 'damage-stain']),
    suppressed: Object.freeze(['slash-contact-geometry'])
  }),
  enemyTell: Object.freeze({
    source: 'enemy.mode + clock + span + aim',
    primary: 'enemy-warning',
    evidence: Object.freeze(['active-hazard-at-source']),
    suppressed: Object.freeze(['tell-as-hazard'])
  }),
  theWatch: Object.freeze({
    source: 'teaching.visualTutorial real phase/callbacks',
    primary: 'tutorial-guidance / watch-scene',
    evidence: Object.freeze(['real-tell', 'real-resolve', 'real-hurt-or-miss']),
    suppressed: Object.freeze(['fabricated-tutorial-combat'])
  })
});

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// consolidated/shapes.js
var shapes_exports = {};
__export(shapes_exports, {
  CUBE: () => CUBE,
  INK: () => INK,
  SPECIES: () => SPECIES,
  TAU: () => TAU,
  TYPES: () => TYPES,
  bisect: () => bisect,
  bodyPose: () => bodyPose,
  mix: () => mix,
  pose: () => pose,
  regular: () => regular
});
var TAU = Math.PI * 2;
var regular = (n, offset = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [
  Math.cos(offset + i * TAU / n),
  Math.sin(offset + i * TAU / n)
]);
var star = (n, r) => regular(n * 2).map(([x, y], i) => [x * (i % 2 ? r : 1), y * (i % 2 ? r : 1)]);
var cross = [
  [-0.31, -1],
  [0.31, -1],
  [0.31, -0.31],
  [1, -0.31],
  [1, 0.31],
  [0.31, 0.31],
  [0.31, 1],
  [-0.31, 1],
  [-0.31, 0.31],
  [-1, 0.31],
  [-1, -0.31],
  [-0.31, -0.31]
];
var INK = {
  void: "#100e19",
  black: "#16111e",
  paper: "#fff8ec",
  acid: "#deff52",
  rose: "#ff426b",
  // The non-lethal replacement for a rose hazard mark. Used where something
  // used to shout "danger" and now only reports a condition.
  cool: "#6f8fa3",
  quiet: "#b3a6bd"
};
function species(name, form, color, outline, r, points, ability, counter, extra = {}) {
  return { name, form, color, outline, r, points, ability, counter, hp: 1, ...extra };
}
var TYPES = {
  fang: species(
    "Fang",
    "Triangle",
    "#ff506e",
    regular(3, 0),
    33,
    100,
    "Locks a bearing, then charges. Only a charging Fang hurts on contact.",
    "Leave its lane or cut it while your blade is active."
  ),
  pulse: species(
    "Pulse",
    "Circle",
    "#f67f9c",
    regular(32),
    32,
    150,
    "Sends a growing shock ring through the field.",
    "Start a fresh dash as the ring reaches you."
  ),
  prism: species(
    "Prism",
    "Diamond",
    "#c69aff",
    regular(4),
    37,
    180,
    "Fires a sighted needle. Some form charged beams with another Prism.",
    "Cut into needles. Break either endpoint to cancel a linked beam."
  ),
  fork: species(
    "Fork",
    "Cross",
    "#ff946e",
    cross,
    31,
    220,
    "Telegraphs a cross swipe and splits into two smaller Fangs.",
    "Leave the cross or interrupt it; save a slash for the offspring.",
    { concave: true }
  ),
  bastion: species(
    "Bastion",
    "Shield",
    "#ffba52",
    [[-0.85, -0.8], [0.85, -0.8], [0.92, 0.3], [0.5, 0.78], [0, 1], [-0.5, 0.78], [-0.92, 0.3]],
    41,
    300,
    "Two plates protect it; a marked wedge warns of its shield slam.",
    "Leave the wedge or interrupt it; cut twice to break its plates.",
    { hp: 2 }
  ),
  rift: species(
    "Rift",
    "Star",
    // ── DANGER RED, NOT PRIZE GOLD ─────────────────────────────────────────
    //
    // This was #ffa47b, a warm peach-gold. In a game where every glowing
    // star-shaped pickup has been a reward for forty years, that colour is an
    // instruction to TOUCH it -- and the Rift marks your position and then
    // blinks onto the mark. The report caught the result precisely: "the orange
    // star flashes and shrinks and grows like a glowing prize... in every video
    // game ever made, a glowing star makes players want to touch it, not run
    // away from it."
    //
    // #e0123a is the same red the Red Line uses for danger, which is the one
    // place this game already asks the player to read colour as hazard. It is
    // the named exception to "red is only for the Red Line" -- the Rift is a
    // hazard, not a pickup.
    "#e0123a",
    star(5, 0.47),
    36,
    260,
    "Marks a destination and landing strike, then blinks there.",
    "Leave the marked landing circle or cut Rift before it blinks.",
    { concave: true }
  ),
  well: species(
    "Well",
    "Pentagon",
    // ── WELL IS NOT A PRISM ────────────────────────────────────────────────
    //
    // This was '#b99bff', SEVEN RGB units from Prism's '#c69aff' -- the same
    // lilac in the same family, on two shapes that want opposite reactions. A
    // player cannot treat a friend and a hazard the same colour.
    //
    // Prism keeps '#c69aff'. Well moves to crimson, which is the language this
    // game already uses for the things that hurt you (Crown is '#ff426b'), and
    // gets a jagged hazard border on top so the difference survives colour
    // blindness. The rule about red was about the RED LINE, a red boundary that
    // used to kill you; it was never a ban on danger dressing.
    "#d61b57",
    regular(5),
    36,
    260,
    "Pulls airborne cubes inward, then marks a close compression strike.",
    "Leave the inner marked circle or cut the core before it strikes.",
    { hazard: true }
  ),
  monolith: species(
    "Monolith",
    "Slab",
    // A slab of near-black stone — the one thing in the game the colour of
    // the void between the stars could describe honestly. Nothing glows on it
    // except the core, and the core never glows for free.
    "#0d0b13",
    [[-1.12, -1.5], [1.12, -1.5], [0.78, 1.5], [-0.78, 1.5]],
    // CHUNK 6B: r 130 → 215. The slab hangs off the top of the seam at
    // ordinary zoom — it does not threaten, it LANDLORDS. The outline is in
    // units of r and scales with it; the sensor body scales the same way.
    215,
    2500,
    "The landlord of the tear. Five plates; only a banked OVERCHARGED cut takes one.",
    "Bank the rails to x4, then cut. Repeat five times.",
    { hp: 10 }
  ),
  crown: species(
    "Crown",
    "Octagon",
    "#ff426b",
    regular(8, Math.PI / 8),
    67,
    1200,
    "A sector hunter. Fires a radial volley and carries three plates.",
    "Break the plates with separate cuts. Destroy it to restore one health.",
    { hp: 3 }
  )
};
var SPECIES = Object.keys(TYPES);
var CUBE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
];
var mix = (a, b, t) => a + (b - a) * t;
function pose(e, t) {
  return { x: mix(e.px, e.x, t), y: mix(e.py, e.y, t), angle: mix(e.pa, e.angle, t) };
}
function bodyPose(body, t) {
  const p = body.plugin.previous;
  return {
    x: mix(p.x, body.position.x, t),
    y: mix(p.y, body.position.y, t),
    angle: mix(p.angle, body.angle, t)
  };
}
function bisect(points, angle) {
  const nx = -Math.sin(angle), ny = Math.cos(angle);
  return [-1, 1].map((sign) => {
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length], da = sign * (nx * a[0] + ny * a[1]), db = sign * (nx * b[0] + ny * b[1]);
      if (da >= 0) out.push(a);
      if (da < 0 !== db < 0) {
        const t = da / (da - db);
        out.push([mix(a[0], b[0], t), mix(a[1], b[1], t)]);
      }
    }
    return out;
  });
}

// consolidated/animation.js
var animation_exports = {};
__export(animation_exports, {
  DASH: () => DASH,
  DIRS: () => DIRS,
  DUST: () => DUST,
  FALL: () => FALL,
  GHOSTS: () => GHOSTS,
  HYPER_CEILING: () => HYPER_CEILING,
  OCTANT_NAMES: () => OCTANT_NAMES,
  SLASH: () => SLASH,
  SPARKS: () => SPARKS,
  SPLAT: () => SPLAT,
  TAU: () => TAU2,
  clamp01: () => clamp01,
  cubePose: () => cubePose,
  dashBurst: () => dashBurst,
  dashFor: () => dashFor,
  easeInCubic: () => easeInCubic,
  easeInOutCubic: () => easeInOutCubic,
  easeOutCubic: () => easeOutCubic,
  easeOutElastic: () => easeOutElastic,
  easeOutQuint: () => easeOutQuint,
  fallFor: () => fallFor,
  ghostsFor: () => ghostsFor,
  landFor: () => landFor,
  lerp: () => lerp,
  moveFor: () => moveFor,
  octant: () => octant,
  slashFor: () => slashFor,
  spike: () => spike,
  splatFor: () => splatFor
});
var TAU2 = Math.PI * 2;
var clamp01 = (n) => n < 0 ? 0 : n > 1 ? 1 : n;
var lerp = (a, b, t) => a + (b - a) * t;
var easeOutQuint = (t) => 1 - Math.pow(1 - clamp01(t), 5);
var easeInCubic = (t) => Math.pow(clamp01(t), 3);
var easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
var easeInOutCubic = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
var easeOutElastic = (t) => {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  const p = 0.14;
  return Math.pow(2, -14 * x) * Math.sin((x - p / 4) * TAU2 / p) + 1;
};
var spike = (t) => {
  const x = clamp01(t);
  return x >= 1 ? 0 : Math.pow(1 - x, 2);
};
var SLASH = Object.freeze({
  windup: 2,
  swing: 4,
  impact: 2,
  settle: 6,
  get total() {
    return this.windup + this.swing + this.impact + this.settle;
  },
  /** How far the blade travels, in radians. Past PI so it reads as a full
   *  committed arc rather than a poke. */
  sweep: Math.PI * 1.18,
  /** How far BACK it cocks before starting, in radians. */
  cock: 0.38,
  /** Body counter-rotation during the wind-up, in radians. */
  counter: 0.24
});
function slashFor(age, dir = 0) {
  const a = age;
  const total = SLASH.total;
  if (!(a >= 0) || a >= total) return null;
  const { windup, swing, impact, settle } = SLASH;
  let angle, smear, alpha, weight, flash;
  if (a < windup) {
    const t = easeInCubic(a / windup);
    angle = dir - SLASH.cock * t;
    smear = 0;
    alpha = 0.55 + 0.45 * t;
    weight = 0.55 + 0.45 * t;
    flash = 0;
  } else if (a < windup + swing) {
    const t = easeOutQuint((a - windup) / swing);
    angle = dir - SLASH.cock + (SLASH.sweep + SLASH.cock) * t;
    const u = clamp01((a - windup) / swing);
    smear = Math.min(1, Math.sin(u * Math.PI) + 0.42 * u);
    alpha = 1;
    weight = 1;
    flash = 0;
  } else if (a < windup + swing + impact) {
    const t = (a - windup - swing) / impact;
    angle = dir + SLASH.sweep;
    smear = 0.42 - 0.21 * t;
    alpha = 1;
    weight = 1;
    flash = 1 - t * 0.5;
  } else {
    const t = clamp01((a - windup - swing - impact) / settle);
    const e = easeOutCubic(t);
    angle = dir + SLASH.sweep + 0.1 * e;
    smear = (1 - e) * 0.21;
    alpha = 1 - e;
    weight = 1 - e * 0.85;
    flash = 0.5 * (1 - e);
  }
  const counter = a < windup ? -SLASH.counter * easeInCubic(a / windup) : a < windup + swing ? -SLASH.counter + SLASH.counter * 1.6 * easeOutQuint((a - windup) / swing) : SLASH.counter * 0.6 * (1 - clamp01((a - windup - swing) / (impact + settle)));
  return {
    /** absolute blade bearing */
    angle,
    /** 0..1, how much of the swung arc to draw as a smear */
    smear,
    alpha,
    /** blade thickness multiplier */
    weight,
    /** 0..1 white flash on the leading edge, impact frames only */
    flash,
    /** body rotation offset, radians */
    counter,
    phase: a < windup ? "windup" : a < windup + swing ? "swing" : a < windup + swing + impact ? "impact" : "settle",
    /** feet planted: no stretch while swinging, so the arc is the motion */
    t: a / total
  };
}
var HYPER_CEILING = 280;
var FALL = Object.freeze({
  /** Below this downward speed the cube is drifting, not falling. */
  drift: 8,
  /** At or above this it is a plunge. */
  plunge: 20,
  /** `rush` reaches 1 here. Was effectively 80 (the old divisor was 60 from
   *  plunge); a full-speed dive is 280, so the vocabulary had 200 px/tick of
   *  silence to say nothing in. */
  terminal: 220,
  /** The physical ceiling of a fall, where `dive` reaches 1. */
  top: 378,
  /** Ticks of squash after a landing. */
  land: 9
});
function fallFor(vy, speed = 0) {
  const down = Math.max(0, vy);
  if (down < FALL.drift) return null;
  const k = clamp01((down - FALL.drift) / (FALL.plunge - FALL.drift));
  const rush = clamp01((down - FALL.plunge) / (FALL.terminal - FALL.plunge));
  const dive = clamp01((down - FALL.terminal) / (FALL.top - FALL.terminal));
  return {
    k,
    rush,
    /** The far end: the body has stopped resisting and gone streamlined. */
    dive,
    /** Lean BACK against the fall: the body fights gravity before it gives in.
     *
     *  This used to be `-0.16 * (1 - easeInCubic(k))`, which is LARGEST at
     *  k = 0 and decays to zero. Added to the pose's own lean, the body rocked
     *  12 degrees backwards at vy 8 and then snapped upright at vy 20 -- a
     *  stumble while barely moving, and rigid exactly when the drop got real.
     *
     *  Now it starts at 0 and grows with the fall, so the read is: the faster
     *  the drop, the harder the body resists it. It is an EXPRESSION channel --
     *  it dips the leading corners rather than rotating them.
     */
    lean: 0.2 * easeInCubic(k) + 0.1 * rush,
    /** Vertical elongation. Squash is wide+short, plunge is narrow+long.
     *
     *  `dive` adds a further term past `terminal`, so a full dive keeps
     *  narrowing instead of flattening out with `rush` once it saturates. */
    stretch: 1 + 0.1 * k + 0.16 * rush + 0.1 * dive,
    squeeze: 1 - 0.12 * k - 0.14 * rush - 0.08 * dive,
    /** Eyes close to two lines.
     *
     *  They used to hit their floor at vy 20 -- the instant the fall became a
     *  fall at all -- so the face was a threshold crossing rather than a
     *  readout. Now they stay open through the ordinary plunge and close as the
     *  dive locks in, which is when the body stops looking where it is going. */
    eyes: 1 - 0.55 * k - 0.45 * dive,
    /** Scarf streams UP in world space, i.e. opposite the travel. */
    scarfLift: 1.25 * k + 0.9 * rush,
    /** The smear runs upward, behind the cube. Never in front. */
    trail: k + 0.55 * rush + 0.5 * dive,
    /** How many trailing cels to draw. A plunge gets one plume; a dive gets a
     *  stack of them, which is the only thing that separates the two on screen. */
    cels: 1 + Math.round(3 * rush) + Math.round(2 * dive),
    /** 0..1, how much the frame itself should compress at this speed. */
    shock: rush
  };
}
function landFor(age) {
  if (!(age >= 0) || age > FALL.land) return null;
  const t = age / FALL.land;
  const q = 1 - easeOutElastic(t);
  return {
    /** >1 = wider than tall */
    wide: 1 + 0.42 * q,
    tall: 1 - 0.34 * q,
    alpha: 1,
    t,
    /** How hard the frame is rung, 1 at the instant of contact -> 0 by the end.
     *  The renderer uses this for the impact ring and the ground scuff; without
     *  it the landing was applied as a silent scale and nothing was DRAWN. */
    shock: Math.pow(1 - t, 1.6),
    /** 0 at contact, 1 at rest. The ground marks fade along this. */
    settle: t
  };
}
var DIRS = Object.freeze([
  // E — driving right: leading with the edge, leaning hard into it.
  { name: "E", lean: 0.34, tall: 0.99, wide: 1.03, scarf: 0, eyes: 1, twist: 0.1, stretch: 0.16 },
  // NE — the corner pose: taller, twisted, chin up.
  { name: "NE", lean: 0.22, tall: 1.1, wide: 0.93, scarf: 0.7, eyes: 1, twist: 0.24, stretch: 0.13 },
  // N — full climb: stretched long and thin, the classic rising silhouette.
  { name: "N", lean: 0, tall: 1.2, wide: 0.88, scarf: 1.4, eyes: 1, twist: 0, stretch: 0.1 },
  // NW — corner, mirrored: the twist goes the other way.
  { name: "NW", lean: -0.22, tall: 1.1, wide: 0.93, scarf: 2.1, eyes: 1, twist: -0.24, stretch: 0.13 },
  // W — driving left, mirrored.
  { name: "W", lean: -0.34, tall: 0.99, wide: 1.03, scarf: 2.8, eyes: 1, twist: -0.1, stretch: 0.16 },
  // SW — falling left: heavy, wider, eyes narrowing against the wind.
  { name: "SW", lean: -0.18, tall: 0.9, wide: 1.12, scarf: 3.5, eyes: 0.6, twist: -0.14, stretch: 0.18 },
  // S — full drop: the widest, shortest, most compressed pose. Eyes shut.
  { name: "S", lean: 0, tall: 0.86, wide: 1.18, scarf: 4.2, eyes: 0.3, twist: 0, stretch: 0.2 },
  // SE — falling right.
  { name: "SE", lean: 0.18, tall: 0.9, wide: 1.12, scarf: 4.9, eyes: 0.6, twist: 0.14, stretch: 0.18 }
]);
function moveFor(vx, vy, hold = 0) {
  const speed = Math.hypot(vx, vy);
  if (speed < 0.6) {
    const d = DIRS[hold & 7];
    return {
      ...d,
      index: hold & 7,
      mix: 0,
      speed,
      moving: false,
      lean: d.lean * 0.25,
      tall: lerp(d.tall, 1, 0.72),
      wide: lerp(d.wide, 1, 0.72),
      twist: d.twist * 0.3,
      stress: 0,
      stretch: d.stretch * 0.3
    };
  }
  const t = Math.atan2(vy, vx);
  const turns = t / TAU2 * 8;
  const i = (Math.floor(turns) % 8 + 8) % 8;
  const u = turns - Math.floor(turns);
  const a = DIRS[i], b = DIRS[(i + 1) % 8];
  // Ease out of the held pose over the first few pixels/tick. Without this,
  // crossing 0.6px/tick jumps straight from a relaxed stop to a full run pose.
  const held = DIRS[hold & 7], v = clamp01((speed - 0.6) / 5.4), weight = v * v * (3 - 2 * v);
  const lean = lerp(held.lean * 0.25, lerp(a.lean, b.lean, u), weight);
  const scarf = lerp(a.scarf, b.scarf, u);
  const stress = clamp01((speed - 12) / 26);
  return {
    name: u < 0.5 ? a.name : b.name,
    index: i,
    mix: u,
    speed,
    moving: true,
    lean,
    tall: lerp(lerp(held.tall, 1, 0.72), lerp(a.tall, b.tall, u), weight),
    wide: lerp(lerp(held.wide, 1, 0.72), lerp(a.wide, b.wide, u), weight),
    scarf,
    eyes: lerp(held.eyes, lerp(a.eyes, b.eyes, u), weight),
    // The two channels that make a diagonal read as a turn and a fast cube read
    // as thrown rather than moved. Both are blended, so neither can pop.
    twist: lerp(held.twist * 0.3, lerp(a.twist, b.twist, u) * clamp01(speed / 18), weight),
    stretch: lerp(held.stretch * 0.3, lerp(a.stretch, b.stretch, u) * stress, weight),
    stress
  };
}
function cubePose({ vx = 0, vy = 0, age = 0, slashAge = -1, fallAge = -1, landAge = -1, hold = 0, facing = 1, suppressFall = false } = {}) {
  const move = moveFor(vx, vy, hold);
  let lean = move.lean, tall = move.tall, wide = move.wide, eyes2 = move.eyes, scarf = move.scarf, twist = move.twist, stretch = move.stretch, counter = 0, slash = null, fall = null, land = null;
  fall = suppressFall ? null : fallFor(vy, move.speed);
  if (fall) {
    lean += fall.lean;
    const f = Math.min(1, fall.k * 0.6 + fall.rush * 0.3 + fall.dive * 0.3);
    tall = lerp(tall, tall * fall.stretch, f);
    wide = lerp(wide, wide * fall.squeeze, f);
    eyes2 = lerp(eyes2, fall.eyes, f);
    scarf = lerp(scarf, scarf + fall.scarfLift, 1);
  }
  if (slashAge >= 0) {
    slash = slashFor(slashAge, 0);
    if (slash) {
      counter = slash.counter * facing;
      tall = lerp(tall, 1, 0.5);
      wide = lerp(wide, 1, 0.5);
      twist = lerp(twist, 0, 0.5);
      stretch = lerp(stretch, 0, 0.6);
    }
  }
  land = landFor(landAge);
  if (land) {
    tall *= land.tall;
    wide *= land.wide;
    lean *= 1 - land.t * 0.6;
    twist *= 1 - land.t * 0.8;
    stretch *= 1 - land.t * 0.8;
  }
  if (fall && fall.rush > 0) {
    tall *= 1 + 0.1 * fall.rush;
    wide *= 1 - 0.08 * fall.rush;
  }
  const skew = -twist * 0.62;
  const speedNow = Math.hypot(vx, vy);
  const sonic = clamp01((speedNow - HYPER_CEILING) / (HYPER_CEILING * 0.35));
  return {
    lean,
    tall,
    wide,
    eyes: eyes2,
    scarf,
    twist,
    /** Shear along travel, radians-equivalent: takes the place of the rotation.
     *  Positive shears the leading edge over the trailing one. */
    skew,
    stretch,
    /** 0 below hyper's ceiling, 1 at the physical top speed. Drives the
     *  supersonic silhouette, the pressure cone and the ribbon. */
    sonic,
    counter,
    slash,
    fall,
    land,
    move,
    facing,
    /** The world-space bearing the body is being dragged along. */
    heading: Math.atan2(vy, vx)
  };
}
var OCTANT_NAMES = Object.freeze(["E", "SE", "S", "SW", "W", "NW", "N", "NE"]);
function octant(vx, vy) {
  if (!vx && !vy) return 0;
  const t = Math.atan2(vy, vx);
  return (Math.round(t / TAU2 * 8) % 8 + 8) % 8;
}
var DASH = Object.freeze({
  /** Anticipation. Two ticks: enough to read as a coil, short enough that the
   *  dash still answers the input. */
  windup: 2,
  /** The dashes state. Five ticks, matching the brief's frames 3-7. */
  active: 5,
  /** Braking and the elastic settle. Eight ticks, not five: at five the settle
   *  moved 0.175 of the body's own length per tick, which is a pop, not a
   *  spring. The brief's 3 frames were a starting point; this is what actually
   *  reads as elastic. */
  recover: 8,
  /** Sum of the three. Written out because the object is frozen. */
  total: 15
});
/** Resolve a dash's octant from its committed launch bearing when one exists.
 *
 * `vx/vy` remain the compatibility fallback for pure animation callers and old
 * preview fixtures. Gameplay passes the launch angle captured by `run.dash()`;
 * a rail reflection or a later steering update must never turn the already
 * committed dash telegraph around underneath the player.
 */
function dashDirection(vx, vy, launchAngle = null) {
  return Number.isFinite(launchAngle)
    ? octant(Math.cos(launchAngle), Math.sin(launchAngle))
    : octant(vx, vy);
}
function dashFor(slashAge, vx, vy, launchAngle = null) {
  if (!(slashAge >= 0) || slashAge > DASH.total) return null;
  const dir = dashDirection(vx, vy, launchAngle);
  const speed = Math.hypot(vx, vy);
  const power = clamp01(speed / 42);
  const a = dir / 8 * TAU2;
  const dx = Math.sign(Math.round(Math.cos(a) * 1e6) / 1e6), dy = Math.sign(Math.round(Math.sin(a) * 1e6) / 1e6);
  const lead = { x: dx, y: dy };
  const trail = { x: -dx, y: -dy };
  if (slashAge < DASH.windup) {
    const t2 = (slashAge + 1) / (DASH.windup + 1);
    const k = 0.16 * power * t2;
    return withAxes({
      phase: "windup",
      dir,
      t: t2,
      along: 1 - k,
      across: 1 + k * 0.62,
      core: { x: -dx * 0.42 * t2, y: -dy * 0.42 * t2 },
      lead,
      trail,
      // The leading wall flashes DURING the wind-up: the telegraph.
      leadGlow: 0.35 + 0.5 * t2,
      trailBreak: 0,
      ghost: 0
    }, dx, dy);
  }
  if (slashAge < DASH.windup + DASH.active) {
    const t2 = clamp01((slashAge - DASH.windup) / (DASH.active - 1));
    const ease = easeOutQuint(t2);
    return withAxes({
      phase: "active",
      dir,
      t: t2,
      along: lerp(1 - 0.16 * power, 1 + 0.3 * power + 0.08, ease),
      across: lerp(1 + 0.16 * power * 0.62, 1 - 0.16 * power - 0.04, ease),
      core: { x: dx * lerp(-0.42, 0.34, ease), y: dy * lerp(-0.42, 0.34, ease) },
      lead,
      trail,
      leadGlow: lerp(0.85, 1, ease),
      // Ramps in and STAYS: the back of the body is dematerialised for the whole
      // dash, not just at the start of it.
      trailBreak: Math.min(1, t2 * 2.2),
      ghost: 1
    }, dx, dy);
  }
  const t = (slashAge - DASH.windup - DASH.active) / DASH.recover;
  const peak = 0.3 * power + 0.08;
  const settle = Math.cos(t * Math.PI) * Math.pow(1 - t, 1.4);
  return withAxes({
    phase: "recover",
    dir,
    t,
    along: 1 + peak * settle,
    across: 1 - (0.16 * power + 0.04) * settle,
    core: { x: dx * 0.34 * (1 - t), y: dy * 0.34 * (1 - t) },
    lead,
    trail,
    leadGlow: 1 - t,
    trailBreak: Math.pow(1 - t, 1.6),
    // ── ZERO GHOSTS ONCE THE DASH IS OVER ────────────────────────────────
    //
    // This used to fade from 1 to 0 across recovery, so a cube that had
    // finished dashing -- and was now just falling or sitting -- kept drawing
    // after-images. The brief is explicit: ghost copies exist ONLY while a dash
    // is actively flying, and a cube on the floor drops ZERO. Recovery is not
    // the dash; it is the settle afterwards, and the settle is exactly when the
    // player needs to read the cube's real position.
    ghost: 0
  }, dx, dy);
}
function withAxes(dash, dx, dy) {
  const diagonal = dx !== 0 && dy !== 0;
  const sx = diagonal ? 1 + (dash.along - 1) * 0.55 : dx ? dash.along : dash.across;
  const sy = diagonal ? 1 + (dash.along - 1) * 0.55 : dy ? dash.along : dash.across;
  return { ...dash, sx, sy };
}
var GHOSTS = Object.freeze({
  count: 3,
  /**
   * Gap between after-images, in body half-widths. It was 0.62, which put the
   * three ghosts 3-7px apart against a 46px-wide body: they landed on top of
   * each other and read as ONE solid slab of acid behind the cube rather than
   * as three fading echoes. Measured at the glass: -72, -76, -79 px.
   */
  spread: 1.05,
  fade: 0.4,
  /**
   * ── AFTER-IMAGES ARE ECHOES OF POSITIONS, NOT DECORATION ─────────────────
   *
   * A ghost marks where the body WAS. So the spacing between them is set by how
   * far the body actually travelled, not by a constant: one ghost per half-cube
   * of travel, which is the interval at which the eye stops reading overlap and
   * starts reading separate echoes.
   *
   * The old code spaced them in fixed body units off `lead`, so a 12px/tick
   * dash and a 42px/tick dash left exactly the same pattern -- a slow dash
   * looked like it had been moving fast, and a fast one looked like it had not
   * moved at all. `travel` below is what fixes that.
   */
  spacing: 0.5,
  /** Never fewer than this between images, or a slow dash stacks them. */
  minGap: 0.85
});
function ghostsFor(dash, travel = null) {
  if (!dash || !(dash.ghost > 0.02) || dash.phase === "windup") return [];
  const out = [];
  for (let i = 0; i < GHOSTS.count; i++) {
    const u = (i + 1) / (GHOSTS.count + 1);
    const step = travel === null ? GHOSTS.spread * dash.ghost * (1 + dash.t) : Math.max(GHOSTS.minGap, travel * GHOSTS.spacing * 2);
    const back = 1 + u * step;
    const ln = Math.hypot(dash.lead.x, dash.lead.y) || 1;
    out.push({
      // Along the trailing direction, in body units.
      x: -dash.lead.x / ln * back,
      y: -dash.lead.y / ln * back,
      // Each ghost is a little smaller: the body was slightly less stretched
      // when it occupied that position, and a receding silhouette gives the
      // trail its depth. Shrinking is axis-aligned.
      scale: (1 - u * 0.3) * (1 - 0.1 * (1 - dash.ghost)),
      alpha: dash.ghost * GHOSTS.fade * (1 - u * 0.72),
      age: u
    });
  }
  return out;
}
var DUST = Object.freeze({ count: 6, splay: 0.62, speed: 3.1 });
var SPARKS = Object.freeze({ count: 7, splay: 0.9, speed: 4.4 });
function dashBurst(dash, kind) {
  if (!dash) return [];
  const spec = kind === "brake" ? SPARKS : DUST;
  const dx = dash.trail.x, dy = dash.trail.y;
  const px = -dy, py = dx;
  const out = [];
  for (let i = 0; i < spec.count; i++) {
    const u = spec.count === 1 ? 0 : i / (spec.count - 1) * 2 - 1;
    const ax = kind === "brake" ? -dx : dx, ay = kind === "brake" ? -dy : dy;
    const splay = u * spec.splay;
    out.push({
      // Unit-ish direction, not normalised: a wider splay is a wider fan.
      dx: ax + px * splay,
      dy: ay + py * splay,
      // Middle particles fly furthest; the edges of the fan are slower.
      speed: spec.speed * (1 - Math.abs(u) * 0.45),
      // Alternating two-tone so the burst is not one flat colour.
      hot: i % 2 === 0
    });
  }
  return out;
}
var SPLAT = Object.freeze({
  /** Ticks compressed against the wall. */
  hold: 3,
  /** Ticks peeling off and wobbling back to rest. */
  daze: 11,
  total: 14,
  /** How flat the body gets at worst. */
  flat: 0.34,
  /** How much it bulges along the wall while flat. */
  bulge: 0.5
});
function splatFor(age, normal) {
  if (!(age >= 0) || age >= SPLAT.total) return null;
  const nx = Math.sign(normal?.x ?? 0), ny = Math.sign(normal?.y ?? 0);
  if (!nx && !ny) return null;
  const onX = Math.abs(nx), onY = Math.abs(ny);
  if (age < SPLAT.hold) {
    const t2 = age / SPLAT.hold;
    const k2 = SPLAT.flat + (1 - SPLAT.flat) * 0.28 * t2;
    const b2 = SPLAT.bulge * (1 - 0.15 * t2);
    return {
      phase: "pancake",
      t: t2,
      sx: 1 - (1 - k2) * onX + b2 * onY,
      sy: 1 - (1 - k2) * onY + b2 * onX,
      core: { x: -nx * 0.62, y: -ny * 0.62 },
      // The contact ring: how hard the wall is being hit, for debris.
      hit: 1 - t2 * 0.4,
      daze: 0
    };
  }
  const t = (age - SPLAT.hold) / SPLAT.daze;
  const wob = Math.cos(t * Math.PI * 2) * Math.pow(1 - t, 1.6);
  const k = SPLAT.flat + (1 - SPLAT.flat) * Math.min(1, t * 2.6);
  const b = SPLAT.bulge * (1 - t) * 0.5;
  return {
    phase: "daze",
    t,
    sx: 1 - (1 - k) * onX + (b + wob * 0.16) * onY,
    sy: 1 - (1 - k) * onY + (b + wob * 0.16) * onX,
    // The core peels away from the wall and floats back to centre.
    core: { x: -nx * 0.62 * (1 - t), y: -ny * 0.62 * (1 - t) },
    hit: 0,
    // Dizzy eyes: the caller feeds this to the face so the cube looks stunned.
    daze: Math.pow(1 - t, 1.3)
  };
}

// consolidated/harmony.js
var harmony_exports = {};
__export(harmony_exports, {
  ATTACHMENTS: () => ATTACHMENTS,
  bodyFinish: () => bodyFinish,
  corePalette: () => corePalette,
  drawCoreChamber: () => drawCoreChamber,
  drawForge: () => drawForge,
  evolutionIntensity: () => evolutionIntensity,
  forgeState: () => forgeState,
  livingPose: () => livingPose,
  materialMount: () => materialMount
});
var palettes = { standard: ["#dfff70", "#ffd777", "#fff7cf"], grav: ["#bc8cff", "#7053d9", "#f2ddff"], riot: ["#cfff52", "#6fba33", "#f5ffd1"], time: ["#7ceeff", "#3c9be0", "#ebffff"], glass: ["#fff4ee", "#ef4e74", "#ffffff"], magnet: ["#ff6f8e", "#70dfff", "#f5ecff"], echo: ["#ff7dcf", "#a959e1", "#ffe1f4"] };
function corePalette(core = "standard") {
  const [primary, secondary, light] = palettes[core] || palettes.standard;
  return Object.freeze({ primary, secondary, light });
}
/** Cosmetic BODY profiles. Outline units are hero radii; no collision changes.
 * resolveVisualHarmony(eq,time,pose) returns a frozen palette/lighting descriptor:
 * primary/secondary/light = CORE hues, rim = world light, trim = CORE/material mix,
 * energy = bounded chain intensity, pulse = [0.7,1], profile = cosmetic body ID.
 */
var SHAPE_MODIFIERS=Object.freeze([
  {id:"chamfer",name:"Chamfer Frame",outline:[[-.72,-1],[.72,-1],[1,-.72],[1,.72],[.72,1],[-.72,1],[-1,.72],[-1,-.72]]},
  {id:"notched",name:"Notched Frame",outline:[[-1,-1],[.9,-1],[1,-.9],[1,.45],[.84,.59],[1,.72],[1,1],[-1,1],[-1,.72],[-.84,.59],[-1,.45]]},
  {id:"segmented",name:"Segmented Frame",outline:[[-1,-1],[.9,-1],[1,-.9],[1,1],[-.93,1],[-1,.91]]}
].map(x=>Object.freeze({...x,outline:Object.freeze(x.outline.map(p=>Object.freeze(p)))})));
function resolveVisualHarmony(eq={},time=0,pose={}) {
  const p=corePalette(eq.core),rim={tokyo:"#8eeeff",foundry:"#ffab76",manga:"#66516e",synth:"#ff8de2",void:"#bcc9ff"}[eq.world]||p.light;
  const material={iron:"#a7b8cb",gold:"#ffe1a0",prism:"#c8aeff",lava:"#ffad77",obsidian:"#7d8ba5",hologram:"#9eebff",chamfer:"#b8cce5",notched:"#e4a9c5",segmented:"#a2cab9"}[eq.body]||p.light;
  return Object.freeze({...p,rim,trim:blend(p.primary,material,.28),energy:evolutionIntensity(pose.combo,pose.overdrive),pulse:.85+Math.sin((Number.isFinite(time)?time:0)*.05)*.15,profile:SHAPE_MODIFIERS.some(x=>x.id===eq.body)?eq.body:"standard"});
}
// Quiet finishing: a structural plate only where the BODY actually needs it.
function drawHarmonyBindings(c,eq,t,p) {
  const d=resolveBodyConstruction(eq.body),h=resolveVisualHarmony(eq,t,p);
  c.save();
  if(eq.body==="segmented"){
    for(const side of [-1,1])panel(c,[[side*.65,.38],[side*.91,.32],[side*.91,.75],[side*.65,.82]],d.shadow,.028);
  }else if(eq.body==="notched"){
    for(const side of [-1,1])seam(c,[[side*.94,.39],[side*.76,.58],[side*.94,.78]],d.shadow,.05);
  }
  // One material language across arbitrary mixes: head mounts and lower
  // tail socket carry the CORE trim, without recoloring the eye cuts.
  if(eq.head && eq.head!=="none")for(const side of [-1,1])seam(c,[[side*.63,-.91],[side*.78,-.84]],h.trim,.035);
  seam(c,[[-.91,.64],[-.77,.75],[-.59,.75]],h.trim,.035);
  c.restore();
}
/** Pure presentation state. progress is normalized existing attack lifetime;
 * -1 means no attack. Contact is explicit, never inferred from an endpoint.
 * Reduced motion retains static intent but suppresses release/secondary motion.
 */
function resolveCharacterPerformance(input={},time=0) {
  const unit=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
  const moving=unit((input.speed||0)/35),aim=input.aiming?1:0;
  const progress=Number.isFinite(input.attackProgress)&&input.attackProgress>=0?unit(input.attackProgress):input.attack>0?1-unit(input.attack):-1;
  const reduced=input.reducedMotion===true;
  // Legacy attack strength also expresses a held attack pose at progress zero.
  const attackFocus=Number.isFinite(input.attack)?unit(input.attack)*.5:0;
  const release=progress>=0&&!reduced?Math.sin(Math.PI*Math.min(1,progress/.62)):0;
  const recovery=progress>.55&&!reduced?Math.sin((progress-.55)/.45*Math.PI):0;
  const contact=input.contact===true&&!reduced?1:0;
  const phase=aim?"aim":progress<0?"idle":progress<.55?"release":"recover";
  return Object.freeze({phase,progress,focus:unit(aim*.85+release*.9+attackFocus+moving*.25+contact*.2),charge:aim,release:unit(release),recovery,contact,
    coreCompression:aim*.14-release*.10-contact*.04,tailLag:reduced?0:release*.14-recovery*.07,
    idleClock:(Number.isFinite(time)?time:0)*.28});
}
/** Visible interval on the full quadratic slash path, independent of opacity. */
function resolveSlashSweep(progress=.4,id="razor",reducedMotion=false) {
  const p=reducedMotion?.4:Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
  const speed=id==="katana"?5:id==="laser"?3.1:3.6;
  let head=Math.min(1,.04+p*speed),tail=Math.max(0,(p-.38)/.62);
  if(id==="pixel"){head=Math.ceil(head*14)/14;tail=Math.floor(tail*14)/14;}
  return Object.freeze({head,tail:Math.min(head,tail),width:(.7+Math.sin(Math.PI*Math.min(1,p*2))*.3)*(1-Math.max(0,p-.45)*1.3),progress:p});
}
function evolutionIntensity(chain = 0, drive = false) {
  return Math.min(1.8, 0.35 + Math.max(0, chain) * 0.12 + (drive ? 0.45 : 0));
}
function livingPose(t, cursor = { x: 0, y: 0 }, motion = true) {
  if (!motion) return { blink: 1, breathe: 0, look: [0, 0], lean: 0, lift: 0.25 };
  const x = Number.isFinite(cursor.x) ? Math.max(-1, Math.min(1, cursor.x)) : 0, y = Number.isFinite(cursor.y) ? Math.max(-1, Math.min(1, cursor.y)) : 0;
  const phase = (t % 211 + 211) % 211, blink = phase > 202 ? Math.abs(phase - 206.5) / 4.5 : 1;
  return { blink: Math.max(0.05, Math.min(1, blink)), breathe: Math.sin(t * 0.027), look: [x, y], lean: x * 0.045, lift: 0.3 + Math.sin(t * 0.036) * 0.08 };
}
function forgeState(elapsedMs, slot) {
  const u = Math.max(0, Math.min(1, elapsedMs / 180));
  return { slot, progress: u, scale: 1 + 0.12 * (1 - u) * (1 - u), active: u < 1 };
}
var ATTACHMENTS = Object.freeze({ head: [0, -1.4], eyes: [0.1, -0.15], body: [0, 0], core: [0, 0.25], tail: [-1.2, 0.05], slash: [1, 0.1], world: [0, 0] });
function drawForge(c, forge, palette) {
  if (!forge?.active) return;
  const [x, y] = ATTACHMENTS[forge.slot] || [0, 0], u = forge.progress;
  c.save();
  c.translate(x, y);
  c.globalAlpha = (1 - u) * 0.8;
  c.strokeStyle = palette.primary;
  c.lineWidth = 0.05 * (1 - u) + 0.015;
  c.beginPath();
  c.arc(0, 0, 0.2 + u * 1.3, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 10; i++) {
    const a = i * 2.399, r = 0.18 + u * (0.6 + i * 0.04);
    c.fillStyle = i % 2 ? palette.light : palette.secondary;
    c.fillRect(Math.cos(a) * r - 0.022, Math.sin(a) * r - 0.022, 0.044, 0.044);
  }
  c.restore();
}
function bodyFinish(c, eq, palette, t, pose2) {
  // A single short reflected edge. No second halftone lattice or frame.
  const d=resolveBodyConstruction(eq.body),h=resolveVisualHarmony(eq,t,pose2);
  c.save();
  if(eq.world!=="manga")seam(c,[[.96,-.67],[.96,-.37]],blend(d.light,h.rim,.24),.025);
  c.restore();
}
function materialMount(c, body, slot, t, palette) {
  c.save();
  if (body === "hologram") {
    c.globalAlpha = 0.6;
    c.strokeStyle = "#82edff";
    c.lineWidth = 0.025;
    const box = slot === "head" ? [-1.1, -1.9, 2.2, 0.85] : [-2.6, -0.65, 1.7, 1.55];
    for (let i = 0; i < 5; i++) {
      const y = box[1] + (i * 0.18 + t * 5e-3) % box[3];
      c.beginPath();
      c.moveTo(box[0], y);
      c.lineTo(box[0] + box[2], y);
      c.stroke();
    }
  } else if (body === "iron") {
    const [x, y] = slot === "head" ? [0, -0.93] : [-0.91, 0.05];
    c.fillStyle = "#202936";
    c.strokeStyle = "#8898a7";
    c.lineWidth = 0.025;
    c.fillRect(x - 0.28, y - 0.12, 0.56, 0.24);
    c.strokeRect(x - 0.28, y - 0.12, 0.56, 0.24);
    for (const dx of [-0.2, 0.2]) {
      c.fillStyle = "#e8be66";
      c.beginPath();
      c.arc(x + dx, y, 0.035, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}
function drawCoreChamber(c, eq, t, palette, pose2) {
  if (eq.core === "standard" && eq.body !== "hologram") return;
  const energy = evolutionIntensity(pose2?.combo, pose2?.overdrive);
  c.save();
  const performance=pose2?.performance||resolveCharacterPerformance(pose2||{},t),charge=performance.charge;
  const construction=resolveBodyConstruction(eq.body),material=construction.shadow;
  c.translate(.36,.64);c.scale(.82,.82);
  const cavity=construction.cavity;
  panel(c,cavity,"#080b13",0);
  seam(c,[cavity[0],cavity[1],cavity[2]],"#05070d",.07);
  const bottom=cavity.filter(point=>point[1]>.10);
  if(bottom.length>1)seam(c,bottom,construction.light,.045);
  c.save();path(c,cavity);c.clip();
  // The cut has a visible wall even with all internal emission disabled.
  panel(c,[[-.48,-.31],[.44,-.31],[.39,-.15],[-.30,-.10],[-.29,.29],[-.48,.29]],material,0);
  panel(c,[[.30,-.20],[.48,-.25],[.48,.30],[.22,.30]],"#101723",0);
  c.save();c.globalAlpha*=Math.max(0,Math.min(1,pose2?.emission??1));
  c.fillStyle=palette.primary+"24";c.beginPath();c.ellipse(0,.01,.36,.22,0,0,Math.PI*2);c.fill();
  const breathe=1+Math.sin(t*.035)*.018-performance.coreCompression;
  c.save();c.scale(.72*breathe,.59*breathe);
  if(eq.core==="grav")c.rotate(performance.idleClock*.018+performance.release*.4);
  else if(eq.core==="time")c.rotate(Math.floor(t/28)*Math.PI/12+performance.release*.2);
  else if(eq.core==="echo")c.rotate(.25+performance.recovery*.7+Math.sin(t*.025)*.04);
  else if(eq.core==="glass")c.rotate(.12+Math.sin(t*.018)*.035);
  c.strokeStyle = palette.primary;
  c.fillStyle = palette.primary;
  c.lineWidth = 0.048;
  if (eq.core === "grav") {
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      for (let i = 0; i < 24; i++) {
        const u = i / 23, a = u * 4 + j * Math.PI * 2 / 3, r = 0.04 + u * 0.29;
        c[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
      }
      c.stroke();
    }
  } else if (eq.core === "magnet") {
    for (const [s, color] of [[-1, palette.primary], [1, palette.secondary]]) {
      c.strokeStyle = color;
      c.lineWidth = 0.11;
      c.beginPath();
      c.moveTo(s * 0.22, -0.25);
      c.lineTo(s * 0.22, 0.1);
      c.lineTo(0, 0.24);
      c.stroke();
    }
    circle(c,Math.sin(t*.035)*.10,.02+performance.release*.08,.032,palette.light);
  } else if (eq.core === "riot") {
    c.scale(1+performance.release*.24,1-performance.charge*.20);
    c.beginPath();
    c.moveTo(0.1, -0.34);
    c.lineTo(-0.23, 0.05);
    c.lineTo(0.01, 0.02);
    c.lineTo(-0.12, 0.34);
    c.lineTo(0.26, -0.08);
    c.lineTo(0.03, -0.04);
    c.fill();
  } else if (eq.core === "time") {
    c.rotate(Math.PI / 4);
    c.fillStyle = "#163c55";
    c.strokeRect(-0.23, -0.23, 0.46, 0.46);
    c.fillRect(-0.23, -0.23, 0.46, 0.46);
    c.fillStyle = palette.light;
    c.beginPath();
    c.moveTo(-0.19, -0.19);
    c.lineTo(0.19, 0.19);
    c.lineTo(-0.19, 0.19);
    c.lineTo(0.19, -0.19);
    c.closePath();
    c.fill();
  } else if (eq.core === "glass") {
    c.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, r = i % 2 ? 0.12 : 0.37;
      c[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
    }
    c.fill();
    c.strokeStyle = palette.secondary;
    c.stroke();
  } else {
    c.beginPath();
    c.ellipse(0, 0, 0.3, 0.19, 0.4, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = palette.light;
  c.beginPath();
  c.arc(0, 0, 0.055, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.restore();
  // Recess shadow and fixed ribs occlude the moving energy, giving depth.
  panel(c,[[-.43,-.22],[.39,-.22],[.39,-.14],[-.43,-.10]],"#070815aa",0);
  if(construction.kind==="plate")seam(c,[[-.14,-.25],[-.14,-.07]],material,.07);
  c.restore();
  c.restore();
}

// consolidated/hybrids.js
var hybrids_exports = {};
__export(hybrids_exports, {
  HYBRIDS: () => HYBRIDS,
  MUTATIONS: () => MUTATIONS,
  SPARKS: () => SPARKS2,
  activeHybrid: () => activeHybrid,
  activeSparks: () => activeSparks,
  collectionBadges: () => collectionBadges,
  drawHybridAura: () => drawHybridAura,
  drawSparkMutation: () => drawSparkMutation,
  hybridHint: () => hybridHint,
  hybridMatches: () => hybridMatches,
  mutationMatches: () => mutationMatches,
  mutationTitle: () => mutationTitle
});
var HYBRIDS = Object.freeze([
  { id: "wyrm", title: "LASER WYRM", parts: { head: "viper", body: "prism", slash: "laser" }, color: "#a6ddff" },
  { id: "ronin", title: "INK RONIN", parts: { head: "samurai", body: "paper", slash: "katana", world: "manga" }, color: "#c2afda" },
  { id: "king", title: "VOID KING", parts: { head: "crown", core: "grav", tail: "anchor" }, color: "#ddbd72" },
  { id: "phantom", title: "CYBER PHANTOM", parts: { eyes: "visor", body: "hologram", tail: "ghost" }, color: "#84eaff" },
  { id: "reaper", title: "MECHA REAPER", parts: { head: "oni", body: "iron", tail: "viper-tails" }, color: "#ff7597" },
  { id: "eater", title: "STAR EATER", parts: { eyes: "hypno", core: "grav", tail: "wings" }, color: "#c6a0ff" },
  { id: "sun", title: "APEX SUN", parts: { head: "halo", body: "gold", slash: "confetti" }, color: "#ffe48a" },
  {id:"glacier",title:"GLACIER CROWN",parts:{body:"chamfer",core:"time",head:"halo",slash:"laser"},color:"#a0f2ff"},
  {id:"briar",title:"SPECTRAL BRIAR",parts:{body:"notched",eyes:"hypno",tail:"spectrum"},color:"#e2a1ff"},
  {id:"sentinel",title:"ARC SENTINEL",parts:{body:"segmented",core:"magnet",head:"coil"},color:"#8bffe1"},
  {id:"arcade",title:"ARCADE SOVEREIGN",parts:{core:"echo",slash:"pixel",eyes:"visor",world:"synth"},color:"#ffb0eb"},
  {id:"storm",title:"STORM CONDUCTOR",parts:{head:"coil",body:"chamfer",core:"echo",slash:"laser"},color:"#a0e6ff"},
  {id:"forge",title:"FURNACE REGENT",parts:{head:"crown",body:"lava",core:"riot",tail:"anchor"},color:"#ffb18c"},
  {id:"wraith",title:"CHRONO WRAITH",parts:{head:"neko",body:"hologram",core:"time",tail:"ghost"},color:"#b5ebff"},
  {id:"bulwark",title:"RESCUE PALADIN",parts:{head:"beacon",body:"iron",core:"magnet",tail:"wings"},color:"#b0e6bd"},
  {id:"razoredge",title:"GLASS SHOGUN",parts:{head:"samurai",body:"notched",core:"glass",slash:"katana"},color:"#f4b3c9"},
  {id:"orbit",title:"PRISM ORACLE",parts:{head:"halo",body:"prism",core:"grav",tail:"spectrum"},color:"#c6b3ff"}
].map((x) => Object.freeze({ ...x, parts: Object.freeze(x.parts) })));
function hybridMatches(eq = {}) {
  return HYBRIDS.map((recipe) => {
    const entries = Object.entries(recipe.parts), matched = entries.filter(([slot, id]) => eq[slot] === id).length;
    return { ...recipe, matched, total: entries.length, complete: matched === entries.length };
  });
}
function activeHybrid(eq) {
  return hybridMatches(eq).find((x) => x.complete) || null;
}
function hybridHint(eq) {
  const matches = hybridMatches(eq), active = matches.find((x) => x.complete);
  if (active) return active.title;
  const near = matches.filter((x) => x.matched >= 2).sort((a, b) => b.matched / b.total - a.matched / a.total)[0];
  return near ? `??? / ${near.matched} OF ${near.total} PARTS` : "HYBRID / MIX A RECIPE";
}
function collectionBadges(items, owned) {
  return [...new Set(items.map((x) => x.slot))].filter((slot) => items.filter((x) => x.slot === slot).every((x) => owned.includes(x.id)));
}
/** One hierarchy for every surface. radius is the logical body half-width;
 * small surfaces retain primary shapes but omit ornamental tertiary detail.
 * Recipe data and gameplay matching are never changed by this descriptor.
 */
function resolveArtDirection(eq={},radius=23,pose={}) {
  const h=resolveVisualHarmony(eq,0,pose),family=activeHybrid(eq)?.id||null;
  const performance=pose.performance||resolveCharacterPerformance(pose,0);
  const detail=radius<29?0:radius<49?1:2;
  return Object.freeze({family,detail,energy:h.primary,light:h.light,
    accent:family?blend(h.primary,activeHybrid(eq).color,.22):h.trim,
    shadow:resolveBodyConstruction(eq.body).shadow,activity:performance.release,
    // One bounded selected rim, never a complete glowing outline.
    rim:blend(resolveBodyConstruction(eq.body).light,h.rim,.20)});
}
function drawHybridAura(c,eq,t=0,pose=null) {
  const d=resolveArtDirection(eq,pose?.artRadius??45,pose||{}),id=d.family;
  if(!id)return;
  c.save();c.lineJoin="miter";
  // Rear structural layer: all forms have roots; no orbiting badges or rings.
  if(["storm","forge","wraith","bulwark","razoredge","orbit"].includes(id)){
    const forms={
      storm:[[-.83,-.69],[-1.18,-1.22],[-1.37,-1.02],[-1.22,-.36],[-.91,-.12]],
      forge:[[-.87,-.10],[-1.43,-.46],[-1.37,.55],[-1.01,.87]],
      wraith:[[-.88,.19],[-1.24,-.15],[-1.57,.49],[-1.26,.77],[-.88,.63]],
      bulwark:[[-.88,-.36],[-1.39,-.17],[-1.47,.61],[-1.09,1.02],[-.86,.67]],
      razoredge:[[-.88,-.48],[-1.14,-.76],[-1.47,-.61],[-1.22,-.18],[-1.40,.12],[-.92,.45]],
      orbit:[[-.87,-.39],[-1.22,-.74],[-1.52,-.33],[-1.20,.41],[-.88,.55]]
    };
    for(const side of [-1,1]){
      const shape=forms[id].map(([x,y])=>[x*side,y]);
      panel(c,shape,d.shadow,.065);
      seam(c,[[side*-.99,.20],[side*-1.17,.03],[side*-1.16,-.29]],d.accent,.038);
      if(d.detail)panel(c,[[side*-1.17,-.27],[side*-1.28,-.16],[side*-1.18,.04],[side*-1.06,-.06]],d.energy,0);
    }
  }
  if(id==="glacier"){
    for(const [x,tip]of [[-.62,-1.91],[0,-2.13],[.57,-1.86]]){
      panel(c,[[x-.20,-1.13],[x-.12,tip+.22],[x,tip],[x+.18,-1.17]],"#345772",.055);
      panel(c,[[x,-1.17],[x,tip],[x+.12,-1.24]],"#b6dfe5",0);
    }
    for(const side of [-1,1])panel(c,[[side*.84,-.58],[side*1.24,-.78],[side*1.16,.21],[side*.91,.41]],"#4a697e",.07);
  }else if(id==="briar"){
    c.strokeStyle="#1a1523";c.lineWidth=.15;c.beginPath();c.moveTo(-.83,.68);c.bezierCurveTo(-1.37,.40,-1.24,-.70,-.88,-1.1);c.stroke();
    c.strokeStyle=d.shadow;c.lineWidth=.075;c.stroke();
    for(const [x,y,scale]of [[-1.08,-.74,1],[-1.22,-.17,.8],[-1.10,.42,.63]])panel(c,[[x,y+.13],[x-.37*scale,y-.15],[x-.12,y-.19],[x+.03,y-.08]],d.accent,.045);
    panel(c,[[.84,.40],[1.16,.23],[1.08,.70],[.91,.85]],d.shadow,.055);
  }else if(id==="sentinel"){
    // Two broad shield segments seated on a spine, rather than six satellites.
    panel(c,[[-1.03,-.69],[-1.48,-.48],[-1.43,.61],[-1.07,.87],[-.87,.62],[-.88,-.48]],"#253c3b",.09);
    panel(c,[[-1.39,-.40],[-1.15,-.52],[-1.06,.03],[-1.33,.12]],"#71978e",0);
    panel(c,[[-1.33,.20],[-1.05,.12],[-1.01,.63],[-1.26,.65]],"#4a6c64",0);
    seam(c,[[-1.33,.14],[-1.05,.07]],d.energy,.035);
    panel(c,[[.9,-.38],[1.15,-.26],[1.13,.59],[.93,.70]],"#354e47",.055);
  }else if(id==="arcade"){
    panel(c,[[-1.02,-.73],[-1.25,-.73],[-1.25,-.41],[-1.43,-.41],[-1.43,.31],[-1.18,.31],[-1.18,.78],[-.91,.78]],"#29223c",.07);
    for(let i=0;i<(d.detail?3:2);i++){c.fillStyle=i%2?d.accent:"#665177";c.fillRect(-1.32+i*.14,-.20+i*.24,.13,.13);}
  }else if(id==="reaper"){
    for(const side of [-1,1]){
      panel(c,[[side*.88,.49],[side*1.35,.27],[side*1.47,-.45],[side*1.29,-.86],[side*1.13,-.46],[side*.90,-.21]],"#343843",.085);
      panel(c,[[side*1.20,-.06],[side*1.34,-.36],[side*1.29,-.86],[side*1.48,-.48],[side*1.46,.06]],"#b0a4b2",0);
      seam(c,[[side*1.01,.29],[side*1.24,.17],[side*1.30,-.12]],d.accent,.032);
    }
  }else if(id==="wyrm"){
    const spine=[[-.91,-.49],[-1.52,-.48],[-2.20,-.62],[-2.88,-.53]];
    seam(c,spine,"#171321",.12);
    for(const [x,y,height]of [[-1.25,-.49,.40],[-1.68,-.53,.31],[-2.10,-.57,.23]])panel(c,[[x+.12,y],[x-.04,y-height],[x-.25,y]],d.accent,.045);
  }else if(id==="eater"){
    // Wing-root crescent: one carved support follows the existing feather fan.
    panel(c,[[-.91,-.30],[-1.36,-.67],[-1.61,-.22],[-1.36,.38],[-.91,.46]],"#332443",.075);
    seam(c,[[-1.28,-.43],[-1.44,-.15],[-1.23,.23]],d.accent,.045);
  }else if(id==="ronin"){
    panel(c,[[-.87,-.10],[-1.43,-.20],[-1.85,.06],[-1.43,.23],[-1.13,.52],[-.87,.28]],"#2b2530",.075);
    seam(c,[[-1.01,.11],[-1.43,.07],[-1.72,.08]],"#ad9f94",.035);
  }else if(id==="king"){
    panel(c,[[-.89,.43],[-1.20,.54],[-1.09,.99],[-.70,.86]],"#423447",.065);
    seam(c,[[-1.02,.57],[-.92,.85]],"#baa273",.065);
  }else if(id==="sun"){
    // Three rays grow from the Halo's rear crown, not a second luminous ring.
    for(const [x,tip]of [[-.61,-1.70],[0,-1.94],[.59,-1.69]])panel(c,[[x-.12,-1.21],[x,tip],[x+.14,-1.23]],"#c79c4c",.045);
  }else if(id==="phantom"&&d.activity>.05){
    c.globalAlpha=d.activity*.16;seam(c,[[-1.12,-.91],[-1.23,.77],[-.91,.94]],d.accent,.055);
  }
  c.restore();
}
function drawHybridIntegration(c,eq,t,p) {
  const d=resolveArtDirection(eq,p.artRadius??45,p);if(!d.family)return;
  c.save();
  if(d.family==="glacier"){
    // Crest struts overlap Halo: the crystals now physically grow from its mount.
    for(const [x,tip]of [[-.47,-1.66],[0,-1.92],[.47,-1.66]]){
      panel(c,[[x-.14,-1.01],[x-.10,tip+.15],[x,tip],[x+.16,-1.01]],"#3c6077",.045);
      panel(c,[[x,-1.03],[x,tip],[x+.10,-1.07]],"#b4dce3",0);
    }
  }
  path(c,SHAPE_MODIFIERS.find(x=>x.id===eq.body)?.outline||HERO_SHELL);c.clip();
  // Front layer modifies shell planes, never crosses eye cuts or CORE machinery.
  if(["storm","forge","wraith","bulwark","razoredge","orbit"].includes(d.family)){
    for(const side of [-1,1]){
      panel(c,[[side*.80,.35],[side*.96,.23],[side*.96,.78],[side*.77,.88]],d.shadow,0);
      seam(c,[[side*.89,.40],[side*.89,.68],[side*.73,.78]],d.energy,.032);
    }
  }
  if(d.family==="glacier"){
    for(const side of [-1,1])panel(c,[[side*.76,-.94],[side*.98,-.75],[side*.90,-.56],[side*.71,-.75]],"#a6d4dd",0);
  }else if(d.family==="briar"){
    seam(c,[[-.92,.24],[-.76,.38],[-.88,.61],[-.76,.85]],d.shadow,.075);
    if(d.detail)panel(c,[[-.83,.54],[-.61,.40],[-.74,.68]],d.accent,0);
  }else if(d.family==="sentinel"){
    panel(c,[[-.95,.30],[-.66,.25],[-.66,.83],[-.95,.94]],"#2c4940",0);
    seam(c,[[-.90,.36],[-.73,.33],[-.73,.57]],d.energy,.03);
  }else if(d.family==="arcade"){
    const px=.11;c.fillStyle=d.accent;for(const [x,y]of [[.79,-.69],[.79,-.58],[.68,-.58],[-.70,.72],[-.59,.72]])c.fillRect(x,y,px,px);
  }else if(d.family==="phantom"){
    panel(c,[[.70,-.72],[.97,-.83],[.97,.94],[.71,.76]],"#65bec726",0);
    seam(c,[[.83,.32],[.83,.72],[.65,.79]],d.accent,.035);
  }else if(d.family==="reaper"){
    for(const side of [-1,1])panel(c,[[side*.93,.31],[side*.70,.39],[side*.70,.72],[side*.94,.84]],"#64636e",0);
  }else if(d.family==="ronin"){
    panel(c,[[-.74,.33],[.92,.29],[.92,.46],[-.74,.51]],"#382c34",0);
    if(d.detail)seam(c,[[-.60,.43],[.76,.37]],"#ac998e",.025);
  }else if(d.family==="king"){
    panel(c,[[-.69,.35],[.08,.39],[.22,.53],[.08,.67],[-.70,.59]],"#423047",0);
    seam(c,[[-.63,.42],[-.20,.46]],"#baa273",.035);
  }else if(d.family==="sun"){
    panel(c,[[-.70,-.70],[.86,-.77],[.78,-.57],[-.61,-.55]],"#e9c56b",0);
  }else if(d.family==="eater"){
    if(d.detail)for(const [x,y]of [[-.69,.36],[-.53,.51],[-.68,.70]])circle(c,x,y,.026,d.light);
  }else if(d.family==="wyrm"){
    panel(c,[[-.73,.33],[-.50,.28],[-.40,.42],[-.61,.56]],d.shadow,0);
    seam(c,[[-.68,.38],[-.52,.35]],d.accent,.03);
  }
  c.restore();
}
var SPARKS2 = Object.freeze([
  { id: "chrono", title: "CHRONO RING", parts: { head: "halo", core: "time" }, color: "#a8efff" },
  { id: "jet", title: "JET VIPER", parts: { head: "viper", tail: "thrusters" }, color: "#ff728a" },
  { id: "angel", title: "ARC ANGEL", parts: { tail: "wings", core: "magnet" }, color: "#98efff" },
  { id: "flail", title: "MAGMA FLAIL", parts: { body: "lava", tail: "anchor" }, color: "#ffb079" },
  { id: "corrupt", title: "CORRUPT.EXE", parts: { body: "hologram", slash: "glitch-fx" }, color: "#8ff3ff" },
  { id: "tyrant", title: "TYRANT NOVA", parts: { head: "crown", core: "glass" }, color: "#ff829e" },
  {id:"cryolens",title:"CRYO LENS",parts:{body:"chamfer",core:"time"},color:"#b0f4ff"},
  {id:"razorleaf",title:"RAZOR LEAF",parts:{body:"notched",tail:"spectrum"},color:"#d9a7ff"},
  {id:"relay",title:"ARC RELAY",parts:{body:"segmented",core:"magnet"},color:"#9affe0"},
  {id:"afterimage",title:"PIXEL ECHO",parts:{core:"echo",slash:"pixel"},color:"#ffbaec"},
  {id:"stormlink",title:"STORM RELAY",parts:{head:"coil",core:"echo"},color:"#a0e6ff"},
  {id:"furnace",title:"FURNACE HEART",parts:{body:"lava",core:"riot"},color:"#ffb18c"},
  {id:"blink",title:"CHRONO CAT",parts:{head:"neko",core:"time"},color:"#b5ebff"},
  {id:"guardlink",title:"MAGNET GUARD",parts:{body:"iron",core:"magnet"},color:"#b0e6bd"},
  {id:"glassedge",title:"GLASS EDGE",parts:{body:"notched",core:"glass"},color:"#f4b3c9"},
  {id:"riftlens",title:"RIFT LENS",parts:{body:"prism",core:"grav"},color:"#c6b3ff"},
  {id:"lifeline",title:"SKY SIGNAL",parts:{head:"beacon",tail:"wings"},color:"#d6ed98"},
  {id:"darklink",title:"NIGHT SIGNAL",parts:{body:"obsidian",slash:"glitch-fx"},color:"#afb6ff"}
].map((x) => Object.freeze({ ...x, parts: Object.freeze(x.parts) })));
var MUTATIONS = Object.freeze([...SPARKS2, ...HYBRIDS]);
function mutationMatches(eq = {}) {
  return MUTATIONS.map((h) => {
    const total = Object.keys(h.parts).length, matched = Object.entries(h.parts).filter(([slot, id]) => eq[slot] === id).length;
    return { ...h, matched, total, complete: total === matched, layer: SPARKS2.includes(h) ? "SPARK" : "APEX" };
  });
}
function activeSparks(eq) {
  return mutationMatches(eq).filter((x) => x.layer === "SPARK" && x.complete);
}
function mutationTitle(eq) {
  return activeHybrid(eq)?.title || activeSparks(eq).map((x) => x.title).join(" + ") || hybridHint(eq);
}
function drawSparkMutation(c,eq,t,layer="front",pose=null) {
  if(layer!=="front")return;
  const sparks=activeSparks(eq);if(!sparks.length)return;
  const d=resolveArtDirection(eq,pose?.artRadius??45,pose||{});
  c.save();
  for(const h of sparks){
    const newSpark=["stormlink","furnace","blink","guardlink","glassedge","riftlens","lifeline","darklink"].indexOf(h.id);
    if(newSpark>=0){
      const side=newSpark%2?-1:1,y=.56+(newSpark%3)*.08;
      seam(c,[[side*.89,y-.13],[side*.76,y],[side*.58,y]],d.energy,.035);
      if(d.detail){c.fillStyle=d.accent;c.fillRect(side*.67-.035,y-.035,.07,.07);}
    }
    if(h.id==="chrono"){
      seam(c,[[-.63,-1.33],[-.31,-1.20],[.36,-1.20],[.69,-1.34]],d.accent,.04);
    }else if(h.id==="jet"){
      for(const side of [-1,1])seam(c,[[side*.56,-1.17],[side*.77,-1.53]],d.accent,.05);
    }else if(h.id==="angel"){
      seam(c,[[-1.04,-.13],[-1.55,-.47],[-2.04,-.75]],d.accent,.04);
      if(d.detail)seam(c,[[-1.12,.12],[-1.59,.40],[-1.99,.70]],d.shadow,.06);
    }else if(h.id==="flail"){
      panel(c,[[-2.48,.72],[-2.24,.67],[-2.08,.87],[-2.26,1.02],[-2.46,.92]],"#633b32",.04);
      seam(c,[[-2.42,.78],[-2.27,.86],[-2.34,.96]],d.energy,.05);
    }else if(h.id==="corrupt"){
      const y=.78;c.fillStyle=d.accent;c.fillRect(.61,y,.21,.035);if(d.detail)c.fillRect(.70,y-.09,.12,.035);
    }else if(h.id==="tyrant"){
      panel(c,[[-.05,-1.49],[.11,-1.30],[-.05,-1.12],[-.21,-1.30]],"#f6dbe0",.035);
    }else if(h.id==="cryolens"){
      for(const side of [-1,1])seam(c,[[side*.74,.80],[side*.88,.70],[side*.88,.54]],d.accent,.035);
    }else if(h.id==="razorleaf"){
      panel(c,[[-1.04,-.50],[-1.49,-.70],[-1.32,-.39]],d.accent,.045);
    }else if(h.id==="relay"){
      seam(c,[[-.87,.73],[-.87,.43],[-.71,.37]],d.energy,.035);
    }else if(h.id==="afterimage"){
      c.fillStyle=d.accent;for(let i=0;i<(d.detail?3:2);i++)c.fillRect(-.69+i*.12,.76,.07,.07);
    }
  }
  c.restore();
}

// consolidated/equipment-details-art.js
var equipment_details_art_exports = {};
__export(equipment_details_art_exports, {
  extraCore: () => extraCore,
  extraEyes: () => extraEyes,
  extraHead: () => extraHead,
  extraTail: () => extraTail,
  shellDetails: () => shellDetails,
  shellMaterial: () => shellMaterial
});
var TAU3 = Math.PI * 2;
function poly(c, p, fill, edge = null, w = 0.035) {
  c.beginPath();
  for (let i = 0; i < p.length; i++) c[i ? "lineTo" : "moveTo"](...p[i]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = w;
    c.stroke();
  }
}
function stroke(c, p, color, w = 0.035) {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  p.forEach((q, i) => c[i ? "lineTo" : "moveTo"](...q));
  c.stroke();
}
function orb(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, TAU3);
  c.fill();
}
function metal(c, colors) {
  const g = c.createLinearGradient(-1, -1, 1, 1);
  const light = colors[0], shadow = colors[1];
  g.addColorStop(0, light);
  g.addColorStop(0.43, light);
  g.addColorStop(0.431, shadow);
  g.addColorStop(1, shadow);
  return g;
}
function shellMaterial(c, id) {
  if (id === "prism") return metal(c, ["#c3a5ff", "#57348e", "#a37af1", "#392857"]);
  if (id === "iron") return metal(c, ["#7a8291", "#273341", "#444b58", "#161e2b"]);
  if (id === "lava") return "#24212b";
  if (id === "gold") return metal(c, ["#fff3b0", "#ae6b1e", "#f9d564", "#fff4b2", "#916022"]);
  return null;
}
function shellDetails(c, id, t, pose2) {
  if (id === "prism") {
    poly(c, [[-0.95, -0.95], [0.6, -0.95], [-0.55, 0.35]], "#e3cdff55");
    poly(c, [[0.6, -0.95], [0.95, -0.9], [0.95, 0.85], [-0.55, 0.35]], "#5b37a866");
    stroke(c, [[-0.95, 0.7], [-0.55, 0.35], [0.6, -0.95]], "#e9dbff77");
    stroke(c, [[-0.55, 0.35], [0.85, 0.94]], "#b992ff");
    orb(c, 0.71, 0.55, 0.05, "#f6edff");
  }
  if (id === "iron") {
    for (const [x, y] of [[-0.84, -0.84], [0.84, -0.84], [-0.84, 0.84], [0.84, 0.84]]) {
      c.fillStyle = "#dfb54d";
      c.fillRect(x - 0.13, y - 0.13, 0.26, 0.26);
      orb(c, x, y, 0.035, "#2b2630");
    }
    stroke(c, [[-0.7, 0.7], [0.7, 0.7]], "#8e9fa7", 0.025);
  }
  if (id === "lava") {
    const heat = Math.min(1, (pose2?.combo || 0) / 8);
    c.save();
    c.globalAlpha = 0.45 + heat * 0.55;
    stroke(c, [[-0.72, -1], [-0.51, -0.66], [-0.65, -0.3], [-0.26, 0.3], [-0.49, 0.65], [-0.31, 1]], pose2?.palette?.primary || "#ff612f", 0.075);
    stroke(c, [[0.78, -0.95], [0.6, -0.5], [0.78, 0.05], [0.43, 0.45], [0.7, 1]], pose2?.palette?.secondary || "#ffb94b", 0.055);
    stroke(c, [[-0.26, 0.3], [0.11, 0.5], [0.43, 0.45]], "#ffd28a", 0.03);
    c.restore();
  }
  if (id === "gold") {
    poly(c, [[-0.9, -0.92], [-0.5, -0.92], [0.55, 0.92], [0.17, 0.92]], "#fff9cf44");
    stroke(c, [[-0.84, 0.87], [0.84, 0.87], [0.84, 0.35]], "#fff0b0", 0.03);
    if ((pose2?.speed || 0) < 2) {
      const a = 0.07 + 0.04 * Math.sin(t * 0.045);
      stroke(c, [[0.72 - a, 0.65], [0.72 + a, 0.65]], "#fff", 0.035);
      stroke(c, [[0.72, 0.65 - a * 2], [0.72, 0.65 + a * 2]], "#fff", 0.035);
    }
  }
}
function extraTail(c, id, t, pose2) {
  if (id === "anchor") {
    const lag=pose2?.performance?.tailLag||0;
    for (let i = 0; i < 8; i++) {
      c.save();
      c.translate(-1.05 - i * 0.16, 0.25 + Math.sin(t * .018 - i * .24) * (.012+i*.004)+lag*i*.045 + i * 0.07);
      c.rotate((i % 2 ? 0.6 : -0.5) + Math.sin(t * .018-i*.24)*.035+lag*.25);
      c.strokeStyle = i % 2 ? "#d1cad5" : "#817b96";
      c.lineWidth = 0.065;
      c.beginPath();
      c.ellipse(0, 0, 0.17, 0.09, 0, 0, TAU3);
      c.stroke();
      c.restore();
    }
    poly(c, [[-2.15, 0.55], [-2.5, 0.62], [-2.52, 1.02], [-2.2, 1.13], [-1.98, 0.9]], metal(c, ["#aeb3c0", "#33313f"]), "#d8cfee", 0.04);
    for (const [x, y] of [[-2.5, 0.65], [-2.2, 1.1], [-2.05, 0.8]]) poly(c, [[x, y], [x - 0.17, y + 0.19], [x + 0.08, y + 0.12]], "#a3a0b4");
    return true;
  }
  if (id === "thrusters") {
    for (const y of [-0.5, 0.48]) {
      poly(c, [[-0.8, y - 0.2], [-1.35, y - 0.17], [-1.42, y + 0.15], [-0.8, y + 0.2]], "#6d6c7a", "#c6c8cc");
      const flame=.16+(pose2?.lift||0)*.18+(pose2?.performance?.release||0)*.42+Math.sin(t*.18+y)*.025;
      poly(c, [[-1.4, y - 0.13], [-1.4 - flame, y + 0.03], [-1.4, y + 0.14]], pose2?.palette?.secondary || "#ff7d35");
      poly(c, [[-1.4, y - 0.07], [-1.4 - flame * 0.6, y + 0.02], [-1.4, y + 0.07]], pose2?.palette?.light || "#fff0a7");
    }
    return true;
  }
  if (id === "viper-tails" || id === "spectrum") {
    const count = id === "spectrum" ? 1 : 2;
    for (let tail = 0; tail < count; tail++) {
      const points = [];
      for (let i = 0; i < 12; i++) {
        const u = i / 11;
        points.push([-1 - u * 2, -0.55 + tail * 0.45 + Math.sin(u*4+t*.025+tail*2)*u*.09+(pose2?.performance?.tailLag||0)*u*u]);
      }
      for (let i = 1; i < points.length; i++) {
        const color = id === "spectrum" ? `hsl(${(i * 24 + t * (0.4 + (pose2?.speed || 0) * 0.02)) % 360} 95% 70%)` : tail ? "#b62c58" : "#ff6c80";
        stroke(c, [points[i - 1], points[i]], color, 0.26 * (1 - i / 14));
      }
      if (id === "viper-tails") {
        const end = points.at(-1);
        stroke(c, [end, [end[0] - 0.22, end[1] - 0.12]], "#ffafbd", 0.03);
        stroke(c, [end, [end[0] - 0.22, end[1] + 0.12]], "#ffafbd", 0.03);
      }
    }
    return true;
  }
  return false;
}
function extraCore(c, id, t) {
  if (!["grav", "magnet", "echo"].includes(id)) return;
  c.save();
  c.translate(0, 0.59);
  if (id === "grav") {
    orb(c, 0, 0, 0.34, "#281840");
    c.strokeStyle = "#d49dff";
    c.lineWidth = 0.035;
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      for (let i = 0; i < 28; i++) {
        const u = i / 27, a = u * 4 + j * TAU3 / 3 + t * 0.04, r = 0.04 + u * 0.28;
        c[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
      }
      c.stroke();
    }
    orb(c, 0, 0, 0.06, "#fff1ff");
  } else if (id === "magnet") {
    c.rotate(Math.sin(t * 0.03) * 0.15);
    stroke(c, [[-0.24, -0.21], [-0.24, 0.12], [-0.12, 0.25], [0.12, 0.25], [0.24, 0.12], [0.24, -0.21]], "#8bdfff", 0.12);
    stroke(c, [[-0.24, -0.22], [-0.24, -0.04]], "#ff5b80", 0.12);
    stroke(c, [[0.24, -0.22], [0.24, -0.04]], "#76baff", 0.12);
  } else {
    c.strokeStyle = "#ff9fdb";
    c.lineWidth = 0.055;
    c.beginPath();
    c.ellipse(0, 0, 0.29, 0.2, Math.sin(t * 0.04) * 0.4, 0, TAU3);
    c.stroke();
    orb(c, 0, 0, 0.07, "#ffe0f5");
  }
  c.restore();
}
function extraHead(c, id, t, pose2) {
  if (id === "crown") {
    poly(c, [[-0.91, -0.92], [-1.03, -1.62], [-0.49, -1.3], [0, -1.88], [0.49, -1.3], [0.97, -1.62], [0.84, -0.92]], metal(c, ["#fff0a0", "#d79c44", "#ff80c4"]), "#2b1830", 0.055);
    stroke(c, [[-0.82, -1.02], [0.76, -1.02]], "#fff0bd", 0.06);
    poly(c, [[0, -1.48], [0.14, -1.3], [0, -1.12], [-0.14, -1.3]], "#ed4aa0", "#ffbedb", 0.025);
  } else if (id === "samurai") {
    poly(c, [[-0.92, -0.94], [-0.65, -1.17], [0.65, -1.17], [0.92, -0.94]], "#302531", "#d9b65a", 0.04);
    for (const s of [-1, 1]) poly(c, [[s * 0.12, -1.04], [s * 0.45, -1.32], [s * 1.1, -1.83], [s * 0.91, -1.21], [s * 0.37, -0.96]], metal(c, ["#fff0a0", "#d4a747", "#ffe4a1"]), "#61452f", 0.035);
  } else if (id === "coil") {
    stroke(c, [[0, -1], [0, -1.78]], "#567782", 0.07);
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = pose2?.palette?.primary || "#70e9ff";
      c.lineWidth = 0.045;
      c.beginPath();
      c.ellipse(0, -1.12 - i * 0.16, 0.22, 0.075, 0, 0, TAU3);
      c.stroke();
    }
    orb(c, 0, -1.82, 0.09, "#e2ffff");
    if ((pose2?.combo || 0) > 1) stroke(c, [[-0.31, -1.6], [-0.45, -1.73], [-0.37, -1.88]], "#c8faff", 0.035);
  } else if (id === "beacon") {
    poly(c, [[-0.5, -0.96], [-0.43, -1.12], [0.43, -1.12], [0.5, -0.96]], "#5a4d4b", "#f1b55e");
    const g = c.createLinearGradient(-0.35, 0, 0.35, 0);
    g.addColorStop(0, "#bb5a29");
    g.addColorStop(0.5, "#ffdb80");
    g.addColorStop(1, "#d66a2c");
    poly(c, [[-0.35, -1.13], [-0.31, -1.55], [0.31, -1.55], [0.35, -1.13]], g, "#f3bf6e");
    orb(c, Math.sin(t * 0.08) * 0.22, -1.36, 0.055, "#fff5d2");
  }
}
function extraEyes(c, id, t, pose2) {
  if (!["glitch", "smug", "hypno", "sniper"].includes(id)) return false;
  c.save();
  c.translate((pose2?.look?.[0] || 0) * 0.065, (pose2?.look?.[1] || 0) * 0.04);
  c.translate(0, -0.13);
  c.scale(1, pose2?.blink ?? 1);
  c.translate(0, 0.13);
  if (id === "glitch") {
    const color = Math.floor(t / 18) % 2 ? "#8aeaff" : "#ff80cf";
    stroke(c, [[-0.65, -0.32], [-0.25, 0.04]], color, 0.085);
    stroke(c, [[-0.65, 0.04], [-0.25, -0.32]], color, 0.085);
    c.strokeStyle = "#9cf2ff";
    c.lineWidth = 0.06;
    c.beginPath();
    c.arc(0.53, -0.14, 0.17, 0, TAU3);
    c.stroke();
    orb(c, 0.53, -0.14, 0.05, "#ff80d6");
  } else if (id === "smug") {
    for (const x of [-0.43, 0.55]) {
      poly(c, [[x - 0.2, -0.13], [x + 0.2, -0.13], [x + 0.14, pose2?.overdrive ? 0.16 : 0.01], [x - 0.17, pose2?.overdrive ? 0.14 : 5e-3]], pose2?.overdrive ? pose2?.palette?.light || "#ffed90" : pose2?.palette?.primary || "#d9ffe0");
      stroke(c, [[x - 0.22, -0.15], [x + 0.22, -0.15]], "#657969", 0.04);
    }
  } else if (id === "sniper") {
    stroke(c, [[-0.65, -0.13], [0.72, -0.13]], "#742337", 0.04);
    orb(c, 0.08, -0.13, 0.13, "#ff4b73");
    orb(c, 0.04, -0.17, 0.045, "#fff6ec");
  } else {
    for (const x of [-0.43, 0.55]) {
      c.strokeStyle = "#d5a1ff";
      c.lineWidth = 0.037;
      c.beginPath();
      for (let i = 0; i < 40; i++) {
        const u = i / 39, a = u * TAU3 * 1.7 + t * 0.035, r = u * 0.2;
        c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * r, -0.13 + Math.sin(a) * r);
      }
      c.stroke();
    }
  }
  c.restore();
  return true;
}

// consolidated/hero-art.js
var hero_art_exports = {};
__export(hero_art_exports, {
  drawComicHero: () => drawComicHero,
  partAccent: () => partAccent
});
var BLACK = "#050408";
var CREAM = "#fff8ec";
function partAccent(eq = {}, slot = "head") {
  const id = eq[slot];
  const identity={ visor: "#65eeff", hypno: "#c08aff", glitch: "#ff5cbf", sniper: "#ff5376", blaze: "#ffbf64", viper: "#ff405b", oni: "#ff6170", neko: "#ff66cb", halo: "#ffe18a", crown: "#ffc45b", coil: "#69edff", beacon: "#ffba55", prism: "#b28aff", hologram: "#65eeff", lava: "#ff845c", gold: "#ffdf83", wings: "#bb96ff", ghost: "#86e8ff" }[id];
  return identity?blend(corePalette(eq.core).primary,identity,.30):corePalette(eq.core).primary;
}
function path(c, points) {
  c.beginPath();
  points.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](x, y));
  c.closePath();
}
function panel(c, points, fill, ink2 = 0.1) {
  path(c, points);
  c.fillStyle = fill;
  c.fill();
  if (ink2) {
    c.strokeStyle = BLACK;
    c.lineWidth = ink2;
    c.stroke();
  }
}
function seam(c, points, color, width = 0.045) {
  c.beginPath();
  points.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](x, y));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function circle(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
/** Static BODY construction in hero-radius units. Shared by face, CORE and
 * attachment roots; no clock, DOM, store or collision data. Unknown IDs use paper.
 * @param {string} body BODY catalogue ID.
 * @returns {Readonly<Object>} Deep-frozen material/cutaway descriptor.
 */
function resolveBodyConstruction(body="paper") { return BODY_CONSTRUCTION[body]||BODY_CONSTRUCTION.paper; }
const freezeConstruction=x=>{if(x&&typeof x==="object"){Object.values(x).forEach(freezeConstruction);Object.freeze(x);}return x;};
var BODY_CONSTRUCTION=freezeConstruction(Object.fromEntries([
  ["paper","fold","#fff8e8","#b39a91",[[-.46,-.25],[.23,-.24],[.43,-.04],[.26,.24],[-.38,.21]]],
  ["iron","plate","#aab7c4","#344252",[[-.43,-.25],[.28,-.25],[.43,-.10],[.43,.20],[-.43,.20]]],
  ["segmented","plate","#c2dace","#35594e",[[-.46,-.24],[.36,-.24],[.36,.03],[.18,.03],[.18,.23],[-.46,.23]]],
  ["chamfer","bevel","#e6edf4","#526f88",[[-.27,-.29],[.28,-.29],[.46,-.10],[.28,.25],[-.28,.25],[-.45,.03]]],
  ["notched","cut","#edc5d4","#79485d",[[-.45,-.25],[.34,-.25],[.34,-.03],[.21,.05],[.36,.22],[-.36,.22],[-.27,.02],[-.45,-.08]]],
  ["obsidian","facet","#7c8499","#10111c",[[-.44,-.19],[.09,-.30],[.43,-.07],[.24,.25],[-.27,.17]]],
  ["prism","facet","#e5d3ff","#624092",[[-.41,-.19],[.02,-.32],[.43,-.02],[.10,.26],[-.36,.18]]],
  ["hologram","glass","#a3e8ed","#15445b",[[-.44,-.25],[.39,-.25],[.39,.24],[-.44,.24]]],
  ["gold","bevel","#fff0b0","#9a6827",[[-.30,-.28],[.28,-.28],[.44,-.08],[.25,.25],[-.30,.25],[-.43,.02]]],
  ["lava","cut","#a17568","#1c1922",[[-.46,-.25],[-.08,-.17],[.30,-.30],[.42,-.04],[.18,.24],[-.37,.18]]]
].map(([id,kind,light,shadow,cavity])=>[id,{id,kind,light,shadow,cavity}])));
function drawConstructedFace(c,eq) {
  const d=resolveBodyConstruction(eq.body),single=["visor","sniper"].includes(eq.eyes);
  c.save();
  if(single){
    // A low continuous recess for display/reticle eyes, never a separate mask.
    const shape=d.kind==="plate"?[[-.73,-.47],[.89,-.47],[.89,.11],[-.73,.11]]:
      d.kind==="bevel"?[[-.61,-.50],[.77,-.50],[.94,-.32],[.82,.13],[-.65,.13],[-.78,-.04]]:
      [[-.77,-.43],[.13,-.36],[.96,-.51],[.88,.12],[.23,.06],[-.73,.16]];
    panel(c,shape,"#0c1019",0);
    seam(c,[shape[0],shape[1],shape[2]],d.shadow,.075);
    seam(c,[[-.65,.17],[.23,.09],[.82,.16]],d.light,.035);
  }else{
    // Two independent eye cuts leave a BODY-colored bridge and cheeks intact.
    for(const side of [-1,1]){
      const socket=d.kind==="plate"?[[.08,-.40],[.91,-.46],[.91,.17],[.10,.14]]:
        d.kind==="bevel"?[[.10,-.35],[.75,-.52],[.95,-.32],[.85,.12],[.12,.12]]:
        d.kind==="facet"?[[.08,-.36],[.92,-.53],[.85,.17],[.09,.08]]:
        [[.08,-.31],[.94,-.50],[.86,.13],[.13,.12]];
      const points=socket.map(([x,y])=>[side*x+.08,y]);
      panel(c,points,"#0b0d15",0);
      seam(c,[points[0],points[1]],d.shadow,.075);
      seam(c,[points.at(-1),points.at(-2)],d.light,.028);
    }
  }
  if(d.kind==="plate"){
    for(const side of [-1,1])panel(c,[[side*.10,-.47],[side*.89,-.56],[side*.89,-.47],[side*.15,-.36]],d.shadow,0);
  }else if(d.kind==="fold"){
    // One broad paper fold; no neon forehead stripe.
    panel(c,[[-.73,-.65],[.90,-.76],[.88,-.57],[.08,-.38],[-.72,-.51]],"#fffdf3",0);
    seam(c,[[-.70,-.51],[.08,-.38],[.86,-.57]],"#806b6d",.025);
  }else if(d.kind==="facet"){
    panel(c,[[-.72,-.65],[.16,-.40],[.83,-.69]],d.light,0);
  }else if(d.kind==="bevel"){
    seam(c,[[-.64,-.56],[.78,-.62]],d.light,.045);
  }
  c.restore();
}
// Occlusion collars share the shell construction: attachment roots disappear
// behind a lip, then re-emerge through an inset socket. Never changes physics.
function attachmentCollars(c,eq,t,p) {
  const d=resolveBodyConstruction(eq.body);
  c.save();
  if(eq.tail){
    const roots=eq.tail==="thrusters"?[-.5,.48]:[eq.tail==="anchor"?.25:eq.tail==="wings"?0:eq.tail==="spectrum"||eq.tail==="viper-tails"?-.55:-.34];
    for(const y of roots){
      // Root tucks behind the side plane: no floating socket badge or bolt.
      panel(c,[[-1.015,y-.17],[-.79,y-.12],[-.79,y+.16],[-1.015,y+.11]],d.shadow,0);
      seam(c,[[-.81,y-.12],[-.81,y+.16]],"#0b0912",.045);
      if(d.kind==="plate")panel(c,[[-1.02,y-.18],[-.91,y-.15],[-.91,y+.16],[-1.02,y+.12]],d.light,0);
    }
  }
  if(eq.head&&eq.head!=="none"){
    seam(c,[[-.72,-.925],[.68,-.925]],d.shadow,.05);
    // Horn feet disappear under the top plane, instead of two universal studs.
    if(["viper","oni"].includes(eq.head))for(const side of [-1,1]){
      panel(c,[[side*.34,-1.01],[side*.73,-1.01],[side*.68,-.92],[side*.39,-.92]],d.shadow,0);
      seam(c,[[side*.39,-.91],[side*.67,-.91]],d.light,.025);
    }
  }
  c.restore();
}
function ribbon(c, eq, t, accent, ink2, performance=resolveCharacterPerformance({},t)) {
  const wave2 = Math.sin(t * .025) * .035 + performance.tailLag, ghost = eq.tail === "ghost";
  c.save();
  if (ghost) c.globalAlpha = 0.65;
  c.beginPath();
  c.moveTo(-0.67, -0.55);
  c.bezierCurveTo(-1.25, -0.75, -1.55, -0.25, -2.76, -0.53 + wave2);
  c.lineTo(-2.31, -0.12 + wave2);
  c.bezierCurveTo(-1.65, 0.02, -1.12, -0.14, -0.8, -0.12);
  c.closePath();
  c.fillStyle = ghost ? "#82dfff" : "#29213b";
  c.fill();
  c.strokeStyle = BLACK;
  c.lineWidth = ink2;
  c.stroke();
  c.beginPath();
  c.moveTo(-0.8, -0.49);
  c.bezierCurveTo(-1.5, -0.55, -1.87, -0.22, -2.6, -0.48 + wave2);
  c.lineTo(-2.31, -0.28 + wave2);
  c.bezierCurveTo(-1.65, -0.1, -1.16, -0.3, -0.8, -0.25);
  c.closePath();
  c.fillStyle = accent;
  c.fill();
  seam(c, [[-1.15, -0.3], [-1.78, -0.25], [-2.2, -0.36 + wave2]], CREAM, 0.025);
  c.restore();
}
function wings(c, eq, t, accent, ink2, intensity) {
  const dark=eq.eyes==="hypno"&&eq.core==="grav";
  c.save();c.translate(-.84,.02);c.scale(1+intensity*.015,1+Math.sin(t*.018)*.018);
  const tips=[[-1.75,-1.5],[-2.05,-.79],[-2.08,-.06],[-1.83,.66],[-1.35,1.19]];
  for(let i=0;i<tips.length;i++){
    const [tx,ty]=tips[i],rootY=(i-2)*.075,mx=tx*.48,my=ty*.48+rootY*.5;
    const nx=-(ty-rootY)*.14,ny=tx*.14;
    const feather=[[0,rootY],[mx+nx,my+ny],[tx,ty],[mx-nx*.72,my-ny*.72]];
    panel(c,feather,dark?"#20102f":"#7152b4",ink2*.82);
    panel(c,[[0,rootY],[mx+nx,my+ny],[tx,ty]],dark?"#60468d":"#dac2ff",0);
    seam(c,[[0,rootY],[tx,ty]],accent,.025);
    if(dark)for(let j=1;j<4;j++)circle(c,tx*j/4,rootY+(ty-rootY)*j/4,.022,"#ece1ff");
  }
  panel(c,[[.05,-.27],[-.16,-.35],[-.27,-.11],[-.18,.32],[.05,.24]],"#2a233a",ink2*.7);
  circle(c,-.12,-.02,.07,accent);circle(c,-.13,-.04,.023,"#fff7ee");c.restore();
}
function head(c, id, t, palette, ink2) {
  if (id === "viper") {
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      panel(c,[[.26,-.87],[.69,-.87],[.76,-1.04],[.27,-1.06]],"#29202d",ink2*.7);
      c.beginPath();c.moveTo(.31,-1.03);c.quadraticCurveTo(.76,-1.31,1.02,-1.99);c.quadraticCurveTo(1.18,-1.37,.67,-.99);c.closePath();
      c.fillStyle="#64192e";c.fill();c.strokeStyle=BLACK;c.lineWidth=ink2;c.stroke();
      c.beginPath();c.moveTo(.35,-1.05);c.quadraticCurveTo(.73,-1.36,1.02,-1.99);c.quadraticCurveTo(.91,-1.37,.55,-1.02);c.closePath();c.fillStyle="#ff536d";c.fill();
      seam(c,[[.58,-1.13],[.85,-1.58],[1.01,-1.94]],"#ffdacb",.033);
      seam(c,[[.36,-.94],[.63,-.94]],palette.primary,.035);c.restore();
    }
  } else if (id === "oni") {
    c.beginPath();
    c.moveTo(-0.93, -0.65);
    c.quadraticCurveTo(-1.55, -1.33, -1.07, -1.96);
    c.quadraticCurveTo(-1.15, -1.48, -0.49, -1.06);
    c.closePath();
    c.fillStyle = "#a91f3e";
    c.fill();
    c.strokeStyle = BLACK;
    c.lineWidth = ink2;
    c.stroke();
    seam(c, [[-1.12, -1.67], [-1.13, -1.37], [-0.79, -1.02]], "#ff7a7e", 0.07);
  } else if (id === "neko") {
    for (const side of [-1, 1]) {
      panel(c, [[side * 0.25, -0.88], [side * 0.85, -1.73], [side * 1.09, -0.82]], "#302138", ink2);
      panel(c, [[side * 0.49, -1], [side * 0.81, -1.43], [side * 0.9, -0.96]], "#f262be", 0.04);
      seam(c,[[side*.57,-1.02],[side*.79,-1.33]],"#ffd6f2",.028);
      circle(c,side*.43,-.94,.045,palette.primary);
    }
  } else if (id === "halo") {
    c.save();
    c.translate(0, -1.44);
    c.rotate(-0.12 + Math.sin(t * 0.025) * 0.06);
    c.beginPath();
    c.ellipse(0, 0, 0.92, 0.21, 0, 0, Math.PI * 2);
    c.lineWidth = ink2 + 0.09;
    c.strokeStyle = BLACK;
    c.stroke();
    c.lineWidth = 0.105;
    c.strokeStyle = "#ffd066";
    c.stroke();
    c.lineWidth = 0.025;
    c.strokeStyle = CREAM;
    c.stroke();
    c.restore();
  } else if (id === "crown") {
    panel(c, [[-0.92, -0.82], [-1.02, -1.62], [-0.43, -1.35], [-0.07, -1.98], [0.38, -1.37], [0.94, -1.7], [0.85, -0.8]], "#bd782c", ink2);
    panel(c, [[-0.85, -1.03], [-0.89, -1.46], [-0.39, -1.22], [-0.04, -1.75], [0.35, -1.22], [0.82, -1.52], [0.72, -1.03]], "#ffe295", 0);
    panel(c,[[.0,-1.76],[.35,-1.22],[.82,-1.52],[.72,-1.03],[.02,-1.03]],"#94561e55",0);
    seam(c, [[-0.78, -0.98], [0.74, -0.98]], "#fff6d5", 0.055);
    panel(c, [[-0.03, -1.5], [0.15, -1.28], [-0.03, -1.07], [-0.2, -1.28]], "#fa328f", 0.045);
    seam(c, [[-0.03, -1.43], [0.08, -1.29]], "#ffb6dd", 0.035);
  } else if (id === "samurai") {
    panel(c, [[-1, -0.84], [-1.1, -1.23], [-0.3, -1.07], [0.1, -1.18], [0.96, -1.3], [0.87, -0.83]], "#352734", ink2);
    for (const side of [-1, 1]) panel(c, [[side * 0.15, -1], [side * 0.47, -1.39], [side * 1.29, -1.86], [side * 0.94, -1.22], [side * 0.45, -0.94]], "#ffda81", ink2 * 0.7);
  } else if (id === "coil") {
    for (const side of [-1, 1]) {
      panel(c, [[side * 0.13, -0.87], [side * 0.12, -1.75], [side * 0.37, -1.92], [side * 0.48, -1.01]], "#353343", ink2);
      panel(c, [[side * 0.22, -1.1], [side * 0.22, -1.65], [side * 0.3, -1.72], [side * 0.35, -1.1]], "#8c9caa", 0);
    }
    const y = -1.48 + Math.sin(t * 0.08) * 0.1;
    seam(c, [[-0.19, y], [-0.06, y - 0.15], [0.06, y + 0.11], [0.23, y - 0.05]], "#207caa", 0.15);
    seam(c, [[-0.19, y], [-0.06, y - 0.15], [0.06, y + 0.11], [0.23, y - 0.05]], "#b9ffff", 0.055);
  } else if (id === "beacon") {
    c.save();
    c.globalAlpha = 0.16 + Math.sin(t * 0.07) * 0.04;
    panel(c, [[-0.38, -1], [0.38, -1], [1.05, -2.03], [-1.05, -2.03]], "#ffbd68", 0);
    c.restore();
    panel(c, [[-0.68, -0.84], [-0.58, -1.28], [0.48, -1.3], [0.69, -0.89]], "#34303a", ink2);
    panel(c, [[-0.45, -1.03], [-0.4, -1.14], [0.38, -1.15], [0.45, -1.03]], "#ffbf5b", 0.035);
    seam(c, [[-0.32, -1.09], [0.29, -1.1]], "#fff4c8", 0.045);
  }
}
function eyes(c, id, t, pose2, palette) {
  const performance=pose2.performance||resolveCharacterPerformance(pose2,t),engage=performance.focus;
  const lookX=Math.max(-1,Math.min(1,pose2.look?.[0]||0));
  c.save();
  // Socket stays fixed; only the luminous eye surface tracks and compresses.
  const saccade=Math.sin(Math.floor(t/24)*2.31)*.018;
  c.translate(lookX*.055+saccade,-engage*.045);
  c.translate(0,-.14);c.scale(1+engage*.055,1-engage*.27);c.translate(0,.14);
  c.translate((pose2.look?.[0] || 0) * 0.08, (pose2.look?.[1] || 0) * 0.045);
  c.translate(0, -0.1);
  // Display hardware stays readable even during a blink; slit eyes may close.
  c.scale(1, Math.max(id==="visor"?.42:id==="sniper"?.32:.06, (pose2.blink ?? 1) * (pose2.eyes ?? 1)));
  c.translate(0, 0.1);
  if (id === "visor") {

    const g = c.createLinearGradient(0, -0.4, 0, 0.1);
    g.addColorStop(0, "#082332");
    g.addColorStop(0.6, "#12556b");
    g.addColorStop(1, "#4de9f5");
    panel(c, [[-0.7, -0.34], [0.68, -0.28], [0.6, -0.02], [-0.63, 0.02]], g, 0);
    panel(c, [[-0.58, -0.33], [-0.31, -0.32], [-0.58, -0.01], [-0.7, -0.01]], "#d7ffff", 0);
    seam(c, [[-0.13, -0.12], [0.08, -0.08], [0.43, -0.15]], "#b7ffff", 0.045);
    c.save();path(c,[[-.7,-.34],[.68,-.28],[.6,-.02],[-.63,.02]]);c.clip();
    const scan=((performance.idleClock+engage*28)*.018%2.1)-1.05;
    panel(c,[[scan,-.42],[scan+.16,-.42],[scan-.13,.1],[scan-.29,.1]],"#e0ffff77",0);c.restore();
    if(engage>.05){
      seam(c,[[-.57,-.25],[-.32,-.20]],palette.light,.04);
      seam(c,[[.31,-.20],[.56,-.25]],palette.light,.04);
    }
  } else if (id === "hypno") {
    for (const x of [-0.43, 0.47]) {
      circle(c, x, -0.13, 0.29, "#080610");
      for (const [r, col] of [[0.23, "#6936b0"], [0.175, "#d493ff"], [0.12, "#291536"], [0.065, "#a976f1"]]) {
        c.beginPath();
        c.arc(x, -0.13, r, 0, Math.PI * 2);
        c.strokeStyle = col;
        c.lineWidth = 0.045;
        c.stroke();
      }
      const spin=performance.idleClock*.045+engage*2.2+(x<0?0:Math.PI);
      seam(c,[[x+Math.cos(spin)*.09,-.13+Math.sin(spin)*.09],[x+Math.cos(spin+.5)*.21,-.13+Math.sin(spin+.5)*.21]],palette.light,.038);
      circle(c, x+lookX*.05, -.13, .045+engage*.025, "#fff");
    }
  } else if (id === "glitch") {
    for (const [x, s] of [[-0.43, -1], [0.45, 1]]) {
      for (const [dx, color] of [[-.035-Math.sin(Math.floor(t/19)*2.1)*(.008+engage*.045), "#ff40af"], [.035+Math.sin(Math.floor(t/19)*2.1)*(.008+engage*.045), "#58efff"]]) {
        seam(c, [[x - 0.22 + dx, -0.35], [x - 0.22 + dx, -0.08], [x - 0.1 + dx, 0.03]], color, 0.075);
        seam(c, [[x + 0.22 + dx, -0.29], [x + 0.22 + dx, -0.02], [x + 0.1 + dx, 0.06]], color, 0.065);
      }
      panel(c, [[x - 0.13, -0.2], [x + 0.12, -0.15], [x + 0.06, -0.045], [x - 0.12, -0.08]], "#e9ffff", 0);
    }
  } else if (id === "sniper") {
    seam(c, [[-0.73, -0.16], [0.7, -0.16]], "#6c263d", 0.045);
    circle(c, 0.08, -0.16, 0.18, "#9d2848");
    circle(c, 0.08, -0.16, 0.1, "#ff4e79");
    circle(c, .05+lookX*.12, -.2, .04, "#fff5e9");
    c.save();c.translate(.08,-.16);c.rotate(performance.idleClock*.018+engage*.65);
    for(let i=0;i<4;i++){c.rotate(Math.PI/2);seam(c,[[.21+engage*.04,0],[.29+engage*.04,0]],palette.light,.027);}c.restore();
  } else {
    const col = id === "blaze" ? "#fff1b1" : id === "smug" ? palette.light : "#faffdb";
    panel(c, [[-0.77, -0.33], [-0.16, -0.19], [-0.08, -0.02], [-0.64, -0.08]], col, 0);
    panel(c, [[0.1, -0.02], [0.2, -0.2], [0.77, -0.36], [0.65, -0.08]], col, 0);
    if (id === "smug") seam(c, [[-0.77, -0.3], [0.76, -0.3]], BLACK, 0.14);
    // Moving highlights stay inside the eye cuts, not pasted onto the shell.
    for(const side of [-1,1]){
      const x=side*.43;
      const glint=Math.sin(t*.065+side)*.055;
      seam(c,[[x-.10+glint,-.14],[x+.05+glint,-.12]],palette.primary,.026);
      if(id==="blaze"){
        const flicker=.04+(.5+.5*Math.sin(t*.12+side))* (.018+engage*.08);
        panel(c,[[x-.14,-.19],[x-.08,-.29-flicker],[x,-.22],[x+.08,-.32-flicker*.7],[x+.13,-.16]],palette.primary,0);
      }
    }
  }
  c.restore();
}
// Four cel values and a fixed screen-tone lattice. No offscreen surfaces or DOM.
var COMIC_TONE = Object.freeze(Array.from({length:72},(_,i)=>Object.freeze([
  -.78+(i%9)*.20+(Math.floor(i/9)%2)*.10, -.20+Math.floor(i/9)*.17
])));
var HERO_SHELL = Object.freeze([[-1,-1],[.9,-1],[1,-.9],[1,1],[-.93,1],[-1,.91]]);
function sculptedShell(c,eq,palette,shell,ink2) {
  // Keep the player's physical silhouette; depth is carved INSIDE that contour.
  const contour=SHAPE_MODIFIERS.find(x=>x.id===eq.body)?.outline||HERO_SHELL;
  path(c,contour);c.strokeStyle=BLACK;c.lineWidth=ink2*1.9;c.stroke();
  panel(c,contour,shell,ink2*.72);
  const id=eq.body||"paper";
  const top={paper:"#fffef5",obsidian:"#42445c",iron:"#a2adbd",prism:"#e6d0ff",gold:"#fff0a8",lava:"#51404b",hologram:"#83eaff55",chamfer:"#ecf4ff",notched:"#f5c7df",segmented:"#c9e7d8"}[id]||CREAM;
  const side={paper:"#af9895",obsidian:"#10111c",iron:"#303b4b",prism:"#6844a7",gold:"#a86c20",lava:"#18121b",hologram:"#10557788",chamfer:"#58718d",notched:"#7d465f",segmented:"#385e56"}[id]||"#66546d";
  panel(c,[[-1,-1],[.9,-1],[1,-.9],[.79,-.73],[-.77,-.73]],top,0);
  panel(c,[[-1,-1],[-.77,-.73],[-.77,.88],[-.93,1],[-1,.91]],side,0);
  c.save();path(c,[[-.77,-.73],[.99,-.9],[.99,1],[-.93,1],[-.77,.88]]);c.clip();
  panel(c,[[.55,-.73],[1,-.84],[1,1],[-.3,1]],id==="paper"?"#ddc9b9":"#09081525",0);
  panel(c,[[.94,-.3],[1,-.36],[1,1],[.1,1]],id==="paper"?"#bfa49c":"#08071355",0);
  c.fillStyle=id==="obsidian"?palette.primary+"36":"#170d292e";c.beginPath();
  for(const [x,y] of COMIC_TONE)if(id==="paper"&&x+y>1.35){c.moveTo(x+.014,y);c.arc(x,y,.014,0,Math.PI*2);}c.fill();
  c.restore();
  seam(c,[[-1,-1],[-.77,-.73],[-.77,.88]],BLACK,ink2*.6);
  seam(c,[[-.77,-.73],[.79,-.73],[1,-.9]],BLACK,ink2*.5);
  seam(c,[[-.72,-.68],[.75,-.68]],"#ffffffbb",.032);
  seam(c,[[-.72,-.65],[-.72,.77]],id==="obsidian"?"#8d9abb88":"#ffffff99",.025);
  if(id==="obsidian"&&eq.world==="void")seam(c,[[-.99,-.70],[-.99,.90],[-.92,.98],[.88,.98]],"#61616d",.035);
}
function drawComicHero(c, x, y, r, angle = 0, t = 0, face = 1, pose2 = null) {
  const raw=pose2||{},performance=resolveCharacterPerformance(raw,t),p={...raw,performance,artRadius:r}, eq = p.equipment || {}, palette = corePalette(eq.core), accent = p.accent || palette.primary, ink2 = Math.max(0.075, Math.min(.20, (p.inkPixels || 4) / Math.max(r,1))), energy = evolutionIntensity(p.combo, p.overdrive);
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(r * face, r);
  c.lineJoin = "miter";
  c.miterLimit = 2.5;
  if (p.breathe) c.scale(1 + p.breathe * 8e-3, 1 - p.breathe * 8e-3);
  if (p.field) {
    const f = p.field, g = f.grip ?? 1;
    c.scale(1 + ((f.sx ?? 1) / (1 + Math.abs(f.dipX ?? 0) * 0.5) - 1) * g, 1 + ((f.sy ?? 1) / (1 + Math.abs(f.dipY ?? 0) * 0.5) - 1) * g);
  }
  if (p.forge?.active && p.forge.slot === "body") c.scale(p.forge.scale, p.forge.scale);
  drawHybridAura(c, eq, t, p);
  c.save();
  if (eq.body === "hologram") c.globalAlpha = 0.65;
  if (eq.tail === "wings") wings(c, eq, t, accent, ink2, energy);
  else if (!extraTail(c, eq.tail, t, { ...p, palette })) ribbon(c, eq, t, accent, ink2,performance);
  c.restore();
  c.save();
  if (p.forge?.active && p.forge.slot === "head") c.scale(p.forge.scale, p.forge.scale);
  head(c, eq.head, t, palette, ink2);
  c.restore();
  c.save();
  const profile=SHAPE_MODIFIERS.find(x=>x.id===eq.body);if(profile){path(c,profile.outline);c.clip();}
  const profileFill={chamfer:"#b0c4dc",notched:"#d3a6bd",segmented:"#93b8a9"}[eq.body];
  const shell = profileFill || (eq.body === "obsidian" ? "#181821" : eq.body === "hologram" ? "#163348bb" : shellMaterial(c, eq.body) || CREAM);
  sculptedShell(c,eq,palette,shell,ink2);
  panel(c, [[-.75,.72],[.35,.81],[.96,.61],[.96,.91],[.8,.96],[-.75,.96]], eq.body === "paper" || !eq.body ? "#bca299" : "#09091266", 0);
  if(eq.body!=="iron"&&(r>=29||eq.body==="lava"))shellDetails(c, eq.body, t, { ...p, palette });
  if (p.equipment) bodyFinish(c, eq, palette, t, p);
  // Rear head silhouettes stay behind the shell. The forward mounting band
  // sits OVER its top plane, while the face remains unobscured below it.
  if(eq.head&&eq.head!=='none'&&eq.head!=='halo'){
    c.save();c.beginPath();c.rect(-2.2,-2.5,4.4,1.85);c.clip();
    if(p.forge?.active&&p.forge.slot==='head')c.scale(p.forge.scale,p.forge.scale);
    head(c,eq.head,t,palette,ink2);c.restore();
  }
  drawConstructedFace(c,eq);
  c.save();
  if (p.forge?.active && p.forge.slot === "eyes") c.scale(p.forge.scale, p.forge.scale);
  c.translate(.08,-.02);c.scale(.91,.96);
  eyes(c, eq.eyes, t, p, palette);
  c.restore();
  if (eq.core && eq.core !== "standard" || eq.body === "hologram") {
    c.save();
    if (p.forge?.active && p.forge.slot === "core") c.scale(p.forge.scale, p.forge.scale);
    drawCoreChamber(c, { ...eq, core: eq.core || "standard" }, t, palette, p);
    c.restore();
  } else {
    seam(c,[[-.53,.70],[.32,.70],[.63,.57]],resolveBodyConstruction(eq.body).shadow,.035);
  }

  if (eq.head === "oni") {
    panel(c, [[-1, -1.04], [-0.2, -1.04], [-0.14, -0.65], [-0.43, -0.43], [-0.88, -0.55], [-1.08, -0.35]], "#fff0cf", ink2 * 0.7);
    panel(c, [[-0.96, -0.95], [-0.3, -0.95], [-0.26, -0.69], [-0.46, -0.76]], "#bba49e", 0);
    seam(c, [[-0.64, -1.03], [-0.55, -0.84], [-0.68, -0.7], [-0.54, -0.52]], "#492c38", 0.055);
  }
  c.restore();
  if(p.equipment){attachmentCollars(c,eq,t,p);drawHarmonyBindings(c,eq,t,p);drawHybridIntegration(c,eq,t,p);}
  drawSparkMutation(c, eq, t, "front", p);
  drawForge(c, p.forge, palette);
  c.restore();
}

// consolidated/art.js
var art_exports = {};
__export(art_exports, {
  arc: () => arc,
  blade: () => blade,
  bladeAlpha: () => bladeAlpha,
  createJelly: () => createJelly,
  cube: () => cube,
  cutFigure: () => cutFigure,
  cutHalf: () => cutHalf,
  disk: () => disk,
  foe: () => foe,
  jelly: () => jelly,
  line: () => line,
  nick: () => nick,
  poly: () => poly2,
  shearInk: () => shearInk,
  trace: () => trace
});
function jelly(x, y, f) {
  if (!f) return [x, y];
  const g = f.grip ?? 1;
  let nx = x * (f.sx ?? 1), ny = y * (f.sy ?? 1);
  const lx = f.dipX ?? 0, ly = f.dipY ?? 0;
  const stretchX = 1 + Math.abs(lx) * 0.5, stretchY = 1 + Math.abs(ly) * 0.5;
  nx /= stretchX;
  ny /= stretchY;
  return [x + (nx - x) * g, y + (ny - y) * g];
}
function trace(c, p, field = null) {
  const a = field ? jelly(p[0][0], p[0][1], field) : p[0];
  c.moveTo(a[0], a[1]);
  for (let i = 1; i < p.length; i++) {
    const v = field ? jelly(p[i][0], p[i][1], field) : p[i];
    c.lineTo(v[0], v[1]);
  }
  c.closePath();
}
function poly2(c, color, p, edge = null, width = 0.07, field = null) {
  c.fillStyle = color;
  c.beginPath();
  trace(c, p, field);
  c.fill();
  if (edge) {
    c.lineWidth = width;
    c.strokeStyle = edge;
    c.stroke();
  }
}
function line(c, color, width, ...coords) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(coords[0], coords[1]);
  for (let i = 2; i < coords.length; i += 2) c.lineTo(coords[i], coords[i + 1]);
  c.stroke();
}
function arc(c, color, width, x, y, r, a = 0, b = TAU) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.arc(x, y, r, a, b);
  c.stroke();
}
function disk(c, color, x, y, r) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}
var K = INK.black;
var W = INK.paper;
var L = INK.acid;
function cube(c, x, y, r, angle = 0, flutter = 0, face = 1, pose2 = null) {
  drawComicHero(c, x, y, r, angle, flutter, face, pose2);
}
function blend(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round((pa >> sh & 255) * (1 - t) + (pb >> sh & 255) * t);
  return `#${(1 << 24 | ch(16) << 16 | ch(8) << 8 | ch(0)).toString(16).slice(1)}`;
}
/** The art reads only actual combat state; it never invents a target or plate. */
export function resolveEnemyMechanism(kind,opts={},angle=0){
 const t=TYPES[kind];if(!t)return null;
 const charging=opts.mode==='tell',active=!!opts.active||opts.mode==='rush';
 const progress=charging&&Number.isFinite(opts.clock)&&Number.isFinite(opts.span)&&opts.span>0?clamp(1-opts.clock/opts.span,0,1):0;
 const aim=Number.isFinite(opts.aim)?opts.aim-angle:0;
 const plates=Number.isFinite(opts.hp)?clamp(Math.floor(opts.hp),0,t.hp):t.hp;
 return {charging,active,progress,aim,plates,ports:kind==='crown'?10:kind==='prism'?1:0};
}
// The same broken gate is used in Rift's body and its real landing zone.
function drawRiftGlyph(c,col='#e0123a'){
 const dark='#1b1624',metal='#fff3df';
 poly2(c,dark,[[0,-.66],[.56,-.20],[.40,.13],[.06,.02],[-.05,.57],[-.48,.12],[-.38,-.25]]);
 poly2(c,metal,[[-.36,-.18],[-.13,-.47],[.03,-.25],[-.12,-.02]],dark,.04);
 poly2(c,metal,[[.15,.02],[.39,.20],[.13,.48],[-.02,.27]],dark,.04);
 line(c,col,.085,-.31,.35,.32,-.32);
}
function drawMonolithSignals(c,x,y,r,opts={},scale=1,time=0){
  if(!opts||!Number.isFinite(r))return;
  const lash=Math.max(0,opts.lashTell|0),slam=Math.max(0,opts.slamTell|0),lens=Math.max(0,opts.lensTell|0),lensOn=Math.max(0,opts.lensT|0),inv=Math.max(.35,1/Math.max(.35,scale));
  c.save();
  c.lineCap='round';c.lineJoin='round';
  const baseY=y+r*1.5;
  if(lash>0){
    const p=clamp(1-lash/54,0,1),pulse=.72+.28*Math.sin(time*.45);
    c.save();c.globalAlpha=(.18+.62*p)*pulse;c.strokeStyle='#ffd7a1';c.lineWidth=2.1*inv;
    for(let i=0;i<7;i++){
      const a=Math.PI/2+(i-3)*.18,reach=(r*.9+r*1.35*p)*(1-Math.abs(i-3)*.045),steps=4;
      c.beginPath();c.moveTo(x+Math.cos(a)*r*.24,baseY+Math.sin(a)*r*.08);
      for(let j=1;j<=steps;j++){
        const d=reach*j/steps,jag=Math.sin((i*19+j*11)*1.7)*r*.045;
        c.lineTo(x+Math.cos(a)*d+Math.cos(a+Math.PI/2)*jag,baseY+Math.sin(a)*d+Math.sin(a+Math.PI/2)*jag);
      }
      c.stroke();
    }
    c.globalAlpha=.4+.35*p;c.strokeStyle='#fff5d5';c.lineWidth=1*inv;
    arc(c,'#fff5d5',1*inv,x,baseY,r*.28,-Math.PI*.86,-Math.PI*.14);
    c.restore();
  }
  if(slam>0){
    const p=clamp(1-slam/30,0,1),dashPhase=(time*.08)%1;
    c.save();c.globalAlpha=.34+.46*p;c.setLineDash([10*inv,7*inv]);c.lineDashOffset=-dashPhase*17*inv;
    arc(c,'#ffe5b5',2.4*inv,x,baseY,150,-Math.PI,Math.PI);c.setLineDash([]);
    c.globalAlpha=.35+.45*p;c.strokeStyle='#ffb45f';c.lineWidth=2.2*inv;
    for(let i=0;i<5;i++){const a=-Math.PI*.82+i*Math.PI*.41,inner=20,outer=48+46*p;c.beginPath();c.moveTo(x+Math.cos(a)*inner,baseY+Math.sin(a)*inner);c.lineTo(x+Math.cos(a)*outer,baseY+Math.sin(a)*outer);c.stroke();}
    c.restore();
  }
  if(lens>0||lensOn>0){
    const p=lens>0?clamp(1-lens/45,0,1):1,coreY=y+r*.24,rad=42+r*.12+18*p;
    c.save();c.globalAlpha=.2+.5*p+.15*(lensOn>0);c.strokeStyle=lensOn>0?'#bff8ff':'#ffe6b6';c.lineWidth=2*inv;
    arc(c,c.strokeStyle,2*inv,x,coreY,rad,time*.02,time*.02+Math.PI*1.55);
    arc(c,c.strokeStyle,1.1*inv,x,coreY,rad+13,-time*.025,-time*.025+Math.PI*1.2);
    c.fillStyle=c.strokeStyle;
    for(let i=0;i<8;i++){
      const a=i*TAU/8+(lensOn>0?time*.025:0),rr=rad+8+Math.sin(i*2.4)*3;
      c.beginPath();c.arc(x+Math.cos(a)*rr,coreY+Math.sin(a)*rr,Math.max(1.6,3*inv),0,TAU);c.fill();
    }
    if(lensOn>0){
      c.globalAlpha=.11+.08*Math.sin(time*.2);c.fillStyle='#bff8ff';c.beginPath();c.arc(x,coreY,rad+32,0,TAU);c.fill();
      c.globalAlpha=.75;c.strokeStyle='#d8ffff';c.lineWidth=1.4*inv;
      for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4,from=rad+30,to=rad+8;c.beginPath();c.moveTo(x+Math.cos(a)*from,coreY+Math.sin(a)*from);c.lineTo(x+Math.cos(a)*to,coreY+Math.sin(a)*to);c.stroke();}
    }
    c.restore();
  }
  c.restore();
}
function foe(c, kind, x, y, r, angle = 0, opts = {}) {
  const t = TYPES[kind], flash = typeof opts.flash === "number" ? opts.flash : opts.flash ? 1 : 0, col = flash > 0 ? blend(W, t.color, 1 - flash) : t.color, time = opts.time || 0;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  // CHUNK 5: the attention ring. Drawn before the radius scale so it reads
  // in world units: while the enemy is dormant the ring says HOW FAR its
  // gaze reaches, which is the one fact a new player cannot infer.
  if (opts.wake && opts.mode === "idle") {
    c.save();
    c.setLineDash([12, 10]);
    c.strokeStyle = "rgba(255,213,143,0.55)";
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, 0, opts.wake, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([2, 16]);
    c.strokeStyle = "rgba(255,244,214,0.85)";
    c.lineWidth = 4;
    c.beginPath();
    c.arc(0, 0, opts.wake, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  c.scale(r, r);
  c.lineJoin = "round";
  if (opts.paper) {
    poly2(c, "#ffaf82", t.outline, K, 0.1);
    poly2(c, "#ee795f", [
      [1, 0],
      [-0.5, 0.866],
      [-0.15, 0.12]
    ]);
    poly2(c, "#ffe4bc", [
      [-0.5, -0.86],
      [-0.5, -0.53],
      [0.74, -0.02]
    ]);
    for (let i = 0; i < 3; i++)
      line(
        c,
        "#924b49",
        0.043,
        -0.31 + i * 0.27,
        -0.21 + i * 0.068,
        -0.16 + i * 0.27,
        -0.17 + i * 0.068
      );
    disk(c, K, -0.33, 0.12, 0.092);
    disk(c, "#f4cf94", -0.346, 0.09, 0.035);
    c.restore();
    return;
  }
  poly2(c, col, t.outline, K, 0.115);
  // Mechanisms are clipped to the actual collision silhouette. Normalized
  // geometry scales with the same radius as the sensor, not decorative spikes.
  c.save();c.beginPath();trace(c,t.outline);c.clip();
  const {charging,active,progress,aim,plates}=resolveEnemyMechanism(kind,opts,angle);
  const metal='#fff3df', dark='#1b1624';
  switch(kind){
    case 'fang': {
      // Nose points along the real body axis; a compressed spring backs it.
      poly2(c,dark,[[-.44,-.48],[.76,0],[-.44,.48],[-.32,0]]);
      const compression=charging?progress*.08:0;
      line(c,metal,.095,-.37,-.22,-.20+compression,-.11,-.36+compression,0,-.20+compression,.11,-.37,.22);
      poly2(c,metal,[[.05,-.27],[.74,0],[.05,.27],[.18,0]],dark,.045);
      if(active)line(c,'#ffb1a8',.07,.12,-.35,.72,0,.12,.35);
      break;
    }
    case 'pulse': {
      // A drum with concentric membranes: the released rim expands outward.
      disk(c,dark,0,0,.70);
      arc(c,metal,.11,0,0,.53);
      arc(c,metal,.085,0,0,.29-progress*.07);
      disk(c,col,0,0,.12);
      for(let i=0;i<4;i++){const a=i*TAU/4; c.save();c.rotate(a);poly2(c,metal,[[.73,0],[.59,-.10],[.59,.10]]);c.restore();}
      break;
    }
    case 'prism': {
      // Aperture at rest; during a genuine tell the barrel follows locked aim.
      poly2(c,dark,[[0,-.78],[.78,0],[0,.78],[-.78,0]]);
      if(charging||active){
        c.save();c.rotate(aim);
        poly2(c,metal,[[-.48,-.16],[.34,-.16],[.34,-.28],[.71,0],[.34,.28],[.34,.16],[-.48,.16]],dark,.045);
        line(c,col,.06,-.3,0,.42,0);c.restore();
      } else {
        arc(c,metal,.10,0,0,.39);disk(c,metal,0,0,.12);
        for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4);line(c,metal,.08,.48,0,.66,0);c.restore();}
      }
      break;
    }
    case 'fork': {
      // Four cutting arms, with two Fang profiles separated by a break seam.
      for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4);line(c,dark,.14,.43,0,.86,0);line(c,metal,charging?.065+progress*.05:.065,.56,-.17,.76,-.17);c.restore();}
      poly2(c,dark,[[-.54,-.34],[0,-.46],[.54,-.34],[.54,.34],[0,.46],[-.54,.34]]);
      poly2(c,metal,[[-.50,0],[-.12,-.24],[-.12,.24]],dark,.035);
      poly2(c,metal,[[.50,0],[.12,-.24],[.12,.24]],dark,.035);
      line(c,col,.07,0,-.36,-.06,-.11,.05,.08,0,.36);
      break;
    }
    case 'bastion': {
      const hp=plates;
      // Actual remaining plates are the only filled armor blocks.
      poly2(c,metal,[[-.70,-.62],[.70,-.62],[.70,.22],[0,.78],[-.70,.22]],dark,.07);
      poly2(c,dark,[[-.51,-.41],[.51,-.41],[.49,.16],[0,.56],[-.49,.16]]);
      poly2(c,col,[[-.35,-.25],[.35,-.25],[.33,.10],[0,.38],[-.33,.10]]);
      for(let i=0;i<2;i++){const xx=(i-.5)*.48;c.fillStyle=i<hp?metal:'#624b38';c.fillRect(xx-.19,-.78,.38,.14);}
      if(hp<2)line(c,dark,.10,.08,-.58,-.08,-.25,.10,-.04,-.08,.48);
      // Only a real wind-up points in the committed slam direction.
      if(charging){c.save();c.rotate(aim);poly2(c,metal,[[.04,-.16],[.48,-.16],[.48,-.29],[.80,0],[.48,.29],[.48,.16],[.04,.16]],dark,.04);c.restore();}
      break;
    }
    case 'rift': {
      // Two offset halves and broken gate, never a glowing collectible star.
      c.save();c.rotate(-angle);drawRiftGlyph(c,col);if(charging)arc(c,metal,.06,0,0,.64,-1.57,-1.57+TAU*progress);c.restore();
      break;
    }
    case 'well': {
      // Inward teeth point toward the dark compression center.
      disk(c,dark,0,0,.68);
      arc(c,metal,.07,0,0,.58);
      for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4);poly2(c,metal,[[.20,0],[.51,-.17],[.51,-.07],[.65,-.07],[.65,.07],[.51,.07],[.51,.17]],dark,.035);c.restore();}
      disk(c,dark,0,0,.17);arc(c,col,.07,0,0,.19);
      if(charging)arc(c,metal,.06,0,0,.25,-1.57,-1.57+TAU*progress);
      break;
    }
    case 'crown': {
      const hp=plates;
      // Ten ports match the actual radial volley. Three slots represent armor.
      disk(c,dark,0,0,.71);
      c.save();if(charging)c.rotate(aim);
      for(let i=0;i<10;i++){c.save();c.rotate(i*TAU/10);if(charging)poly2(c,metal,[[.88,0],[.62,-.08],[.62,.08]]);else {c.fillStyle=metal;c.fillRect(.62,-.055,.18,.11);}c.restore();}
      c.restore();
      disk(c,col,0,0,.43);arc(c,metal,.065,0,0,.43);
      poly2(c,dark,[[-.35,-.11],[-.19,-.27],[0,-.14],[.19,-.27],[.35,-.11],[.25,.12],[-.25,.12]]);
      for(let i=0;i<3;i++){const xx=(i-1)*.23;c.fillStyle=i<hp?metal:'#6a3543';c.fillRect(xx-.085,.17,.17,.12);}
      break;
    }
    case 'monolith': {
      // THE MONOLITH — five lit seams stand for five plates; as plates fall
      // the seams go dark and the core burns through. Cold, flat, enormous.
      const hpLeft = Math.max(0, Math.floor(opts.hp ?? t.hp));
      const standing = Math.ceil(hpLeft / 2);
      const lashTell = Math.max(0, opts.lashTell | 0),
        slamTell = Math.max(0, opts.slamTell | 0),
        slamPlate = opts.slamPlate == null ? -1 : opts.slamPlate | 0,
        lensTell = Math.max(0, opts.lensTell | 0),
        lensOn = Math.max(0, opts.lensT | 0);
      // ── SEISMIC LASH telegraph — crack-lines crawl out of the base ──────
      if (lashTell > 0) {
        const progress = 1 - lashTell / 54;
        c.save();
        c.strokeStyle = '#cbb493';
        c.lineWidth = 0.028;
        c.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const spread = (i - 2.5) * 0.38;
          const reach = progress * (1.3 - Math.abs(i - 2.5) * 0.2);
          let px = 0;
          c.globalAlpha = 0.3 + progress * 0.6;
          c.beginPath();
          c.moveTo(0, 1.5);
          for (let s = 1; s <= 4; s++) {
            const step = (reach / 4) * s,
              jag = Math.sin((i * 7 + s * 13) * 1.7) * 0.09;
            px = Math.sin(spread) * step * 1.6 + jag;
            c.lineTo(px, 1.5 + Math.cos(spread * 0.6) * step * 0.62 + s * 0.015);
          }
          c.stroke();
        }
        // Dust lifting off the seam.
        c.fillStyle = '#e9dab9';
        for (let i = 0; i < 10; i++) {
          const seed = i * 137.5 + time * 0.04,
            my = 1.5 - ((seed * 0.13 + time * 0.05) % 0.8);
          c.globalAlpha = 0.14 + 0.28 * (0.5 + 0.5 * Math.sin(seed * 3.1 + time * 0.35));
          c.fillRect(Math.sin(seed) * 1.05 - 0.022, my - 0.022, 0.045, 0.045);
        }
        c.restore();
      }
      poly2(c, '#0d0b13', t.outline, K, 0.13);
      poly2(c, '#17141f', [[-0.78, -1.18], [0.78, -1.18], [0.55, 1.14], [-0.55, 1.14]], K, 0.055);
      for (let i = 0; i < 5; i++) {
        const yy = -0.92 + i * 0.46;
        const alive = standing > i;
        c.fillStyle = alive ? '#262130' : '#100d17';
        c.fillRect(-0.64, yy, 1.28, 0.32);
        if (alive) {
          line(c, '#ff9c5a', 0.05, -0.64, yy + 0.155, 0.64, yy + 0.155);
          line(c, '#ffd9a0', 0.018, -0.64, yy + 0.155, 0.64, yy + 0.155);
        } else {
          line(c, '#241f2c', 0.035, -0.64, yy + 0.155, 0.64, yy + 0.155);
        }
      }
      // ── PLATE SLAM telegraph — the slotted plate hangs white, then drops ─
      if (slamTell > 0 && slamPlate >= 0) {
        const yy = -0.92 + slamPlate * 0.46,
          drop = 1 - slamTell / 30;
        c.save();
        c.globalAlpha = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(time * 0.9));
        line(c, '#ffffff', 0.055, -0.64, yy + 0.155, 0.64, yy + 0.155);
        c.restore();
        c.save();
        c.translate(0, drop * 0.62);
        c.rotate(drop * 0.16);
        c.globalAlpha = 0.96;
        c.fillStyle = '#2b2438';
        c.fillRect(-0.64, yy, 1.28, 0.32);
        line(c, '#ffffff', 0.04, -0.64, yy + 0.16, 0.64, yy + 0.16);
        line(c, '#ff9c5a', 0.03, -0.64, yy + 0.02, 0.64, yy + 0.02);
        c.restore();
      }
      // The core. Dim ember while the plates stand; the tear burns through
      // once the face is mostly dark.
      const coreGlow = Math.max(0.15, Math.min(1, 0.18 + (5 - standing) * 0.19));
      // ── GRAVITY LENS — the iris dilates, the rim beads bright ──────────
      const lensTellP = lensTell > 0 ? 1 - lensTell / 45 : 0,
        lensBoost = lensTellP * 0.45 + (lensOn > 0 ? 0.42 + 0.06 * Math.sin(time * 0.7) : 0),
        iris = 0.3 * (1 + lensBoost);
      const ember = c.createRadialGradient(0, 0.24, 0, 0, 0.24, 0.56 + (lensOn > 0 ? 0.18 : lensTellP * 0.14));
      ember.addColorStop(0, `rgba(255,${lensBoost > 0 ? 205 : 150},${lensBoost > 0 ? 145 : 70},${Math.min(1, coreGlow + lensTellP * 0.35 + (lensOn > 0 ? 0.3 : 0))})`);
      ember.addColorStop(0.55, `rgba(215,74,48,${coreGlow * 0.62})`);
      ember.addColorStop(1, 'rgba(215,74,48,0)');
      c.fillStyle = ember;
      c.fillRect(-0.58, -0.3, 1.16, 1.28);
      disk(c, '#050308', 0, 0.24, iris);
      arc(c, `rgba(255,226,186,${Math.min(1, 0.3 + coreGlow * 0.65 + lensTellP * 0.3 + (lensOn > 0 ? 0.25 : 0))})`, 0.055, 0, 0.24, iris);
      if (lensTell > 0 || lensOn > 0) {
        const bead = lensTell > 0 ? lensTellP : 1;
        c.save();
        c.fillStyle = `rgba(255,233,192,${0.35 + bead * 0.6})`;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + (lensOn > 0 ? time * 0.05 : 0);
          c.beginPath();
          c.arc(Math.cos(a) * (iris + 0.075), 0.24 + Math.sin(a) * (iris + 0.075), 0.028 + bead * 0.02, 0, TAU);
          c.fill();
        }
        c.restore();
      }
      if (flash > 0) { c.globalAlpha = flash * 0.55; poly2(c, '#ffffff', t.outline); c.globalAlpha = 1; }
      break;
    }
  }
  c.restore();
  c.restore();
}
function bladeAlpha(left, life = 38, time = 0) {
  if (!(left > 0)) return 0;
  const t = Math.min(1, left / life), base = 0.55 + 0.45 * Math.min(1, t * 2.2);
  if (left <= 4) return Math.round(left) % 2 ? base * 0.16 : base;
  return base;
}
function blade(c, x, y, angle, r, strength = 1, reach = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(r, r);
  c.globalAlpha *= strength;
  const stretch = (2.88 * reach - 0.69) / (2.88 - 0.69);
  c.translate(0.69 * (1 - stretch), 0);
  c.scale(stretch, reach > 1 ? 1.52 : 1);
  poly2(
    c,
    L,
    [
      [0.69, 0.23],
      [1.04, 0.1],
      [2.88, -0.15],
      [2.38, 0.16],
      [1.12, 0.33],
      [0.8, 0.42]
    ],
    K,
    0.065
  );
  line(c, W, 0.055, 1.11, 0.16, 2.55, -0.08);
  line(c, K, 0.12, 0.99, -0.04, 1.12, 0.49);
  if (reach > 1)
    poly2(c, W, [
      [1.04, 0.12],
      [1.23, -0.06],
      [2.88, -0.15],
      [2.1, -0.015]
    ]);
  c.restore();
}
function cutHalf(c, kind, path2, cutLocal, side, opts = {}) {
  c.save();
  c.beginPath();
  trace(c, path2);
  c.clip();
  if (kind === "cube") cube(c, 0, 0, 1, 0, 0, opts.face,{equipment:opts.equipment||{},reducedMotion:true});
  else foe(c, kind, 0, 0, 1, 0, opts);
  c.rotate(cutLocal);
  c.fillStyle = opts.torn ? L : W;
  const lip = opts.torn ? 0.115 : 0.072;
  c.fillRect(-1.5, side < 0 ? -lip : 0, 3, lip);
  c.restore();
}
function cutFigure(c, kind, x, y, r, angle, cut, gap, opts = {}) {
  const local = cut - angle, paths = bisect(kind === "cube" ? CUBE : TYPES[kind].outline, local);
  paths.forEach((path2, i) => {
    const side = i ? 1 : -1;
    c.save();
    c.translate(x - Math.sin(cut) * side * gap, y + Math.cos(cut) * side * gap);
    c.rotate(angle + side * (opts.twist || 0));
    c.scale(r, r);
    cutHalf(c, kind, path2, local, side, opts);
    c.restore();
  });
}
function shearInk(c, x, y, angle, len, width) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(len, width);
  poly2(c, L, [
    [0, -0.16],
    [0.21, -0.48],
    [0.6, -0.34],
    [0.55, -0.19],
    [1, -0.07],
    [0.82, 0.07],
    [0.91, 0.13],
    [0.3, 0.4],
    [0.1, 0.49],
    [0.15, 0.22],
    [0, 0.27]
  ]);
  poly2(c, W, [
    [0.02, 0.11],
    [0.24, -0.09],
    [0.76, -0.13],
    [0.38, 0.075],
    [0.45, 0.11],
    [0.1, 0.22]
  ]);
  poly2(c, L, [
    [0.16, 0.68],
    [0.54, 0.35],
    [0.36, 0.6]
  ]);
  c.restore();
}
function nick(c, x, y, r, angle, count, scale) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.cos(angle) < 0 ? angle + Math.PI : angle);
  c.translate(0, -r);
  c.scale(1 / scale, 1 / scale);
  for (let i = 0; i < count; i++) {
    const u = (i - (count - 1) * 0.5) * 7;
    poly2(
      c,
      L,
      [
        [u - 3, -2],
        [u, -11],
        [u + 5, -11],
        [u + 1, -2]
      ],
      K,
      1.2
    );
  }
  c.restore();
}
function createJelly() {
  let x = 0, y = 0, vx = 0, vy = 0;
  return {
    /** Kick the body. `nx`/`ny` is the direction of the blow in cube space.
     *
     *  The impulse is scaled into the spring's own units. Feeding raw power in
     *  as velocity peaks at ~0.014 -- measured, invisible -- because the spring
     *  immediately pulls the displacement back toward zero. */
    hit(power, nx = 0, ny = 1) {
      const p = Math.max(-1.6, Math.min(1.6, power)) * 22;
      vx += nx * p;
      vy += ny * p;
    },
    step(dt = 1) {
      const omega = 13, zeta = 0.72, h = 0.016 * dt;
      const ax = -omega * omega * x - 2 * zeta * omega * vx, ay = -omega * omega * y - 2 * zeta * omega * vy;
      vx += ax * h;
      vy += ay * h;
      x += vx * h;
      y += vy * h;
    },
    /** The field `cube()` draws with. `grip` rises with speed: a cube being
     *  thrown is stiffer than one standing still, which is what stops the
     *  deformation from reading as mush at 280 px/tick. */
    field(grip = 0.75, dipX = 0, dipY = 0) {
      return {
        sx: 1 + x * 0.22,
        sy: 1 + y * 0.22,
        dipX,
        dipY,
        grip: Math.max(0, Math.min(1, grip))
      };
    },
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    reset() {
      x = y = vx = vy = 0;
    }
  };
}

// consolidated/equipment-art.js
var equipment_art_exports = {};
__export(equipment_art_exports, {
  drawEquipmentEffects: () => drawEquipmentEffects,
  drawEquipmentImpact: () => drawEquipmentImpact,
  drawEquipmentSlash: () => drawEquipmentSlash,
  drawEquipmentWorld: () => drawEquipmentWorld
});
var TAU4 = Math.PI * 2;
function line2(c, color, width, x, y, tx, ty) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(tx, ty);
  c.stroke();
}
function disk2(c, color, x, y, r) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, TAU4);
  c.fill();
}
function gradient(c, h, colors) {
  const g = c.createLinearGradient(0, 0, 0, h);
  colors.forEach((s, i) => g.addColorStop(i / (colors.length - 1), s));
  return g;
}
function polygon(c, points, color) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach((p, i) => c[i ? "lineTo" : "moveTo"](...p));
  c.closePath();
  c.fill();
}
/** Industrial world architecture, rendered in screen pixels. Camera offsets
 * move independent depth planes; deterministic tile coordinates avoid respawns.
 * All masses are scenery: muted edges, no gameplay lime/red or collision writes.
 */
function drawIndustrialDistrict(c,w,h,camera={},seed=41,band=1,time=0) {
  const x=Number.isFinite(camera.x)?camera.x:0,y=Number.isFinite(camera.y)?camera.y:0;
  const scale=Math.max(.65,Math.min(1.3,camera.scale||1));
  const palettes=[
    {sky:"#101b25",haze:"#30434b",far:"#1b2b37",mid:"#223640",edge:"#465760",near:"#13222c",lamp:"#a68c63"},
    {sky:"#171a24",haze:"#3d3942",far:"#292d39",mid:"#333440",edge:"#555660",near:"#1a202b",lamp:"#b09a76"},
    {sky:"#201b23",haze:"#49403d",far:"#302c34",mid:"#3d343b",edge:"#625351",near:"#251f29",lamp:"#b99a74"},
    {sky:"#122126",haze:"#314a4a",far:"#1c3439",mid:"#263e41",edge:"#46605e",near:"#14282f",lamp:"#9eab93"}
  ];
  const p=palettes[((Math.floor(band)||1)%4+4)%4];
  c.save();
  const sky=c.createLinearGradient(0,0,w,h);sky.addColorStop(0,p.sky);sky.addColorStop(.65,p.haze);sky.addColorStop(1,p.sky);c.fillStyle=sky;c.fillRect(0,0,w,h);
  // Far light well: broad value separation, not a colored bloom cloud.
  const well=c.createRadialGradient(w*.48,h*.43,0,w*.48,h*.43,w*.69);well.addColorStop(0,"#a8b7af13");well.addColorStop(1,"#08121c00");c.fillStyle=well;c.fillRect(0,0,w,h);
  // Each tier is continuous through positive/negative camera movement.
  for(let tier=0;tier<3;tier++){
    const depth=[.09,.22,.40][tier],tw=[490,790,1360][tier]*scale,th=[640,820,1140][tier]*scale;
    const ox=-x*depth,oy=-y*depth;
    const col0=Math.floor(-ox/tw)-1,col1=Math.ceil((w-ox)/tw),row0=Math.floor(-oy/th)-1,row1=Math.ceil((h-oy)/th);
    for(let row=row0;row<=row1;row++)for(let col=col0;col<=col1;col++){
      const n=hash(seed,col,row+tier*71),px=col*tw+ox,py=row*th+oy;
      const bounds=tier===0?[50,35,370,640]:tier===1?[30,-30,670,820]:[924,-70,1360,1140];
      if(px+(bounds[2]+16)*scale<0||px+(bounds[0]-16)*scale>w||py+(bounds[3]+16)*scale<0||py+(bounds[1]-16)*scale>h)continue;
      c.save();c.translate(px,py);c.scale(scale,scale);
      if(tier===0){
        // Distant compression towers: visible through the larger machinery.
        const top=100+(n%90),bw=120+(n>>>9)%60;
        polygon(c,[[50,640],[50,top+35],[75,top],[bw,top],[bw+18,top+26],[bw+18,640]],p.far);
        c.fillStyle=p.edge+"44";c.fillRect(80,top+47,3,180);
        for(let k=0;k<3;k++){c.fillStyle=p.lamp+"45";c.fillRect(92+k*19,top+65,7,3);}
        c.fillStyle=p.far;c.fillRect(260,35,38,605);c.fillRect(240,90,112,11);
        line2(c,p.edge+"38",2,280,100,370,240);
      }else if(tier===1){
        // Freight bays: a dark cavity, deep jambs, lintel and inset conduit.
        const top=74+(n%60),left=40;
        if(px+(left+390)*scale>=0&&px+left*scale<=w&&py+820*scale>=0&&py+(top-3)*scale<=h){
        polygon(c,[[left,820],[left,top+35],[left+38,top],[left+350,top],[left+390,top+35],[left+390,820]],p.mid);
        c.fillStyle=p.sky;c.fillRect(left+64,top+70,260,360);
        polygon(c,[[left+64,top+70],[left+324,top+70],[left+300,top+94],[left+86,top+94],[left+86,top+411],[left+64,top+430]],p.near);
        seam(c,[[left+34,top+66],[left+34,top+461],[left+361,top+461]],p.edge,.9);
        const type=(n>>>16)%3;
        if(type===0){
          for(let k=0;k<5;k++){
            c.fillStyle=p.near;c.fillRect(left+69,top+115+k*60,250,18);
            line2(c,p.edge+"88",1,left+75,top+115+k*60,left+309,top+115+k*60);
          }
          c.fillStyle=p.mid;c.fillRect(left+135,top+285,72,35);c.fillStyle=p.edge;c.fillRect(left+151,top+301,38,3);
        }else if(type===1){
          const cx=left+194,cy=top+232;
          disk2(c,p.near,cx,cy,113);disk2(c,p.edge,cx,cy,97);disk2(c,p.sky,cx,cy,89);
          for(let k=0;k<5;k++){
            c.save();c.translate(cx,cy);c.rotate(k*Math.PI*2/5+.3+time*.004);
            polygon(c,[[10,-10],[57,-67],[79,-37],[43,5],[12,18]],p.mid);
            line2(c,p.edge+"99",1,17,-6,59,-53);c.restore();
          }
          disk2(c,p.near,cx,cy,24);disk2(c,p.edge,cx,cy,11);
          for(let k=0;k<3;k++){c.fillStyle=p.near;c.fillRect(left+94,top+366+k*12,202,5);}
        }else{
          for(let k=0;k<3;k++){
            const xx=left+102+k*72;
            seam(c,[[xx,top+76],[xx,top+160],[xx+22,top+202],[xx+22,top+425]],p.mid,22);
            seam(c,[[xx-6,top+76],[xx-6,top+160],[xx+16,top+202],[xx+16,top+425]],p.edge+"99",2);
            c.fillStyle=p.edge;c.fillRect(xx+6,top+290,32,7);
          }
        }
        // Narrow maintenance recesses provide scale without HUD-like labels.
        c.fillStyle=p.near;c.fillRect(left+12,top+150,15,47);c.fillStyle=p.lamp+"99";c.fillRect(left+17,top+157,4,12);
        c.fillStyle=p.edge;c.fillRect(left+59,top+40,269,5);
        c.fillStyle=p.lamp;c.fillRect(left+85,top+46,44,3);c.fillRect(left+267,top+46,26,3);
        }
        // One physical pipe with bends and a muted reflected side.
        if(px+606*scale>=0&&px+456*scale<=w){
        seam(c,[[505,-30],[505,205],[560,260],[560,820]],p.near,19);
        seam(c,[[499,-30],[499,208],[554,264],[554,820]],p.edge,2);
        c.fillStyle=p.near;c.fillRect(456,300,150,18);c.fillRect(478,286,13,48);
        }
        // Service truss remains far behind gameplay, without a bright top edge.
        if(py+(top+581)*scale>=0&&py+(top+510)*scale<=h){
        c.fillStyle=p.near;c.fillRect(30,top+510,640,18);
        for(let k=0;k<5;k++)line2(c,p.mid,6,60+k*116,top+528,116+k*116,top+575);
        c.fillStyle=p.mid;c.fillRect(30,top+572,640,9);
        }
      }else{
        // Near gantry edge: sparse cropped masses frame, not fill, the arena.
        c.fillStyle=p.near;c.fillRect(1035,-70,70,1210);
        polygon(c,[[1014,70],[1127,70],[1127,118],[1014,118]],p.mid);
        line2(c,p.edge+"99",2,1041,-60,1041,1110);
        for(let k=0;k<4;k++){const yy=190+k*245;c.fillStyle=p.mid;c.fillRect(1017,yy,106,18);line2(c,p.edge+"66",1,1020,yy,1116,yy);}
        seam(c,[[1100,310],[1210,420],[1360,420]],p.near,28);
        seam(c,[[1102,299],[1215,409],[1360,409]],p.edge+"88",2);
        // Cable drops have no bobbing or arbitrary orbiting motion.
        line2(c,p.near,3,930,0,930,250+(n%90));
        c.fillStyle=p.edge;c.fillRect(924,240+(n%90),12,17);
      }
      c.restore();
    }
  }
  c.save();c.globalAlpha=.045;
  polygon(c,[[w*.17,0],[w*.36,0],[w*.92,h],[w*.58,h]],"#d1d8cb");c.restore();
  // One slow dust layer only, well below threat/UI contrast.
  for(let i=0;i<22;i++){const px=((i*173-x*.05+w*2)%(w+30)+w+30)%(w+30)-15,py=((i*97-y*.06+time*.035)%(h+20)+h+20)%(h+20)-10;c.fillStyle=p.lamp+"44";c.fillRect(px,py,1,2);}
  const shade=c.createRadialGradient(w*.5,h*.5,Math.min(w,h)*.27,w*.5,h*.5,Math.max(w,h)*.73);shade.addColorStop(0,"#080c1200");shade.addColorStop(1,"#080c1277");c.fillStyle=shade;c.fillRect(0,0,w,h);
  c.restore();
}
/**
 * CHUNK 2: THE SKY FRACTURES. Drawn after the world backdrop and before any
 * gameplay layer, so the seams sit behind play but inside the lens.
 *
 * Four sky stages, keyed off the persistent fracture meter (src/fracture.js
 * is the source of truth for these thresholds; they are duplicated here
 * because this module is deliberately import-free):
 *   stage 1 @ 10%  first hairline crack, horizon embers
 *   stage 2 @ 35%  three cracks, the light well dies, thin dust glow
 *   stage 3 @ 60%  five cracks + rising embers, the sky itself splits
 *   stage 4 @ 88%  the COLLAPSE SKY: a white-hot fissure and a red horizon
 *
 * `motion=false` freezes the pulse and the ember rise (Reduce Motion /
 * Screen shake OFF); the crack geometry is always the same hashed polylines,
 * so a still frame is identical frame to frame.
 */
function fractureCrack(c, w, h, seed, motion, time) {
  const startX = (hash(seed, 11, 7) % 1000) / 1000 * w;
  // ── The main seam: a deterministic jagged walk from above the top edge.
  const walk = (fromX, fromY, fromAngle, count, stepBase) => {
    let x = fromX, y = fromY, angle = fromAngle;
    const pts = [[x, y]];
    for (let k = 0; k < count; k++) {
      const step = stepBase + (hash(seed, 20 + k + fromY, 3) % 22);
      angle += (((hash(seed, 40 + k, 8) % 1000) / 1000) - 0.5) * 1.15;
      angle = Math.max(0.35, Math.min(Math.PI - 0.35, angle));
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      pts.push([x, y]);
    }
    return { pts, angle };
  };
  const startAngle = Math.PI / 2 + (((hash(seed, 12, 9) % 1000) / 1000) - 0.5) * 1.15;
  const segments = 9 + (hash(seed, 13, 5) % 6);
  const main = walk(startX, -18, startAngle, segments, 14);
  // ── A branch seam forks off the middle of the main one.
  const forkIndex = 4 + (hash(seed, 60, 2) % 3);
  const fork = main.pts[Math.min(forkIndex, main.pts.length - 1)];
  const branchAngle = main.angle + ((hash(seed, 70, 4) % 1000) / 1000 < 0.5 ? -0.8 : 0.8);
  const branch = walk(fork[0], fork[1], branchAngle, 5 + (hash(seed, 71, 6) % 4), 10);
  const pulse = motion ? 0.72 + 0.28 * Math.sin(time * 0.055 + seed * 0.7) : 1;
  // The wide ember pass, then the near-white core. Glow first, for both seams.
  c.lineJoin = "round";
  c.lineCap = "round";
  for (const { pts } of [main, branch]) {
    for (const [width, style] of [
      [6.5, `rgba(255,118,64,${0.34 * pulse})`],
      [1.6, `rgba(255,196,140,${0.62 * pulse})`],
    ]) {
      c.strokeStyle = style;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.stroke();
    }
  }
}

function drawFractureSky(c, w, h, pct, time, motion) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  if (p <= 0) return;
  const stage = p >= 88 ? 4 : p >= 60 ? 3 : p >= 35 ? 2 : p >= 10 ? 1 : 0;
  const cracks = [0, 1, 3, 5, 7][stage];
  const glowA = [0, 0.07, 0.13, 0.22, 0.34][stage];
  const dim = [0, 0, 0.05, 0.11, 0.19][stage];
  c.save();
  // The light well behind the district dies as the seam opens. Fixed alpha;
  // no composite tricks — this is a paint, not a filter.
  if (dim) {
    c.fillStyle = `rgba(6,5,12,${dim})`;
    c.fillRect(0, 0, w, h);
  }
  // The horizon heats up, brightest dead centre, like something below the floor.
  const ember = c.createRadialGradient(w * 0.5, h * 1.05, 0, w * 0.5, h * 1.05, h * 0.95);
  ember.addColorStop(0, `rgba(255,132,63,${glowA})`);
  ember.addColorStop(0.55, `rgba(214,79,58,${glowA * 0.45})`);
  ember.addColorStop(1, "rgba(214,79,58,0)");
  c.fillStyle = ember;
  c.fillRect(0, 0, w, h);
  // The hairlines themselves.
  for (let i = 0; i < cracks; i++) fractureCrack(c, w, h, hash(977, i, 13), motion, time);
  // Stage 4: one white-hot COLLAPSE fissure, unmistakably the big one.
  if (stage === 4) {
    const pulse = motion ? 0.78 + 0.22 * Math.sin(time * 0.075 + 2.1) : 1;
    const fx = w * (0.52 + (hash(977, 99, 17) % 100) / 100 * 0.12 - 0.06);
    c.lineCap = "round";
    for (const [width, style] of [
      [14, `rgba(255,150,80,${0.30 * pulse})`],
      [5.5, `rgba(255,208,150,${0.62 * pulse})`],
      [1.8, `rgba(255,246,230,${0.9 * pulse})`],
    ]) {
      c.strokeStyle = style;
      c.lineWidth = width;
      c.beginPath();
      let x = fx, y = -20;
      c.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        const step = h * 0.075 + (hash(977, 300 + k, 19) % 26);
        x += (hash(977, 340 + k, 23) % 1000) / 1000 * 92 - 46;
        y += step;
        c.lineTo(x, y);
      }
      c.stroke();
    }
  }
  // Rising ember motes. Deterministic arcs so reduced motion can pin them.
  if (stage >= 3) {
    const rise = motion ? time * 0.9 : 0;
    for (let i = 0; i < 15; i++) {
      const spread = (hash(977, 500 + i, 29) % 1000) / 1000;
      const depth = (hash(977, 540 + i, 31) % 1000) / 1000;
      const x = spread * w;
      const travel = h + 120;
      const y = h + 40 - ((rise * (0.5 + depth) + i * 173) % travel);
      const r = 0.8 + depth * 1.7;
      c.globalAlpha = 0.26 + depth * 0.3;
      c.fillStyle = depth > 0.72 ? "#ffd9a0" : "#ff9c5a";
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  c.restore();
}

/**
 * CHUNK 3: THE SHATTER EVENT. The meter hit 100 and the world tore.
 *
 * Two jobs:
 *  1. While `s.shatter` is running (140 ticks from the trigger): the
 *     singularity flash — the trash sky collapses into a point. A white-hot
 *     bloom burns out early; the accretion-ringed disc swells and is gone.
 *  2. For the rest of the run: the sky hangs in 12–16 hash-seeded shards —
 *     slabs of plum night with ember light burning through the gaps. Static
 *     geometry; only the breathing pulse and ember glow animate, both frozen
 *     under Reduce Motion / Screen shake OFF.
 *
 * The four borders of the arena also go neon here (drawShatteredRails):
 * 1.30x bumper rails in the fiction, bright enough to read as live wire.
 */
function drawShatteredSky(c, w, h, s, time, motion) {
  c.save();
  const t = Math.max(0, s?.shatter ?? 0);
  const life = t > 0 ? 1 - t / 140 : 1;            // 0 at trigger → 1 when drained
  const shardCount = 12 + (hash(4242, 7, 13) % 5); // 12..16, hash-seeded
  // Ember light from below burns through every gap between the shards.
  const ember = c.createRadialGradient(w * 0.5, h * 1.02, 0, w * 0.5, h * 1.02, h * 0.92);
  ember.addColorStop(0, "rgba(255,120,60,0.52)");
  ember.addColorStop(0.55, "rgba(205,70,55,0.20)");
  ember.addColorStop(1, "rgba(205,70,55,0)");
  c.fillStyle = ember;
  c.fillRect(0, 0, w, h);
  // The shards themselves.
  for (let i = 0; i < shardCount; i++) {
    const sx = (hash(977, i, 31) % 1000) / 1000 * (w + 200) - 100;
    const sy = (hash(977, i, 47) % 1000) / 1000 * h * 0.40 - 40;
    const sw = 34 + (hash(977, i, 59) % 118);
    const sh = 30 + (hash(977, i, 71) % 132);
    const slant = ((hash(977, i, 83) % 1000) / 1000 - 0.5) * 0.9;
    const drift = motion ? Math.sin(time * 0.011 + i * 2.13) * 4 : 0;
    const pulse = motion ? 0.72 + 0.28 * Math.sin(time * 0.05 + i) : 1;
    c.save();
    c.translate(sx + drift, sy);
    c.rotate(slant * 0.22);
    // Slab body.
    c.fillStyle = i % 3 === 0 ? "#171220" : "#1d1726";
    c.beginPath();
    c.moveTo(-sw / 2, -sh / 2 + (hash(977, i, 5) % 20));
    c.lineTo(sw / 2 - (hash(977, i, 9) % 26), -sh / 2);
    c.lineTo(sw / 2, sh / 2 - (hash(977, i, 12) % 18));
    c.lineTo(-sw / 2 + (hash(977, i, 14) % 24), sh / 2);
    c.closePath();
    c.fill();
    // The under-rim: the ember light licking the bottom edge of the shard.
    c.strokeStyle = `rgba(255,150,80,${0.75 * pulse})`;
    c.lineWidth = 2.1;
    c.beginPath();
    c.moveTo(-sw / 2 + (hash(977, i, 14) % 24), sh / 2);
    c.lineTo(sw / 2, sh / 2 - (hash(977, i, 12) % 18));
    c.stroke();
    // A hairline seam on the shard face.
    c.strokeStyle = "rgba(255,196,140,0.28)";
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-sw * 0.18, -sh * 0.32);
    c.lineTo((hash(977, i, 17) % 1000) / 1000 * sw * 0.4 - sw * 0.2, sh * 0.4);
    c.stroke();
    c.restore();
  }
  if (t <= 0) { c.restore(); return; }
  // ── THE SINGULARITY FLASH ──
  const cx = w * 0.5, cy = h * 0.38;
  const flashA = Math.max(0, 1 - life * 2.15); // white-hot bloom, burned out by ~46% of the clock
  if (flashA > 0) {
    const burst = c.createRadialGradient(cx, cy, 0, cx, cy, h * 0.62);
    burst.addColorStop(0, `rgba(255,255,250,${flashA})`);
    burst.addColorStop(0.35, `rgba(255,224,190,${flashA * 0.75})`);
    burst.addColorStop(1, "rgba(255,224,190,0)");
    c.fillStyle = burst;
    c.fillRect(0, 0, w, h);
  }
  // The disc: swells from nothing, collapses to a point, gone.
  const grow = life < 0.34 ? life / 0.34 : Math.max(0.06, 1 - (life - 0.34) / 0.66);
  const r = w * 0.135 * grow;
  if (r > 1) {
    const pulse = motion ? 0.8 + 0.2 * Math.sin(time * 0.3) : 1;
    const glow = c.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.1);
    glow.addColorStop(0, `rgba(255,140,70,${0.5 * pulse})`);
    glow.addColorStop(1, "rgba(255,140,70,0)");
    c.fillStyle = glow;
    c.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
    c.fillStyle = "#050308";
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.lineWidth = Math.max(1.4, r * 0.16);
    c.strokeStyle = `rgba(255,236,210,${0.9 * pulse})`;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
}

/** The four borders, live: two passes of glow over a hot core, corner nodes. */
function drawShatteredRails(c, w, h, v, arena, time, motion) {
  if (!arena) return;
  const pulse = motion ? 0.66 + 0.34 * Math.sin(time * 0.085) : 0.85;
  const x0 = (arena.x - v.x) * v.scale, x1 = (arena.x + arena.w - v.x) * v.scale;
  const y0 = (arena.y - v.y) * v.scale, y1 = (arena.y + arena.h - v.y) * v.scale;
  c.save();
  c.lineCap = "round";
  for (const [lw, style] of [
    [12, `rgba(255,93,177,${0.30 * pulse})`],
    [4.4, `rgba(155,246,255,${0.88 * pulse})`],
    [1.5, `rgba(255,255,255,${0.95 * pulse})`],
  ]) {
    c.strokeStyle = style;
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(x0, y0); c.lineTo(x1, y0);
    c.moveTo(x0, y1); c.lineTo(x1, y1);
    c.moveTo(x0, y0); c.lineTo(x0, y1);
    c.moveTo(x1, y0); c.lineTo(x1, y1);
    c.stroke();
  }
  c.fillStyle = `rgba(255,255,255,${0.85 * pulse})`;
  for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    c.beginPath(); c.arc(px, py, 3.1, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

function drawEquipmentWorld(c, w, h, id, t = 0, camera = {}) {

  if(!id||id==="twilight"){drawIndustrialDistrict(c,w,h,camera,41,1,t);return;}
  c.save();
  if (id === "void") {
    c.fillStyle = "#020205";
    c.fillRect(0, 0, w, h);
    const bx=w*.67,by=h*.32,br=Math.min(w,h)*.105;
    const halo=c.createRadialGradient(bx,by,br*.6,bx,by,br*3.3);
    halo.addColorStop(0,"#8d6fe738");halo.addColorStop(.5,"#33235b33");halo.addColorStop(1,"#07070d00");
    c.fillStyle=halo;c.fillRect(0,0,w,h);
    for(let i=0;i<24;i++)disk2(c,i%6===0?"#d8dcffa0":"#a7b0d744",(i*137+29)%w,(i*71+11)%h,i%9===0?1.5:.7);
    c.save();c.translate(bx,by);c.rotate(-.22);
    c.strokeStyle="#bba0ff45";c.lineWidth=br*.28;c.beginPath();c.ellipse(0,0,br*2.2,br*.53,0,0,Math.PI*2);c.stroke();
    c.strokeStyle="#f1e6ff99";c.lineWidth=Math.max(.8,br*.045);c.beginPath();c.ellipse(0,0,br*2.1,br*.53,0,0,Math.PI*2);c.stroke();
    disk2(c,"#020206",0,0,br);c.strokeStyle="#d4d2ffaa";c.lineWidth=1.2;c.beginPath();c.arc(0,0,br,0,Math.PI*2);c.stroke();
    c.strokeStyle="#ffd6b399";c.lineWidth=br*.07;c.beginPath();c.ellipse(0,0,br*2.1,br*.53,0,0,Math.PI);c.stroke();c.restore();
    for(let i=0;i<4;i++){const x=w*(.13+i*.23),y=h*(.58+(i%2)*.19)+Math.sin(t*.014+i)*3,r=h*(.035+i*.008);polygon(c,[[x-r*.7,y-r],[x+r*.5,y-r*.7],[x+r*.7,y+r*.8],[x-r*.5,y+r]],"#111021");line2(c,"#8c86b655",1,x-r*.7,y-r,x+r*.5,y-r*.7);}
    c.strokeStyle = "#ededf51a";
    c.lineWidth = 1;
    c.strokeRect(14, 14, w - 28, h - 28);
    for (const x of [14, w - 14]) for (const y of [14, h - 14]) {
      line2(c, "#d3d3df77", 1, x, y, x + (x === 14 ? 12 : -12), y);
      line2(c, "#d3d3df77", 1, x, y, x, y + (y === 14 ? 12 : -12));
    }
    c.restore();
    return;
  }
  if (id === "manga") {
    c.fillStyle = "#f1e8d7";
    c.fillRect(0, 0, w, h);
    for(let i=0;i<16;i++){const a=i*Math.PI*2/16,inner=h*(.28+(i%4)*.08);line2(c,"#34253e12",i%5?1:2,w*.55+Math.cos(a)*inner,h*.40+Math.sin(a)*inner,w*.55+Math.cos(a)*w,h*.4+Math.sin(a)*w);}
    c.fillStyle="#24182d12";c.beginPath();for(let row=0;row<9;row++)for(let col=0;col<12;col++)if(row+col<12){const x=col*12,y=row*10;c.moveTo(x+1.4,y);c.arc(x,y,1.4,0,TAU4);}c.fill();
    for (let i = 0; i < 18; i++) {
      const x = i * 137 % w, y = i * 73 % h;
      line2(c, "#66564716", 1, x, y, x + 20, y - 8);
    }
    for (let i = 0; i < 18; i++) {
      const bw = w / 15, x = i * w / 16, y = h * (0.48 + i * 7 % 9 / 24);
      c.fillStyle = i % 2 ? "#d0c2a9" : "#b5a98f";
      c.fillRect(x, y, bw, h - y);
      c.strokeStyle = "#776956";
      c.lineWidth = .8;
      c.strokeRect(x, y, bw, h - y);
      for (let j = 0; j < 6; j++) line2(c, "#4d415d2b", .8, x, y + 10 + j * 15, x + bw, y + j * 15);
    }
    c.strokeStyle = "#51445444";
    c.lineWidth = 1;
    c.strokeRect(9, 9, w - 18, h - 18);
    c.restore();
    return;
  }
  if (id === "synth") {
    c.fillStyle = gradient(c, h, ["#070b26", "#35122f", "#b82b62"]);
    c.fillRect(0, 0, w, h);
    const sx = w * .79, sy = h * .24, r = h * .165;
    c.save();
    c.beginPath();
    c.arc(sx, sy, r, 0, TAU4);
    c.clip();
    c.fillStyle = gradient(c, h * 0.65, ["#ffe396", "#ffaf85", "#ed3c9b"]);
    c.fillRect(sx - r, sy - r, r * 2, r * 2);
    c.fillStyle = "#33142f";
    for (let i = 0; i < 8; i++) c.fillRect(sx - r, sy + i * r * 0.12, r * 2, 2 + i * 1.2);
    c.restore();
    polygon(c, [[0, h * 0.65], [w * 0.14, h * 0.47], [w * 0.26, h * 0.63], [w * 0.41, h * 0.53], [w * 0.58, h * 0.68], [w * 0.77, h * 0.49], [w, h * 0.65], [w, h], [0, h]], "#14152c");
    const horizon = h * 0.72;
    c.fillStyle = "#0c1123";
    c.fillRect(0, horizon, w, h - horizon);
    for (let i = -8; i <= 8; i++) line2(c, "#dd67c64d", 1, w * 0.5 + i * w * 0.07, horizon, w * 0.5 + i * w * 0.27, h);
    for (let i = 0; i < 9; i++) {
      const u = (i + t * 0.012) % 9 / 9, y = horizon + (h - horizon) * u * u;
      line2(c, "#ce68cc55", 1, 0, y, w, y);
    }
    c.restore();
    return;
  }
  c.fillStyle = gradient(c, h, id === "foundry" ? ["#190f22", "#572032", "#a7463e"] : id === "tokyo" ? ["#080b25", "#122345", "#215066"] : ["#1b1227", "#553149"]);
  c.fillRect(0, 0, w, h);
  if (id === "foundry") {
    const x = w * 0.76, y = h * 0.26, r = h * 0.17;
    const glow = c.createRadialGradient(x, y, 0, x, y, r * 1.8);
    glow.addColorStop(0, "#ed8d5b55");
    glow.addColorStop(1, "#e35b4500");
    c.fillStyle = glow;
    c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    disk2(c, "#b85755", x, y, r);
    disk2(c, "#db82704a", x - r * 0.15, y - r * 0.18, r * 0.78);
    for (let i = 0; i < 8; i++) line2(c, "#ec9b8633", 1, x - r * 0.7, y - r * 0.6 + i * r * 0.16, x + r * 0.7, y - r * 0.45 + i * r * 0.16);
  }
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 18; i++) {
    const bw = w / (14 - layer * 2), x = i * w / 16 - layer * w * 0.018, y = h * (0.4 + layer * 0.13 + (i * 7 + layer * 3) % 9 / 30);
    c.fillStyle = id === "tokyo" ? ["#172c46", "#13273e", "#101e33"][layer] : ["#4b2e40", "#332434", "#241f30"][layer];
    c.fillRect(x, y, bw, h - y);
    if (id === "tokyo") {
      for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
        c.fillStyle = (i + row + col) % 3 ? "#7295a51b" : "#c18fa52b";
        c.fillRect(x + 4 + col * bw * 0.25, y + 12 + row * 19, 2, 6);
      }
      if (layer === 1 && i % 3 === 0) {
        c.fillStyle = i % 2 ? "#a96e98" : "#5b92a7";
        c.fillRect(x + bw * 0.2, y + 8, 4, 29);
        line2(c, "#a5d8e522", 1, x - 5, y, x + bw + 5, y);
      }
    }
  }
  if (id === "foundry") {
    for (let i = 0; i < 8; i++) {
      const x = i * w / 7, top = h * (0.52 + i % 3 * 0.09), bw = w * 0.065;
      c.fillStyle = gradient(c, h, ["#59505a", "#25212c", "#151722"]);
      c.fillRect(x, top, bw, h - top);
      line2(c, "#ed985b", Math.max(1, w * 15e-4), x + bw * 0.35, h, x + bw * 0.35, top + 12);
      line2(c, "#ffd59a88", 2, x + bw * 0.35, top + 12, x + bw * 0.88, top + 12);
      c.fillStyle = "#bba18a44";
      c.fillRect(x - 2, top + 3, bw + 4, 6);
      for (let j = 0; j < 5; j++) line2(c, "#cf8e6a22", 1, x, top + 40 + j * 40, x + bw, top + 40 + j * 40);
    }
    for (let i = 0; i < 20; i++) {
      c.fillStyle = i % 3 ? "#ffbb7766" : "#fff2bd88";
      c.fillRect(i * 79 % w, h - (i * 37 + t * 0.8) % h, 1.5, 2.5);
    }
  }
  if (id === "tokyo") {
    const haze = c.createLinearGradient(0, h * 0.6, 0, h);
    haze.addColorStop(0, "#60b9de00");
    haze.addColorStop(1, "#64b2d322");
    c.fillStyle = haze;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 19; i++) {
      const x = (i * 97 + t * 2) % (w + 40), y = (i * 53 + t * 5) % h;
      line2(c, "#92c2d51c", 1, x, y, x - 8, y + 22);
    }
  }
  if(id==="tokyo") {
    for(let i=0;i<2;i++){const dir=i%2?1:-1,x=((i*143+t*dir*2.2)%(w+100)+w+100)%(w+100)-50,y=h*(.2+(i%3)*.12);line2(c,i%2?"#8acbd333":"#d79ab733",1.5,x,y,x-dir*28,y);disk2(c,"#d9fbff",x,y,1);}
  } else if(id==="foundry") {
    for(const x of [w*.29,w*.64]){const y=h*.48;c.fillStyle="#281d29";c.fillRect(x-12,y-9,24,13);line2(c,"#ffa05c99",3,x,y+4,x,h);line2(c,"#fff0baaa",1,x,y+4,x,h);}
    line2(c,"#1c1524",4,0,h*.18,w,h*.18);
    for(const x of [w*.16,w*.83])for(let y=h*.18;y<h*.45;y+=9){c.strokeStyle="#96808b44";c.lineWidth=1.3;c.beginPath();c.ellipse(x,y,2.5,4.5,0,0,TAU4);c.stroke();}
  } else if(id!=="tokyo"&&id!=="foundry") {
    const mx=w*.74,my=h*.25,mr=Math.min(w,h)*.115;
    const glow=c.createRadialGradient(mx,my,mr*.6,mx,my,mr*2.9);glow.addColorStop(0,"#ffb5be3a");glow.addColorStop(1,"#c65b9200");c.fillStyle=glow;c.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
    disk2(c,"#eeb5b188",mx,my,mr);disk2(c,"#b8709c22",mx-mr*.19,my-mr*.14,mr*.8);
  }
  c.restore();
}
function inkCrescent(c, x, y, tx, ty, width, color, bend = -.40, start = 0, end = 1) {
  const dx = tx - x, dy = ty - y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, cx = (x + tx) / 2 + nx * len * bend, cy = (y + ty) / 2 + ny * len * bend, top = [], bottom = [];
  for (let i = 0; i <= 20; i++) {
    const local=i/20,u=start+(end-start)*local, v = 1 - u, px = v * v * x + 2 * v * u * cx + u * u * tx, py = v * v * y + 2 * v * u * cy + u * u * ty, ax = 2 * v * (cx - x) + 2 * u * (tx - cx), ay = 2 * v * (cy - y) + 2 * u * (ty - cy), d = Math.hypot(ax, ay) || 1, w = Math.sin(Math.PI * local) * width * 0.65 * (1 - u * 0.45);
    top.push([px - ay / d * w, py + ax / d * w]);
    bottom.push([px + ay / d * w, py - ax / d * w]);
  }
  polygon(c, [...top, ...bottom.reverse()], color);
}
function drawEquipmentSlash(c,x,y,tx,ty,id,alpha=1,motion={}) {
  const reduced=motion.reducedMotion===true;
  const progress=Number.isFinite(motion.progress)?motion.progress:.4;
  const sweep=resolveSlashSweep(progress,id,reduced),h=resolveVisualHarmony(motion.equipment||{},motion.time||0);
  if(sweep.head-sweep.tail<.001)return;
  const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,bend=-.38;
  const size=Math.max(.72,Math.min(1.5,len/170))*sweep.width;
  const styles={blood:[[18,"#1e0a15"],[10,"#ba2245"],[3,"#ff8294"]],laser:[[18,"#5bdeff22"],[7,"#82dfff"],[2,"#fff7fc"]],katana:[[18,"#090914"],[10,"#fff4df"],[2,"#ffffff"]],confetti:[[14,"#16101e"],[7,"#eac46d"],[2,"#fff2cb"]],comic:[[20,"#15101b"],[10,"#ffdc72"]],pixel:[[10,"#695195"],[4,"#dfcaff"]],"glitch-fx":[[13,"#fa6388"],[5,"#8af1ef"]]};
  c.save();c.globalAlpha*=Math.max(0,Math.min(1,alpha));
  const draw=(width,color,offset=0,tail=sweep.tail,head=sweep.head)=>inkCrescent(c,x+nx*offset,y+ny*offset,tx+nx*offset,ty+ny*offset,width*size,color,bend,tail,head);
  const bands=styles[id]||[[21,"#0c0a14"],[14,"#b7e5f4"],[5,"#fff8eb"]];
  if(id==="pixel"){
    for(let i=0;i<14;i++){const u=(i+.5)/14;if(u<sweep.tail||u>sweep.head)continue;const v=1-u,cx=(x+tx)/2+nx*len*bend,cy=(y+ty)/2+ny*len*bend,px=v*v*x+2*v*u*cx+u*u*tx,py=v*v*y+2*v*u*cy+u*u*ty;
      c.fillStyle=i%3?h.primary:h.light;const block=Math.max(2,7*size);c.fillRect(Math.round(px/3)*3,Math.round(py/3)*3,block,block);
    }
  }else{
    for(const [width,color]of bands)draw(width,color);
    if(motion.equipment)draw(1.8,h.primary);
    if(id==="blood")draw(3,"#ff718d",8,sweep.tail,Math.max(sweep.tail,sweep.head-.08));
    if(id==="glitch-fx")draw(2,h.secondary,Math.sin(Math.floor(sweep.progress*12))*7);
  }
  // A leading edge, not a burst: follows the visible end, never implies contact.
  if(!reduced&&sweep.progress<.55&&id!=="pixel"){
    const u=sweep.head,v=1-u,cx=(x+tx)/2+nx*len*bend,cy=(y+ty)/2+ny*len*bend;
    const px=v*v*x+2*v*u*cx+u*u*tx,py=v*v*y+2*v*u*cy+u*u*ty;
    line2(c,h.light,1.5,px-nx*5*size,py-ny*5*size,px+nx*5*size,py+ny*5*size);
  }
  if(motion.contact&&Number.isFinite(motion.contact.x)&&Number.isFinite(motion.contact.y))drawEquipmentImpact(c,motion.contact.x,motion.contact.y,id,sweep.progress);
  c.restore();
}
function drawEquipmentImpact(c, x, y, id, progress2, floorY = Infinity) {
  c.save();
  c.translate(x, y);
  c.globalAlpha *= Math.max(0, 1 - progress2);
  if (id === "comic") {
    const points = Array.from({ length: 24 }, (_, i) => {
      const a = i * TAU4 / 24, r = (i % 2 ? 12 : 30) * (1 + progress2);
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    polygon(c, points, "#17101e");
    c.scale(0.75, 0.75);
    polygon(c, points, "#ffe779");
  } else if (["confetti", "pixel", "katana", "glitch-fx", "laser", "razor", "blood"].includes(id)) {
    for (let i = 0; i < 12; i++) {
      const a = i * 2.399, r = 8 + progress2 * (24 + i * 2), px = Math.cos(a) * r;
      let py = Math.sin(a) * r + (id === "pixel" ? progress2 * progress2 * 70 : 0);
      if (id === "pixel" && y + py > floorY) py = floorY - y - (py - (floorY - y)) * 0.35;
      c.save();
      c.translate(px, py);
      if (id !== "pixel") c.rotate(a + progress2 * 4);
      c.fillStyle = id === "confetti" ? ["#ffeab1", "#d99b3d", "#fff7df"][i % 3] : id === "katana" ? "#14121e" : id === "razor" ? "#e2f6ff" : id === "laser" ? (i%2?"#72f4ff":"#ff80e8") : id === "blood" ? "#ff476f" : id === "pixel" ? ["#be9fff", "#e9ddff", "#7765d1"][i % 3] : i % 2 ? "#ff6b9a" : "#7ceaff";
      c.fillRect(-2, -2, id === "confetti" ? 3 : 4, id === "confetti" ? 6 : 4);
      c.restore();
    }
  }
  c.restore();
}
function drawEquipmentEffects(c, fx, t = 0, floorY = Infinity) {
  if (!fx) return;
  for (const b of fx.bursts) {
    const progress2 = 1 - b.ticks / 30;
    if (b.style === "spark" && b.from) {
      line2(c, "#8feeff", 2, b.from.x, b.from.y, b.x, b.y);
      disk2(c, "#e3ffff", b.x, b.y, 4 * (1 - progress2));
    } else if (b.style === "floor" || b.style === "guard") {
      c.save();
      c.globalAlpha = 1 - progress2;
      c.strokeStyle = b.style === "guard" ? "#b9ffb6" : "#d8c2ff";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(b.x, b.y, 15 + progress2 * 155, 10 + progress2 * 40, 0, 0, TAU4);
      c.stroke();
      c.restore();
    } else drawEquipmentImpact(c, b.x, b.y, b.style, progress2, floorY);
  }
  for (const p of fx.projectiles) {
    line2(c, "#b88fff", 3, p.x, p.y, p.x - p.vx * 2, p.y - p.vy * 2);
    disk2(c, "#f5d9ff", p.x, p.y, 2);
  }
  for (const e of fx.echoes) {
    c.save();
    c.globalAlpha = Math.max(0, e.ticks / 30) * 0.6;
    c.translate(e.x, e.y);
    c.rotate(t * 0.12);
    line2(c, "#eeb8ef", 4, -27, 0, 27, 0);
    line2(c, "#fff0ff", 1, -27, 0, 27, 0);
    line2(c, "#8ecbff", 2, -10, -8, -10, 8);
    c.restore();
  }
}

// consolidated/lab-scene.js
var lab_scene_exports = {};
__export(lab_scene_exports, {
  choreography: () => choreography,
  createLabScene: () => createLabScene
});
function createLabScene() {
  const s = { x: 190, y: 190, vx: 0, vy: 0, age: 0, manual: 0, freeze: 0, drag: null, dummy: { x: 466, y: 180, alive: true, respawn: 0 }, fragments: [], hits: 0, impact: null };
  return {
    state: s,
    adoptPose({ x, y }) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      s.x = Math.max(75, Math.min(570, x));
      s.y = Math.max(85, Math.min(265, y));
      return true;
    },
    aim(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      s.drag = { x: Math.max(20, Math.min(620, x)), y: Math.max(30, Math.min(300, y)) };
      return true;
    },
    fire(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        s.drag = null;
        return false;
      }
      const dx = x - s.x, dy = y - s.y, n = Math.hypot(dx, dy);
      if (n < 4) {
        s.drag = null;
        return false;
      }
      s.vx = dx / n * 17;
      s.vy = dy / n * 17;
      s.manual = 300;
      s.age = 0;
      s.drag = null;
      return true;
    },
    reset() {
      s.x = 190;
      s.y = 190;
      s.vx = s.vy = 0;
      s.manual = 0;
      s.freeze = 0;
      s.age = 0;
      s.hits = 0;
      s.drag = null;
      s.impact = null;
      s.fragments = [];
      s.dummy.alive = true;
      s.dummy.respawn = 0;
    },
    tick() {
      if (s.drag) return;
      s.age++;
      if (s.freeze > 0) {
        s.freeze--;
        return;
      }
      if (s.impact && ++s.impact.age > 24) s.impact = null;
      if (!s.manual) {
        if (!s.dummy.alive && --s.dummy.respawn <= 0) {
          s.dummy.alive = true;
          s.fragments = [];
        }
        return;
      }
      s.manual--;
      const px = s.x, py = s.y;
      s.vy += 0.15;
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.995;
      if (s.x < 75 || s.x > 570) {
        s.x = Math.max(75, Math.min(570, s.x));
        s.vx *= -0.75;
      }
      if (s.y < 85 || s.y > 265) {
        s.y = Math.max(85, Math.min(265, s.y));
        s.vy *= -0.72;
      }
      const d = s.dummy;
      if (d.alive) {
        const dx = s.x - px, dy = s.y - py, n = dx * dx + dy * dy, u = Math.max(0, Math.min(1, ((d.x - px) * dx + (d.y - py) * dy) / (n || 1)));
        if (Math.hypot(px + u * dx - d.x, py + u * dy - d.y) < 54) {
          d.alive = false;
          d.respawn = 70;
          s.freeze = 3;
          s.hits++;
          s.impact = { x: d.x, y: d.y, fromX: px, fromY: py, age: 0 };
          s.fragments = [{ side: -1, x: d.x, y: d.y, vx: -3, vy: -4, a: -0.08 }, { side: 1, x: d.x, y: d.y, vx: 4, vy: 1, a: 0.1 }];
        }
      } else if (--d.respawn <= 0) {
        d.alive = true;
        s.fragments = [];
      }
      for (const f of s.fragments) {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.14;
        f.a += f.vx * 6e-3;
      }
    }
  };
}
function choreography(t, mode) {
  let phase = (t % 120 + 120) % 120;
  if (phase >= 48 && phase < 51) phase = 48;
  const swing = Math.max(0, Math.min(1, (phase - 32) / 16)), ease = 1 - (1 - swing) ** 3;
  return { phase, x: mode === "slice" ? 185 + ease * 205 * (phase < 77 ? 1 : Math.max(0, 1 - (phase - 77) / 35)) : mode === "dash" ? 200 + Math.sin(t * 0.04) * 125 : mode === "bounce" ? 170 + Math.abs(Math.sin(t * 0.032)) * 280 : 235, y: mode === "bounce" ? 245 - Math.abs(Math.sin(t * 0.032)) * 100 : mode === "slice" ? 190 - Math.sin(swing * Math.PI) * 22 : 185 + Math.sin(t * 0.023) * 5, split: mode === "slice" && phase >= 48 && phase < 100, cut: mode === "slice" && phase >= 43 && phase < 83, crouch: mode === "slice" && phase > 22 && phase < 33 ? Math.sin((phase - 22) / 11 * Math.PI) : 0, impact: mode === "slice" && phase === 48 };
}

// consolidated/lab-art.js
var lab_art_exports = {};
__export(lab_art_exports, {
  drawLabCard: () => drawLabCard,
  drawLabScene: () => drawLabScene
});
function spotlight(c,w,h,palette,active,t,world) {
  // Quiet center for specimens; no colored wash, dotted wallpaper or scanning bars.
  c.save();const g=c.createRadialGradient(w*.48,h*.43,h*.16,w*.48,h*.43,w*.65);
  g.addColorStop(0,world==="manga"?"#fff6e91a":"#100f1900");
  g.addColorStop(1,world==="manga"?"#4c385519":"#09071055");
  c.fillStyle=g;c.fillRect(0,0,w,h);c.restore();
}
function fangHalf(c, x, y, r, side, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.rect(side < 0 ? -r * 2 : 0, -r * 2, r * 2, r * 4);
  c.clip();
  foe(c, "fang", 0, 0, r, 0.16);
  c.restore();
}
function splitFang(c, x, y, r, t) {
  for (const side of [-1, 1]) fangHalf(c, x + side * t * 1.6, y + t * t * 0.015, r, side, side * t * 0.025);
}
function drawLabCard(c, w, h, eq, slot, t = 0, active = false, motion = true, sword = null) {
  if (slot === "radar" || slot === "trajectory") { drawSensorPreview(c,w,h,{slot,level:sensorTier(eq[slot],slot),motion,time:t}); return; }
  if (slot === "dash") { drawShopElementDash(c,w,h,{equipment:eq,time:motion?t*16.667:0,motion}); return; }
  if (slot === "pointer") { drawDragArrowPreview(c,w,h,{equipment:eq}); return; }
  const accent = partAccent(eq, slot), palette = { ...corePalette(eq.core), primary: accent }, clock = motion ? t : 0;
  if (slot === "world") drawEquipmentWorld(c, w, h, eq.world, clock);
  else {
    c.fillStyle="#19161f";c.fillRect(0,0,w,h);
    // One broad neutral plane frames the item without simulating a neon light.
    polygon(c,[[w*.34,0],[w,0],[w,h],[w*.64,h]],"#29232d");
    line2(c,"#a99aab16",1,w*.34,0,w*.64,h);
  }
  const pose2 = { ...livingPose(clock, { x: 0.1, y: 0 }, motion), accent, inkPixels: 6, equipment: eq, combo: active ? 4 : 0, speed: active ? 28 : 0, lift: active ? 0.7 : 0.2, aiming: active };
  const crops = { head: [w * .60, Math.min(54,h*.38)*2.05+h*.03, Math.min(54,h*.38)], eyes: [w * 0.56, h * 0.55, 55], body: [w * 0.6, h * 0.61, 54], core: [w * .48, h * .35, 61], tail: [w * 0.74, h * 0.5, 40], slash: [w * 0.26, h * 0.65, 29], world: [w * 0.64, h * 0.7, 23] };
  let [x, y, r] = crops[slot] || crops.body;
  if(sword&&slot==="body")x=w*.54;
  y += Math.sin(clock * 0.025) * (active ? 1 : 0.08);
  c.save();
  c.beginPath();
  c.rect(0, 0, w, h);
  c.clip();
  cube(c, x, y, r, -7 * Math.PI / 180 + pose2.lean, clock, 1, pose2);
  if(sword)drawSwordWeapon(c,{x,y,radius:r,angle:0,sword,motion:false});
  if (slot === "slash") {
    const u = active ? clock % 90 / 90 : 0.55;
    drawEquipmentSlash(c, w * 0.2, h * 0.83, w * 0.83, h * 0.37, eq.slash,.9,{progress:motion&&active?u:.4,equipment:eq,reducedMotion:!motion});
    if (u > 0.4) splitFang(c, w * 0.83, h * 0.38, 14, (u - 0.4) * 22);
  }
  c.restore();
}
function drawLabScene(c, eq, t, mode, scene, { cursor = { x: 0, y: 0 }, motion = true, forgeAt = -Infinity, now = 0, slot = "head", sword = null } = {}) {
  const w = 640, h = 400, palette = corePalette(eq.core), auto = choreography(motion ? t : 18, mode), manual = scene.state.manual > 0 || !!scene.state.drag, s = scene.state, p = manual ? { ...auto, x: s.x, y: s.y, split: !s.dummy.alive, cut: s.freeze > 0, crouch: 0 } : auto;
  drawEquipmentWorld(c, w, h, eq.world, motion ? t * 0.4 : 0);
  spotlight(c, w, h, palette, true, motion ? t : 0, eq.world);
  c.strokeStyle = eq.world === "manga" ? "#46384d44" : "#d8c3ee25";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(38, 286);
  c.lineTo(602, 286);
  c.stroke();
  const pose2 = { ...livingPose(t, cursor, motion), accent: partAccent(eq, slot), inkPixels: 5.5, equipment: eq, combo: mode === "dash" ? 7 : 3, overdrive: mode === "dash", attackProgress: motion?(manual&&s.impact?s.impact.age/24:!manual&&p.cut?Math.max(0,(auto.phase-43)/40):-1):-1, contact:motion&&(manual?!!s.impact&&s.impact.age<3:!!p.impact), reducedMotion:!motion, aiming: mode === "aim" || !!s.drag, lift: mode === "dash" ? 1.3 : 0.4, speed: mode === "dash" ? 40 : 0, forge: motion ? forgeState(now - forgeAt, slot) : null, field: { sx: 1 + p.crouch * 0.12, sy: 1 - p.crouch * 0.12, grip: 1 } };
  c.save();
  const floor=c.createLinearGradient(0,270,0,400);floor.addColorStop(0,"#0b091400");floor.addColorStop(1,eq.world==="manga"?"#49335318":"#08071488");c.fillStyle=floor;c.fillRect(0,270,640,130);
  for(let i=0;i<5;i++)line2(c,eq.world==="manga"?"#35213c17":"#c4abd514",1,20,286+i*i*5,620,286+i*i*5);
  c.globalAlpha=.2;c.fillStyle=eq.world==="manga"?"#3b2a4c":"#03020b";c.beginPath();c.ellipse(p.x,286,Math.max(19,52-(286-p.y)*.13),7,0,0,TAU4);c.fill();c.restore();
  const dx = manual ? s.dummy.x : 472, dy = manual ? s.dummy.y : 181;
  if (!p.split) foe(c, "fang", dx, dy, 29, 0.15);
  else if (manual) {
    for (let i = 0; i < s.fragments.length; i++) {
      const f = s.fragments[i];
      fangHalf(c, f.x, f.y, 29, f.side, f.a);
    }
  } else splitFang(c, dx, dy, 29, Math.max(0, auto.phase - 51));
  if (manual && s.impact) {
    const hit = s.impact, u = hit.age / 24;
    drawEquipmentSlash(c, hit.fromX - 50, hit.fromY + 28, hit.x + 25, hit.y - 16, eq.slash, 1 - u,{progress:u,time:t,equipment:eq,reducedMotion:!motion});
    drawEquipmentImpact(c, hit.x, hit.y, eq.slash, u);
  }
  if (!manual && p.cut) {
    drawEquipmentSlash(c, p.x - 170, p.y + 65, dx + 35, dy - 24, eq.slash, Math.max(0.1, 1 - (auto.phase - 48) / 40),{progress:Math.max(0,(auto.phase-43)/40),time:t,equipment:eq,reducedMotion:!motion});
    if(auto.phase>=48)drawEquipmentImpact(c, dx, dy, eq.slash, Math.max(0, (auto.phase - 48) / 45));
  }
  if (manual && !s.drag) drawCubeDashSmear(c,{x:p.x,y:p.y,vx:s.vx,vy:s.vy,age:s.age,radius:48,equipment:eq,motion});
  if (mode === "dash" && !manual && motion) for (let i = 3; i > 0; i--) {
    c.save();
    c.globalAlpha = 0.06 * i;
    cube(c, p.x - i * 24, p.y, 45, 0, t - i * 4, 1, pose2);
    c.restore();
  }
  cube(c, p.x, p.y, 48, -0.122 + pose2.lean + (manual ? Math.atan2(s.vy, s.vx) * 0.04 : 0), motion ? t : 0, 1, pose2);
  if(sword){const a=manual?Math.atan2(s.drag?s.drag.y-p.y:s.vy,s.drag?s.drag.x-p.x:s.vx):-.12;drawSwordWeapon(c,{x:p.x,y:p.y,radius:48,angle:a,active:manual?!!s.impact||Math.hypot(s.vx,s.vy)>5:!!p.cut,aiming:!!s.drag||mode==='aim',sword,charge:0,motion,time:t});}
  if (s.drag) {
    c.strokeStyle = palette.primary;
    c.lineWidth = 2;
    c.setLineDash([5, 6]);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(s.drag.x, s.drag.y);
    c.stroke();
    c.setLineDash([]);
    c.beginPath();
    c.arc(s.drag.x, s.drag.y, 12, 0, Math.PI * 2);
    c.stroke();
  }
  if (mode === "hit" && !manual) {
    const u = t % 65 / 65;
    c.strokeStyle = palette.primary;
    c.globalAlpha = 1 - u;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(p.x, p.y, 52 + u * 30, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  const title = activeHybrid(eq) || activeSparks(eq)[0];
  c.fillStyle = eq.world === "manga" ? "#39283f" : "#e7d9ee";
  c.font = "10px monospace";
  c.fillText(manual ? "MANUAL / " + s.hits + " DUMMY CUTS" : "AUTO / " + mode.toUpperCase() + " STUDY", 24, 26);
  if (title) {
    c.font = "bold 18px sans-serif";
    c.fillStyle = eq.world === "manga" ? "#39283f" : palette.light;
    c.fillText(title.title, 24, 363);
    c.font = "9px monospace";
    c.fillText(sword?.build ? `${sword.tier.toUpperCase()} / ${sword.name}` : activeHybrid(eq) ? "APEX FORM / DNA FUSED" : "SPARK / VISUAL FUSION", 24, 382);
  } else {
    c.font = "10px monospace";
    c.fillText("DRAG TO AIM / RELEASE TO SLICE", 24, 378);
  }
}

// consolidated/print.js
var print_exports = {};
__export(print_exports, {
  drawStrokePrint: () => drawStrokePrint
});
function drawStrokePrint(c, w, h, stroke2) {
  c.clearRect(0, 0, w, h);
  const ends = stroke2.shear ? [...stroke2.marks, stroke2.shear.end] : stroke2.marks;
  const bearing = 0;
  function local(p) {
    return { x: p.x - stroke2.origin.x, y: p.y - stroke2.origin.y };
  }
  const marks = stroke2.marks.map((m) => ({ ...m, ...local(m) }));
  const bounds = [{ x: 0, y: 0, r: 23 }, ...marks];
  if (stroke2.shear) bounds.push({ ...local(stroke2.shear.end), r: 9 });
  const minX = Math.min(...bounds.map((m) => m.x - m.r)), maxX = Math.max(...bounds.map((m) => m.x + m.r)), minY = Math.min(...bounds.map((m) => m.y - m.r)), maxY = Math.max(...bounds.map((m) => m.y + m.r)), diagramLeft = Math.min(136, w * 0.38), diagramWidth = w - diagramLeft, scale = Math.min((diagramWidth - 30) / (maxX - minX), (h - 18) / (maxY - minY), 1.5), ox = diagramLeft + (diagramWidth - (maxX - minX) * scale) / 2 - minX * scale, oy = (h - (maxY - minY) * scale) / 2 - minY * scale;
  c.save();
  c.translate(ox, oy);
  c.scale(scale, scale);
  c.setLineDash([8 / scale, 5 / scale]);
  let prev = { x: 0, y: 0 };
  for (const m of marks)
    if (!m.fromShear) {
      line(c, "#7d5f64", 1.7 / scale, prev.x, prev.y, m.x, m.y);
      prev = m;
    }
  c.setLineDash([]);
  if (stroke2.shear) {
    const a = local(stroke2.shear), b = local(stroke2.shear.end);
    line(c, INK.black, 9 / scale, a.x, a.y, b.x, b.y);
    shearInk(
      c,
      a.x,
      a.y,
      stroke2.shear.angle - bearing,
      Math.hypot(b.x - a.x, b.y - a.y),
      8 / scale
    );
  }
  if (stroke2.equipment?.slash && stroke2.equipment.slash !== "razor") drawEquipmentSlash(c, -15, 15, 35, -20, stroke2.equipment.slash, 1);
  cube(c, 0, 0, Math.min(20, 14 / scale), stroke2.angle - bearing, 0, 1, { equipment: stroke2.equipment });
  for (const m of marks)
    cutFigure(c, m.kind, m.x, m.y, m.r * 0.78, m.angle - bearing, m.cut - bearing, m.r * 0.14, {
      paper: m.paper,
      torn: m.release || m.fromShear,
      hp: m.hpBefore,
      fault: m.fault,
      twist: 0.045
    });
  c.restore();
  c.save();
  const stampRadius = Math.min(23, h * 0.22, diagramLeft * 0.19);
  cube(c, diagramLeft * 0.6, h * 0.59, stampRadius, 0, 0, 1, { equipment: stroke2.equipment });
  line(c, "#9b859644", 1, diagramLeft - 5, 12, diagramLeft - 5, h - 12);
  c.restore();
  const types = stroke2.marks.map(
    (m) => `${m.paper ? "paper triangle" : (m.small ? "small " : "") + TYPES[m.kind].name}${m.fromShear ? " (forward cut)" : ""}`
  );
  return `Stroke ${stroke2.shot}: ${types.join(", ")}${stroke2.kills > marks.length ? ", and more" : ""}. ${stroke2.points} points.`;
}

// consolidated/field-guide.js
var field_guide_exports = {};
__export(field_guide_exports, {
  drawSpecimen: () => drawSpecimen
});
function drawSpecimen(c, w, h, k) {
  const col = TYPES[k].color;
  c.clearRect(0, 0, w, h);
  c.save();
  c.translate(156, 83);
  function ray(x, y, angle, len) {
    c.save();
    c.setLineDash([5, 6]);
    line(c, col, 2, x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    c.restore();
  }
  if (k === "fang") {
    ray(-46, 7, -0.1, 176);
    foe(c, k, -66, 10, 43, -0.1);
    shearInk(c, 26, 55, -1.24, 108, 9);
    cube(c, 43, 4, 16, -0.26);
  } else if (k === "pulse") {
    arc(c, col, 4, -30, 5, 60);
    foe(c, k, -30, 5, 32);
    shearInk(c, 8, 2, -0.16, 76, 9);
    cube(c, 50, -5, 14, -0.12);
  } else if (k === "prism") {
    foe(c, k, -72, 8, 34, 0);
    ray(-37, 6, -0.1, 143);
    cutFigure(c, k, 73, -6, 33, 0, -1.18, 7);
    shearInk(c, 59, 29, -1.18, 80, 8);
  } else if (k === "fork") {
    cutFigure(c, k, -53, 0, 43, 0.12, 0.06, 7);
    ray(-8, -6, -0.38, 67);
    ray(-8, 6, 0.38, 67);
    foe(c, "fang", 77, -36, 22, 2.7);
    foe(c, "fang", 77, 36, 22, -2.7);
  } else if (k === "bastion") {
    cutFigure(c, "fang", -99, 8, 24, 3, 0, 5);
    cutFigure(c, "prism", -36, 5, 27, 0, 0, 6);
    cutFigure(c, k, 59, 2, 46, 0, -0.04, 8, { torn: true });
    shearInk(c, -39, 4, -0.04, 165, 10);
  } else if (k === "rift") {
    ray(-56, 16, -0.2, 143);
    foe(c, k, -66, 18, 38, 0.16);
    c.save();
    c.translate(65, -9);
    c.scale(47, 47);
    c.strokeStyle = col;
    c.lineWidth = 0.04;
    c.beginPath();
    trace(c, TYPES.rift.outline);
    c.stroke();
    c.restore();
    cube(c, 88, -38, 13, -0.3);
  } else if (k === "well") {
    for (let j = 0; j < 3; j++) {
      const a = j * TAU / 3 + 0.28;
      arc(c, col, 2, -13, 3, 65, a, a + 0.73);
      c.save();
      c.translate(-13, 3);
      c.rotate(a + 0.36);
      poly2(c, col, [
        [37, 0],
        [47, -4],
        [44, 0],
        [47, 4]
      ]);
      c.restore();
    }
    foe(c, k, -13, 3, 30);
    shearInk(c, 45, 9, -0.3, 65, 9);
    cube(c, 84, -3, 14, 0.15);
  } else {
    for (let j = 0; j < 10; j++) {
      const a = j * TAU / 10 - 0.15;
      ray(44 * Math.cos(a), 44 * Math.sin(a), a, 32);
    }
    foe(c, "crown", 0, 0, 39);
  }
  c.restore();
}

// consolidated/quest-art.js
var quest_art_exports = {};
__export(quest_art_exports, {
  drawQuestPart: () => drawQuestPart
});
function drawQuestPart(c, id, x, y, scale = 1, time = 0) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.strokeStyle = "#ffd773";
  c.fillStyle = "#ffd773";
  c.lineWidth = 3;
  if (id === "halo") {
    c.beginPath();
    c.ellipse(0, -40, 28, 8, Math.sin(time) * 0.08, 0, Math.PI * 2);
    c.stroke();
  } else if (id === "wings")
    for (const sign of [-1, 1]) {
      c.beginPath();
      c.moveTo(sign * 24, 0);
      c.lineTo(sign * 57, -28);
      c.lineTo(sign * 42, 12);
      c.closePath();
      c.stroke();
    }
  else if (id === "crown") {
    c.beginPath();
    c.moveTo(-24, -30);
    c.lineTo(-28, -53);
    c.lineTo(-10, -43);
    c.lineTo(0, -60);
    c.lineTo(10, -43);
    c.lineTo(28, -53);
    c.lineTo(24, -30);
    c.closePath();
    c.stroke();
  } else {
    c.fillRect(-24, -16, 48, 32);
    c.fillStyle = "#493021";
    c.fillRect(-25, -7, 50, 4);
    c.fillRect(-3, -16, 6, 32);
  }
  c.restore();
}

// consolidated/storyboard.js
var storyboard_exports = {};
__export(storyboard_exports, {
  drawStory: () => drawStory,
  sceneFor: () => sceneFor
});

// consolidated/levels.js
var PLAYER_SIZE = 46;
var CELL_H = 1240;
var BAND = CELL_H * 5;
var ARENA = Object.freeze({
  // THE TABLE, now a closed arena rather than an open climb.
  //
  // Top at -78,000: the wall HYPER is built to reach. Measured minimum speed to
  // clear it is 242 (bisected against the real integrator); HYPER_SPEED is 280,
  // leaving 34,000px of margin so the wall is still reachable while slashing on
  // the way up.
  //
  // Bottom at +12,000, NOT the symmetric -78,000 that was asked for. Measured
  // fall from a typical peak: +4,000 takes 3.3s, +12,000 takes 6.5s, +78,000
  // takes 32.6s -- because terminal fall speed is capped at 42, distance is the
  // only variable. A symmetric floor is half a minute of falling through empty
  // space on every drop, which is not a lossy cushion, it is a dead screen.
  // 12,000 keeps the bottom wall a real, costly landmark without the wait.
  //
  // ── THE TABLE IS SQUARE: 90,000 x 90,000 ────────────────────────────────
  //
  // This has been wrong three times and the third failure is the one that
  // explains the other two.
  //
  //   +-2,300   crossed in 1.8s. First side contact at tick 195-273 of EVERY
  //             run. A corridor, and the camera lived near a boundary.
  //   +-14,000  better, still wrong: 28,000 x 90,000 is a 1:3.2 SHAFT. The
  //             measured consequence was that 17 of 17 bank contacts in a run
  //             landed on the TOP wall -- the cube was flying up a chimney, not
  //             fighting in a canvas. It is also why the minimap had to be a
  //             133x407 sliver to be honest: an accurate scale drawing of a
  //             shaft IS a strip.
  //
  // A square table fixes the shape of the play AND the shape of the map. All
  // four walls are the same distance, so no direction is privileged, and the
  // minimap can be a real square panel that reads like the room it describes.
  //
  // Measured at 280px/tick (hyper): 4.6s to the top wall, 2.7s to either side
  // from mid-table. At ordinary speed (42px/tick) the sides are 17.9s away and
  // the top is 31s -- the walls are reached by RUNNING, not by existing, which
  // is the whole point of putting a hyper bounce at the end of the effort.
  //
  // The stream generates cells by column, so width costs nothing at runtime:
  // no extra bodies, no extra work, just more room between the rails.
  x: -45e3,
  y: -78e3,
  w: 9e4,
  h: 9e4,
  // floor at y = +12,000
  thick: 150
});
var SPAWN = { x: 0, y: 0 };
var PAD = { x: -102, y: PLAYER_SIZE / 2, w: 204, h: 25 };
var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function randomSource(seed) {
  let s = seed >>> 0;
  return () => (s = Math.imul(s, 1664525) + 1013904223 >>> 0) / 4294967296;
}
function hash(seed, x, y) {
  let h = (seed ^ Math.imul(x, 2654435761) ^ Math.imul(y, 2246822519)) >>> 0;
  h = Math.imul(h ^ h >>> 16, 569420461);
  h = Math.imul(h ^ h >>> 15, 1935289751);
  return (h ^ h >>> 15) >>> 0;
}
var DISTRICTS = ["Undercut", "Razor Belt", "Black Circuit", "Static Bloom", "Dead Channel", "Aftershock"];
var districtIndex = (seed, band) => (Math.max(1, Math.floor(band || 1)) - 1) % DISTRICTS.length;
var openingFacing = (seed) => hash(seed, 71, -4) & 1 ? 1 : -1;

// consolidated/physics.js
var STEP_MS = 1e3 / 60;
var MAX_SPEED = 42;
var BASE_GRAVITY = 1e-3;
var GRAVITY_Y = 1.35;
var MAX_TRAVEL = 5;
function sweptHit(x, y, dx, dy, r, inset = 0) {
  const l = r.x - inset, t = r.y - inset, rr = r.x + r.w + inset, b = r.y + r.h + inset;
  if (x < l && x + dx < l || x > rr && x + dx > rr || y < t && y + dy < t || y > b && y + dy > b)
    return null;
  if (x > l && x < rr && y > t && y < b) return null;
  const tx1 = dx ? (l - x) / dx : -Infinity, tx2 = dx ? (rr - x) / dx : Infinity;
  const ty1 = dy ? (t - y) / dy : -Infinity, ty2 = dy ? (b - y) / dy : Infinity;
  const ex = Math.min(tx1, tx2), ey = Math.min(ty1, ty2);
  const entry = Math.max(ex, ey), exit = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
  if (entry > exit || entry < 0 || entry > 1) return null;
  return { t: entry, nx: ex > ey ? -Math.sign(dx) : 0, ny: ey >= ex ? -Math.sign(dy) : 0 };
}
function projectilePoint(start, velocity, ticks2) {
  const g = GRAVITY_Y * BASE_GRAVITY * STEP_MS * STEP_MS;
  return {
    x: start.x + velocity.x * ticks2,
    y: start.y + velocity.y * ticks2 + 0.5 * g * ticks2 * ticks2
  };
}
var RELEASE_GRAVITY = GRAVITY_Y * BASE_GRAVITY * STEP_MS * STEP_MS;
function releaseSamples(start, velocity, ticks2 = 190, { minVy = -Infinity, maxVy = Infinity, ceiling = MAX_SPEED, limitAfterTicks = 0 } = {}) {
  let x = start.x, y = start.y, vx = velocity.x, vy = velocity.y;
  const initial = Math.hypot(vx, vy), k = initial > ceiling ? ceiling / initial : 1;
  vx *= k;
  vy *= k;
  const points = [{ x, y }];
  for (let t = 1; t <= ticks2; t++) {
    const steps = Math.max(1, Math.ceil((Math.hypot(vx, vy) + 0.5) / MAX_TRAVEL));
    for (let i = 0; i < steps; i++) {
      vy += RELEASE_GRAVITY / steps;
      x += vx / steps;
      y += vy / steps;
      const speed = Math.hypot(vx, vy);
      if (speed > ceiling) {
        vx *= ceiling / speed;
        vy *= ceiling / speed;
      }
    }
    if(t>limitAfterTicks)vy = Math.max(minVy, Math.min(maxVy, vy));
    points.push({ x, y });
  }
  return points;
}

// consolidated/camera.js
var camera_exports = {};
__export(camera_exports, {
  createCamera: () => createCamera,
  frameRun: () => frameRun,
  inView: () => inView,
  toScreen: () => toScreen
});

// consolidated/motion.js
var motion_exports = {};
__export(motion_exports, {
  ANIM: () => ANIM,
  CAMERA: () => CAMERA,
  HYPER_SPEED: () => HYPER_SPEED,
  MOTION: () => MOTION,
  SHAKE: () => SHAKE,
  TIERS: () => TIERS,
  alive: () => alive,
  animationState: () => animationState,
  appear: () => appear,
  createShake: () => createShake,
  curve: () => curve,
  dampedTarget: () => dampedTarget,
  dialGeometry: () => dialGeometry,
  enemyIsSharp: () => enemyIsSharp,
  fade: () => fade,
  hitStopFor: () => hitStopFor,
  leanFor: () => leanFor,
  meterReadout: () => meterReadout,
  progress: () => progress,
  speedRamp: () => speedRamp,
  speedReadout: () => speedReadout,
  stretchFor: () => stretchFor,
  tierOf: () => tierOf
});
var MOTION = Object.freeze({
  // --- player readability -------------------------------------------------
  // Above this speed the cube starts to blur and stretch.
  blurFrom: 0.35,
  // ── SENSORY BUDGET ───────────────────────────────────────────────────────
  //
  // Measured complaint: "it's more sensory load than before... my brain can't
  // keep up". The numbers agreed. At ordinary full speed the cube was already
  // stretched 1.52x with a 26px smear, and hyper doubled it to 2.05x / 53px --
  // on top of a screen that is simultaneously streaming the world past at 280
  // units a tick, pulsing the speedo, and holding a permanent blade.
  //
  // So both ends come down. Normal flight keeps a visible stretch (it is the
  // speed feedback the game is built on) but stops at 1.36x / 19px, and hyper
  // tops out at 1.60x / 32px instead of doubling. Hyper still reads as the
  // extreme state -- it is 18% wider, 68% more smear, and a different colour --
  // it just no longer tries to describe 280 units a tick with a bigger number
  // than the eye can process.
  blurMax: 19,
  // How much extra ramp full hyper adds on top of the normal curve.
  hyperGain: 0.45,
  // Trail samples kept for the player's speed ribbon.
  ribbon: 16,
  // Effect population caps. Every one of these is a hard ceiling so a long
  // chain cannot turn the screen into confetti. Overwhelm is a stack of small
  // decisions like this one, not a single dramatic effect.
  maxShards: 28,
  maxSparks: 30,
  maxImprints: 8,
  // --- enemies ------------------------------------------------------------
  // Enemies are ALWAYS drawn sharp. This is not a tuning value, it is a
  // guarantee, and a test asserts it.
  enemyBlur: 0,
  // --- camera calm --------------------------------------------------------
  // Fraction of the gap to the target the camera closes per tick. Lower is
  // calmer. The old 0.17 made the whole world swim on every launch.
  follow: 0.2,
  // NOTE: the follow rate is NOT the calm. Measured in a real run, lowering
  // it let the cube outrun the lens and cost the player visible targets
  // (30 -> 27 kills at 0.105, 30 -> 22 at 0.062). The calm comes from the
  // lean threshold and from not chasing targets mid-flight; the follow rate
  // stays tight so the cube is always framed well enough to aim from.
  // A dead zone around the ideal framing: the camera ignores player motion
  // inside this fraction of the viewport instead of chasing it.
  deadZone: 0.04,
  // NOTE: this must stay SMALL. A large dead zone sounds calmer, but it lets
  // the cube sit near the edge of the viewport, which shrinks the amount of
  // the field the player can see and read. Calm is worth nothing if the
  // player cannot see the thing they are aiming at.
  // Camera only leans into travel above this fraction of terminal speed.
  leanFrom: 0.55,
  // How hard it leans at terminal speed (px of pan per px/s of velocity).
  leanMax: 1.35,
  // --- shake budget -------------------------------------------------------
  // Shake is capped and regenerates, so a long chain cannot stack into
  // permanent vibration. `budget` is in "kick units" per second.
  shakeBudget: 2.6,
  shakeRegen: 2.2,
  shakeDecay: 0.42
});
var HYPER_SPEED = 280;
function speedRamp(speed, max = MAX_SPEED, ceiling = max) {
  const t = clamp(speed / max, 0, 1), base = clamp((t - MOTION.blurFrom) / (1 - MOTION.blurFrom), 0, 1);
  if (speed <= max) return base;
  const TOP_SPEED = HYPER_SPEED * 1.35, span = Math.max(TOP_SPEED, ceiling), over = clamp((speed - max) / (span - max), 0, 1);
  const bonus = ceiling > max ? MOTION.hyperGain : 0;
  return 1 + (MOTION.hyperGain + bonus) * over ** 0.8;
}
function stretchFor(speed, max = MAX_SPEED, ceiling = max) {
  const t = speedRamp(speed, max, ceiling);
  const k = t ** 1.15;
  return {
    // 0.52 -> 0.36: at k=1 this is 1.36x rather than 1.52x. The silhouette
    // still visibly lengthens with speed; it stops turning the cube into a
    // streak that is hard to track with the eye.
    //
    // `along` is NOT capped at k=1 any more: overspeed carries it to 1.55 at
    // terminal, because a cube at three times the limit should not have the
    // same silhouette as one at the limit. It is bounded by the physics
    // (TOP_SPEED), so it cannot run away.
    along: 1 + 0.36 * k,
    across: Math.max(0.55, 1 - 0.19 * k),
    // Blur IS capped, and at its own number rather than at `blurMax`.
    //
    // `blurMax` (19) is the smear an ORDINARY full-speed shot earns -- it was
    // never a perceptual ceiling, and before this change everything above 42
    // px/tick sat on exactly 19, which was the bug: 42 and 120 blurred the same.
    // Motion smear is the one channel where more really does become
    // nauseating, so it gets a bounded extension instead of the unbounded one
    // the silhouette gets: 19 at the limit, 26 at terminal, linear in k.
    blur: speed <= max ? MOTION.blurMax * k : MOTION.blurMax * k * 0.72 + MOTION.blurMax * 0.65
  };
}
var TIERS = Object.freeze([
  { id: "drift", at: 0, label: "DRIFT", tint: "#b3a6bd" },
  { id: "cruise", at: 0.55, label: "CRUISE", tint: "#ffd166" },
  { id: "surge", at: 0.78, label: "SURGE", tint: "#deff52" },
  // Formerly 'REDLINE'. There is no red line in this game any more -- not on the
  // field, not on the map, not in the readout. The tier survives as the top of
  // the ordinary dial, wearing a name that describes what it feels like rather
  // than a boundary that no longer exists.
  { id: "edge", at: 0.9, label: "EDGE", tint: "#ffb347" },
  // The only tier that is not a position on the 0..100 dial: it means "past the
  // limit", and the HUD reaches it through `speedReadout`'s band rather than
  // through `tierOf`. It lives here so pips, tint and label have one source.
  { id: "hyper", at: 1, label: "HYPER", tint: "#9bf6ff" }
]);
function tierOf(speed, max = MAX_SPEED) {
  const t = clamp(speed / max, 0, 1);
  let tier = TIERS[0], index = 0;
  for (let i = 0; i < TIERS.length; i++)
    if (t >= TIERS[i].at) {
      tier = TIERS[i];
      index = i;
    }
  return { ...tier, index, t };
}
function leanFor(vx, vy, max = MAX_SPEED) {
  const speed = Math.hypot(vx, vy);
  if (!speed) return { x: 0, y: 0 };
  const t = clamp((speed / max - MOTION.leanFrom) / (1 - MOTION.leanFrom), 0, 1);
  const k = MOTION.leanMax * t ** 1.6 / (speed || 1);
  return { x: vx * k, y: vy * k };
}
var CAMERA = Object.freeze({
  /**
   * Steady-follow camera.
   *
   * This replaced three successive attempts at a "saccadic" camera that would
   * hold still, then snap to catch the cube. All of them failed for the same
   * structural reason: at terminal speed the cube crosses the entire viewport
   * in about 20 frames, so a view that stops moving is always forced to make up
   * the gap with a much larger, much faster correction afterwards. Measured on
   * identical inputs, the saccade build moved the view on 78% of frames and
   * still produced a 20+px acceleration spike; the plain follow below moves on
   * 100% of frames while never exceeding 22px/tick.
   *
   * The insight that made this work is that motion sickness is driven by
   * CHANGING velocity (acceleration), not by steady motion. A camera that
   * tracks continuously at a bounded, nearly constant speed reads as calmer
   * than one that freezes and then lunges. So rather than trying to move the
   * view less often, bound how hard it can ever move.
   *
   * Measured over 3 seeds x 700 ticks against the previous build:
   *   mean view acceleration  3.04px -> 1.85px  (-39%)
   *   worst view acceleration 43.7px -> 22.4px  (-49%)
   *
   * Tuning notes:
   *  - `follow` is a fraction of the remaining gap closed per tick. Anything
   *    much above ~0.2 makes the world swim; below ~0.08 the cube outruns the
   *    frame and the hard clamp below does all the work (which reads as a
   *    snap).
   *  - `maxStepPx` is the load-bearing constant. It is the only thing bounding
   *    peak acceleration when the cube is launched at full speed. Dropping it
   *    to 16 calms the frame further (18.9px worst) but the cube then outruns
   *    the view so badly that far fewer enemies stay on screen, which starves
   *    the player of targets; 20 is the knee where the camera is still calm
   *    and the field stays readable.
   */
  follow: 0.2,
  /** Vertical budget per tick. Named, because the brief and the tests both
   *  speak in terms of ONE number for "the worst a dash may move the frame
   *  vertically". 30 is the proven ceiling: below it a full-speed climb is
   *  outrun by the cube, above it the frame reads as a pan. */
  maxCamStepY: 30,
  maxStepPx: 30,
  // ── HORIZONTAL IS NOT THE PROBLEM THE FOLLOW WAS SOLVING ────────────────
  //
  // The follow was tuned for the VERTICAL axis -- a cube climbing at terminal
  // speed, where the frame must keep up or the player flies off the top.
  // Horizontally the same value means a 42px/tick lateral dash drags the entire
  // skyline 30px sideways in a frame, and a dash is the most common thing the
  // player does. That is the "screen whip".
  //
  // So the axes are separated: vertical keeps the proven follow, horizontal is
  // capped at a fraction of it. The cube is allowed to move sideways on screen;
  // the city is not.
  //
  // 18 rather than the 2 that seemed right on paper. A hard 2px/tick cap does
  // stop the whip, and it also breaks the frame: the cube outruns the view by
  // 40px/tick, so it slides across the screen and every dash visibly stutters
  // (measured: p95/p50 traced travel 1.90, i.e. sprites speeding up and slowing
  // down, against a 1.8 threshold). 18 is the value at which the skyline stops
  // whipping and the frame still reads as a glide -- and it is enforced ONCE
  // per tick, on the tick's actual displacement, so no other rule can add to it.
  maxStepXPx: 18,
  /** Deadzone around the framing target, as a fraction of the viewport.
   *  Motion inside it does not move the camera at all -- which is what makes a
   *  small hover, a rail bounce or a breathing idle read as a still frame. */
  deadzoneX: 0.05,
  deadzoneY: 0.1,
  /** Downward look-ahead while falling, in world px, and the speed at which it
   *  is fully applied. Small and damped: enough that a fast drop shows where it
   *  is going, not enough to swing the frame. */
  fallLead: 60,
  fallLeadVy: 40,
  /**
   * How far ahead of the cube the lens frames while it is flying, as a
   * fraction of the viewport at terminal speed.
   *
   * This exists because a capped follow rate and an uncapped player cannot
   * both be satisfied by centring: on a sustained climb the cube outruns the
   * lens and the hard framing clamp parks it against the top edge. Measured
   * before this existed, the cube spent 22-32% of a real run in the outer 12%
   * of the screen, worst case touching y=0.02 -- it read as stuck, not fast.
   *
   * Keep it small. The lead only ever points along the cube's own velocity, so
   * it buys room in front of the player, but a large value on a vertical climb
   * would push the cube down toward the bottom of the screen and shrink the
   * space for targets ahead.
   */
  // CHUNK 6B: 12% more lead so large aerial swings read against the taller arena.
  lead: 0.1344
});
function dampedTarget(ideal, current, viewW, viewH) {
  const dx = ideal.x - current.x, dy = ideal.y - current.y, wx = viewW * MOTION.deadZone, wy = viewH * MOTION.deadZone;
  return {
    x: current.x + (Math.abs(dx) <= wx ? 0 : dx - Math.sign(dx) * wx),
    y: current.y + (Math.abs(dy) <= wy ? 0 : dy - Math.sign(dy) * wy)
  };
}
var SHAKE = Object.freeze({
  /** Peak positional displacement of the frame, in px. */
  maxPx: 7,
  /** Peak rotational roll, in degrees. Deliberately tiny. */
  maxRollDeg: 0.59,
  /** Seconds for trauma to fall from 1 to 0. */
  decaySeconds: 0.38,
  /** Wave frequencies (radians per tick at 60Hz) and phase offsets. Chosen to
   *  be incommensurate so the pattern does not visibly repeat. */
  freqX: 13.7,
  freqY: 17.3,
  freqRoll: 9.1,
  /** A single impact may add at most this much trauma before clamps apply, so
   *  a chain of cuts cannot sum into a seizure. */
  maxBump: 0.55,
  /** Ticks before another bump is accepted. Prevents a fast multi-kill from
   *  re-triggering on every contact in the same frame burst. */
  cooldown: 6
});
function createShake() {
  let trauma = 0, clock = 0, cool = 0, lastBump = 0;
  const wave2 = (f, ph) => Math.sin(clock * f + ph);
  return {
    /** Current positional amplitude in px, already trauma^2 and clamped. */
    get px() {
      const a = trauma * trauma * SHAKE.maxPx;
      return Math.min(SHAKE.maxPx, MOTION.shakeBudget, a);
    },
    /** Back-compat: the old API exposed a single scalar. */
    get amount() {
      return this.px;
    },
    get trauma() {
      return trauma;
    },
    /** The offset to translate the WORLD by, this frame. */
    get x() {
      const a = this.px;
      return a * wave2(SHAKE.freqX, 0);
    },
    get y() {
      const a = this.px;
      return a * wave2(SHAKE.freqY, 1.7) * 0.8;
    },
    /** Roll in DEGREES. Clamped hard; callers must apply it to the world only. */
    get rollDeg() {
      const a = this.px;
      const r = a / SHAKE.maxPx * wave2(SHAKE.freqRoll, 0.9) * SHAKE.maxRollDeg;
      return Math.max(-SHAKE.maxRollDeg, Math.min(SHAKE.maxRollDeg, r));
    },
    /**
     * Ask for a bump of trauma. `force` is in the old pixel units for the
     * callers that already speak it; it is converted to trauma here.
     *
     * MAX, NOT SUM -- and this is the whole anti-stacking rule. Cutting three
     * shapes in one swing used to call this three times, and three summed
     * impulses produced a single very large shake out of three small ones. A
     * shake is a reaction to an event, and three events that land in the same
     * six ticks are one event as far as the eyes are concerned.
     */
    ask(force, _angle, scale = 1) {
      if (cool > 0) return 0;
      const bump = Math.min(SHAKE.maxBump, Math.max(0, force) / MOTION.shakeBudget);
      if (bump <= 0) return 0;
      const next = Math.min(1, Math.max(trauma, bump * scale) + bump * 0.18);
      const gained = next > trauma;
      lastBump = bump;
      if (!gained) return 0;
      trauma = next;
      cool = SHAKE.cooldown;
      return this.px;
    },
    /** Advance. `dt` is in ticks. */
    tick(dt) {
      if (cool > 0) cool = Math.max(0, cool - dt);
      if (trauma > 0) {
        trauma = Math.max(0, trauma - dt / 60 / SHAKE.decaySeconds);
        clock += dt;
      }
      return this.px;
    },
    reset() {
      trauma = 0;
      clock = 0;
      cool = 0;
      lastBump = 0;
    }
  };
}
function animationState(state) {
  if (state.stop > 0) return "frozen";
  if (state.phase === "dying" || state.phase === "over") return "dying";
  if (state.blade > 0) return "strike";
  if (state.held) return "focus";
  if (state.phase === "playing") return "flight";
  return "rest";
}
function hitStopFor(kind, pinned = false) {
  if (pinned) return 4;
  return kind === "armor" ? 3 : 2;
}
var HIGH_SPEED = HYPER_SPEED * 1.35;
function speedReadout(speed, max = MAX_SPEED, ceiling = HYPER_SPEED, hyperLive = null) {
  const TOP = HIGH_SPEED, ordinary = Math.pow(clamp(speed / max, 0, 1), 0.5) * 0.7, extra = speed <= max ? 0 : 0.3 * Math.pow(clamp((speed - max) / (TOP - max), 0, 1), 0.75), t = clamp(ordinary + extra, 0, 1), kmh = Math.round(100 * t), over = hyperLive === null ? speed > max * 2 : hyperLive;
  const band = over ? "HYPER" : speed > max * 1.9 ? "EDGE" : speed > max * 1.15 ? "SURGE" : speed > max * 0.5 ? "CRUISE" : "DRIFT";
  return { kmh, t, over, live: over, band };
}
function enemyIsSharp(motion) {
  return !motion || MOTION.enemyBlur === 0;
}
var EASE = {
  linear: (t) => t,
  // Fast out, slow in: things that APPEAR (pops, stamps, sparks) arrive hard.
  out: (t) => 1 - (1 - t) ** 3,
  // Slow out, fast in: things that LEAVE (fades, drops) go away decisively.
  in: (t) => t ** 2.2,
  // Both ends soft. Used for anything that reads as a "breath".
  smooth: (t) => t * t * (3 - 2 * t),
  // Overshoot then settle. Only for impacts, where a little bounce sells weight.
  snap: (t) => 1 - (1 - t) ** 2 * Math.cos(t * 2.6)
};
var ANIM = Object.freeze({
  // ── CONTACT INK: 0.4 SECONDS, HARD CEILING ─────────────────────────────
  //
  // This was 34 ticks -- 567 ms -- and it is the single longest-lived mark the
  // game draws. The report is blunt about the result: long white/dark strokes
  // were being found stretched across the screen at moments when the player was
  // not aiming and had not dashed, and they read as a broken line left behind
  // by mistake rather than as a mark that had been made.
  //
  // 20 ticks is 333 ms: long enough that the eye registers a mark ON the world
  // and ties it to the cut that made it, short enough that nothing is still on
  // screen by the time the cube has moved somewhere else. The brief's number is
  // "under half a second"; this is comfortably under a third.
  imprint: { life: 20, hold: 0.4, ease: "smooth" },
  // A cut shard is debris: it leaves quickly and must not linger to be read.
  shard: { life: 20, hold: 0.1, ease: "in" },
  // A spark is a short punctuation mark, not an object.
  spark: { life: 11, hold: 0, ease: "in" },
  // The hit flash on an enemy: two frames of white, then gone. Any longer and
  // a fast target reads as a solid white blob sliding across the screen.
  flash: { life: 16, hold: 0.18, ease: "out" },
  // The blade sweep is the single most important read in the game: it must be
  // long enough to show the ARC of the cut, short enough to feel like a whip.
  // ── 38, NOT 31 ──────────────────────────────────────────────────────────
  //
  // `s.blade` is set to 16..31 on a dash (`16 + 15 * speed/MAX_SPEED`) but a
  // CUT extends it with `s.blade = min(38, s.blade + 7)`. So on a three-kill
  // dash the hitbox was live for 38 ticks while this animation expired at 31 --
  // for the last seven ticks the blade could still cut things and drew nothing
  // at all. That is the "blade expired mid-flight" read in the recording, and
  // it is a hitbox the player cannot see.
  //
  // The window covers the longest the counter can be, and the last four ticks
  // flicker (see `bladeAlpha`) so expiry is telegraphed instead of silent.
  blade: { life: 38, hold: 0, ease: "smooth" },
  // A pop is the shape appearing. It overshoots slightly so the eye catches it.
  pop: { life: 18, hold: 0, ease: "snap" },
  // The Overdrive ring is ambient, so it is the slowest thing here.
  drive: { life: 60, hold: 0.3, ease: "smooth" }
});
function progress(name, age) {
  const a = ANIM[name];
  if (!a) return 1;
  return clamp(age / a.life, 0, 1);
}
function curve(name, age) {
  const a = ANIM[name];
  if (!a) return 1;
  return EASE[a.ease](progress(name, age));
}
function fade(name, age) {
  const a = ANIM[name];
  if (!a) return 0;
  const t = progress(name, age);
  if (t >= 1) return 0;
  if (t <= a.hold) return 1;
  return 1 - EASE.smooth((t - a.hold) / (1 - a.hold || 1));
}
function alive(name, age) {
  return age >= 0 && age < ANIM[name].life;
}
function appear(name, age) {
  return 0.55 + 0.45 * curve(name, age);
}
function meterReadout(s) {
  const hp = Math.max(0, s.hp | 0), edgeMax = s.edgeMax || 3, edge = clamp(s.edge ?? 0, 0, edgeMax), regenWindow = s.regenWindow || 60, regen = edge >= edgeMax ? 0 : clamp((s.recharge || 0) / regenWindow, 0, 1), focus = clamp(s.focus ?? 1, 0, 1);
  return {
    hp,
    edge,
    edgeMax,
    edgeEmpty: edge <= 0,
    // The timer only means something when a pip is actually owed.
    regen: edge >= edgeMax ? 0 : regen,
    regenDue: edge < edgeMax && regen > 0.02,
    focus,
    focusPct: Math.round(100 * focus),
    // Local, not global: these two describe this meter, and a shared
    // "isLow" flag would be the kind of state that ends up meaning two things.
    focusLive: !!s.held && !s.depleted && focus > 0.01,
    focusEmpty: !!s.depleted || focus <= 0.01
  };
}
function dialGeometry(readout) {
  const arc2 = clamp(readout.t, 0, 1), needle = clamp(readout.t, 0, 1.15);
  return {
    arcPct: arc2 * 100,
    // -90deg is the needle at rest (pointing left along the dial's base); a
    // full 0..1 sweep is 180deg.
    needleDeg: -90 + needle * 180,
    over: readout.t > 1
  };
}

// consolidated/camera.js
function createCamera() {
  let width = 1, height = 1, base = 1, x = 0, y = 0, zoom = 1, trainingScale = 1;
  // CHUNK 1: a field-wide scale the arena modes can lower to see more of the
  // (now ~1.3x larger) table. 1 = unchanged; below 1 pulls the lens back.
  let fieldScale = 1;
  let prevX = x, prevY = y, prevZoom = zoom;
  let home = { x: 0, y: 0 }, last = home, docked = true, room = false, forward = 1;
  function frameScale() {
    const portrait = width < height * 0.85;
    return (room ? portrait ? width / 676 : Math.min(width / 830, height / 728) : portrait ? width / 792 : Math.min(width / 1330, height / 780)) * fieldScale;
  }
  const LEAD = CAMERA.lead;
  let leadX = 0, leadY = 0;
  const MAX_LEAD_V = 42;
  let wasPinned = false;
  let pin = 0;
  function desired(p, stationary, vx = 0, vy = 0, z = zoom, aimK = 1, advance = true) {
    const portrait = width < height * 0.85;
    const inset = room ? 0.28 : 0.32;
    const ax = stationary ? forward > 0 ? inset : 1 - inset : 0.48;
    const ay = room ? 0.76 : portrait ? 0.69 : 0.78;
    const fast = Math.hypot(vx, vy) > MAX_SPEED, leadTarget = fast ? 0 : 1;
    if (advance) {
      const rate = stationary ? 0.5 : aimK < 1 ? 0 : 0.08;
      leadX += (clamp(-vx / MAX_LEAD_V * LEAD, -LEAD, LEAD) * leadTarget - leadX) * rate;
      leadY += (clamp(-vy / MAX_LEAD_V * LEAD, -LEAD, LEAD) * leadTarget - leadY) * rate;
    }
    const lead = { x: leadX, y: leadY };
    const axMix = ax, ayMix = ay;
    const lean = fast ? { x: 0, y: 0 } : leanFor(vx, vy);
    return {
      x: p.x - width / (base * z) * axMix + lean.x - lead.x * (width / (base * z)),
      y: p.y - height / (base * z) * ayMix + lean.y - lead.y * (height / (base * z))
    };
  }
  function snap(p, stationary = false) {
    last = { ...p };
    docked = stationary;
    zoom = prevZoom = 1;
    const d = desired(p, stationary);
    x = prevX = d.x;
    y = prevY = d.y;
  }
  return {
    resize(w, h) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      base = frameScale() * trainingScale;
      snap(last, docked);
    },
    reset(p, facing = 1, onRack = false) {
      room = onRack;
      base = frameScale() * trainingScale;
      forward = facing;
      home = { ...p };
      pin = 0;
      snap(p, true);
    },
    setTrainingScale(value) {trainingScale=clamp(value,1,1.5);base=frameScale()*trainingScale;snap(last,docked);},
    setFieldScale(value) {fieldScale=clamp(Number.isFinite(value)?value:1,0.75,1.1);base=frameScale()*trainingScale;snap(last,docked);},
    snap,
    /** The lens does NOT dolly. A fixed scale, with only the faintest lean
     *  into speed, because a zoom that moves while you aim is the fastest way
     *  to make a fast game unwatchable. `widen` is accepted and ignored so
     *  callers and tests keep one signature. */
    tick(p, v, stationary, motion = true, next = null, widen = 0, timeScale = 1) {
      prevX = x;
      prevY = y;
      prevZoom = zoom;
      last = { ...p };
      docked = stationary;
      const speed = Math.hypot(v.x, v.y);
      zoom = stationary || !motion ? 1 : 1;
      const aimK = clamp(timeScale, 0.25, 1), d = desired(p, stationary, motion ? v.x : 0, motion ? v.y : 0, zoom, aimK);
      if (next) {
        d.x += clamp(
          (next.x - p.x) * 0.45,
          -width / (base * zoom) * 0.2,
          width / (base * zoom) * 0.2
        );
        d.y += clamp(
          (next.y - p.y) * 0.4,
          -height / (base * zoom) * 0.14,
          height / (base * zoom) * 0.14
        );
      }
      const vw = width / (base * zoom), vh = height / (base * zoom), dzX = vw * CAMERA.deadzoneX, dzY = vh * CAMERA.deadzoneY, fallLead = v.y > 0 ? CAMERA.fallLead * Math.pow(clamp(v.y / CAMERA.fallLeadVy, 0, 1), 2) : 0, errX = d.x - x, errY = d.y + fallLead - y, dxIn = Math.abs(errX) <= dzX ? 0 : errX - Math.sign(errX) * dzX, dyIn = Math.abs(errY) <= dzY ? 0 : errY - Math.sign(errY) * dzY, dx = dxIn * CAMERA.follow * aimK, dy = dyIn * CAMERA.follow * aimK, dist = Math.hypot(dx, dy), cap = CAMERA.maxCamStepY, soft = cap * (1 - Math.exp(-dist * 1 / cap)), k = dist > 1e-6 ? Math.min(1, soft / dist) : 1;
      const sx = dx * k, sy = dy * k, capX = CAMERA.maxStepXPx;
      x += Math.abs(sx) > capX ? Math.sign(sx) * capX : sx;
      y += sy;
      const sp = Math.hypot(v.x, v.y), PIN_AT = MAX_SPEED * 2.4, PIN_FROM = MAX_SPEED, pinTarget = clamp((sp - PIN_FROM) / (PIN_AT - PIN_FROM), 0, 1);
      pin += (pinTarget - pin) * (pinTarget > pin ? 0.34 : 0.5);
      const pinned = pin > 0.999;
      if (pin > 0) {
        const px = p.x - vw * 0.48, py = p.y - vh * 0.56;
        x += (px - x) * pin;
        y += (py - y) * pin;
      }
      let netFired = false;
      const mx = vw * 0.16, my = vh * 0.16, netXCap = Math.max(CAMERA.maxStepXPx, Math.abs(v.x) * 1.15 + 2), netYCap = Math.max(CAMERA.maxCamStepY, Math.abs(v.y) * 1.15 + 2), toward = (cur, want, cap2) => Math.abs(want - cur) > cap2 ? cur + Math.sign(want - cur) * cap2 : want;
      netFired = false;
      if (p.x < x + mx) x = toward(x, p.x - mx, netXCap), netFired = true;
      else if (p.x > x + vw - mx) x = toward(x, p.x - (vw - mx), netXCap), netFired = true;
      if (p.y < y + my) y = toward(y, p.y - my, netYCap), netFired = true;
      else if (p.y > y + vh - my) y = toward(y, p.y - (vh - my), netYCap), netFired = true;
      if (pinned) {
        wasPinned = true;
      } else if (wasPinned) {
        wasPinned = false;
      }
      {
        const tdx = x - prevX, tdy = y - prevY, bx = netFired ? Math.max(CAMERA.maxStepXPx, Math.abs(v.x) * 1.15 + 2) : CAMERA.maxStepXPx, by = netFired ? Math.max(CAMERA.maxCamStepY, Math.abs(v.y) * 1.15 + 2) : CAMERA.maxCamStepY;
        if (Math.hypot(v.x, v.y) <= MAX_SPEED) {
          if (Math.abs(tdx) > bx) x = prevX + Math.sign(tdx) * (bx - 1e-9);
          if (Math.abs(tdy) > by) y = prevY + Math.sign(tdy) * (by - 1e-9);
        }
      }
    },
    /** Fixed-scale return framing. Fit actor + deck with capped translation;
     * never zoom/dolly or alter input/world coordinates. */
    frameLanding(p,deck) {
      const scale=base*zoom,vw=width/scale,vh=height/scale;
      const mx=30/scale,mt=Math.min(180,height*.26)/scale,mb=70/scale;
      const left=Math.min(p.x-28,deck.x-14),right=Math.max(p.x+28,deck.x+deck.w+14);
      const top=Math.min(p.y-32,deck.y-65),bottom=Math.max(p.y+32,deck.y+deck.h+45);
      const fit=(cur,min,max,span,before,after)=>max-min<=span-before-after?clamp(cur,max-span+after,min-before):cur;
      const tx=fit(x,left,right,vw,mx,mx),ty=fit(y,top,bottom,vh,mt,mb);
      x=clamp(tx,prevX-CAMERA.maxStepXPx,prevX+CAMERA.maxStepXPx);
      y=clamp(ty,prevY-CAMERA.maxCamStepY,prevY+CAMERA.maxCamStepY);
    },
    view(alpha = 1) {
      const scale = base * (prevZoom + (zoom - prevZoom) * alpha);
      const left = prevX + (x - prevX) * alpha, top = prevY + (y - prevY) * alpha;
      const origin = desired(home, true, 0, 0, scale / base, 1, false);
      return {
        x: left,
        y: top,
        width,
        height,
        scale,
        w: width / scale,
        h: height / scale,
        panX: left - origin.x,
        panY: top - origin.y
      };
    }
  };
}
var toScreen = (view, p) => ({
  x: (p.x - view.x) * view.scale,
  y: (p.y - view.y) * view.scale
});
var inView = (view, p, margin = 100) => p.x >= view.x - margin && p.x <= view.x + view.w + margin && p.y >= view.y - margin && p.y <= view.y + view.h + margin;
function frameRun(camera, run, motion = true) {
  const s = run.state, p = run.world.player;
  const looking = s.opening ? s.opening.rest && s.phase !== "ready" : s.phase === "playing" && (s.held || s.breath > 0);
  camera.tick(p.position, p.velocity, s.phase === "ready", motion, looking ? run.nearest() : null, 0);
  if(s.wave?.platform&&["return","choose"].includes(s.wave.phase))camera.frameLanding(p.position,s.wave.platform);
}

// consolidated/storyboard.js
function sceneFor(s, target, falling, gap) {
  if (!s.story || !["ready", "playing"].includes(s.phase)) return null;
  const o = s.opening;
  if (o) {
    if (o.returning) return "rewind";
    if (!o.rest || o.finishing) return null;
    if (!s.edge && !o.free) return "stock";
    if (o.row === 2) return target?.hp === 1 ? "crack" : "shell";
    if (o.misses) return "retry";
    return o.row === 1 ? "pull" : "tap";
  }
  if (!s.tutorialActive) return null;
  if (s.caught) return "net";
  if (s.phase === "ready" && target?.sentry) return "lane";
  if (s.net && falling && gap < 400) return "rise";
  if (s.firstAir && s.breath > 0) return "focus";
  if (s.band === 1 && s.edge === 0) return "stock";
  return null;
}
var paper = "#f0dfbd";
var ink = "#232b2a";
var fern = "#206253";
var seam2 = "#aa997c";
var acid = INK.acid;
var smooth = (v) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};
function arrow(c, color, x, y, xx, yy, width = 2, head2 = 6) {
  const a = Math.atan2(yy - y, xx - x), dx = Math.cos(a), dy = Math.sin(a);
  line(c, color, width, x, y, xx - dx * head2 * 0.6, yy - dy * head2 * 0.6);
  poly2(c, color, [[xx, yy], [xx - dx * head2 - dy * head2 * 0.55, yy - dy * head2 + dx * head2 * 0.55], [xx - dx * head2 + dy * head2 * 0.55, yy - dy * head2 - dx * head2 * 0.55]]);
}
function clockFace(c, x, y, r) {
  arc(c, fern, 1.7, x, y, r);
  line(c, fern, 1.8, x, y - r * 0.68, x, y, x + r * 0.53, y + r * 0.22);
}
function key(c, x, y, kind, down) {
  c.save();
  c.translate(x, y);
  const w = kind === "space" ? 33 : 20;
  c.fillStyle = ink;
  c.fillRect(-w / 2, -8, w, 19);
  c.fillStyle = down ? acid : INK.paper;
  c.fillRect(2 - w / 2, down ? -5 : -8, w - 4, down ? 13 : 14);
  if (kind === "space") line(c, ink, 1.9, 8 - w / 2, -0.8, 8 - w / 2, 2.5, w / 2 - 8, 2.5, w / 2 - 8, -0.8);
  else if (kind === "shift") poly2(c, ink, [[-6, 0], [0, -6], [6, 0], [2.8, 0], [2.8, 5], [-2.8, 5], [-2.8, 0]]);
  else arrow(c, ink, -5, 3, 5, -4, 1.5, 4);
  c.restore();
}
function hand(c, x, y, device, down, size = 1) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  if (device === "keys") key(c, 7, 9, "space", down);
  else if (device === "touch") {
    c.rotate(-0.28);
    c.beginPath();
    c.moveTo(-3, 17);
    c.lineTo(-3, 2);
    c.bezierCurveTo(-3, -2, 3, -2, 3, 2);
    c.lineTo(3, 12);
    c.bezierCurveTo(3, 8, 8, 8, 9, 12);
    c.bezierCurveTo(10, 9, 14, 10, 15, 14);
    c.bezierCurveTo(18, 12, 21, 14, 21, 18);
    c.lineTo(20, 29);
    c.lineTo(16, 35);
    c.lineTo(2, 33);
    c.lineTo(-8, 21);
    c.bezierCurveTo(-12, 15, -7, 13, -3, 17);
    c.closePath();
    c.fillStyle = INK.paper;
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 2;
    c.stroke();
    line(c, ink, 1.3, 3, 12, 3, 17);
    line(c, ink, 1.2, 9, 12, 9, 17);
    line(c, ink, 1.2, 15, 14, 15, 19);
    poly2(c, down ? acid : "#9ac3ac", [[0, 30], [18, 31], [16, 36], [3, 35]], ink, 1.4);
  } else {
    poly2(c, INK.paper, [[0, 0], [3, 25], [9, 18], [15, 28], [20, 25], [14, 16], [24, 15]], ink, 2.1);
    if (down) poly2(c, acid, [[4, 8], [6, 18], [10, 14], [16, 13]]);
  }
  c.restore();
}
function tapMark(c, x, y, device, down) {
  for (let j = 0; j < 3; j++) {
    const a = -Math.PI + j * 0.99;
    line(c, fern, 2, x + Math.cos(a) * 8, y + Math.sin(a) * 8, x + Math.cos(a) * 13, y + Math.sin(a) * 13);
  }
  hand(c, x, y, device, down, 0.7);
}
var flag = (c, x, y, r) => foe(c, "fang", x, y, r, 1.15, { paper: true });
var scraps = (c, k, x, y, r, opts = {}) => cutFigure(c, k, x, y, r, k === "fang" && opts.paper ? 1.15 : 0, -0.49, r * 0.29, { twist: 0.09, ...opts });
function stocks(c, x, y, n, f = 0) {
  for (let i = 0; i < 3; i++) {
    c.fillStyle = ink;
    c.fillRect(x + i * 12, y, 10, 7);
    c.fillStyle = i < n ? acid : "#857f71";
    c.fillRect(x + i * 12 + 1.5, y + 1.5, 7, 4);
    if (i === n) {
      c.fillStyle = paper;
      c.fillRect(x + i * 12 + 1.5, y + 1.5, 7 * f, 4);
    }
  }
}
function stripe(c, y) {
  c.fillStyle = "#4a5f6b";
  c.fillRect(-30, y, 60, 6);
  for (let x = -25; x < 25; x += 13) line(c, "#8fa9b8", 1.6, x, y + 5, x + 3, y + 1);
}
function splitLine(c) {
  shearInk(c, -27, 15, -0.43, 61, 6);
}
function impression(c, scene, i, device) {
  if (scene === "tap" || scene === "retry" || scene === "rewind") {
    if (i === 0 && scene !== "tap") {
      cube(c, -17, 8, 7);
      arrow(c, fern, 21, -11, -5, 4, 2, 6);
      arc(c, seam2, 1.5, -17, 8, 12);
    } else if (i === 0) {
      flag(c, -4, -3, 15);
      if (device === "keys") key(c, 8, 12, "space", true);
      else tapMark(c, -2, -5, device, true);
    } else if (i === 1) {
      cube(c, -21, 10, 8, -0.17);
      for (let k = 0; k < 4; k++) disk(c, fern, -8 + k * 6, 6 - k * 2.9, 1.8);
      flag(c, 21, -8, 10);
    } else {
      scraps(c, "fang", -10, 3, 12, { paper: true });
      scraps(c, "fang", 13, -7, 13, { paper: true });
      splitLine(c);
    }
  } else if (scene === "pull" || scene === "focus") {
    if (i === 0) {
      if (scene === "focus") {
        clockFace(c, 15, -10, 8);
        stocks(c, -18, 15, 2);
      } else arc(c, fern, 1.6, -9, -6, 9);
      if (device === "keys") key(c, -7, 3, scene === "focus" ? "shift" : "aim", true);
      else tapMark(c, -8, -4, device, true);
    } else if (i === 1) {
      if (device === "keys") {
        key(c, -14, 5, "aim", true);
        arrow(c, fern, 4, 4, 22, -10, 2, 7);
      } else {
        arc(c, seam2, 1.4, 13, -11, 5);
        arrow(c, fern, -15, 9, 10, -9, 2.4, 7);
        hand(c, 11, -10, device, true, 0.61);
      }
    } else {
      cube(c, -15, 9, 8, -0.24);
      shearInk(c, -7, 8, -0.57, 39, 6);
      scraps(c, "fang", 20, -11, 11, { paper: scene === "pull" });
      if (scene === "focus") stocks(c, -17, 17, 3);
    }
  } else if (scene === "shell") {
    if (i === 0) {
      foe(c, "bastion", 0, 0, 19);
    } else if (i === 1) {
      blade(c, -24, 14, -0.47, 12);
      foe(c, "bastion", 4, -1, 15);
      hand(c, 6, 1, device, true, 0.64);
    } else {
      foe(c, "bastion", 0, 0, 19, 0, { hp: 1, fault: -0.49 });
      poly2(c, "#fa9580", [[14, -18], [24, -20], [19, -15], [13, -15]], ink, 1);
    }
  } else if (scene === "crack") {
    if (i === 0) foe(c, "bastion", 0, 0, 19, 0, { hp: 1, fault: -0.49 });
    else if (i === 1) {
      foe(c, "bastion", -4, -2, 15, 0, { hp: 1, fault: -0.49 });
      tapMark(c, 1, 1, device, true);
    } else {
      scraps(c, "bastion", 1, 0, 18, { hp: 1, fault: -0.49 });
      splitLine(c);
    }
  } else if (scene === "lane") {
    if (i === 0) {
      foe(c, "fang", -14, 0, 16);
      c.setLineDash([3, 3]);
      line(c, "#5f7f8f", 2, 0, 0, 26, 0);
      c.setLineDash([]);
    } else if (i === 1) {
      arrow(c, "#5f7f8f", -25, 0, 25, 0, 3, 8);
      cube(c, 0, 12, 6);
      arrow(c, fern, 0, 5, 10, -16, 2, 6);
    } else {
      scraps(c, "fang", -2, 1, 17);
      splitLine(c);
    }
  } else if (scene === "net" || scene === "rise") {
    stripe(c, 13);
    if (i === 0) {
      cube(c, -6, -12, 7, 0.3);
      arrow(c, "#5f7f8f", 4, -8, 10, 8, 2, 6);
    }
    if (i === 1) {
      c.beginPath();
      c.moveTo(-29, -2);
      c.quadraticCurveTo(0, 17, 29, -2);
      c.strokeStyle = fern;
      c.lineWidth = 3;
      c.stroke();
      cube(c, 0, 0, 7, 0.12);
    }
    if (i === 2) {
      cube(c, 11, -15, 6, -0.26);
      arrow(c, fern, -9, 8, 4, -8, 3, 7);
      line(c, seam2, 1.8, -28, 0, -12, 5, -9, 2);
      line(c, seam2, 1.8, 6, 5, 9, 7, 29, 1);
    }
  } else if (scene === "stock") {
    stocks(c, -17, 6, i === 0 ? 0 : i === 1 ? 0 : 1, i === 1 ? 0.6 : 0);
    if (i === 1) clockFace(c, -1, -8, 9);
    else if (i === 0) cube(c, 0, -9, 8);
    else shearInk(c, -15, -3, -0.36, 36, 7);
  }
}
function film(c, v, scene, device, frame, actors) {
  const z = Math.min(1.22, (v.width - 32) / 270, v.height * 0.157 / 64), x = Math.round(v.width / 2), bottom = Math.round(v.height - Math.max(12, v.height * 0.032) - 32 * z), above = Math.round(Math.min(v.height * 0.34, 120 + 32 * z));
  const room = (y2) => Math.min(...actors.map((a) => Math.max(Math.abs(a.x - x) - 139 * z, Math.abs(a.y - y2) - 33 * z) - a.r));
  const y = room(bottom) < 8 && room(above) > room(bottom) ? above : bottom;
  c.save();
  c.translate(x, y);
  c.scale(z, z);
  const cut = [[-136, -32], [128, -32], [137, -23], [137, 24], [127, 33], [-130, 33], [-138, 24], [-138, -24]];
  c.save();
  c.translate(2, 3);
  poly2(c, "#182a2c", cut);
  c.restore();
  poly2(c, paper, cut, ink, 2);
  for (let j = 0; j < 3; j++) {
    const px = (j - 1) * 85;
    if (j > 0) {
      c.setLineDash([2.5, 3.5]);
      line(c, seam2, 1, px - 42, -23, px - 42, 24);
      c.setLineDash([]);
      poly2(c, ink, [[px - 45, -3], [px - 39, 0], [px - 45, 3]]);
    }
    c.save();
    c.translate(px, 0);
    impression(c, scene, j, device);
    c.restore();
    line(c, j === frame ? fern : seam2, j === frame ? 3 : 1, px - 28, 25, px + 28, 25);
  }
  for (const x2 of [-130, 129]) for (const y2 of [-20, 19]) disk(c, ink, x2, y2, 2);
  c.restore();
}
function bracket(c, x, y, r) {
  for (let j = 0; j < 4; j++) arc(c, INK.paper, 1.6, x, y, r, j * Math.PI / 2 + 0.16, j * Math.PI / 2 + 0.66);
}
function drawStory(c, { v, p, e, shot, scene, device, age, motion, aim }) {
  c.save();
  const period = 168, t = motion ? age % period / period : 0.39, stage = motion ? Math.min(2, Math.floor(t * 3)) : scene === "crack" ? 2 : scene === "shell" ? 1 : 0;
  const actors = [{ ...toScreen(v, p), r: 24 * v.scale + 10 }];
  if (e) actors.push({ ...toScreen(v, e), r: e.r * v.scale + 9 });
  film(c, v, scene, device, stage, actors);
  if (aim || scene === "stock" || scene === "rewind" || !shot) {
    c.restore();
    return;
  }
  const b = toScreen(v, p), q = e && toScreen(v, e), unit = Math.hypot(shot.x, shot.y) || 1, dx = shot.x / unit, dy = shot.y / unit;
  if (scene === "net" || scene === "rise") {
    const a = b.x > v.width / 2 ? -1 : 1;
    for (let j = 0; j < 2; j++) line(c, acid, 2.5, b.x + a * (20 + j * 9) - 6, b.y - 15 - j * 16, b.x + a * (20 + j * 9), b.y - 23 - j * 16, b.x + a * (20 + j * 9) + 6, b.y - 15 - j * 16);
    c.restore();
    return;
  }
  if (!q || q.x < 12 || q.x > v.width - 12 || q.y < 24 || q.y > v.height - 20) {
    c.restore();
    return;
  }
  const r = e.r * v.scale + 7;
  bracket(c, q.x, q.y, r);
  const pulling = scene === "pull" || scene === "focus";
  if (pulling) {
    const pullX=-dx,pullY=-dy;
    const travel = clamp(Math.min(v.width, v.height) * 0.16, 36, 83), bx = clamp(b.x + pullX * 19, 25 - Math.min(0, pullX * travel), v.width - 39 - Math.max(0, pullX * travel)), by = clamp(b.y + pullY * 19, 35 - Math.min(0, pullY * travel), v.height - 88 - Math.max(0, pullY * travel)), f = motion ? smooth((t - 0.13) / 0.34) : 1;
    if (device === "keys") {
      key(c, bx, by, "aim", true);
      key(c, bx, by + 24, "space", t > 0.48);
    } else if (!motion || t < 0.62) {
      c.save();
      c.setLineDash([3, 4]);
      line(c, INK.paper, 1.9, bx, by, bx + pullX * travel, by + pullY * travel);
      c.restore();
      arc(c, INK.paper, 1.5, bx, by, 6);
      arrow(c, acid, bx + pullX * travel * 0.66, by + pullY * travel * 0.66, bx + pullX * travel, by + pullY * travel, 2.2, 8);
      hand(c, bx + pullX * travel * f, by + pullY * travel * f, device, t < 0.49, 1.05);
    }
  } else {
    const sx = q.x > v.width - 70 ? -1 : 1, tipX = q.x + sx * e.r * v.scale * 0.4, tipY = q.y + e.r * v.scale * 0.38;
    if (!motion || t < 0.64) {
      const land = motion ? 1 - smooth(t / 0.18) : 0, pressed = !motion || t > 0.17 && t < 0.43;
      if (pressed) {
        arc(c, acid, 2.2, tipX, tipY, 7);
        arc(c, INK.paper, 1.4, tipX, tipY, 13);
      }
      hand(c, tipX + sx * 14 * land + (device === "keys" ? 10 : 0), tipY + 19 * land + (device === "keys" ? 9 : 0), device, pressed, 1.1);
    }
  }
  if (motion && t > 0.53 && t < 0.9 && scene !== "lane") {
    const span = Math.hypot(e.x - p.x, e.y - p.y) / unit;
    const u = smooth((t - 0.53) / 0.37), a = toScreen(v, projectilePoint(p, shot, span * u));
    c.save();
    c.translate(a.x, a.y);
    c.rotate(-0.14);
    const r2 = clamp(19 * v.scale, 8, 18);
    c.globalAlpha = 0.56 * Math.sin(Math.PI * u);
    c.strokeStyle = INK.paper;
    c.lineWidth = 2;
    c.setLineDash([6, 3]);
    c.strokeRect(-r2, -r2, r2 * 2, r2 * 2);
    c.restore();
  }
  c.restore();
}

// consolidated/cut-ink.js
var cut_ink_exports = {};
__export(cut_ink_exports, {
  contactInk: () => contactInk,
  drawSweep: () => drawSweep,
  rackInk: () => rackInk
});
function rackInk(c, pegs, live) {
  const a = pegs[0], b = pegs.at(-1), angle = pegs.length > 1 ? Math.atan2(b.y - a.y, b.x - a.x) : -0.12;
  const rot = Math.cos(angle) < 0 ? angle + Math.PI : angle, ca = Math.cos(rot), sa = Math.sin(rot);
  const xs = pegs.map((p) => (p.x - a.x) * ca + (p.y - a.y) * sa);
  const l = Math.min(...xs) - 50, r = Math.max(...xs) + 50, y = -Math.max(...pegs.map((p) => p.r)) - 21;
  c.save();
  if (pegs.every((p) => !live.has(p.id))) c.globalAlpha = 0.43;
  c.translate(a.x, a.y);
  c.rotate(rot);
  poly2(
    c,
    "#61554c",
    [
      [l, y - 7],
      [r, y - 7],
      [r - 6, y + 4],
      [l + 9, y + 6]
    ],
    "#202e30",
    2
  );
  line(c, "#93836c", 1.7, l + 9, y - 5, r - 9, y - 5);
  for (const [i, x] of xs.entries()) {
    const p = pegs[i], held = live.has(p.id), py = (p.y - a.y) * ca - (p.x - a.x) * sa;
    const bot = held ? py - p.r * (pegs.length === 1 ? 0.68 : 0.36) : y + 16;
    poly2(c, held ? "#bf9a73" : "#988067", [
      [x - 8, y],
      [x + 8, y],
      [x + 7, bot - 4],
      [x + 2, bot],
      [x - 2, bot - 5],
      [x - 7, bot - 1]
    ]);
    disk(c, "#24312e", x, y, 2.7);
  }
  c.restore();
}
function drawSweep(c, p, angle, r, side, f) {
  c.save();
  c.translate(p.x, p.y);
  c.rotate(angle);
  c.scale(r, r * side);
  c.fillStyle = INK.acid;
  c.globalAlpha = 0.65 * f;
  c.beginPath();
  c.moveTo(0.78, 0.19);
  c.quadraticCurveTo(1.96, -0.03, 2.85, -0.13);
  c.quadraticCurveTo(2.62, 1.15 * f, 1.85, 1.45 * f);
  c.quadraticCurveTo(2.05, 0.8 * f, 0.78, 0.19);
  c.fill();
  c.restore();
}
function contactInk(c, m, alpha, motion) {
  c.save();
  c.translate(m.x, m.y);
  c.rotate(m.cut);
  c.globalAlpha = alpha;
  const r = m.r;
  if (m.type === "armor") {
    const f = motion ? 1 - m.life / 16 : 0.25;
    c.translate(r * (0.35 + f), -r * (0.76 + f));
    c.rotate(-0.54 - f * 0.7);
    poly2(
      c,
      "#ffc4aa",
      [
        [-r * 0.4, 0],
        [r * 0.32, -4],
        [r * 0.2, 4],
        [-r * 0.29, 7]
      ],
      INK.black,
      1.4
    );
  } else {
    c.scale(r, r);
    c.fillStyle = INK.paper;
    c.beginPath();
    c.moveTo(-1.48, 0.15);
    c.quadraticCurveTo(-0.24, -0.15, 1.45, -0.11);
    c.lineTo(0.73, -0.02);
    c.lineTo(1.12, -0.012);
    c.quadraticCurveTo(-0.42, 0.02, -1.48, 0.15);
    c.fill();
  }
  c.restore();
}

// consolidated/smear.js
var smear_exports = {};
__export(smear_exports, {
  createSmear: () => createSmear,
  ghostFor: () => ghostFor,
  morphWedge: () => morphWedge
});
function createSmear(capacity = 10) {
  const xs = new Float32Array(capacity), ys = new Float32Array(capacity), as = new Float32Array(capacity), fs = new Float32Array(capacity), ages = new Float32Array(capacity).fill(-1);
  let head2 = 0;
  return {
    /** Record the cube's pose. `age` starts at 0 and climbs with `tick`. */
    push(x, y, angle, facing) {
      xs[head2] = x;
      ys[head2] = y;
      as[head2] = angle;
      fs[head2] = facing;
      ages[head2] = 0;
      head2 = (head2 + 1) % capacity;
    },
    tick(dt) {
      for (let i = 0; i < capacity; i++) if (ages[i] >= 0) ages[i] += dt;
    },
    clear() {
      ages.fill(-1);
    },
    /** Iterate live ghosts, oldest last. */
    each(fn) {
      for (let i = 0; i < capacity; i++) {
        const k = (head2 - 1 - i + capacity * 2) % capacity;
        if (ages[k] >= 0) fn(xs[k], ys[k], as[k], fs[k], ages[k]);
      }
    },
    get size() {
      let n = 0;
      for (let i = 0; i < capacity; i++) if (ages[i] >= 0) n++;
      return n;
    }
  };
}
function ghostFor(speed, MAX_SPEED2) {
  const t = Math.max(0, Math.min(1.6, speed / MAX_SPEED2));
  if (t < 0.55) return { count: 0, gap: 0, alpha: 0 };
  const k = Math.min(1, (t - 0.55) / 0.35);
  return {
    count: t > 0.9 ? 4 : 3,
    gap: 9 + 16 * k,
    alpha: 0.1 + 0.26 * k
  };
}
function morphWedge(c, speed, MAX_SPEED2, roar = 0) {
  const t = Math.max(0, Math.min(1.5, speed / MAX_SPEED2));
  const grow = Math.max(0, Math.min(1, roar));
  if (t < 0.62) return null;
  const k = Math.min(1, (t - 0.62) / 0.5);
  return {
    length: 22 + 78 * k + 120 * grow,
    width: 15 + 9 * k + 10 * grow,
    alpha: 0.1 + 0.2 * k + 0.1 * grow
  };
}

// consolidated/bake.js
var bake_exports = {};
__export(bake_exports, {
  BLEND_TABLE: () => BLEND_TABLE,
  DIR_LUT_N: () => DIR_LUT_N,
  DIR_TABLE: () => DIR_TABLE,
  FALL_ROW: () => FALL_ROW,
  FALL_SAMPLES: () => FALL_SAMPLES,
  FALL_TABLE: () => FALL_TABLE,
  LAND_ROW: () => LAND_ROW,
  LAND_TABLE: () => LAND_TABLE,
  SLASH_ROW: () => SLASH_ROW,
  SLASH_TABLE: () => SLASH_TABLE,
  bakeDirectionBlend: () => bakeDirectionBlend,
  bakeDirections: () => bakeDirections,
  bakeFall: () => bakeFall,
  bakeLand: () => bakeLand,
  bakeSlash: () => bakeSlash
});
var SLASH_ROW = Object.freeze({
  angle: 0,
  smear: 1,
  alpha: 2,
  weight: 3,
  flash: 4,
  counter: 5,
  phase: 6,
  // 0..3 = windup, swing, impact, settle
  width: 8
  // floats per row
});
var LAND_ROW = Object.freeze({
  wide: 0,
  tall: 1,
  t: 2,
  // How hard the frame is rung, and how settled it is. Both were added with the
  // landing's drawn impact: without them the renderer had no quantity to fade
  // the shock ring and the ground scuff on, so a landing was applied as a
  // silent scale and nothing was ever drawn.
  shock: 3,
  settle: 4,
  width: 5
});
function bakeSlash() {
  const n = SLASH.total;
  const out = new Float64Array(n * SLASH_ROW.width);
  for (let a = 0; a < n; a++) {
    const s = slashFor(a, 0);
    const o = a * SLASH_ROW.width;
    if (!s) {
      out[o + SLASH_ROW.angle] = -1;
      continue;
    }
    out[o + SLASH_ROW.angle] = s.angle;
    out[o + SLASH_ROW.smear] = s.smear;
    out[o + SLASH_ROW.alpha] = s.alpha;
    out[o + SLASH_ROW.weight] = s.weight;
    out[o + SLASH_ROW.flash] = s.flash;
    out[o + SLASH_ROW.counter] = s.counter;
    out[o + SLASH_ROW.phase] = s.phase === "windup" ? 0 : s.phase === "swing" ? 1 : s.phase === "impact" ? 2 : 3;
  }
  return out;
}
function bakeLand() {
  const n = FALL.land + 1;
  const out = new Float64Array(n * LAND_ROW.width);
  for (let a = 0; a < n; a++) {
    const l = landFor(a);
    const o = a * LAND_ROW.width;
    if (!l) {
      out[o + LAND_ROW.wide] = -1;
      continue;
    }
    out[o + LAND_ROW.wide] = l.wide;
    out[o + LAND_ROW.tall] = l.tall;
    out[o + LAND_ROW.t] = l.t;
    out[o + LAND_ROW.shock] = l.shock;
    out[o + LAND_ROW.settle] = l.settle;
  }
  return out;
}
var FALL_SAMPLES = 378;
var FALL_ROW = Object.freeze({
  k: 0,
  rush: 1,
  lean: 2,
  stretch: 3,
  squeeze: 4,
  eyes: 5,
  scarfLift: 6,
  trail: 7,
  cels: 8,
  width: 9
});
function bakeFall() {
  const out = new Float64Array((FALL_SAMPLES + 1) * FALL_ROW.width);
  for (let vy = 0; vy <= FALL_SAMPLES; vy++) {
    const f = fallFor(vy);
    const o = vy * FALL_ROW.width;
    if (!f) {
      out[o + FALL_ROW.k] = -1;
      continue;
    }
    out[o + FALL_ROW.k] = f.k;
    out[o + FALL_ROW.rush] = f.rush;
    out[o + FALL_ROW.lean] = f.lean;
    out[o + FALL_ROW.stretch] = f.stretch;
    out[o + FALL_ROW.squeeze] = f.squeeze;
    out[o + FALL_ROW.eyes] = f.eyes;
    out[o + FALL_ROW.scarfLift] = f.scarfLift;
    out[o + FALL_ROW.trail] = f.trail;
    out[o + FALL_ROW.cels] = f.cels;
  }
  return out;
}
function bakeDirections() {
  const W2 = 5;
  const out = new Float64Array(8 * W2);
  for (let i = 0; i < 8; i++) {
    const d = DIRS[i];
    out[i * W2 + 0] = d.lean;
    out[i * W2 + 1] = d.tall;
    out[i * W2 + 2] = d.wide;
    out[i * W2 + 3] = d.scarf;
    out[i * W2 + 4] = d.eyes;
  }
  return out;
}
var DIR_LUT_N = 64;
function bakeDirectionBlend(n = DIR_LUT_N) {
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / n * TAU2;
    const turns = t / TAU2 * 8;
    const idx = (Math.floor(turns) % 8 + 8) % 8;
    const u = turns - Math.floor(turns);
    out[i * 2] = idx;
    out[i * 2 + 1] = u;
  }
  return out;
}
var SLASH_TABLE = bakeSlash();
var LAND_TABLE = bakeLand();
var DIR_TABLE = bakeDirections();
var BLEND_TABLE = bakeDirectionBlend();
var FALL_TABLE = bakeFall();

// consolidated/impact.js
var impact_exports = {};
__export(impact_exports, {
  IMPACT: () => IMPACT,
  contactSquash: () => contactSquash,
  elongate: () => elongate,
  spring: () => spring,
  squashed: () => squashed,
  velocityWeight: () => velocityWeight,
  wave: () => wave
});
var IMPACT = Object.freeze({
  // Elongation starts where a cube is genuinely flying, not on a nudge.
  stretchFrom: MAX_SPEED * 0.52,
  // ~18 px / tick
  stretchMax: 0.46,
  // 1 -> 1.46 along the velocity vector
  stretchThin: 0.52,
  // how much of that stretch is paid back across it
  // A contact bends at least this much and at most that.
  squashMin: 0.14,
  squashMax: 0.4,
  springTicks: 15,
  // One ring per contact, gone in a quarter of a second.
  waveTicks: 17,
  waveFrom: 7,
  waveTo: 46
});
function velocityWeight(speed) {
  if (!Number.isFinite(speed) || speed <= IMPACT.stretchFrom) return 0;
  return clamp((speed - IMPACT.stretchFrom) / (MAX_SPEED - IMPACT.stretchFrom), 0, 1);
}
function elongate(speed) {
  const k = velocityWeight(speed) * IMPACT.stretchMax;
  return { along: 1 + k, across: 1 - k * IMPACT.stretchThin };
}
function spring(age, ticks2 = IMPACT.springTicks) {
  if (!Number.isFinite(age) || age < 0 || age >= ticks2) return 0;
  const u = age / ticks2;
  return Math.cos(u * Math.PI * 2.35) * Math.exp(-u * 4.4);
}
function contactSquash(speed) {
  return IMPACT.squashMin + (IMPACT.squashMax - IMPACT.squashMin) * velocityWeight(speed);
}
function squashed(speed, nx, ny, age, ticks2 = IMPACT.springTicks) {
  const ring = spring(age, ticks2);
  if (!ring) return null;
  const amp = contactSquash(speed) * ring, axis = Math.atan2(ny, nx);
  return { axis, along: 1 - amp, across: 1 + amp * 0.72 };
}
function wave(age, ticks2 = IMPACT.waveTicks) {
  if (!Number.isFinite(age) || age < 0 || age >= ticks2) return null;
  const u = age / ticks2, ease = 1 - (1 - u) ** 2.4;
  return {
    r: IMPACT.waveFrom + (IMPACT.waveTo - IMPACT.waveFrom) * ease,
    alpha: (1 - u) ** 1.5
  };
}

// consolidated/radar.js
var radar_exports = {};
__export(radar_exports, {
  localRadar: () => localRadar,
  overlapsHUD: () => overlapsHUD,
  overlayPoint: () => overlayPoint,
  radarRect: () => radarRect
});
/** Only explicitly equipped catalogue IDs can unlock sensor detail. */
export function sensorTier(id,slot){return id===`${slot}-1`?1:id===`${slot}-2`?2:id===`${slot}-3`?3:0;}
export function trajectorySamples(id){return [24,36,55,95][sensorTier(id,'trajectory')];}
function radarRect(width, height) {
  const side = Math.min(width, height);
  const size = Math.min(160, Math.max(96, side * 0.23), width * 0.34);
  const pad2 = Math.max(12, side * 0.022);
  return { x: width - size - pad2, y: height - size - pad2, w: size, h: size };
}
var COLORS = {
  fang: "#ff507b",
  prism: "#b28cff",
  fork: "#ffa54d",
  bastion: "#ffc35b",
  crown: "#ffd166",
  rift: "#ff4277",
  pulse: "#e178ed",
  well: "#928bff"
};
function localRadar(view, player, rect, enemies = [], portal = null, {range = 1} = {}) {
  range = Math.max(1, Math.min(2.2, Number.isFinite(range) ? range : 1));
  const inset = 8, left = rect.x + inset, right = rect.x + rect.w - inset, top = rect.y + inset, bottom = rect.y + rect.h - inset;
  const width = right - left, height = bottom - top, px = (left + right) / 2, py = top + height * 0.75;
  const project = (p, r = 4) => {
    const dx = p.x - player.x, dy = p.y - player.y;
    const rawX = px + dx * width / (2 * view.w * range), rawY = py + dy * (dy < 0 ? height * 0.75 / (2 * view.h * range) : height * 0.25 / (0.5 * view.h * range));
    return {
      x: Math.max(left + r, Math.min(right - r, rawX)),
      y: Math.max(top + r, Math.min(bottom - r, rawY)),
      outside: rawX < left || rawX > right || rawY < top || rawY > bottom
    };
  };
  const blips = [];
  for (const e of enemies) {
    if (Math.abs(e.x - player.x) > view.w * range || e.y < player.y - view.h * 2 * range || e.y > player.y + view.h * 0.5 * range)
      continue;
    const r = e.kind === "crown" ? 5 : 3;
    blips.push({
      ...project(e, r),
      r,
      id: e.id,
      kind: e.kind,
      mode: e.mode,
      onScreen: e.x >= view.x && e.x <= view.x + view.w && e.y >= view.y && e.y <= view.y + view.h,
      color: COLORS[e.kind] || "#ff507b"
    });
  }
  return {
    rect,
    left,
    right,
    top,
    bottom,
    player: { x: px, y: py },
    viewport: (() => {
      const a = project({ x: view.x, y: view.y }, 0), b = project({ x: view.x + view.w, y: view.y + view.h }, 0);
      return {
        x: a.x,
        y: a.y,
        w: Math.max(0, b.x - a.x),
        h: Math.max(0, b.y - a.y)
      };
    })(),
    blips,
    portal: portal ? { ...project(portal, 7), r: 6 } : null,
    project
  };
}
function overlapsHUD(view, rect, actor, radius = 30) {
  const scale = view.scale || 1, x = (actor.x - view.x) * scale, y = (actor.y - view.y) * scale, r = radius * scale + 12;
  return x + r > rect.x && x - r < rect.x + rect.w && y + r > rect.y && y - r < rect.y + rect.h;
}
function overlayPoint(width, height, point, { radius = 16, top = 32, gutter = 20 } = {}) {
  const radar = radarRect(width, height), corner = Math.min(width * 0.34, 300);
  const boxes = [
    { x: 0, y: 0, w: gutter + corner, h: top + 230 },
    { x: width - gutter - corner, y: 0, w: gutter + corner, h: top + 230 },
    radar,
    { x: 0, y: height - 80, w: Math.min(210, width * 0.34), h: 80 }
  ];
  const clamp2 = (n, a, b) => Math.max(a, Math.min(b, n));
  const x = clamp2(point.x, radius, width - radius), y = clamp2(point.y, radius, height - radius);
  const valid = (x2, y2) => boxes.every(
    (b) => x2 + radius <= b.x || x2 - radius >= b.x + b.w || y2 + radius <= b.y || y2 - radius >= b.y + b.h
  );
  if (valid(x, y)) return { x, y };
  const xs = [
    x,
    width / 2,
    ...boxes.flatMap((b) => [b.x - radius - 1, b.x + b.w + radius + 1])
  ];
  const ys = [
    y,
    height / 2,
    ...boxes.flatMap((b) => [b.y - radius - 1, b.y + b.h + radius + 1])
  ];
  let best = null, distance = Infinity;
  for (const px of xs)
    for (const py of ys) {
      const cx = clamp2(px, radius, width - radius), cy = clamp2(py, radius, height - radius), d = (cx - x) ** 2 + (cy - y) ** 2;
      if (valid(cx, cy) && d < distance) {
        best = { x: cx, y: cy };
        distance = d;
      }
    }
  return best || { x: width / 2, y: height / 2 };
}

// consolidated/world-clip.js
var world_clip_exports = {};
__export(world_clip_exports, {
  clipWorldToHUD: () => clipWorldToHUD
});
function clipWorldToHUD(c, w, h) {
  c.beginPath();
  c.rect(0, 0, w, h);
  c.clip();
}

// consolidated/atmosphere.js
var atmosphere_exports = {};
__export(atmosphere_exports, {
  createBackdrop: () => createBackdrop
});
function tower(c, x, y, s, ink2) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = ink2;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-26, 0);
  c.lineTo(-5, -96);
  c.lineTo(5, -96);
  c.lineTo(26, 0);
  c.moveTo(0, -96);
  c.lineTo(0, -140);
  c.moveTo(-22, -98);
  c.lineTo(22, -98);
  c.moveTo(-16, -114);
  c.lineTo(16, -114);
  c.moveTo(-16, -30);
  c.lineTo(12, -54);
  c.lineTo(-8, -75);
  c.moveTo(17, -27);
  c.lineTo(-12, -52);
  c.lineTo(8, -76);
  c.stroke();
  c.restore();
}
function ruins(c, w, h, offset, datum, scale, seed) {
  const pitch = 133 * scale, first = Math.floor(offset / pitch) - 2, last = first + Math.ceil(w / pitch) + 5;
  for (let plane = 0; plane < 2; plane++) {
    const ink2 = plane ? "#211626" : "#312035", base = datum + (plane ? 62 : 4) * scale;
    for (let j = first; j <= last; j++) {
      const rn = hash(seed, j, plane), x = j * pitch - offset, hh = (32 + rn % 112) * scale, ww = (60 + (rn >>> 9) % 66) * scale, y = base - hh;
      if (x > w + 20 || x + pitch < -20 || y > h + 10) continue;
      const roof = rn % 4 === 0 ? [
        [x, y + 22 * scale],
        [x + ww * 0.37, y],
        [x + ww, y]
      ] : rn % 4 === 1 ? [
        [x, y],
        [x + ww * 0.21, y],
        [x + ww * 0.21, y + 18 * scale],
        [x + ww * 0.73, y + 18 * scale],
        [x + ww * 0.73, y],
        [x + ww, y]
      ] : rn % 4 === 2 ? [
        [x, y + 13 * scale],
        [x + ww * 0.27, y + 13 * scale],
        [x + ww * 0.27, y],
        [x + ww, y]
      ] : [
        [x, y],
        [x + ww * 0.86, y],
        [x + ww, y + 10 * scale]
      ];
      poly2(c, ink2, [
        [x - 1, base + 190 * scale],
        ...roof,
        [x + ww, y + hh * 0.64],
        [x + pitch + 1, y + hh * 0.64],
        [x + pitch + 1, base + 190 * scale]
      ]);
      if (rn % 7 === 0) tower(c, x + ww * 0.55, y, 0.5 * scale, ink2);
      if (plane && (rn & 3) === 1) {
        c.fillStyle = "#563047";
        c.fillRect(x + ww * 0.45, y + 12 * scale, ww * 0.32, 2 * scale);
      }
    }
  }
}
function ticks(c, r, ink2, from, count) {
  for (let i = 0; i < count; i++) {
    const a = from + i * 0.042, l = i % 5 ? 4 : 10;
    line(
      c,
      ink2,
      i % 5 ? 1.4 : 2.8,
      Math.cos(a) * r,
      Math.sin(a) * r,
      Math.cos(a) * (r + l),
      Math.sin(a) * (r + l)
    );
  }
}
function createBackdrop(c) {
  const glints = Array.from({ length: 190 }, (_, i) => {
    const rand = randomSource(hash(41, i, 9));
    return [rand(), rand(), rand(), rand(), rand()];
  });
  let grad = null, key2 = "";
  function base(w, h, x, y, bright = false, band = 1) {
    const k = `${w}:${h}:${bright}:${band % 4}`;
    if (key2 !== k) {
      grad = c.createLinearGradient(0, 0, w, h * 0.9);
      grad.addColorStop(0, "#100f19");
      grad.addColorStop(0.43, "#1b1525");
      grad.addColorStop(
        0.78,
        bright ? "#402036" : ["#292034", "#332036", "#30233a", "#202d39"][band % 4]
      );
      grad.addColorStop(1, "#1c1426");
      key2 = k;
    }
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    if (!bright) {
      const glow = c.createRadialGradient(
        w * 0.5,
        h * 0.78,
        0,
        w * 0.5,
        h * 0.78,
        Math.max(w, h) * 0.62
      );
      glow.addColorStop(0, ["#4a2740", "#4d2634", "#43263f", "#22333c"][band % 4] + "99");
      glow.addColorStop(0.55, ["#3a2033", "#3d2029", "#352031", "#1b2830"][band % 4] + "55");
      glow.addColorStop(1, "#00000000");
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
    }
    for (const [u, v, z, n, layer] of glints) {
      const depth = 0.08 + layer * 0.05, px2 = ((u * w - x * z * depth) % (w + 26) + w + 26) % (w + 26) - 12, py2 = ((v * h - y * z * depth) % (h + 26) + h + 26) % (h + 26) - 12;
      const big = n > 0.965, mid = n > 0.86;
      c.globalAlpha = big ? 0.85 : mid ? 0.5 : 0.26 - layer * 0.04;
      c.fillStyle = big ? "#c39aae" : mid ? "#8a6573" : "#6a5872";
      const sz = big ? 3.1 : mid ? 1.9 : 1.3;
      c.fillRect(px2, py2, sz, sz * (big ? 1.6 : 1));
      if (big) {
        c.globalAlpha = 0.3;
        c.fillRect(px2 - 3, py2 + sz * 0.6, sz + 6, 0.9);
      }
    }
    c.globalAlpha = 1;
    const vig = c.createRadialGradient(
      w * 0.5,
      h * 0.52,
      Math.min(w, h) * 0.34,
      w * 0.5,
      h * 0.52,
      Math.max(w, h) * 0.82
    );
    vig.addColorStop(0, "#00000000");
    vig.addColorStop(1, bright ? "#08060e88" : "#08060ebb");
    c.fillStyle = vig;
    c.fillRect(0, 0, w, h);
  }
  function press(x, y, r) {
    c.save();
    c.translate(x, y);
    c.scale(r / 180, r / 180);
    c.rotate(-0.09);
    const steel = "#36253a", shadow = "#251c2e", rim = "#483046";
    poly2(c, shadow, [
      [-245, 63],
      [190, 63],
      [183, 77],
      [-220, 80]
    ]);
    poly2(c, steel, [
      [-218, 64],
      [-186, 5],
      [-165, 4],
      [-143, 64],
      [-157, 64],
      [-176, 32],
      [-197, 64]
    ]);
    disk(c, steel, -176, -18, 55);
    disk(c, shadow, -176, -18, 42);
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 + 0.35;
      line(c, steel, 9, -176, -18, -176 + Math.cos(a) * 44, -18 + Math.sin(a) * 44);
    }
    disk(c, rim, -176, -18, 10);
    c.fillStyle = rim;
    c.beginPath();
    c.moveTo(-184, -72);
    c.quadraticCurveTo(-113, -68, -58, -17);
    c.lineTo(145, -20);
    c.lineTo(145, -13);
    c.lineTo(-62, -10);
    c.quadraticCurveTo(-114, -57, -184, -65);
    c.fill();
    for (const yy of [-30, 1]) {
      disk(c, steel, -46, yy, 15);
      disk(c, shadow, -46, yy, 5);
    }
    poly2(c, steel, [
      [3, 64],
      [3, -65],
      [27, -85],
      [137, -85],
      [160, -61],
      [159, 64],
      [141, 64],
      [139, -53],
      [126, -65],
      [35, -65],
      [25, -52],
      [24, 64]
    ]);
    c.fillStyle = rim;
    c.fillRect(67, -69, 36, 27);
    c.fillRect(36, -42, 97, 17);
    poly2(c, shadow, [
      [32, 6],
      [134, 6],
      [139, 19],
      [26, 19]
    ]);
    poly2(c, steel, [
      [151, -19],
      [178, -21],
      [192, 12],
      [180, 49],
      [157, 75],
      [149, 65],
      [133, 75],
      [140, 57],
      [168, 36],
      [175, 12]
    ]);
    for (let j = 0; j < 3; j++) line(c, shadow, 2, 168 + j * 4, 28, 180 + j * 2, 16);
    c.restore();
  }
  function midground(x, y, w, h, s, seed, band) {
    const pitch = 232 * s, first = Math.floor(x / pitch) - 2, last = first + Math.ceil(w / pitch) + 3;
    for (let j = first; j <= last; j++) {
      const rn = hash(seed, j, band * 7 + 3), px = j * pitch - x, ww = (84 + (rn >>> 5) % 104) * s, hh = (215 + (rn >>> 11) % 330) * s, base2 = h * 1.02 - y * 0.34, top = base2 - hh;
      if (px > w + 40 || px + pitch < -40) continue;
      if (top > h + 60) continue;
      const ink2 = rn & 1 ? "#191325" : "#1d1529";
      const kind = rn % 5;
      c.save();
      c.translate(px, top);
      c.fillStyle = ink2;
      if (kind === 0) {
        c.fillRect(ww * 0.44, 0, ww * 0.12, hh);
        for (let k = 1; k < 5; k++) {
          const yy = hh * (k / 5);
          c.fillRect(0, yy, ww, 2.2 * s);
        }
      } else if (kind === 1) {
        c.fillRect(0, hh * 0.28, ww, hh * 0.72);
        c.fillRect(ww * 0.2, hh * 0.1, ww * 0.6, hh * 0.2);
        c.fillRect(ww * 0.36, 0, ww * 0.28, hh * 0.12);
      } else if (kind === 2) {
        c.fillRect(0, hh * 0.2, ww * 0.16, hh * 0.8);
        c.fillRect(ww * 0.84, hh * 0.45, ww * 0.16, hh * 0.55);
        c.fillRect(0, hh * 0.2, ww * 0.62, hh * 0.1);
      } else if (kind === 3) {
        for (let k = 0; k < 6; k++) {
          const yy = hh * (k / 6), inset = k % 2 * ww * 0.09;
          c.fillRect(inset, yy, ww - inset * 2, hh / 6 - 3 * s);
        }
      } else {
        c.save();
        c.rotate(((rn >>> 17) % 5 - 2) * 0.012);
        c.fillRect(ww * 0.46, 0, ww * 0.08, hh);
        for (let k = 1; k <= 3; k++) {
          const yy = hh * (0.6 + k * 0.12);
          c.fillRect(ww * 0.1, yy, ww * 0.8, 1.6 * s);
        }
        c.restore();
      }
      c.restore();
    }
  }
  function relic(theme, x, y, r, n) {
    c.save();
    c.translate(x, y);
    c.scale(r / 180, r / 180);
    c.globalAlpha *= 0.07;
    const violet = "#3d4050", deep = "#2d303d", light = "#444755";
    if (theme === 1) {
      c.rotate(n % 70 * 0.01);
      for (let j = 0; j < 4; j++) {
        arc(
          c,
          j === 0 ? violet : deep,
          j === 1 ? 14 : 3,
          0,
          0,
          90 + j * 27,
          -2.7 + j * 0.23,
          0.9 + j * 0.21
        );
        arc(c, violet, 2, 0, 0, 115 + j * 25, 1.31, 2.98);
      }
      ticks(c, 169, light, 1.35, 28);
    } else if (theme === 2) {
      for (const [xx, yy, scale] of [
        [-100, 96, 1.5],
        [119, -31, 0.97]
      ])
        tower(c, xx, yy, scale, violet);
      c.strokeStyle = violet;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-112, -53);
      c.quadraticCurveTo(35, 21, 119, -133);
      c.stroke();
      for (let i = 0; i < 5; i++) line(c, deep, 2, -240, -85 + i * 13, 200 - i * 23, -86 + i * 13);
    } else if (theme === 3) {
      c.rotate(-0.35);
      for (let j = 0; j < 5; j++) {
        const xx = -120 + hash(n, j, 0) % 130, yy = (j - 2) * 45;
        poly2(c, j % 2 ? deep : violet, [
          [xx - 110, yy + 25],
          [xx + 102, yy - 19],
          [xx + 152, yy - 18],
          [xx - 62, yy + 31]
        ]);
      }
      line(c, light, 2, -175, 134, 215, 27);
    } else if (theme === 4) {
      c.rotate(-0.32);
      for (let j = 0; j < 4; j++) {
        const y2 = j * 17;
        line(
          c,
          violet,
          4,
          -210,
          y2 + 49,
          -65,
          y2 + 49,
          -12,
          y2 - 4,
          64,
          y2 - 4,
          103,
          y2 - 43,
          180,
          y2 - 43
        );
        arc(c, violet, 3, 187, y2 - 43, 7);
      }
    } else {
      for (let j = 0; j < 3; j++) {
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = i * TAU / 9 + 0.24 * j, r2 = 95 + 27 * j + hash(n, i, 1) % 24;
          if (!i) c.moveTo(Math.cos(a) * r2, Math.sin(a) * r2);
          else c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        }
        c.strokeStyle = j === 1 ? violet : deep;
        c.lineWidth = j === 1 ? 12 : 3;
        c.stroke();
      }
      line(c, light, 2, -48, 94, -15, 33, -27, 4, 32, -83);
    }
    c.restore();
  }
  function world(v, seed, band, time=0) {
    drawIndustrialDistrict(c,v.width,v.height,{x:v.panX*v.scale,y:v.panY*v.scale,scale:v.scale},seed,band,time);
  }
  function title(w, h, time) {
    const tall = w < h * 0.85;
    const short = tall && h < 650;
    const s = tall ? Math.min(w / (short ? 720 : 590), h / (short ? 1490 : 920)) : Math.min(w / 1360, h / 780);
    const x = w * (tall ? 0.53 : 0.742), y = h * (short ? 0.175 : tall ? 0.237 : 0.475);
    base(w, h, 0, 0, true);
    ruins(c, w, h, 74 * s, h * 0.97, Math.max(0.52, s), 494);
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.rotate(-0.3);
    const air = Math.sin(time * 0.024), open = air * 2.7;
    function poster(side) {
      const top = side < 0;
      const edge = top ? [
        [-210, -191],
        [-187, -208],
        [24, -208],
        [44, -202],
        [190, -205],
        [210, -183],
        [206, -5],
        [118, -7],
        [72, -3],
        [80, -8],
        [-46, -4],
        [-111, -8],
        [-209, -4]
      ] : [
        [-210, 4],
        [-116, 0],
        [-50, 4],
        [56, 0],
        [49, 5],
        [132, 1],
        [205, 4],
        [207, 158],
        [178, 184],
        [93, 179],
        [84, 186],
        [-198, 183],
        [-213, 166]
      ];
      c.save();
      c.translate(top ? 9 : -5, side * (10 + open));
      poly2(c, "#7a3a50", edge);
      c.translate(-3, -4);
      poly2(c, top ? "#ec5976" : "#cc4564", edge);
      c.beginPath();
      c.moveTo(...edge[0]);
      for (const q of edge.slice(1)) c.lineTo(...q);
      c.closePath();
      c.clip();
      poly2(c, "#a12e54", [
        [-250, -210],
        [-142, -210],
        [131, 198],
        [30, 199]
      ]);
      c.save();
      c.beginPath();
      c.moveTo(-201, -209);
      c.lineTo(-104, -209);
      c.lineTo(161, 202);
      c.lineTo(113, 202);
      c.closePath();
      c.clip();
      c.fillStyle = "#170f20aa";
      c.beginPath();
      for (let y2 = -210; y2 < 205; y2 += 5) for (let x2 = -205 + (Math.abs(y2 % 10) === 0 ? 0 : 5); x2 < 165; x2 += 10) {
        c.moveTo(x2 + 1.45, y2);
        c.arc(x2, y2, 1.45, 0, Math.PI * 2);
      }
      c.fill();
      c.restore();
      c.fillStyle = top ? "#bf3b61" : "#a83757";
      c.font = "italic 800 270px Riot,Impact,sans-serif";
      c.textAlign = "left";
      c.fillText("02", -117, 93);
      if (top) {
        line(c, "#6b2a4a", 2, -186, -159, 185, -159);
        c.fillStyle = "#461c36";
        c.font = "bold 14px Mono,monospace";
        c.fillText("ONE STROKE", -181, -169);
        for (let i = 0; i < 2; i++)
          poly2(c, "#692642", [
            [145 + i * 9, -180],
            [151 + i * 9, -180],
            [146 + i * 9, -168],
            [140 + i * 9, -168]
          ]);
        poly2(c, "#ffd2b7", [
          [166, -208],
          [199, -206],
          [210, -177],
          [187, -184],
          [179, -179]
        ]);
      } else {
        c.fillStyle = "#51203b";
        c.font = "italic 800 39px Riot,Impact,sans-serif";
        c.fillText("THROUGHCUT", -183, 152);
        line(c, "#652843", 2, -179, 161, 183, 161);
        c.font = "italic 800 29px Riot,Impact,sans-serif";
        c.textAlign = "right";
        c.fillText("+300", 180, 151);
      }
      c.restore();
    }
    poster(-1);
    poster(1);
    poly2(c, "#100e1a", [
      [-370, 27],
      [-275, -6],
      [-43, -10],
      [-74, 26],
      [-319, 51],
      [-259, 27]
    ]);
    poly2(c, INK.acid, [
      [-343, 27],
      [-160, 0],
      [-56, -3],
      [-122, 12]
    ]);
    line(c, "#e7bd9e", 2, -315, 41, -185, 23);
    cutFigure(c, "fang", -206, 4, 46, 2.93, -0.035, 24 + open, { twist: 0.12 });
    cutFigure(c, "prism", 27, -2, 56, 0.09, -0.035, 18 + open, { twist: 0.1 });
    cutFigure(c, "bastion", 188, -8, 78, 0.12, -0.035, 19 + open, { torn: true, twist: 0.05 });
    shearInk(c, 16, -1, -0.035, 294, 17);
    blade(c, -64, 3, -0.035, 52);
    cube(c, -71, 5, 52, -0.12, time, 1);
    for (const [xx, yy, z, a, col] of [
      [185, -112, 15, -0.48, "#ff7088"],
      [238, 84, 13, 0.38, "#ff7088"],
      [29, 86, 9, 0.39, "#c69aff"],
      [-219, -65, 7, -0.53, "#ff506e"]
    ]) {
      c.save();
      c.translate(xx, yy + air * 1.5);
      c.rotate(a);
      poly2(c, col, [
        [z, 0],
        [-z, -z * 0.34],
        [-z * 0.6, z * 0.3]
      ]);
      c.restore();
    }
    c.restore();
  }
  function bench(v) {
    const w = v.width, h = v.height, u = Math.min(w, h) / 700;
    if (key2 !== `bench:${w}:${h}`) {
      key2 = `bench:${w}:${h}`;
      grad = c.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#17292f");
      grad.addColorStop(0.62, "#29403f");
      grad.addColorStop(1, "#16292e");
    }
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    const dx = v.panX * v.scale * 0.077, dy = v.panY * v.scale * 0.077;
    c.save();
    c.translate(-dx, -dy);
    c.lineWidth = 1;
    const pitch = 83 * u;
    for (let i = Math.floor(dx / pitch); i <= (w + dx) / pitch; i++) {
      line(c, "#304542", 1, i * pitch, dy, i * pitch, h + dy);
      for (let j = Math.floor(dy / pitch); j <= (h + dy) / pitch; j++)
        line(c, "#4a5a50", 1, i * pitch - 3, j * pitch, i * pitch + 4, j * pitch);
    }
    for (let j = Math.floor(dy / pitch); j <= (h + dy) / pitch; j++)
      line(c, "#2d4341", 1, dx, j * pitch, w + dx, j * pitch);
    for (const [xx, yy, n, turn] of [
      [w * 0.94, h * 0.22, 1, -0.43],
      [w * 0.11, h * 0.9, 0.7, 0.31]
    ]) {
      c.save();
      c.translate(xx, yy);
      c.rotate(turn);
      c.scale(n * u, n * u);
      c.beginPath();
      c.moveTo(-132, -80);
      c.lineTo(218, -73);
      c.lineTo(202, 57);
      c.lineTo(120, 59);
      c.lineTo(125, 51);
      c.lineTo(-118, 70);
      c.closePath();
      for (let j = 0; j < 3; j++) {
        const x = -65 + j * 89;
        c.moveTo(x, -41);
        c.lineTo(x - 31, 22);
        c.lineTo(x + 40, 20);
        c.closePath();
      }
      c.fillStyle = "#47554c";
      c.fill("evenodd");
      line(c, "#596357", 2, -125, -70, 194, -64);
      c.restore();
    }
    for (const [xx, yy, z, n] of glints) {
      const x = xx * w, y = yy * h;
      line(
        c,
        n > 0.75 ? "#43534b" : "#2d4542",
        0.8,
        x,
        y,
        x + (2 + 14 * z) * u,
        y - (1 + 6 * n) * u
      );
    }
    c.save();
    c.translate(w * 0.95, h * 0.91);
    c.rotate(-0.62);
    c.scale(u, u);
    poly2(
      c,
      "#465348",
      [
        [-71, -13],
        [152, -13],
        [159, -8],
        [159, 9],
        [-71, 9],
        [-77, 3],
        [-77, -7]
      ],
      "#283b37",
      1.5
    );
    line(c, "#798172", 1, -69, -12, 152, -12);
    for (let i = 0; i < 43; i++) {
      const x = -55 + i * 5;
      line(c, "#303f39", 1.3, x, -11, x, i % 5 === 0 ? -1 : -6);
    }
    disk(c, "#233732", -66, -2, 3.4);
    c.restore();
    c.restore();
  }
  return { world, title, bench };
}

// consolidated/renderer.js
var renderer_exports = {};
__export(renderer_exports, {
  MERGE_AGE: () => MERGE_AGE,
  MERGE_R: () => MERGE_R,
  createRenderer: () => createRenderer,
  recordPopup: () => recordPopup,
  traceDraws: () => traceDraws
});

// consolidated/guide.js
var guide_exports = {};
__export(guide_exports, {
  sightPicture: () => sightPicture
});
function sightPicture(p, v, geometry, enemies, damage = 1) {
  const path2 = [], pair = [];
  if (!v?.power) return { path: path2, pair };
  const speed = Math.hypot(v.x, v.y), step = clamp(20 / speed, 0.6, 2.6), candidates = [];
  let limit = 16 + 15 * Math.min(1, speed / MAX_SPEED);
  for (const e of enemies) {
    if (!e.small && e.hp <= damage && Math.hypot(e.x - p.x, e.y - p.y) < 1180) candidates.push(e);
  }
  let last = p;
  for (let i = 1; i <= 57 && i * step <= limit; i++) {
    const q = projectilePoint(p, v, i * step);
    if (geometry.some(
      (r) => sweptHit(last.x, last.y, q.x - last.x, q.y - last.y, r, PLAYER_SIZE * 0.38)
    ))
      break;
    if (Math.hypot(q.x - p.x, q.y - p.y) > PLAYER_SIZE * 0.86) path2.push(q);
    if (pair.length < 2)
      for (const e of candidates) {
        if (pair.some((n) => n.e === e) || Math.hypot(e.x - q.x, e.y - q.y) > e.r * 0.8 + 6)
          continue;
        if (!pair.length) limit += 7;
        pair.push({ e, angle: Math.atan2(q.y - last.y, q.x - last.x) });
        if (pair.length === 2) break;
      }
    last = q;
  }
  return { path: path2, pair: pair.length === 2 ? pair : [] };
}

// consolidated/pace.js
var PACE = Object.freeze({
  // Wall-clock pacing. `focus` is the player holding a slow-mo aim: 0.55 is
  // the slowest time is ever allowed to get, ever.
  focusScale: 0.55,
  focusScaleCap: 0.62,
  // a rookie's first few launches keep a little more
  // The leaning beat after a paid cut. Short, and it only gets shorter.
  breathScale: 0.7,
  // Reaction-time window after a hit, in world ticks. Faster pacing spends
  // world time faster, so this is longer than it looks.
  invulTicks: 132,
  breathTicks: 14,
  // Automatic escape from an unsteered crash.
  panicBase: 0.55,
  panicFloor: 0.66,
  // as tempo climbs, the grace weakens toward here
  panicTicks: 16,
  // The field-edge warning is a shove, not a stall.
  warnDepth: 0.3,
  // Aim assist widens as the game speeds up, and with a beginner's tempo.
  corridor: 19,
  corridorMax: 34,
  // HEAVY AUTO-AIM.
  //
  // Snap is the radius within which a tap is pulled onto a shape instead of
  // being taken literally. It was 62-96px, which on a field where the nearest
  // enemy sits a median ~470px away meant a player had to put their thumb
  // almost exactly on a target before the game helped at all.
  //
  // 150-260px is deliberately generous: the brief asked for HEAVY auto-aim, and
  // the reason is engagement, not difficulty. A player who is aiming at a pack
  // of shapes wants to be fighting the field, not their thumb; when the assist
  // is too small every near-miss feels like the game's fault. Note this does
  // NOT aim for you -- it snaps a tap you already made, within a wider gate.
  snap: 150,
  snapMax: 260,
  // Tempo itself: 0 at the first launch, 1 once a run is genuinely flying.
  tempoTicks: 2100,
  // ~35 s of clean flying to reach full tempo
  tempoKills: 70,
  tempoChain: 14
});
var SPEEDS = Object.freeze([
  { id: "relaxed", label: "Relaxed", floor: 0.38, cap: 0.46, breath: 1.6, panicTicks: 24, note: "More reading time." },
  { id: "fast", label: "Fast", floor: 0.5, cap: 0.62, breath: 1, panicTicks: 16, note: "A short lean, never a crawl." },
  { id: "blazing", label: "Blazing", floor: 0.72, cap: 0.8, breath: 0.5, panicTicks: 8, note: "Almost no slow motion." }
]);

// consolidated/aim.js
var ARC = {
  step: 2,
  maxTicks: 190,
  gravity: RELEASE_GRAVITY,
  wallPad: PLAYER_SIZE / 2,
  // inscribed half-width used by the real CCD guard
  corridor: 19,
  // world-pixel magnetic corridor, a little wider in focus
  corridorFocus: 26,
  pull: 0.24,
  // how much a magnetised release bends toward a locked centre
  // A corridor hit also widens the real blade for that one launch. Capped
  // so a lock is help, not a guaranteed kill through a plate.
  reach: 0.12,
  ray: 12,
  // 200 ms of forward travel at 60 Hz, in simulation ticks
  raySpeed: 26,
  // px / tick; below this a nudge is not a panic
  // The automatic grace. Shallow and short by design: enough to read the
  // threat and press, never enough to feel like the game stopped.
  slowScale: 0.55,
  slowTicks: 16
  // ~270 ms at 60 Hz; pace.js shortens it further with tempo
};
var COOL = [62, 214, 232];
var CRIMSON = [226, 52, 86];
var WHITE = [255, 248, 236];
function speedRgb(power) {
  const p = clamp(power, 0, 1);
  const along = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  if (p < 0.7) return along(COOL, CRIMSON, p / 0.7);
  return along(CRIMSON, WHITE, (p - 0.7) / 0.3);
}
function speedInk(power) {
  return `rgb(${speedRgb(power).join(",")})`;
}
function speedBand(power) {
  return power < 0.34 ? "easy" : power < 0.72 ? "strong" : "lethal";
}
function arcPath(start, velocity, { geometry = [], line: line3 = -Infinity, minVy = -Infinity, maxVy = Infinity, ceiling = MAX_SPEED, limitAfterTicks = 0 } = {}) {
  const out = [];
  let end = null;
  if (!velocity || Math.hypot(velocity.x, velocity.y) < 1e-3)
    return { points: out, end, ticks: 0 };
  const samples = releaseSamples(start, velocity, ARC.maxTicks, {
    minVy,
    maxVy,
    ceiling,
    limitAfterTicks
  });
  let ticks2 = 0;
  for (let t = 1; t <= ARC.maxTicks; t++) {
    const q = samples[t], before = samples[t - 1];
    const wall = firstWall(before, q, geometry);
    ticks2 = t;
    if (wall) {
      end = {
        kind: "wall",
        x: wall.x,
        y: wall.y,
        ticks: t,
        nx: wall.nx,
        ny: wall.ny
      };
      out.push({ x: wall.x, y: wall.y });
      break;
    }
    if (t % ARC.step === 0) out.push(q);
  }
  return { points: out, end, ticks: ticks2 };
}
function firstWall(a, b, geometry) {
  let best = null;
  for (const r of geometry) {
    const hit = sweptHit(a.x, a.y, b.x - a.x, b.y - a.y, r, ARC.wallPad);
    if (hit && (!best || hit.t < best.t))
      best = {
        t: hit.t,
        x: a.x + (b.x - a.x) * hit.t,
        y: a.y + (b.y - a.y) * hit.t,
        nx: hit.nx,
        ny: hit.ny
      };
  }
  return best;
}
function threatAhead(world, combat, velocity, { blade: blade2 = 0, line: line3 = -Infinity } = {}) {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < ARC.raySpeed) return null;
  const p = world.player.position, reach = ARC.ray, ux = velocity.x / speed, uy = velocity.y / speed, tip = { x: p.x + ux * speed * reach, y: p.y + uy * speed * reach }, r = PLAYER_SIZE * 0.44;
  let best = null;
  const consider = (d, kind, x, y) => {
    if (!Number.isFinite(d) || d < 0) return;
    if (!best || d < best.d) best = { d, ticks: d / speed, kind, x, y, ux, uy };
  };
  for (const e of combat.enemies.values()) {
    const ax = e.x - p.x, ay = e.y - p.y, along = clamp(ax * ux + ay * uy, 0, speed * reach), miss = Math.hypot(ax - ux * along, ay - uy * along);
    if (blade2 > 2 && blade2 - 2 > Math.max(0, along - e.r) / speed) continue;
    if (miss <= e.r + r)
      consider(
        Math.max(
          0,
          along - Math.sqrt(Math.max(0, (e.r + r) ** 2 - miss * miss))
        ),
        "shape",
        e.x,
        e.y
      );
    else if (miss <= 46 && along <= e.r + r) consider(0, "shape", e.x, e.y);
  }
  for (const h of combat.hazards || []) {
    if (h.spent) continue;
    if (h.kind === "needle") {
      const ax = h.x - p.x, ay = h.y - p.y;
      const along = clamp(ax * ux + ay * uy, 0, speed * reach);
      if (Math.hypot(ax - ux * along, ay - uy * along) <= r + 15)
        consider(Math.max(0, along), "needle", h.x, h.y);
    } else if (h.kind === "ring") {
      const d = Math.hypot(h.x - p.x, h.y - p.y);
      if (Math.abs(d - h.radius) <= r + 8 && d <= speed * reach)
        consider(Math.max(0, d - h.radius), "ring", h.x, h.y);
    }
  }
  for (const l of combat.links || []) {
    if (l.mode === "off") continue;
    const ax = l.a.x - p.x, ay = l.a.y - p.y, bx = l.b.x - p.x, by = l.b.y - p.y, wx = bx - ax, wy = by - ay;
    const t = clamp(-(ax * wx + ay * wy) / (wx * wx + wy * wy || 1), 0, 1), cx = ax + wx * t, cy = ay + wy * t, along = clamp(cx * ux + cy * uy, 0, speed * reach);
    if (Math.hypot(cx - ux * along, cy - uy * along) <= r + 6)
      consider(Math.max(0, along), "link", l.a.x + wx * t, l.a.y + wy * t);
  }
  const wall = firstWall(p, tip, world.geometry);
  if (wall && wall.t <= 1) {
    const d = Math.hypot(wall.x - p.x, wall.y - p.y), hit = {
      d,
      ticks: d / speed,
      kind: "wall",
      x: wall.x,
      y: wall.y,
      ux: wall.nx,
      uy: wall.ny
    };
    if (!best || d < best.d) best = hit;
  }
  return best;
}
function corridorReach(lock) {
  return lock ? ARC.reach : 0;
}
function magnetize(start, velocity, combat, { focus = false, geometry = [], corridor: width = null } = {}) {
  if (!velocity?.power) return { ...velocity, lock: null };
  const corridor = width ?? (focus ? ARC.corridorFocus : ARC.corridor), speed = Math.hypot(velocity.x, velocity.y), ux = velocity.x / speed, uy = velocity.y / speed;
  let best = null;
  for (const e2 of combat.enemies.values()) {
    if (e2.small) continue;
    const ax = e2.x - start.x, ay = e2.y - start.y, along = ax * ux + ay * uy;
    if (along <= 0 || along > 1180) continue;
    const miss2 = Math.hypot(ax - ux * along, ay - uy * along), radius = e2.r + corridor;
    if (miss2 > radius) continue;
    if (!best || along < best.along) best = { e: e2, along, miss: miss2 };
  }
  if (!best) return { ...velocity, lock: null };
  const { e, miss } = best, pull = ARC.pull * (1 - clamp(miss / (e.r + ARC.corridorFocus), 0, 1)) + ARC.pull * 0.35, target = Math.atan2(e.y - start.y, e.x - start.x), a = Math.atan2(uy, ux), da = Math.atan2(Math.sin(target - a), Math.cos(target - a)) * clamp(pull, 0.14, 0.42), na = a + da;
  return {
    x: Math.cos(na) * speed,
    y: Math.sin(na) * speed,
    power: velocity.power,
    lock: { id: e.id, x: e.x, y: e.y, r: e.r, kind: e.kind }
  };
}
function impactPreview(start, velocity, combat, path2) {
  if (!velocity?.power || !path2.points.length) return null;
  const last = path2.points[path2.points.length - 1];
  if (path2.end && path2.end.kind !== "wall") return null;
  const limit = path2.end ? Math.hypot(last.x - start.x, last.y - start.y) + PLAYER_SIZE * 0.6 : Infinity;
  let best = null;
  for (const [index,t] of path2.points.entries()) {
    const d = Math.hypot(t.x - start.x, t.y - start.y);
    if (d > limit) break;
    for (const e of combat.enemies.values()) {
      const q = e.r + PLAYER_SIZE * 0.36;
      if (Math.hypot(t.x - e.x, t.y - e.y) > q) continue;
      const along = d;
      if (!best || along < best.along)
        best = { x: e.x, y: e.y, r: e.r, kind: e.kind, id: e.id, along, ticks:(index+1)*ARC.step };
    }
    if (best) break;
  }
  return best;
}
function predictAim(run, velocity, { focus = false, magnetic = true, corridor = null } = {}) {
  if (!run || !velocity?.power) return null;
  const arena=run.world.arena, walls=arena?[
    {x:arena.x-100,y:arena.y-100,w:100,h:arena.h+200},
    {x:arena.x+arena.w,y:arena.y-100,w:100,h:arena.h+200},
    {x:arena.x,y:arena.y-100,w:arena.w,h:100},
    {x:arena.x,y:arena.y+arena.h,w:arena.w,h:100},
  ]:[];
  const start = { ...run.world.player.position }, lockOn = magnetic ? magnetize(start, velocity, run.combat, { focus, corridor }) : { ...velocity, lock: velocity.lock ?? null }, launchScale = run.state.opening || run.state.hyper ? 1 : run.state.dashSpeed || 1, fired = { ...lockOn, x: lockOn.x * launchScale, y: lockOn.y * launchScale }, path2 = arcPath(start, fired, {
    ceiling: MAX_SPEED * launchScale,
    limitAfterTicks: run.state.opening || run.state.hyper ? 0 : (run.state.flightRules?.launchGrace ?? 0),
    geometry: [...run.world.geometry,...walls],
    line: run.state.line,
    // Ordinary run limits are applied after each physical tick. Opening and
    // hyper retain their own trajectories; a floor kick owns its ascent.
    minVy: run.state.phase && !run.state.opening && !run.state.hyper && !(run.state.floorIgnore > 0) ? -(run.state.flightRules?.ascent ?? 26) : -Infinity,
    maxVy: run.state.phase && !run.state.hyper ? (run.state.flightRules?.fall ?? 10) : Infinity
  }), speed = Math.hypot(lockOn.x, lockOn.y), power = speed / MAX_SPEED, hit = impactPreview(start, fired, run.combat, path2);
  return {
    start,
    velocity: lockOn,
    path: path2.points,
    end: hit ? { kind: "target", x: hit.x, y: hit.y, id: hit.id } : path2.end,
    hit,
    lock: lockOn.lock,
    power,
    band: speedBand(power),
    ink: speedInk(power),
    ticks: path2.ticks,
    // A real launch is a touch wider along the corridor this shot crosses.
    reach: lockOn.lock ? ARC.reach : 0
  };
}

// consolidated/stroke.js
var SHEAR = Object.freeze({ reach: 424, width: 18, bonus: 300, damage: 2 });
var profiles = {
  chip: { cue: "chip", stop: 0, flecks: 0, kick: 0, gap: 0.08 },
  stock: { cue: "stock", stop: 3, flecks: 2, kick: 1.4, gap: 0.25 },
  paper: { cue: "paper", stop: 1, flecks: 2, kick: 0, gap: 0.1 },
  plate: { cue: "plate", stop: 3, flecks: 3, kick: 1.5, gap: 0.15 },
  crown: { cue: "crown", stop: 4, flecks: 5, kick: 2.8, gap: 0.16 },
  tear: { cue: "tear", stop: 4, flecks: 1, kick: 2.2, gap: 0.18 }
};
var impactFor = (kind, small, torn, paperTarget = false) => torn ? profiles.tear : paperTarget ? profiles.stock : small ? profiles.chip : kind === "crown" || kind === "cube" ? profiles.crown : kind === "bastion" ? profiles.plate : profiles.paper;

// consolidated/renderer.js
var STRETCH_ALONG = 1.25;
var STRETCH_ACROSS = 0.8;
var HYPER_BURST = 18;
var R = PLAYER_SIZE / 2;
function pad(c) {
  const { x, y, w, h } = PAD;
  poly2(
    c,
    "#403346",
    [
      [x, y],
      [x + w, y],
      [x + w - 8, y + h],
      [x + 16, y + h],
      [x + 3, y + 12]
    ],
    INK.black,
    3
  );
  line(c, INK.acid, 3, x, y, x + w, y);
  for (let i = 0; i < 4; i++)
    poly2(c, "#9ca852", [
      [x + 12 + i * 12, y + 5],
      [x + 20 + i * 12, y + 5],
      [x + 14 + i * 12, y + 13],
      [x + 6 + i * 12, y + 13]
    ]);
  for (let i = 0; i < 3; i++) line(c, "#afbf76", 2, x + w - 40 + i * 9, y + 15, x + w - 36 + i * 9, y + 10, x + w - 32 + i * 9, y + 15);
}
/** Quiet chalk diagrams belong to the background, never the collision layer. */
export function drawTutorialWall(c,w,h,lesson) {
 c.save();try{
  c.globalAlpha=Number.isFinite(lesson.wallAlpha)?lesson.wallAlpha:.22;
  c.strokeStyle='#e3f5c8';c.fillStyle='#e3f5c8';c.lineWidth=2.4;c.lineCap='round';c.lineJoin='round';
  const size=Math.min(w*.22,h*.18,130),cx=w*.5-size*1.2,cy=Math.max(90,h*.22);c.translate(cx,cy);c.scale(size/100,size/100);
  const stroke=(...p)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const cube=(x,y)=>{c.strokeRect(x-12,y-12,24,24);};
  const triangle=(x,y)=>stroke([x,y-14],[x+14,y+12],[x-14,y+12],[x,y-14]);
  const pointer=(x,y,dx,dy)=>{stroke([x,y],[x+dx,y+dy]);const a=Math.atan2(dy,dx);stroke([x+dx-8*Math.cos(a-.6),y+dy-8*Math.sin(a-.6)],[x+dx,y+dy],[x+dx-8*Math.cos(a+.6),y+dy-8*Math.sin(a+.6)]);};
  if(lesson.stage===0){cube(0,0);pointer(0,20,-24,14);pointer(38,3,31,-20);triangle(128,-12);triangle(155,-28);triangle(182,-44);pointer(200,0,30,0);for(let i=0;i<3;i++)c.fillRect(250+i*13,0,10,4);}
  else if(lesson.stage===1){cube(0,0);pointer(25,0,48,0);stroke([90,-38],[90,35]);pointer(90,-3,-42,-25);stroke([155,-30],[155,30]);stroke([180,-30],[180,30]);pointer(205,0,35,0);stroke([260,-20],[275,0],[260,20]);}
  else if(lesson.stage===2){c.beginPath();c.arc(0,0,22,0,Math.PI*2);c.stroke();stroke([-12,-12],[12,12]);stroke([12,-12],[-12,12]);pointer(38,0,32,0);cube(94,-25);pointer(94,0,0,32);pointer(132,0,32,0);triangle(194,0);stroke([218,12],[227,21],[246,-4]);}
  else {triangle(0,0);for(let i=0;i<3;i++){pointer(38+i*48,0,25,0);}c.beginPath();c.arc(218,0,21,0,Math.PI*2);c.stroke();stroke([199,18],[236,-18]);}
 }finally{c.restore();}
}
/** Wordless live cue: the input demonstration and ghost travel are separate
 * from the real actor. Uses screen units, never intercepts pointer events, and
 * freezes to an explanatory end-state when reduced motion is requested. */
export function drawTutorialGuidance(c,v,lesson,p,motion=true,device='touch'){
 const guide=lesson?.guide;if(!guide||!lesson.guideVisible||!v?.scale)return;
 const width=v.width,height=v.height,scale=v.scale;
 const from={x:(p.x-v.x)*scale,y:(p.y-v.y)*scale},target={x:(guide.x-v.x)*scale,y:(guide.y-v.y)*scale};
 const dx=target.x-from.x,dy=target.y-from.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 const clock=motion?(lesson.guideClock||0)%180/180:.65;
 c.save();try{
  c.lineCap='round';c.lineJoin='round';
  // The live red warning is the only ring in the dodge lesson.
  if(guide.kind==='watch'||guide.kind==='resolve'||guide.kind==='wait-next')return;
  if(guide.kind==='dodge'){
   // The bright diamond is a real tap/click destination outside the actual
   // strike zone; draw it above the scene, not as a second warning ring.
   c.globalAlpha=.95;arrow(c,'#dfff88',from.x+ux*32,from.y+uy*32,target.x-ux*22,target.y-uy*22,4,11);
   const pulse=motion?1+.1*Math.sin(clock*Math.PI*4):1;
   c.save();c.translate(target.x,target.y);c.scale(pulse,pulse);c.fillStyle='#16251d';c.strokeStyle='#e6ff9a';c.lineWidth=3;c.beginPath();c.moveTo(0,-17);c.lineTo(17,0);c.lineTo(0,17);c.lineTo(-17,0);c.closePath();c.fill();c.stroke();
   c.strokeStyle='#e6ff9a';c.lineWidth=2;c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.moveTo(0,-5);c.lineTo(0,5);c.stroke();c.restore();
   const direction=Math.abs(dx)>=Math.abs(dy)?(dx<0?'←':'→'):(dy<0?'↑':'↓');
   const label=device==='keys'?`${direction} + SPACE`:device==='mouse'?'CLICK':'TAP';
   c.font='bold 11px monospace';c.textAlign='center';c.textBaseline='middle';const tw=c.measureText(label).width+12,ly=target.y>height-75?target.y-28:target.y+29;
   c.fillStyle='#111922ed';c.fillRect(target.x-tw/2,ly-9,tw,18);c.fillStyle='#eaffbc';c.fillText(label,target.x,ly);return;
  }
  // A bright outgoing arrow is distinct from the backward finger movement.
  const length=Math.min(Math.max(60,d-24),145,Math.min(width,height)*.34);
  c.globalAlpha=.82;arrow(c,guide.kind==='dodge'?'#ffe3a1':'#dfff88',from.x+ux*32,from.y+uy*32,from.x+ux*length,from.y+uy*length,2.7,10);
  if(d<Math.max(width,height)*1.3 && ['slice','gate'].includes(guide.kind)){
   c.globalAlpha=.58;c.strokeStyle='#f3f5cf';c.lineWidth=2;const r=Math.max(17,(guide.r||20)*scale+9)+(motion?Math.sin(clock*Math.PI*2)*2:0);c.beginPath();c.arc(target.x,target.y,r,0,Math.PI*2);c.stroke();
  }
  // The opening caption teaches a tap. Illustrate that same action rather
  // than showing an unrelated pull-back gesture alongside it.
  if(lesson.stage===0&&guide.kind==='slice'&&device!=='keys'){
   const down=!motion||clock>.28&&clock<.58;
   c.globalAlpha=.94;hand(c,target.x+9,target.y+8+(motion&&!down?5:0),device==='touch'?'touch':'mouse',down,.85);
   if(down){c.strokeStyle='#dfff88';c.lineWidth=2;c.beginPath();c.arc(target.x,target.y,22,Math.PI*1.08,Math.PI*1.8);c.stroke();}
   return;
  }
  // Demonstrate press → pull backwards → release, near but not on the actor.
  const pull=47,baseX=clamp(from.x-ux*39,25+Math.max(0,ux*pull),width-35+Math.min(0,ux*pull)),baseY=clamp(from.y-uy*39,35+Math.max(0,uy*pull),height-58+Math.min(0,uy*pull));
  if(device==='keys'){
   c.globalAlpha=.86;c.fillStyle='#f5edda';c.strokeStyle='#24212c';c.lineWidth=2;c.fillRect(baseX-13,baseY-12,26,24);c.strokeRect(baseX-13,baseY-12,26,24);
   arrow(c,'#24212c',baseX-ux*6,baseY-uy*6,baseX+ux*7,baseY+uy*7,2,5);key(c,baseX,baseY+28,'space',clock>.45&&clock<.65);
  }else{
   const amount=motion?smooth((clock-.12)/.32):1;
   c.globalAlpha=.6;c.strokeStyle='#f0ecd7';c.lineWidth=1.6;c.setLineDash([4,5]);c.beginPath();c.moveTo(baseX,baseY);c.lineTo(baseX-ux*pull,baseY-uy*pull);c.stroke();c.setLineDash([]);
   c.beginPath();c.arc(baseX,baseY,5,0,Math.PI*2);c.stroke();
   arrow(c,'#f0ecd7',baseX-ux*28,baseY-uy*28,baseX-ux*pull,baseY-uy*pull,1.8,6);
   if(!motion||clock<.57){c.globalAlpha=.9;hand(c,baseX-ux*pull*amount,baseY-uy*pull*amount,device==='touch'?'touch':'mouse',clock<.5,1.05);}
  }
  // Dashed ghost silhouette previews the outgoing movement, never replaces
  // the player or depicts an automatic hit. Its trail stops short of a target.
  const progress=motion?smooth((clock-.48)/.33):.7;
  if(!motion||clock>=.48&&clock<=.88){
   const x=from.x+ux*(35+progress*Math.max(0,length-40)),y=from.y+uy*(35+progress*Math.max(0,length-40));
   c.globalAlpha=.35*(motion?1-progress*.5:1);c.fillStyle='#fffbe7';c.fillRect(x-10,y-10,20,20);c.globalAlpha=.65*(motion?1-progress*.5:1);c.strokeStyle='#e8ffb5';c.lineWidth=2;c.setLineDash([4,4]);c.strokeRect(x-10,y-10,20,20);c.setLineDash([]);c.fillStyle='#24302c';c.fillRect(x-6,y-4,4,2);c.fillRect(x+2,y-4,4,2);
  }
 }finally{c.restore();}
}
function drawTutorialScene(c, lesson, combat, p, scale, motion, time){
 c.save();try{
  if(lesson.stage===0){
   const rack=[...combat.enemies.values()].filter(e=>e.id.startsWith('tutorial/rack/'));
   if(rack.length){const a=rack[0],b=rack[rack.length-1];c.strokeStyle='#d5e6b0';c.globalAlpha=.3;c.lineWidth=4/scale;c.beginPath();c.moveTo(a.x-40,a.y+23);c.lineTo(b.x+40,b.y-23);c.stroke();}

  }
  for(const wall of lesson.walls||[]){c.fillStyle='#353444';c.fillRect(wall.x,wall.y,wall.w,wall.h);c.strokeStyle='#77717b';c.lineWidth=2/scale;c.strokeRect(wall.x,wall.y,wall.w,wall.h);}
  if(lesson.gateTarget&&!lesson.gateBroken){const q=lesson.gateTarget;c.save();c.translate(q.x,q.y);if(q.axis==='y')c.rotate(Math.PI/2);const w=q.axis==='x'?q.w:q.h,h=q.axis==='x'?q.h:q.w;c.globalAlpha=lesson.gateReady?.72:.44;c.fillStyle=lesson.gateReady?'#d6ffa9':'#acdcc7';c.fillRect(-w/2,-h/2,w,h);c.globalAlpha=.8;c.strokeStyle='#ecffdc';c.lineWidth=2/scale;c.strokeRect(-w/2,-h/2,w,h);c.beginPath();c.moveTo(5,-h/2+5);c.lineTo(-9,-h*.1);c.lineTo(9,h*.08);c.lineTo(-5,h/2-5);c.stroke();c.restore();}

  if(lesson.stage===1&&lesson.wallX!=null){c.globalAlpha=.7;c.strokeStyle='#d9ff83';c.lineWidth=10/scale;c.shadowColor='#bfff69';c.shadowBlur=25/scale;c.beginPath();c.moveTo(lesson.wallX-5,p.y-210/scale);c.lineTo(lesson.wallX-5,p.y+210/scale);c.stroke();c.shadowBlur=0;}
  if(lesson.gate){const a=lesson.gate.age/32;c.globalAlpha=(1-a)*.9;c.strokeStyle='#edffe3';c.lineWidth=3/scale;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,d=(20+a*100)/scale;c.beginPath();c.moveTo(lesson.gate.x+Math.cos(angle)*d,lesson.gate.y+Math.sin(angle)*d);c.lineTo(lesson.gate.x+Math.cos(angle)*(d+35/scale),lesson.gate.y+Math.sin(angle)*(d+35/scale));c.stroke();}}
  if(lesson.bumpFlash>0){c.globalAlpha=lesson.bumpFlash/24*.8;c.strokeStyle='#ff6579';c.lineWidth=3/scale;c.beginPath();c.arc(p.x,p.y,(35+(24-lesson.bumpFlash)*2)/scale,0,Math.PI*2);c.stroke();}
 }finally{c.restore();}
}

function drawArc(c, run, aim, alpha, scale, hint, time, view) {
  const a = predictAim(run, aim, {
    focus: true,
    magnetic: !("lock" in aim),
    corridor: run.assist?.({ focus: true }).corridor ?? null
  });
  if (!a) return null;
  const rgb = speedRgb(a.power);
  const end = a.end, margin = 40, inView2 = (q) => q.x >= view.x - margin && q.x <= view.x + view.w + margin && q.y >= view.y - margin && q.y <= view.y + view.h + margin, stop = end && a.hit && inView2(end) ? end : null, path2 = [];
  for (const q of a.path) {
    path2.push(q);
    if (!inView2(q) || stop && Math.hypot(q.x-a.start.x,q.y-a.start.y) >= (a.hit?.along ?? Math.hypot(stop.x-a.start.x,stop.y-a.start.y))) break;
  }
  const level=sensorTier(run.state.equipment?.trajectory,"trajectory");
  const horizon = Math.min(path2.length, trajectorySamples(run.state.equipment?.trajectory));
  path2.length = Math.min(path2.length, horizon);
  const last = Math.max(1, path2.length - 1);
  c.save();
  if (!hint && !aim.anchor) {
    const start=a.start,n=Math.hypot(a.velocity.x,a.velocity.y)||1,ux=a.velocity.x/n,uy=a.velocity.y/n;
    const rr=34/scale,tx=start.x+ux*64/scale,ty=start.y+uy*64/scale;
    // Fixed screen-size launch compass stays readable at every camera zoom.
    arc(c,"#10141dcc",7/scale,start.x,start.y,rr,0,TAU);
    arc(c,INK.paper,2/scale,start.x,start.y,rr,-Math.PI/2,-Math.PI/2+TAU*clamp(a.power,0,1));
    line(c,"#10141d",7/scale,start.x+ux*39/scale,start.y+uy*39/scale,tx,ty);
    line(c,INK.acid,3/scale,start.x+ux*39/scale,start.y+uy*39/scale,tx,ty);
    poly2(c,INK.acid,[[tx+ux*8/scale,ty+uy*8/scale],[tx-ux*4/scale-uy*6/scale,ty-uy*4/scale+ux*6/scale],[tx-ux*4/scale+uy*6/scale,ty-uy*4/scale-ux*6/scale]]);

  }
  if (aim.anchor && hint) {
    const o = aim.anchor, tip = a.start;
    c.save();
    c.globalAlpha = 0.34 + 0.26 * a.power;
    arc(c, INK.paper, 1.4 / scale, o.x, o.y, (5 + 2.5 * a.power) / scale, 0, TAU);
    c.globalAlpha = 0.16 + 0.14 * a.power;
    arc(c, INK.paper, 1 / scale, o.x, o.y, (11 + 4 * a.power) / scale, 0, TAU);
    c.restore();
  }
  for (let i = 0; i < path2.length; i++) {
    const q = path2[i], prev = i ? path2[i - 1] : a.start, u = i / Math.max(1, last), tail = {
      x: q.x - (q.x - prev.x) * (0.42 + 0.34 * a.power),
      y: q.y - (q.y - prev.y) * (0.42 + 0.34 * a.power)
    };
    const fade2 = (hint ? 0.62 : 0.94) * (1 - u) ** (stop ? 0.55 : 1.5);
    if (fade2 < 0.02) continue;
    const pathInk=level?'#baf9e0':'#dcebb7';
    c.globalAlpha = fade2 * (hint ? 0.17 : 0.24);
    line(c, pathInk, 6 / scale, prev.x, prev.y, q.x, q.y);
    c.globalAlpha = fade2;
    const cutting = (i + 1) * ARC.step <= 16 + 15 * Math.min(1, a.power);
    if (!cutting) c.globalAlpha *= 0.35;
    line(c, pathInk, (cutting ? 2.5 : 1.4) / scale, cutting ? prev.x : tail.x, cutting ? prev.y : tail.y, q.x, q.y);
  }
  c.globalAlpha = 1;
  const endVisible=end && inView2(end) && path2.length && Math.hypot(path2[path2.length-1].x-end.x,path2[path2.length-1].y-end.y)<60/scale;
  if (endVisible && !hint) {
    const at = end.kind === "target" ? { x: end.x, y: end.y } : end, r = (end.kind === "target" ? a.hit?.r ?? 20 : 6) + 10 / Math.max(0.35, scale);
    c.save();
    c.translate(at.x, at.y);
    c.strokeStyle = a.lock ? INK.paper : `rgb(${rgb.join(",")})`;
    c.lineWidth = 2.2 / scale;
    c.rotate(time * 6e-3);
    for (let j = 0; j < 4; j++) {
      c.beginPath();
      c.arc(0, 0, r, j * Math.PI / 2 + 0.2, j * Math.PI / 2 + 0.82);
      c.stroke();
    }
    if (a.lock) {
      c.rotate(-time * 0.012);
      c.strokeStyle = INK.acid;
      for (let j = 0; j < 4; j++) {
        const s = j * Math.PI / 2 + Math.PI / 4;
        c.beginPath();
        c.moveTo(Math.cos(s) * (r + 3 / scale), Math.sin(s) * (r + 3 / scale));
        c.lineTo(Math.cos(s) * (r + 12 / scale), Math.sin(s) * (r + 12 / scale));
        c.stroke();
      }
    }
    c.restore();
  } else if (!hint && path2.length) {
    const q = path2[path2.length - 1];
    c.save();
    c.globalAlpha = 0.5;
    c.strokeStyle = `rgb(${rgb.join(",")})`;
    c.lineWidth = 1.6 / scale;
    c.beginPath();
    c.arc(q.x, q.y, 7 / scale, 0.35, 0.95);
    c.arc(q.x, q.y, 7 / scale, 0.35 + Math.PI, 0.95 + Math.PI);
    c.stroke();
    c.restore();
  }
  if(!hint&&level>=2){
    // Time ticks are sampled from the exact trajectory, not a second aim line.
    c.save();c.lineWidth=1.2/scale;c.strokeStyle='#e7f9ca';
    for(let i=5;i<path2.length;i+=6){const q=path2[i],prev=path2[i-1],dx=q.x-prev.x,dy=q.y-prev.y,n=Math.hypot(dx,dy)||1;c.globalAlpha=.7;c.beginPath();c.moveTo(q.x-dy/n*4/scale,q.y+dx/n*4/scale);c.lineTo(q.x+dy/n*4/scale,q.y-dx/n*4/scale);c.stroke();}
    c.restore();
  }
  if(!hint&&level>=3){
    // A compact, bounded receipt. Static targets are snapshots; moving enemies
    // and rebounds are not promises, so do not extrapolate after first impact.
    const width=138/scale,height=42/scale,x=clamp(a.start.x+(a.velocity.x>=0?-width-34/scale:45/scale),view.x+8/scale,view.x+view.w-width-8/scale),y=clamp(a.start.y-82/scale,view.y+50/scale,view.y+view.h-height-12/scale);
    c.save();c.fillStyle='#101620e8';c.fillRect(x,y,width,height);c.strokeStyle='#a9eddf';c.lineWidth=1/scale;c.strokeRect(x,y,width,height);c.fillStyle='#d9fff0';c.font=`${9/scale}px monospace`;c.textAlign='left';c.textBaseline='top';
    const speed=Math.hypot(a.velocity.x,a.velocity.y)*(run.state.opening||run.state.hyper?1:run.state.dashSpeed||1),angle=Math.round(Math.atan2(a.velocity.y,a.velocity.x)*180/Math.PI),ticks=a.hit?.ticks??a.end?.ticks;
    c.fillText(`SPD ${speed.toFixed(1)}PX/T ${angle}°`,x+6/scale,y+6/scale);
    c.fillStyle='#a6c5be';c.fillText(ticks!=null?`IMPACT ~${(ticks/60).toFixed(2)}s · EST`:'FREE FLIGHT · SNAPSHOT',x+6/scale,y+22/scale);c.restore();
  }
  const pair = sightPicture(
    a.start,
    a.velocity,
    run.world.geometry,
    run.combat.enemies.values(),
    run.state.drive > 0 ? 3 : 1
  ).pair;
  pair.forEach(({ e, angle }, i) => {
    const q = pose(e, alpha);
    nick(c, q.x, q.y, e.r, angle, i + 1, scale);
  });
  c.restore();
  return a;
}
/** Fang staging is derived from authoritative tell/rush clocks, never a
 * separate animation timer. Presentation only; the collision body stays put. */
export function resolveFangAnticipation(e={},motion=true){
 const identity={x:1,y:1,offset:0};if(e.kind!=='fang'||!motion)return identity;
 if(e.mode==='tell'){
  const f=1-clamp((e.clock||0)/Math.max(1,e.span||66),0,1),load=f*f*(3-2*f);
  return {x:1-load*.1,y:1+load*.065,offset:-load*2};
 }
 if(e.mode==='rush'){
  const release=Math.exp(-(24-clamp(e.clock||0,0,24))*.24);
  return {x:1+release*.13,y:1-release*.07,offset:release*2};
 }
 return identity;
}
/** One lane and three fixed pressure gates replace stacked arrows/cone/dashes. */
export function drawFangIntent(c,{x=0,y=0,r=22,aim=0,clock=66,span=66,lungeSpeed=10.8,scale=1,arena=null}={}){
 if(![x,y,r,aim,clock,span,lungeSpeed].every(Number.isFinite)||r<=0||span<=0)return;
 const f=1-clamp(clock/span,0,1),length=24*Math.max(0,lungeSpeed)+r,half=r*.6;
 if(arena){
  // The simulation clamps x/y independently at each rail; after the first
  // collision a diagonal charge can slide along the rail. Show both segments.
  const vx=Math.cos(aim)*lungeSpeed,vy=Math.sin(aim)*lungeSpeed;
  const loX=arena.x+r,hiX=arena.x+arena.w-r,loY=arena.y+r,hiY=arena.y+arena.h-r;
  const tx=vx>0?(hiX-x)/vx:vx<0?(loX-x)/vx:Infinity,ty=vy>0?(hiY-y)/vy:vy<0?(loY-y)/vy:Infinity;
  const t=clamp(Math.min(tx,ty),0,24),end={x:clamp(x+vx*24,loX,hiX),y:clamp(y+vy*24,loY,hiY)},bend={x:clamp(x+vx*t,loX,hiX),y:clamp(y+vy*t,loY,hiY)};
  c.save();try{
   c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x,y);c.lineTo(bend.x,bend.y);c.lineTo(end.x,end.y);
   c.strokeStyle='#f36e91';c.globalAlpha=.12+f*.07;c.lineWidth=2*(r+PLAYER_SIZE*.44);c.stroke();
   c.setLineDash([8/Math.max(.1,scale),6/Math.max(.1,scale)]);c.strokeStyle='#ffd8df';c.globalAlpha=.75+f*.2;c.lineWidth=Math.max(1.5,2/Math.max(.1,scale));c.stroke();
  }finally{c.restore();}return;
 }
 c.save();try{c.translate(x,y);c.rotate(aim);c.lineJoin='miter';c.lineCap='butt';
 c.fillStyle='#f36e91';c.globalAlpha=.10+f*.06;
 c.beginPath();c.moveTo(r+5,-half);c.lineTo(length-13,-half*.6);c.lineTo(length,0);c.lineTo(length-13,half*.6);c.lineTo(r+5,half);c.closePath();c.fill();
 c.strokeStyle='#d77c98';c.lineWidth=Math.max(1.5,2/Math.max(.1,scale));c.globalAlpha=.68+f*.25;
 for(const side of [-1,1]){c.beginPath();c.moveTo(r+8,side*half);c.lineTo(length-13,side*half*.6);c.lineTo(length,0);c.stroke();}
 // Gates fill at fixed locations: no marching chevrons or repeated flashing.
 for(let i=0;i<3;i++){c.globalAlpha=f>=(i+1)/3?.95:.44;c.strokeStyle=f>=(i+1)/3?'#ffd8df':'#bb7c94';c.lineWidth=Math.max(1,1.3/Math.max(.1,scale));const gx=r+17+i*14;c.beginPath();c.moveTo(gx,-4);c.lineTo(gx,4);c.stroke();}
 c.globalAlpha=.4+f*.4;c.strokeStyle='#f1b2c4';c.lineWidth=Math.max(1,1.2/Math.max(.1,scale));
 c.beginPath();c.moveTo(-r*.7,-r*.8);c.lineTo(-r-6,-r*.8);c.lineTo(-r-6,r*.8);c.lineTo(-r*.7,r*.8);c.stroke();
 }finally{c.restore();}
}

/** The one geometry definition used by the combat simulation and rendering.
 * A zone is fixed at wind-up: Fork's two cross bars, Bastion's forward wedge,
 * Rift's landing circle, or Well's compression circle. Dimensions are world
 * units; the cube's collision radius is applied separately in the simulation. */
export function enemyAttackZone(kind,x,y,angle=0,r=32){
 if(!['fork','bastion','rift','well'].includes(kind))return null;
 const point=(a,b)=>Object.freeze({x:x+a*Math.cos(angle)-b*Math.sin(angle),y:y+a*Math.sin(angle)+b*Math.cos(angle)});
 const polygon=(pts)=>Object.freeze(pts.map(([a,b])=>point(a,b)));
 const polygons=kind==='fork'?[
  polygon([[-126,-25],[126,-25],[126,25],[-126,25]]),
  polygon([[-25,-126],[25,-126],[25,126],[-25,126]])
 ]:kind==='bastion'?[polygon([[r*.65,-28],[r+136,-69],[r+136,69],[r*.65,28]])]:[];
 return Object.freeze({kind,x,y,angle,radius:kind==='rift'?88:kind==='well'?112:0,polygons:Object.freeze(polygons)});
}
/** Dashed outlines are non-damaging tells; solid filled regions are active. */
export function drawEnemyZone(c,zone,active=false,scale=1){
 if(!zone)return;const unit=1/Math.max(.1,scale),color={fork:'#ffc19b',bastion:'#ffe1a0',rift:'#ffb5c7',well:'#ead3ff'}[zone.kind]||'#ffffff';
 c.save();try{
  c.lineJoin='round';c.lineWidth=(active?2.7:2)*unit;c.strokeStyle=color;
  c.fillStyle=color;c.globalAlpha=active?.25:.08;
  const path=()=>{c.beginPath();if(zone.radius)c.arc(zone.x,zone.y,zone.radius,0,TAU);for(const poly of zone.polygons||[]){if(!poly.length)continue;c.moveTo(poly[0].x,poly[0].y);for(const p of poly.slice(1))c.lineTo(p.x,p.y);c.closePath();}};
  path();c.fill();c.globalAlpha=active?.95:.82;c.setLineDash(active?[]:[8*unit,6*unit]);path();c.stroke();
  if(zone.kind==='rift'){c.save();c.translate(zone.x,zone.y);c.scale(14*unit,14*unit);c.globalAlpha=1;drawRiftGlyph(c,'#e0123a');c.restore();}
  // A second, inset mark differentiates circular Rift and Well effects by shape.
  if(zone.radius){c.setLineDash([]);c.globalAlpha=active?.85:.55;const d=zone.radius*.44;
   if(zone.kind==='rift')for(let j=0;j<4;j++){const a=j*TAU/4+Math.PI/4;line(c,color,1.5*unit,zone.x+Math.cos(a)*d,zone.y+Math.sin(a)*d,zone.x+Math.cos(a)*(d+14*unit),zone.y+Math.sin(a)*(d+14*unit));}
   else for(let j=0;j<4;j++){const a=j*TAU/4,ux=Math.cos(a),uy=Math.sin(a),tx=-uy,ty=ux;line(c,color,1.5*unit,zone.x+ux*(d+12*unit)+tx*5*unit,zone.y+uy*(d+12*unit)+ty*5*unit,zone.x+ux*d,zone.y+uy*d,zone.x+ux*(d+12*unit)-tx*5*unit,zone.y+uy*(d+12*unit)-ty*5*unit);}
  }
 }finally{c.restore();}
}

// Presentation only: the vocabulary describes the real attack, never an idle
// enemy as actively dangerous. Progress is derived from its live wind-up clock.
const INTENT_VERBS=Object.freeze({fang:'RUSH',pulse:'RING',prism:'SHOT',fork:'SWIPE / SPLIT',bastion:'SLAM',rift:'BLINK STRIKE',well:'PULL / CRUSH',crown:'VOLLEY'});
export function enemyIntent(enemy, hazards=[], links=[]) {
 // CHUNK 6B: the landlord surfaces its three tells on the HUD — the same
 // WINDUP/ATTACK language every other shape uses. Pinned enemies normally get
 // nothing; the landlord is the exception that teaches itself.
 if (enemy.kind === 'monolith') {
   if (enemy.slamTell > 0) return {label:'MONOLITH / PLATE SLAM',state:'WINDUP',progress:clamp(1 - enemy.slamTell / 30, 0, 1)};
   if (enemy.lashTell > 0) return {label:'MONOLITH / SEISMIC LASH',state:'WINDUP',progress:clamp(1 - enemy.lashTell / 54, 0, 1)};
   if (enemy.lensTell > 0) return {label:'MONOLITH / GRAVITY LENS',state:'WINDUP',progress:clamp(1 - enemy.lensTell / 45, 0, 1)};
   if (enemy.lensT > 0) return {label:'MONOLITH / PULLED',state:'ATTACK',progress:null};
   if ((hazards || []).some(h => !h.spent && h.sourceId === enemy.id)) return {label:'MONOLITH',state:'ATTACK',progress:null};
   return null;
 }
 const verb=INTENT_VERBS[enemy.kind];if(!verb||enemy.paper||enemy.pinned)return null;
 const link=links.find(l=>(l.a.id===enemy.id||l.b.id===enemy.id)&&(l.mode==='tell'||l.mode==='live'));
 if(link)return {label:'LINK / BEAM',state:link.mode==='tell'?'WINDUP':'ATTACK',progress:link.mode==='tell'?clamp(link.f,0,1):null};
 if(enemy.mode==='tell')return {label:`${enemy.kind.toUpperCase()} / ${verb}`,state:'WINDUP',progress:clamp(1-enemy.clock/Math.max(1,enemy.span),0,1)};
 if(enemy.mode==='rush'||hazards.some(h=>!h.spent&&h.sourceId===enemy.id))return {label:`${enemy.kind.toUpperCase()} / ${verb}`,state:'ATTACK',progress:null};
 return {label:`${enemy.kind.toUpperCase()} / ${verb}`,state:enemy.mode==='recover'?'RECOVER':'IDLE',progress:null};
}
/** A few nearest, non-overlapping labels; urgent tells win over idle names. */
export function enemyIntentBadges(v,combat,player,alpha=1){
 const list=[],hero=toScreen(v,player);
 for(const e of combat.enemies.values()){
  const intent=enemyIntent(e,combat.hazards||[],combat.links||[]);if(!intent)continue;
  const position={x:mix(Number.isFinite(e.px)?e.px:e.x,e.x,alpha),y:mix(Number.isFinite(e.py)?e.py:e.y,e.y,alpha)};
  const p=toScreen(v,position);if(p.x<0||p.x>v.width||p.y<0||p.y>v.height)continue;
  const distance=Math.hypot(e.x-player.x,e.y-player.y);
  list.push({...intent,bodyX:p.x,bodyY:p.y,offset:Math.max(25,e.r*v.scale+18),distance});
 }
 list.sort((a,b)=>(a.state==='WINDUP'?0:a.state==='ATTACK'?1:2)-(b.state==='WINDUP'?0:b.state==='ATTACK'?1:2)||a.distance-b.distance);
 const chosen=[];
 for(const item of list){
  const x=Math.max(72,Math.min(v.width-72,item.bodyX));
  // Try above and below the body; HUD corners and the hero remain clear.
  for(const y of [item.bodyY-item.offset,item.bodyY+item.offset]){
   if(y<24||y>v.height-24||Math.hypot(x-hero.x,y-hero.y)<70)continue;
   if(y<135&&(x<160||x>v.width-160))continue;
   if(chosen.some(a=>Math.abs(a.x-x)<145&&Math.abs(a.y-y)<38))continue;
   chosen.push({...item,x,y});break;
  }
  if(chosen.length===4)break;
 }
 return chosen;
}
export function drawEnemyIntentBadges(c,v,combat,player,alpha=1){
 const badges=enemyIntentBadges(v,combat,player,alpha);c.save();try{
  c.textAlign='center';c.textBaseline='middle';c.font='bold 11px monospace';
  for(const b of badges){
   const width=Math.max(96,Math.min(142,c.measureText(b.label).width+14)),active=b.state==='WINDUP'||b.state==='ATTACK';
   c.fillStyle='#17101deb';c.fillRect(b.x-width/2,b.y-17,width,32);
   c.strokeStyle=active?'#ffbbac':'#aa9eae';c.lineWidth=active?1.5:1;c.strokeRect(b.x-width/2,b.y-17,width,32);
   c.fillStyle='#fff5ed';c.fillText(b.label,b.x,b.y-9,width-6);
   c.font='bold 10px monospace';c.fillStyle=active?'#ffb2a8':'#c5b6c5';c.fillText(b.state==='WINDUP'?'CHARGING':b.state==='ATTACK'?'ATTACK':b.state==='RECOVER'?'RECOVER':'',b.x,b.y+3,width-6);
   if(b.progress!==null){c.fillStyle='#61414b';c.fillRect(b.x-width/2+2,b.y+11,width-4,3);c.fillStyle='#ffcaad';c.fillRect(b.x-width/2+2,b.y+11,(width-4)*b.progress,3);}
   c.font='bold 11px monospace';
  }
 }finally{c.restore();}return badges;
}
export function drawPlayerDamageReceipt(c,v,player,state){
 const hit=state.lastDamage;if(!hit||state.elapsed-hit.tick>90||state.elapsed<hit.tick)return;
 const p=toScreen(v,player),x=clamp(p.x,82,v.width-82),y=clamp(p.y-58,150,v.height-35);
 c.save();try{
  c.fillStyle='#280e18ed';c.fillRect(x-75,y-15,150,30);c.strokeStyle='#ffb5aa';c.lineWidth=2;c.strokeRect(x-75,y-15,150,30);
  c.textAlign='center';c.textBaseline='middle';c.font='bold 12px monospace';c.fillStyle='#fff4e9';c.fillText(`−1 HEALTH · ${hit.hp}/${hit.hpMax}`,x,y-5);
  c.font='bold 9px monospace';c.fillStyle='#ffb5aa';c.fillText(String(hit.cause==='Fang'?'Fang rush':hit.cause).toUpperCase(),x,y+7,142);
 }finally{c.restore();}
}

/** Camera-only edge notices. They never affect AI or hit geometry. */
export function enemyThreatIndicators(v,combat){
 const out=[],seen=new Set(),w=v.width,h=v.height;
 const add=(point,label,state,key,progress=null,verb=null)=>{
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||seen.has(key))return;
  const screen=toScreen(v,point);if(screen.x>=0&&screen.x<=w&&screen.y>=0&&screen.y<=h)return;
  seen.add(key);const dx=screen.x-w/2,dy=screen.y-h/2,k=Math.min(Math.max(1,w/2-42)/Math.max(1,Math.abs(dx)),Math.max(1,h/2-34)/Math.max(1,Math.abs(dy)));
  out.push({x:w/2+dx*k,y:h/2+dy*k,angle:Math.atan2(dy,dx),label,state,progress,verb,distance:Math.hypot(dx,dy)});
 };
 for(const e of combat.enemies.values())if(e.mode==='tell'||e.mode==='rush'){
  add(e,e.kind.toUpperCase(),e.mode==='tell'?'TELL':'ATTACK',`enemy:${e.id}`,e.mode==='tell'&&Number.isFinite(e.clock)&&Number.isFinite(e.span)?clamp(1-e.clock/Math.max(1,e.span),0,1):null,INTENT_VERBS[e.kind]);
  if(e.kind==='rift'&&e.mode==='tell'&&e.attackZone)add(e.attackZone,'RIFT','LANDING',`rift:${e.id}`,Number.isFinite(e.clock)&&Number.isFinite(e.span)?clamp(1-e.clock/Math.max(1,e.span),0,1):null,'STRIKE');
 }
 for(const h of combat.hazards||[])if(!h.spent)add(h,String(h.source||'ATTACK').toUpperCase(),'ATTACK',`hazard:${h.attackId||h.source}`);
 for(const l of combat.links||[])if(l.mode==='tell'||l.mode==='live'){
  add(l.a,'LINK',l.mode==='tell'?'TELL':'ATTACK',`link:${l.a.id}`,l.mode==='tell'?clamp(l.f,0,1):null,'BEAM');add(l.b,'LINK',l.mode==='tell'?'TELL':'ATTACK',`link:${l.b.id}`,l.mode==='tell'?clamp(l.f,0,1):null,'BEAM');
 }
 return out.sort((a,b)=>a.distance-b.distance).slice(0,5);
}
export function drawEnemyThreatIndicators(c,v,combat,{top=32,gutter=20}={}){
 const items=enemyThreatIndicators(v,combat);c.save();try{
  c.font='bold 9px monospace';c.textAlign='center';c.textBaseline='middle';
  for(const item of items){const q=overlayPoint(v.width,v.height,item,{radius:34,top,gutter});c.save();c.translate(q.x,q.y);
   c.fillStyle='#1b1420';c.strokeStyle='#fff1df';c.lineWidth=1.5;c.fillRect(-32,-12,64,24);c.strokeRect(-32,-12,64,24);
   c.fillStyle='#ffe4ad';c.fillText(item.verb?`${item.label} / ${item.verb}`:item.label,0,-5,60);c.fillStyle='#fff1df';c.fillText(item.state==='TELL'?'CHARGING':item.state,0,4,60);
   if(item.progress!==null){c.fillStyle='#6a4c4c';c.fillRect(-29,9,58,2);c.fillStyle='#ffcfac';c.fillRect(-29,9,58*item.progress,2);}
   c.rotate(item.angle);c.beginPath();c.moveTo(39,0);c.lineTo(32,-4);c.lineTo(32,4);c.closePath();c.fill();c.restore();
  }
 }finally{c.restore();}return items;
}

export function drawEnemyWarning(c, e, p, time, scale=1, motion=true, arena=null) {
  const col = TYPES[e.kind].color;
  if (e.kind === "well") {
    // The real pull checks dist < 234 only while the cube is launched.
    // Inward arrowheads distinguish this harmless field from Pulse's solid rim.
    const unit=1/Math.max(.1,scale),r=234;
    c.save();c.globalAlpha=.48;c.setLineDash([5*unit,7*unit]);
    arc(c,col,Math.max(1,1.3*unit),p.x,p.y,r);c.setLineDash([]);
    for(let j=0;j<4;j++){
      const a=j*TAU/4+(motion?time*.004:0),ux=Math.cos(a),uy=Math.sin(a),tx=-uy,ty=ux;
      const tip=r-19*unit,base=tip+10*unit;
      line(c,'#e3dcff',Math.max(1,1.6*unit),p.x+ux*base+tx*5*unit,p.y+uy*base+ty*5*unit,p.x+ux*tip,p.y+uy*tip,p.x+ux*base-tx*5*unit,p.y+uy*base-ty*5*unit);
    }
    c.restore();
  }
  if (e.kind === "fang" && e.mode === "rush") {
    // Active charge is marked at the real body, distinct from the lane tell.
    c.save();c.translate(p.x,p.y);c.rotate(e.aim);c.strokeStyle='#fff0e2';c.lineWidth=Math.max(1.8,2/Math.max(.1,scale));
    c.beginPath();c.moveTo(e.r*.25,-e.r*.78);c.lineTo(e.r*1.08,0);c.lineTo(e.r*.25,e.r*.78);c.stroke();c.restore();
  }
  if (e.mode !== "tell") return;
  if(e.attackZone)drawEnemyZone(c,e.attackZone,false,scale);
  const f = 1 - clamp(e.clock / e.span, 0, 1);
  c.save();
  if(e.kind==='fang'){c.restore();drawFangIntent(c,{...e,...p,scale,arena});return;}
  c.globalAlpha = (e.gentle ? 0.78 : 0.5) + (e.gentle ? 0.2 : 0.42) * f;
  const unit=1/Math.max(.1,scale);
  c.setLineDash([7*unit, 8*unit]);
  if (e.kind === "pulse") {
    // Dashed nested diaphragms are a wind-up, not the solid moving hit rim.
    for(const radius of [e.r+10+(1-f)*12,e.r+19+(1-f)*12])
      arc(c,'#ffd2df',Math.max(1.8,2*unit),p.x,p.y,radius);
  } else if (e.kind === "prism" || e.kind === "crown") {
    const count = e.kind === "crown" ? 10 : 1, length = e.kind === "prism" ? 840 : 230;
    for (let j = 0; j < count; j++) {
      const a = e.aim + j * TAU / count, dx = Math.cos(a), dy = Math.sin(a);
      line(c, col, Math.max(e.kind === "crown" ? 3.2 : 1.7, 2*unit), p.x + dx * e.r, p.y + dy * e.r, p.x + dx * length, p.y + dy * length);
    }
  } else if (e.kind === "rift") {
    c.save();
    c.translate(e.tx, e.ty);
    c.scale(1.45 * e.r, 1.45 * e.r);
    c.strokeStyle = col;
    c.lineWidth = 0.055;
    c.setLineDash([]);
    c.beginPath();
    trace(c, TYPES.rift.outline);
    c.stroke();
    c.restore();
    line(c, col, 1, p.x, p.y, e.tx, e.ty);
  }
  c.setLineDash([]);
  arc(c, col, 3, p.x, p.y, e.r + 19 - 12 * f, -Math.PI / 2, -Math.PI / 2 + TAU * f);
  c.restore();
}
function walls(c, v, p, floorFlash = 0, arena = ARENA) {
  const A = arena;
  if (!A) return;
  const half = PLAYER_SIZE / 2, x0 = A.x + half, x1 = A.x + A.w - half, y0 = A.y + half, y1 = A.y + A.h - half;
  const near = (d) => Math.max(0, Math.min(1, 1 - d / (Math.max(v.w, v.h) * 1.1)));
  const edges = [
    { d: Math.abs(p.x - x0), draw: (a) => wallLine(c, v, x0, y0, x0, y1, a, 1, 0) },
    { d: Math.abs(p.x - x1), draw: (a) => wallLine(c, v, x1, y0, x1, y1, a, -1, 0) },
    { d: Math.abs(p.y - y0), draw: (a) => wallLine(c, v, x0, y0, x1, y0, a, 0, 1) },
    { d: Math.abs(p.y - y1), draw: (a) => wallLine(c, v, x0, y1, x1, y1, a, 0, -1) }
  ];
  c.save();
  for (const e of edges) {
    const a = near(e.d);
    if (a <= 0.01) continue;
    e.draw(a);
  }
  if (floorFlash > 0) {
    const f = Math.min(1, floorFlash / 8), a = Math.min(1, f * 1.35), w = 34 + 26 * (1 - f);
    c.globalAlpha = a;
    c.strokeStyle = "#fff6e8";
    c.lineWidth = 2.5 + 3 * f;
    c.beginPath();
    c.moveTo(p.x - w, y1);
    c.lineTo(p.x + w, y1);
    c.stroke();
    c.globalAlpha = a * 0.2;
    c.lineWidth = 12;
    c.beginPath();
    c.moveTo(p.x - w - 18, y1);
    c.lineTo(p.x + w + 18, y1);
    c.stroke();
  }
  c.restore();
}
function wallLine(c, v, x0, y0, x1, y1, a, nx, ny) {
  const t = 1 / v.scale;
  c.globalAlpha = 0.12 * a;
  line(c, INK.paper, 1.4 * t, x0, y0, x1, y1);
  const len = 26 * t, step = 140 * t;
  const dx = x1 - x0, dy = y1 - y0, span = Math.hypot(dx, dy);
  if (span < 1) return;
  const ux = dx / span, uy = dy / span, n = Math.min(40, Math.max(1, Math.floor(span / step)));
  c.globalAlpha = 0.09 * a;
  for (let i = 0; i <= n; i++) {
    const k = i / n, px = x0 + dx * k, py = y0 + dy * k;
    line(c, INK.paper, 1 * t, px, py, px + nx * len, py + ny * len);
  }
}
function slashArc(c, x, y, r, age, dir, inv = 1, equipment = {}) {
  const slashPalette=corePalette(equipment.core);
  const sample = slashFor(age);
  if (!sample) return;
  const {angle: angle0, smear, alpha, weight, flash} = sample;
  if (alpha <= 0.01) return;
  const angle = angle0 + dir;
  const span = Math.min(SLASH.sweep, Math.abs(angle - dir) + 0.35) * (0.72 + 0.28 * smear);
  const r0 = r * 1.05, r1 = r * (1.9 + 0.5 * smear);
  const from = angle - span, to = angle;
  c.save();
  c.translate(x, y);
  if (smear > 0.02) {
    c.globalAlpha = alpha * 0.2 * smear;
    c.fillStyle = slashPalette.primary;
    c.beginPath();
    c.arc(0, 0, r1 * 0.9, from, to);
    c.arc(0, 0, r0, to, from, true);
    c.closePath();
    c.fill();
  }
  c.globalAlpha = alpha * (0.55 + 0.45 * flash);
  c.strokeStyle = flash > 0.35 ? slashPalette.light : slashPalette.primary;
  c.lineWidth = Math.max(0.6, (1.6 + 1.5 * weight) * inv);
  c.beginPath();
  c.arc(0, 0, r1, from, to);
  c.stroke();
  c.globalAlpha = alpha * 0.3 * weight;
  c.strokeStyle = slashPalette.light;
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, 0, r0 + (r1 - r0) * 0.35, from - 0.22, from + 0.3);
  c.stroke();
  if (smear > 0.05) {
    const n = 3 + Math.round(smear * 4), base = alpha * smear * 0.55;
    c.strokeStyle = slashPalette.light;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, a0 = from + span * t, len = r * (0.28 + 0.34 * smear) * (0.55 + 0.45 * Math.sin(t * Math.PI)), rStart = r1 * (1.02 + 0.06 * i * 0.25);
      c.globalAlpha = base * (0.5 + 0.5 * Math.sin(t * Math.PI));
      c.lineWidth = Math.max(0.5, (1.1 + 0.8 * smear) * inv);
      c.beginPath();
      c.moveTo(Math.cos(a0) * rStart, Math.sin(a0) * rStart);
      c.lineTo(Math.cos(a0) * (rStart + len), Math.sin(a0) * (rStart + len));
      c.stroke();
    }
  }
  if (smear > 0.22) {
    for (let g = 1; g <= 2; g++) {
      const back = span * g / 3.4;
      c.globalAlpha = alpha * smear * (0.3 / g);
      c.strokeStyle = slashPalette.primary;
      c.lineWidth = Math.max(0.4, 1.3 / g * inv);
      c.beginPath();
      c.arc(0, 0, r1 - g * 2, from - back, from - back + span * 0.34);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
  c.restore();
}
/** Presentation only. Elements describe equipment identity, never extra damage. */
export const DASH_ELEMENTS=Object.freeze(['ink','fire','lightning','ice','water','void','echo']);
export function dashElement(equipment={},sword=null){
 const chosen=equipment?.dash?.startsWith('dash-')?equipment.dash.slice(5):'';
 if(DASH_ELEMENTS.includes(chosen))return chosen;
 const id=sword?.build;
 if(['sun','forge','wyrm'].includes(id))return 'fire';
 if(id==='glacier')return 'ice';
 if(['storm','sentinel'].includes(id)||equipment.head==='coil'||equipment.slash==='laser')return 'lightning';
 if(id==='glacier'||equipment.core==='time')return 'ice';
 if(['phantom','wraith','arcade'].includes(id)||equipment.core==='echo')return 'echo';
 if(['king','eater','orbit'].includes(id)||equipment.core==='grav')return 'void';
 if(equipment.tail==='wings'||equipment.core==='magnet')return 'water';
 if(equipment.eyes==='blaze'||equipment.core==='riot')return 'fire';
 return 'ink';
}
/** Speed changes the rhythm/envelope of the existing element, never its identity. */
export function resolveDashTreatment(equipment={},sword=null,buff=null){
 const id=buff?.id||buff,d=resolveUpgradeConstruction(equipment,sword),rush=id==='comet',swift=id==='fleet';
 return Object.freeze({element:dashElement(equipment,sword),material:d.material,energy:d.energy,light:d.edge,ink:d.ink,speed:rush?1.25:swift?1.15:1,reach:rush?.85:1,stretch:rush?1.18:swift?1.08:1,compression:rush?.72:swift?.88:1,decay:rush?.3:swift?.25:.22});
}

/** Local bounded geometry follows actual velocity. Age is simulation ticks, not RAF count.
 * No randomness, filters, particles, DOM, imported state, or gameplay mutations. */
export function drawElementalDash(c,{x=0,y=0,vx=0,vy=0,angle=null,travel=0,age=-1,element='ink',radius=22,motion=true,equipment=null,sword=null,buff=null}={}){
 if(!motion||!Number.isFinite(age)||age<0||age>20||![x,y,vx,vy,radius].every(Number.isFinite))return;
 const speed=Math.hypot(vx,vy);if(speed<4||radius<=0)return;
 const treatment=resolveDashTreatment(equipment||{},sword,buff);
  // The launch bearing owns orientation. Speed only changes the envelope; it
  // cannot redirect a wake after a bank, rail reflection, or collision.
 const a=Number.isFinite(angle)?angle:Math.atan2(vy,vx),r=Math.min(30,radius),measuredTravel=Number.isFinite(travel)?Math.max(0,travel):0;
 const t=age/20,fade=(1-t)**2,punch=Math.exp(-age*treatment.decay),length=Math.min(180,speed*3.3)*(0.35+.65*punch),trailEvidence=Math.min(1,measuredTravel/Math.max(1,r*2.2));
 const baseColor={ink:'#eee9d9',fire:'#ff9856',lightning:'#8cecf4',ice:'#b1eaff',water:'#89dfcb',void:'#bd9bff',echo:'#edabd9'}[element]||'#eee9d9';
 const color=equipment?blend(baseColor,treatment.energy,.23):baseColor,light=equipment?blend(baseColor,treatment.light,.5):'#e9ffff';
 c.save();try{c.translate(x,y);c.rotate(a);c.scale(treatment.stretch,treatment.compression);c.globalAlpha=.65*fade;c.lineCap='butt';c.lineJoin='miter';
 const shape=(pts,fill)=>{c.fillStyle=fill;c.beginPath();pts.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fill();};
 const line=(pts,width,col)=>{c.strokeStyle=col;c.lineWidth=width;c.beginPath();pts.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();};
 // A two-tick directional smear connects poses, then yields to the clean hero.
 if(age<4){c.save();c.globalAlpha*=((4-age)/4)**2;shape([[-length,0],[-r*.55,-r*.67],[r*.25,-r*.32],[r*.4,r*.24],[-r*.7,r*.65]],color);c.restore();}
 if(element==='fire'){
 for(let i=0;i<5;i++){const side=i%2?1:-1,off=(i-2)*r*.27,L=length*(.55+i*.1),w=r*(.28+i*.015);shape([[-r*.7,off-w],[-L*.55,off-w*.6],[-L,off+side*w],[-L*.62,off+w*.35],[-r*.7,off+w]],i%2?light:color);}
 }else if(element==='lightning'){
 for(let j=-1;j<=1;j+=2){const pts=[];for(let i=0;i<8;i++)pts.push([-r-i*length/8,j*(r*.65+(i%2?8:-3))]);line(pts,2.4,color);line([pts[4],[pts[4][0]-12,pts[4][1]+j*14],[pts[4][0]-27,pts[4][1]+j*9]],1.4,light);}
 }else if(element==='ice'){
 for(let i=0;i<6;i++){const xx=-r-length*(i+1)/7,yy=(i%2?1:-1)*r*.7,sz=5+(i%3)*2;shape([[xx+sz,yy],[xx-sz,yy-sz*.65],[xx-sz*1.8,yy],[xx-sz,yy+sz*.65]],i%2?color:light);}
 }else if(element==='water'){
 for(let j=-1;j<=1;j+=2){c.beginPath();c.moveTo(-r*.6,j*r*.65);c.bezierCurveTo(-length*.4,j*r*1.5,-length*.6,-j*r*.7,-length,j*r*.25);c.bezierCurveTo(-length*.6,-j*r*.3,-length*.4,j*r,-r*.6,j*r*.45);c.closePath();c.fillStyle=color;c.fill();}
 }else if(element==='void'){
 for(let i=0;i<3;i++){const xx=-r-length*(i+.3)/3,rr=r*(.5+i*.12);c.strokeStyle=color;c.lineWidth=2.2;c.beginPath();c.ellipse(xx,0,rr*.36,rr,-.15,-1.5,1.5);c.stroke();shape([[xx+4,0],[xx-5,-3],[xx-5,3]],light);}
 }else if(element==='echo'){
 for(let i=1;i<=3;i++){const xx=-r-length*i/3,rr=r*(1-i*.14);line([[xx+rr*.6,-rr],[xx-rr,-rr],[xx-rr,rr],[xx+rr*.6,rr]],1.8,color);line([[xx+rr,rr*.5],[xx+rr,-rr*.5]],1,light);}
 }else{
 shape([[-r*.8,-r*.7],[-length,-r*.12],[-length*.7,r*.08],[-length*.9,r*.24],[-r*.8,r*.6]],'#181321');
 line([[-length*.9,0],[-r*.8,-r*.2]],2,color);for(let i=0;i<3;i++)line([[-length*(.3+i*.2),r*.6],[-length*(.45+i*.2),r*.7]],1.5,color);
 }
 // Two speed slits narrow with cubic decay; avoid persistent scene-wide lines.
 c.globalAlpha=.35*fade;for(const side of[-1,1])line([[-r*1.3,side*r*1.05],[-r*1.3-length*(1-t)**3,side*r*1.05]],1,color);
 // Position evidence is deliberately a separate, small trailing cue. It is
 // measured displacement, never a second direction estimate.
 if(trailEvidence>.05){
  c.globalAlpha=.22*fade*trailEvidence;
  line([[-r*1.05,-r*.82],[-r*(1.05+.8*trailEvidence),-r*.82]],1.2,light);
  line([[-r*1.05,r*.82],[-r*(1.05+.8*trailEvidence),r*.82]],1.2,light);
 }
 }finally{c.restore();}
}

/** A hand-drawn smear cel made from three offset slices of the cube itself.
 * Geometry is in hero radii, driven by the existing dash clock and velocity;
 * no physics writes, random numbers, rotation or second animation clock. */
export function resolveCubeDashSmear({vx=0,vy=0,angle=null,age=-1,radius=22,motion=true}={}){
 if(!motion||![vx,vy,age,radius].every(Number.isFinite)||radius<=0)return null;
 const speed=Math.hypot(vx,vy);
 if(!Number.isFinite(speed)||speed<6||age<=DASH.windup||age>=DASH.windup+DASH.active)return null;
 const u=(age-DASH.windup)/DASH.active;
 const envelope=Math.sin(Math.PI*u)**0.8, power=Math.min(1,speed/42);
 const r=Math.min(radius,80),ux=Number.isFinite(angle)?Math.cos(angle):vx/speed,uy=Number.isFinite(angle)?Math.sin(angle):vy/speed;
 // Three deliberately unequal slices stagger backward. Lag is bounded in world
 // units, direction-normalized and tapers smoothly to zero at both ends.
 const offsets=[.86,1.30,1.82].map(k=>r*k*power*envelope);
 return {ux,uy,r,envelope,power,offsets,vertical:Math.abs(uy)>Math.abs(ux)};
}
export function drawCubeDashSmear(c,{x=0,y=0,vx=0,vy=0,angle=null,age=-1,radius=22,equipment={},motion=true}={}){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 const smear=resolveCubeDashSmear({vx,vy,angle,age,radius,motion});if(!smear)return;
 const {ux,uy,r,envelope,power,offsets,vertical}=smear;
 equipment=equipment||{};
 const body=resolveBodyConstruction(equipment.body),palette=corePalette(equipment.core);
 const contour=SHAPE_MODIFIERS.find(item=>item.id===equipment.body)?.outline||HERO_SHELL;
 const bands=[[-1.04,-.4],[-.4,.3],[.3,1.04]];
 c.save();try{
  for(let i=0;i<bands.length;i++){
   const [lo,hi]=bands[i],back=offsets[i];c.save();
   try{
    c.translate(x-ux*back,y-uy*back);c.scale(r,r);
    c.beginPath();if(vertical)c.rect(lo,-1.06,hi-lo,2.12);else c.rect(-1.06,lo,2.12,hi-lo);c.clip();
    c.globalAlpha*=envelope*(.38+.16*power)*(1-i*.12);
    // Flat cel colors preserve the equipped shell and core identity while
    // avoiding the heavy detail and bloom of three fully opaque characters.
    path(c,contour);c.fillStyle=body.light;c.fill();
    c.strokeStyle=body.shadow;c.lineWidth=.065;c.stroke();
    panel(c,[[-.76,-.42],[.08,-.34],[.92,-.50],[.84,.12],[.15,.08],[-.72,.14]],'#151321',0);
    if(equipment.eyes==='visor'||equipment.eyes==='sniper'){
     panel(c,[[-.65,-.23],[.73,-.26],[.69,-.08],[-.65,-.06]],palette.primary,0);
    }else{
     panel(c,[[-.67,-.26],[-.18,-.18],[-.14,-.07],[-.58,-.09]],palette.light,0);
     panel(c,[[.15,-.08],[.22,-.20],[.70,-.28],[.61,-.08]],palette.light,0);
    }
    panel(c,[[-.26,.42],[0,.28],[.26,.42],[0,.64]],palette.primary,0);
    seam(c,[[-.72,.78],[.64,.78]],body.shadow,.05);
   }finally{c.restore();}
  }
 }finally{c.restore();}
}

function streak(c, trail, p, live) {
  if (trail.length < 3) return;
  const total = trail.length - 1;
  for (let i = 1; i < trail.length; i++) {
    const q = i === trail.length - 1 ? p : trail[i], prev = trail[i - 1], dx = q.x - prev.x, dy = q.y - prev.y, step = Math.hypot(dx, dy), n = step || 1, u = i / total, half = (live ? 13 : 5) * u ** 1.15, col = speedRgb(0.18 + 0.82 * u ** 1.6);
    if (half < 0.7 || step > 46) continue;
    c.save();
    c.globalAlpha = (live ? 0.62 : 0.2) * u ** 1.4;
    poly2(c, `rgb(${col.join(",")})`, [
      [prev.x - half * 0.45 * dy / n, prev.y + half * 0.45 * dx / n],
      [q.x - half * dy / n, q.y + half * dx / n],
      [q.x + half * dy / n, q.y - half * dx / n],
      [prev.x + half * 0.45 * dy / n, prev.y - half * 0.45 * dx / n]
    ]);
    c.restore();
  }
}
function panelRectFor(v) {
  const w = v.width, h = v.height;
  if (!(w > 0 && h > 0)) return null;
  const rect = radarRect(w, h);
  return { ...rect, size: rect.w };
}
function pointer(c, v, p, e) {
  if (!e) return;
  const panelRect = panelRectFor(v);
  const q = toScreen(v, e), o = toScreen(v, p), INSET = 24, l = INSET, r = v.width - INSET, t = 90, b = v.height - INSET;
  if (q.x > l && q.x < r && q.y > t && q.y < b) return;
  const x = clamp(o.x, l, r), y = clamp(o.y, t, b), dx = q.x - x, dy = q.y - y;
  if (!(dx || dy)) return;
  const f = Math.min(
    dx > 0 ? (r - x) / dx : dx < 0 ? (l - x) / dx : Infinity,
    dy > 0 ? (b - y) / dy : dy < 0 ? (t - y) / dy : Infinity
  );
  const ax = x + dx * f, ay = y + dy * f;
  if (panelRect && ax > panelRect.x - 10 && ax < panelRect.x + panelRect.size + 10 && ay > panelRect.y - 10 && ay < panelRect.y + panelRect.size + 10) return;
  const safe = overlayPoint(v.width, v.height, { x: ax, y: ay });
  c.save();
  c.translate(safe.x, safe.y);
  c.rotate(Math.atan2(q.y - safe.y, q.x - safe.x));
  poly2(c, TYPES[e.kind].color, [
    [8, 0],
    [-6, -5],
    [-3, 0],
    [-6, 5]
  ]);
  c.restore();
}
var drawTrace = null;
function traceDraws(to) {
  const sink = to ?? [];
  sink.length = 0;
  drawTrace = sink;
  return () => {
    drawTrace = null;
    return sink;
  };
}
var MERGE_R = 26;
var MERGE_AGE = 8;
function recordPopup(pops, d) {
  const ang = d.cut ?? d.angle ?? 0;
  let nx = -Math.sin(ang);
  let ny = Math.cos(ang);
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const r = d.r || 20;
  const push = r * 0.55 + 16;
  const x = d.x + nx * push;
  const y = d.y + ny * push - r * 0.25;
  const live = pops.find(
    (m) => m.life > 0 && Math.hypot(m.x - x, m.baseY - y) < MERGE_R
  );
  if (live && live.age < MERGE_AGE) {
    live.value += d.points;
    live.text = `+${live.value}`;
    live.big = live.big || d.points >= 400 || !!d.throughcut;
    live.life = 40;
    live.age = 0;
    live.beat = 1;
    return live;
  }
  let py = y;
  for (const m of pops) {
    if (m.life < 16) continue;
    if (Math.abs(m.x - x) > 46 || Math.abs(m.baseY - py) > 14) continue;
    py = m.baseY - 16;
  }
  const pop = {
    x,
    baseY: py,
    value: d.points,
    text: `+${d.points}`,
    // `points` decides the weight, so a 24-point chip and a 900-point
    // throughcut do not print at the same size.
    big: d.points >= 400 || !!d.throughcut,
    life: 40,
    age: 0,
    beat: 0
  };
  pops.push(pop);
  return pop;
}
function createRenderer(c, viewport) {
  const camera = createCamera(), back = createBackdrop(c);
  let scene = null, sceneTicks = 0, w, h, lastView, revision = 0, anim = "rest", shake = createShake(), shakeLevel = "full", mapOpacity = 0.92, frameDt = 1, ghosts = createSmear(10), lastSwing = -1, justLaunched = 0, ghostClock = 0, holdDir = 0, stain = 0, facing = 1, rand = randomSource(1);
  const trail = [], shards = [], pops = [], beams = [], imprints = [], sparks = [];
  const dashDust = [];
  const wardBreaks=[],contactBursts=[];let cutExitSource=null;
  let dashBurstAt = -1, dashBurstSwing = null;
  let dashTravel = { age: null, x: 0, y: 0, along: 0 };
  let viewListener = null;
  function onViewport(fn) {
    viewListener = fn;
    fn(w, h);
  }
  function resize(width, height, backingWidth = width, backingHeight = height, top = 32, gutter = 20) {
    w = Math.max(1, width);
    h = Math.max(1, height);
    viewport = { width: backingWidth, height: backingHeight, top, gutter };
    camera.resize(w, h);
    lastView = camera.view(1);
    revision++;
    viewListener?.(w, h);
  }
  resize(viewport.cssWidth || viewport.width, viewport.cssHeight || viewport.height, viewport.width, viewport.height, viewport.top, viewport.gutter);
  function transform() {
    c.setTransform(viewport.width / w, 0, 0, viewport.height / h, 0, 0);
    c.globalAlpha = 1;
    c.lineJoin = "miter";
  }
  function reset(seed, room = false) {
    scene = null;
    sceneTicks = 0;
    facing = openingFacing(seed);
    camera.reset(SPAWN, facing, room);
    lastView = camera.view(1);
    rand = randomSource(seed ^ 7737);
    shake.reset();
    stain = 0;
    trail.length = shards.length = imprints.length = sparks.length = pops.length = beams.length = 0;
    ghosts.clear();
    ghostClock = 0;
    dashDust.length = 0;wardBreaks.length=0;contactBursts.length=0;cutExitSource=null;
    dashBurstAt = -1; dashBurstSwing = null;
  }
  function event(type, d, motion) {
    if(['cut','armor'].includes(type)&&!d.secondary&&d.entityId!=null)cutExitSource={id:d.entityId,x:d.x,y:d.y};
    if(["cut","armor","hurt","break","waveBlock"].includes(type)){contactBursts.push({x:d.x,y:d.y,type,kind:d.kind,r:d.r,cut:d.cut,hpBefore:d.hpBefore,hp:d.hp,fromShear:d.fromShear,entityId:d.entityId,sword:d.sword,equipment:d.equipment,upgrade:d.upgrade,armorRemoved:d.armorRemoved,secondary:d.secondary,contact:d.contact||null,attack:d.attack||null,life:type==="break"?27:18});if(contactBursts.length>12)contactBursts.shift();}
    if(type==="waveBlock"){wardBreaks.push({x:d.x,y:d.y,life:24,contact:d.contact,equipment:d.equipment,sword:d.sword});if(wardBreaks.length>4)wardBreaks.shift();return;}
    if (type === "armor" && motion) shake.ask(2.1, d.cut, 0.8);
    if (type === "cut" && !d.small && (d.throughcut || d.strokeKills>=2)) {
      beams.push({
        x: d.x,
        y: d.y,
        angle: d.cut ?? d.angle ?? 0,
        reach: (d.r || 20) * 2.4 + 30,
        life: 12,
        through: !!d.throughcut || d.strokeKills >= 2 || ["bastion", "crown"].includes(d.kind)
      });
      if (beams.length > MOTION.maxImprints) beams.shift();
    }
    if (type === "cut" && !d.small && d.points > 0) recordPopup(pops, d);
    if (type === "shear" || type === "parry") {
      imprints.push({ ...d, type, life: type === "shear" ? 18 : 13 });
      if (imprints.length > MOTION.maxImprints) imprints.shift();
      return;
    }
    const recoil = (force, angle) => {
      if (motion) shake.ask(force, angle, 1);
    };
    if (type === "hurt" || type === "break") {
      stain = 1;
      recoil(4.5, -Math.PI * 0.42);
    }
    if (type !== "cut" && type !== "break") return;
    const kind = d.kind || "cube", r = d.r || R, a = d.cut ?? -0.62, mat = d.impact || impactFor(kind, d.small, d.release), local = a - d.angle, halves = bisect(kind === "cube" ? CUBE : TYPES[kind].outline, local), nx = -Math.sin(a), ny = Math.cos(a), plate = kind === "bastion" || kind === "crown";
    const force=d.contact?.strength??.4;
    recoil(mat.kick*(.6+force*.7), a);
    for (const [i, path2] of (type==="break"?[]:halves.entries())) {
      const side = i ? 1 : -1, gap = r * mat.gap * side, x = d.x + nx * gap, y = d.y + ny * gap, drift = plate ? 3.3 : (d.paper ? 6.8 : 4.6) + rand() * 1.8;
      shards.push({
        kind,
        path: path2,
        local,
        side,
        x,
        y,
        px: x,
        py: y,
        angle: d.angle,
        pa: d.angle,
        r,
        opts: {
          paper: d.paper,
          hp: d.hpBefore,
          fault: d.fault,
          torn: d.release || d.fromShear,
          face: facing,
          equipment:d.equipment
        },
        life: motion ? plate || d.paper ? 32 : d.small ? 14 : 24 : 14,
        vx: nx * side * drift*(.65+force) + (d.contact?.vx||Math.cos(a)*8)*.12,
        vy: ny * side * drift*(.65+force) + (d.contact?.vy||Math.sin(a)*8)*.12,
        spin: side * (plate ? 0.025 : 0.07)*(.6+force*.7)
      });
    }
    const col = kind === "cube" ? INK.acid : d.paper ? "#ffaf82" : TYPES[kind].color;
    if (motion)
      for (let i = 0; i < Math.min(force>.65?6:3,Math.ceil(mat.flecks*(.5+force*.65))); i++) {
        const theta = a + (rand() - 0.5) * 1.4, speed = (3 + rand() * 5)*(.6+force*.7), x = d.x + Math.cos(theta) * r * 0.65, y = d.y + Math.sin(theta) * r * 0.65;
        sparks.push({
          x,
          y,
          px: x,
          py: y,
          angle: theta,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          l: 3 + rand() * 7,
          life: 10 + rand() * 6,
          col: i % 2 ? col : INK.paper
        });
      }
    if (shards.length > MOTION.maxShards) shards.splice(0, shards.length - MOTION.maxShards);
    if (sparks.length > MOTION.maxSparks) sparks.splice(0, sparks.length - MOTION.maxSparks);
  }
  function syncScene(run, nearest) {
    const s = run.state, b = run.world.player, k = sceneFor(s, nearest, b.velocity.y > 0, s.line - b.position.y);
    if (k !== scene) {
      scene = k;
      sceneTicks = 0;
    }
  }
  const jelly2 = createJelly();
  let jellySeen = null;
  const hudTop = () => viewport.top ?? 32;
  const hudGutter = () => viewport.gutter ?? 20;
  function tick(run, motion) {
    const { state: s, world } = run;
    syncScene(run, s.story ? run.nearest() : null);
    if (scene) sceneTicks++;
    frameRun(camera, run, motion);
    anim = animationState(s);
    const dt = 1;
    for(let i=contactBursts.length-1;i>=0;i--)if(--contactBursts[i].life<=0)contactBursts.splice(i,1);
    for(let i=wardBreaks.length-1;i>=0;i--)if(--wardBreaks[i].life<=0)wardBreaks.splice(i,1);
    frameDt = dt;
    // Particle age belongs to simulation ticks, not the number of draws. A
    // 144 Hz display must not make the same burst expire 2.4 times faster.
    if (!motion) dashDust.length = 0;
    else {
      for (let i = dashDust.length - 1; i >= 0; i--) {
        const d = dashDust[i];d.age++;d.x += d.vx;d.y += d.vy;
        const drag = d.brake ? 0.84 : 0.92;d.vx *= drag;d.vy *= drag;
        if (d.age >= d.life) dashDust.splice(i, 1);
      }
      if (s.swingStart !== dashBurstSwing || s.slashAge < 0) { dashBurstSwing = s.swingStart; dashBurstAt = -1; }
      const launchAngle = Number.isFinite(s.launchAngle)
        ? s.launchAngle
        : Math.atan2(world.player.velocity.y, world.player.velocity.x);
      const dash = dashFor(s.slashAge, world.player.velocity.x, world.player.velocity.y, launchAngle);
      if (s.phase === "playing" && dash && s.slashAge !== dashBurstAt) {
        const launch = s.slashAge === DASH.windup, brake = s.slashAge === DASH.windup + DASH.active;
        if (launch || brake) {
          dashBurstAt = s.slashAge;
          const src = brake ? dash.lead : dash.trail, p = world.player.position;
          for (const b of dashBurst(dash, brake ? "brake" : "launch")) {
            const n = Math.hypot(b.dx, b.dy) || 1;
            dashDust.push({brake,x:p.x+src.x*R*.92,y:p.y+src.y*R*.92,vx:b.dx/n*b.speed,vy:b.dy/n*b.speed,
              life:brake?9+rand()*5:15+rand()*8,age:0,len:brake?.22+rand()*.3:.07+rand()*.1,hot:b.hot});
          }
          if (dashDust.length > 90) dashDust.splice(0, dashDust.length - 90);
        }
      }
    }
    ghosts.tick(1 / 60);
    const activeDash = s.phase === "playing" && s.slashAge >= DASH.windup && s.slashAge < DASH.windup + DASH.active;
    if (motion && activeDash && !world.grounded) {
      if (++ghostClock % 2 === 0) ghosts.push(world.player.position.x, world.player.position.y, 0, facing);
    } else if (!motion || s.phase !== "playing" || s.slashAge >= DASH.windup + DASH.active + 6) ghosts.clear();
    shake.tick(dt);
    const b = world.player, forward = b.velocity.x * Math.cos(b.angle) + b.velocity.y * Math.sin(b.angle);
    if (s.phase === "playing" && Math.abs(forward) > 3) facing = Math.sign(forward);
    stain = Math.max(0, stain - 0.045);
    if (motion && s.impact && s.impact !== jellySeen) {
      jellySeen = s.impact;
      const power = Math.min(1.6, (s.impact.speed ?? 0) / MAX_SPEED);
      jelly2.hit(power, -s.impact.nx, -s.impact.ny);
    }
    if (motion && s.landAge === 0) jelly2.hit(0.45, 0, 1);
    jelly2.step(dt);
    if (motion && s.phase === "playing" && s.slashAge >= 0 && s.slashAge < DASH.total && dt) {
      if (s.swingStart !== lastSwing) {
        trail.length = 0;
        lastSwing = s.swingStart;
        justLaunched = 2;
      }
      if (justLaunched > 0) justLaunched--;
      else trail.push({ ...world.player.position });
      if (trail.length > MOTION.ribbon) trail.shift();
    }
    if (!motion || s.slashAge < 0 || s.slashAge >= DASH.total || s.phase !== "playing") trail.length = 0;
    for (const list of [sparks, shards, imprints, pops, beams])
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        e.life -= dt;
        if (e.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        if (list === pops) {
          e.age += dt;
          if (e.beat) e.beat = Math.max(0, e.beat - dt * 0.5);
          continue;
        }
        if (list === imprints || list === beams) continue;
        e.px = e.x;
        e.py = e.y;
        e.pa = e.angle;
        if (!motion) continue;
        e.x += dt * e.vx;
        e.y += dt * e.vy;
        if (e.opts?.paper) {
          e.vx *= 0.97 ** dt;
          e.vy *= 0.97 ** dt;
        }
        e.vy += (e.opts?.paper ? 0.087 : 0.105) * dt;
        e.angle += (e.spin || 0) * dt;
      }
  }
  function speedField(c2, world, v, time, state, bearing = null) {
    const body = world.player, p = body.position, speed = Math.hypot(body.velocity.x, body.velocity.y), tier = tierOf(speed, MAX_SPEED);
    if (tier.index === 0) return;
    const sweep = tier.t;
    c2.save();
    c2.setTransform(viewport.width / w, 0, 0, viewport.height / h, 0, 0);
    const vig = c2.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.3,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.55, `rgba(0,0,0,${0.12 * sweep})`);
    vig.addColorStop(1, `rgba(0,0,0,${0.55 * sweep})`);
    c2.fillStyle = vig;
    c2.fillRect(0, 0, w, h);
    if (tier.index >= 2) {
      const glow = c2.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.22,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.62
      );
      glow.addColorStop(0, "rgba(0,0,0,0)");
      glow.addColorStop(0.7, "rgba(0,0,0,0)");
      glow.addColorStop(1, tier.tint);
      c2.globalCompositeOperation = "lighter";
      c2.globalAlpha = 0.12 + 0.2 * sweep;
      c2.fillStyle = glow;
      c2.fillRect(0, 0, w, h);
      c2.globalAlpha = 1;
      c2.globalCompositeOperation = "source-over";
    }
    const moved = state?.moved ?? world.realMoved ?? speed;
    const gate = MAX_SPEED * 0.65;
    if (moved > gate) {
      const cx = w / 2, cy = h / 2, travel = Number.isFinite(bearing)
        ? bearing
        : Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 0.01
          ? Math.atan2(body.velocity.y, body.velocity.x)
          : 0, behind = travel + Math.PI, reach = Math.hypot(w, h), calm = Math.min(1, (moved - gate) / (MAX_SPEED - gate)), lines = Math.min(8, 3 + Math.round(5 * calm));
      c2.globalCompositeOperation = "lighter";
      c2.lineCap = "round";
      for (let i = 0; i < lines; i++) {
        const spread = (i / Math.max(1, lines - 1) - 0.5) * 1.4, a = behind + spread + Math.sin(time * 0.023 + i * 1.9) * 0.04, r0 = 120 + 26 * Math.sin(i * 2.1), r1 = r0 + reach * (0.26 + 0.22 * calm) * (0.78 + 0.22 * Math.sin(i * 1.7));
        c2.strokeStyle = tier.tint;
        c2.globalAlpha = Math.min(0.12, 0.1 * calm * (1 - Math.abs(spread)));
        c2.lineWidth = 1 + calm * 1.2;
        c2.beginPath();
        c2.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        c2.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        c2.stroke();
      }
      c2.globalAlpha = 1;
      c2.globalCompositeOperation = "source-over";
    }
    c2.restore();
  }
  function minimap(c2, world, combat, v, state, motion = true) {
    c2.setTransform(viewport.width / w, 0, 0, viewport.height / h, 0, 0);
    const rect = radarRect(w, h), box = rect.w, p = world.player.position;
    const pc = toScreen(v, p), near = pc.x + 24 * v.scale > rect.x && pc.x - 24 * v.scale < rect.x + box && pc.y + 24 * v.scale > rect.y && pc.y - 24 * v.scale < rect.y + box;
    const target = near ? 0.3 : 0.78, step = 0.84 / 6.2 * Math.max(frameDt, 1e-4);
    mapOpacity += Math.sign(target - mapOpacity) * Math.min(Math.abs(target - mapOpacity), step);
    const landing=state.wave?.phase==='return'&&state.wave.platform?{x:state.wave.platform.x+state.wave.platform.w/2,y:state.wave.platform.y}:null;
    const level=sensorTier(state.equipment?.radar,"radar"),range=[1,1.35,1.7,2.2][level];
    const radar = localRadar(v, p, rect, combat.enemies.values(), state.questPortal||state.wave?.breach||landing,{range});
    c2.save();
    c2.globalAlpha = mapOpacity;
    c2.fillStyle = "#07050d";
    c2.fillRect(rect.x, rect.y, box, box);
    c2.strokeStyle = "#917ba9";
    c2.lineWidth = 1;
    c2.strokeRect(rect.x + 0.5, rect.y + 0.5, box - 1, box - 1);
    c2.globalAlpha = mapOpacity * 0.92;
    c2.beginPath();
    c2.rect(rect.x + 2, rect.y + 2, box - 4, box - 4);
    c2.clip();
    if(level){
      c2.save();c2.strokeStyle='#72c9bc';c2.lineWidth=1;c2.globalAlpha=mapOpacity*.48;
      for(let i=1;i<=level;i++){const rr=box*(.12+i*.105);c2.beginPath();c2.arc(radar.player.x,radar.player.y,rr,Math.PI,TAU);c2.stroke();}
      // A small instrument bezel, entirely within the existing radar bounds.
      c2.strokeStyle='#a2e7d2';c2.globalAlpha=mapOpacity*.7;c2.beginPath();c2.moveTo(rect.x+7,rect.y+20);c2.lineTo(rect.x+box-7,rect.y+20);c2.moveTo(rect.x+7,rect.y+box-7);c2.lineTo(rect.x+18,rect.y+box-7);c2.moveTo(rect.x+box-18,rect.y+box-7);c2.lineTo(rect.x+box-7,rect.y+box-7);c2.stroke();
      c2.fillStyle='#c3f4da';c2.font='bold 7px monospace';c2.textAlign='left';c2.textBaseline='top';c2.fillText(`SCAN / 0${level}`,rect.x+8,rect.y+7);
      for(let i=0;i<3;i++){c2.fillStyle=i<level?'#d5fba6':'#4b6260';c2.fillRect(rect.x+box-27+i*6,rect.y+9,4,3);}
      c2.restore();
    }
    const footprint = radar.viewport;
    c2.fillStyle = "#b6a2db18";
    c2.fillRect(footprint.x, footprint.y, footprint.w, footprint.h);
    c2.strokeStyle = "#b6a2db66";
    c2.lineWidth = 1;
    c2.setLineDash([3, 3]);
    c2.strokeRect(footprint.x, footprint.y, footprint.w, footprint.h);
    c2.setLineDash([]);
    for (const blip of radar.blips) {
      c2.fillStyle = c2.strokeStyle = blip.color;
      c2.lineWidth = 1.4;
      c2.beginPath();
      if (blip.kind === "bastion") c2.rect(blip.x - blip.r, blip.y - blip.r, blip.r * 2, blip.r * 2);
      else if (blip.kind === "crown") {
        c2.moveTo(blip.x, blip.y - blip.r);
        c2.lineTo(blip.x + blip.r, blip.y);
        c2.lineTo(blip.x, blip.y + blip.r);
        c2.lineTo(blip.x - blip.r, blip.y);
        c2.closePath();
      } else c2.arc(blip.x, blip.y, blip.r, 0, TAU);
      if (blip.onScreen) c2.fill();
      else c2.stroke();
      if(level>=3&&blip.mode==='tell'){c2.strokeStyle='#ffb491';c2.setLineDash([2,2]);c2.beginPath();c2.arc(blip.x,blip.y,blip.r+4,0,TAU);c2.stroke();c2.setLineDash([]);}
    }
    if(level>=2){for(const h of (combat.hazards||[]).slice(0,24)){if(h.spent||!Number.isFinite(h.x)||!Number.isFinite(h.y))continue;const q=radar.project(h,3);if(q.outside)continue;c2.strokeStyle='#ffb080';c2.lineWidth=1.3;c2.beginPath();if(h.kind==='ring'||h.kind==='zone'||h.kind==='shock')c2.arc(q.x,q.y,4,0,TAU);else{c2.moveTo(q.x,q.y-4);c2.lineTo(q.x+4,q.y+3);c2.lineTo(q.x-4,q.y+3);c2.closePath();}c2.stroke();}}
    if (radar.portal) {
      const q2 = radar.portal;
      c2.save();
      c2.translate(q2.x, q2.y);
      if(landing){c2.strokeStyle='#d9edac';c2.lineWidth=2;c2.beginPath();c2.moveTo(-7,-3);c2.lineTo(-7,2);c2.lineTo(7,2);c2.lineTo(7,-3);c2.stroke();c2.restore();}else{
      c2.rotate(motion ? (state.questPortal?.age || state.wave?.breach?.age || 0) * 0.04 : 0);
      c2.strokeStyle = "#ffd773";
      c2.lineWidth = 2;
      c2.beginPath();
      c2.arc(0, 0, 6, 0, TAU * 0.8);
      c2.stroke();
      c2.strokeStyle = "#b98aff";
      c2.beginPath();
      c2.arc(0, 0, 4, Math.PI, Math.PI * 2.6);
      c2.stroke();
      c2.restore();
      }
    }
    const q = radar.player, speed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
    if(level>=3&&speed>.5){c2.strokeStyle='#c9ffb9';c2.globalAlpha=mapOpacity*.8;c2.beginPath();c2.moveTo(q.x,q.y);c2.lineTo(q.x+world.player.velocity.x/speed*18,q.y+world.player.velocity.y/speed*18);c2.stroke();}
    c2.fillStyle = "#deff52";
    c2.strokeStyle = "#07050d";
    c2.lineWidth = 2;
    if (speed < 0.5) {
      c2.beginPath();
      c2.arc(q.x, q.y, 4, 0, TAU);
      c2.fill();
    } else {
      const a = Math.atan2(world.player.velocity.y, world.player.velocity.x);
      c2.beginPath();
      c2.moveTo(q.x + Math.cos(a) * 7, q.y + Math.sin(a) * 7);
      c2.lineTo(q.x + Math.cos(a + 2.5) * 5, q.y + Math.sin(a + 2.5) * 5);
      c2.lineTo(q.x + Math.cos(a - 2.5) * 5, q.y + Math.sin(a - 2.5) * 5);
      c2.closePath();
      c2.stroke();
      c2.fill();
    }
    c2.restore();
  }
  function narrativeBackdrop(n, width, height, time, motion) {
    if (!n) return;
    const clock=motion?time:0, sector=n.sector;
    c.save();
    if(n.intro){
      const q=Math.min(1,n.introAge/55);c.fillStyle=`rgba(8,7,20,${.12+q*.34})`;c.fillRect(0,0,width,height);
    } else {
      c.fillStyle=sector>=4?'rgba(221,137,83,.16)':sector===3?'rgba(34,99,102,.14)':sector===2?'rgba(123,48,38,.13)':'rgba(16,13,28,.20)';c.fillRect(0,0,width,height);
      if(sector===1){
        c.strokeStyle='#a89b9a44';c.lineWidth=2;for(const x of [width*.09,width*.89])for(let y=0;y<height*.48;y+=14){c.beginPath();c.ellipse(x,y,4,7,0,0,Math.PI*2);c.stroke();}
      } else if(sector===2){
        for(const [x,y,r] of [[width*.14,height*.27,54],[width*.82,height*.39,36]]){
          c.save();c.translate(x,y);c.rotate(clock*.008);c.strokeStyle='#ba8b7955';c.lineWidth=7;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();for(let j=0;j<8;j++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(r-5,0);c.lineTo(r+13,0);c.stroke();}c.restore();
        }
        c.strokeStyle='#ac8b7866';c.lineWidth=4;c.beginPath();c.moveTo(width*.6,0);c.lineTo(width*.6,height*.2);c.lineTo(width*.77,height*.2);c.lineTo(width*.77,height*.31);c.stroke();
        // Silhouettes in the distant machine are forge markings, not live targets.
        c.save();c.translate(width*.45,height*.25);c.globalAlpha=.3;c.strokeStyle='#f0a37d';c.fillStyle='#6f3a39';c.lineWidth=3;c.strokeRect(-52,-35,104,70);c.beginPath();c.moveTo(-36,-12);c.lineTo(-16,-12);c.lineTo(-26,10);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(24,-16);c.lineTo(39,0);c.lineTo(24,16);c.lineTo(9,0);c.closePath();c.stroke();c.restore();
      } else if(sector===3){
        for(let i=0;i<3;i++){const on=i<n.conduits;c.strokeStyle=on?'#a4f6c770':'#64615f55';c.lineWidth=3;c.beginPath();c.moveTo(i*width*.3,0);c.lineTo(i*width*.3,height*.34);c.lineTo(i*width*.3+width*.12,height*.46);c.stroke();if(!on&&motion&&n.sparkAge>0){c.fillStyle='#ffe79a';c.globalAlpha=.3+.4*Math.abs(Math.sin(clock*.14+i));c.fillRect(i*width*.3+width*.12,height*.46,4,4);c.globalAlpha=1;}}
      } else if(sector>=4){for(let i=0;i<22;i++){c.fillStyle=i%4?'#ffe8b466':'#fff6d3aa';c.fillRect((i*179+23)%width,(i*79+31)%(height*.55),i%4?2:3,i%4?2:3);}}
    }
    // A small independent story silhouette never intercepts input or pauses play.
    if(n.intro||n.reaction){
      const reaction=n.reaction,age=reaction?.age||0,split=reaction?.kind==='split',alarm=reaction?.kind==='alarm';
      const scale=Math.min(width,height)*.00075, x=width*.78,y=height*.15+(n.intro?(motion?Math.min(1,n.introAge/40):1)*height*.07:0);
      c.translate(x,y);c.scale(scale,scale);if(alarm){c.globalAlpha=.25;c.fillStyle='#fb3650';c.beginPath();c.arc(0,0,105,0,Math.PI*2);c.fill();c.globalAlpha=1;}
      for(const side of [-1,1]){c.save();if(split)c.translate(side<0?0:(motion?age*2:40),side<0?(motion?age*1.2:24):(motion?-age:0));c.fillStyle='#171323';c.strokeStyle=alarm?'#ff5368':'#e1b85e';c.lineWidth=7;c.beginPath();c.moveTo(side*4,54);c.lineTo(side*90,54);c.lineTo(side*92,-55);c.lineTo(side*62,-30);c.lineTo(side*35,-91);c.lineTo(side*4,-46);c.closePath();c.fill();c.stroke();c.fillStyle=alarm?'#ffdbcb':'#dff58c';c.fillRect(side<0?-69:24,-7,45,9);c.restore();}
    }
    c.restore();
  }
  function narrativeWorld(n, scale, time, motion){
    if(!n)return;c.save();c.lineWidth=3/scale;
    if(n.intro&&n.fracture){const q=n.fracture;c.translate(q.x,q.y);c.strokeStyle='#332c3b';c.lineWidth=13;c.beginPath();c.moveTo(-760,0);c.lineTo(760,0);c.stroke();c.strokeStyle='#ddff89';c.lineWidth=3;c.beginPath();c.moveTo(-65,-20);c.lineTo(-23,-9);c.lineTo(-8,-22);c.lineTo(7,12);c.lineTo(24,1);c.lineTo(65,18);c.stroke();c.restore();return;}
    const seal=n.seal;if(!seal){c.restore();return;}
    c.strokeStyle=seal.ready?'#e6ff70':'#8b617b';c.lineWidth=seal.ready?9:6;c.beginPath();c.moveTo(seal.x-seal.w/2,seal.y);c.lineTo(seal.x+seal.w/2,seal.y);c.stroke();
    c.strokeStyle=seal.ready?'#fff7b0':'#403245';c.lineWidth=2;c.beginPath();c.moveTo(seal.x-seal.w/2,seal.y-6);c.lineTo(seal.x+seal.w/2,seal.y-6);c.stroke();
    for(const lock of n.locks){
      c.save();c.translate(lock.x,lock.y);c.strokeStyle=lock.broken?'#544751':'#c0a6a8';c.lineWidth=3;c.beginPath();c.moveTo(0,-34);c.lineTo(0,seal.y-lock.y);c.stroke();
      if(lock.broken){c.strokeStyle='#e7e7a0';c.beginPath();c.moveTo(-24,-8);c.lineTo(-8,4);c.moveTo(8,-4);c.lineTo(25,8);c.stroke();}
      else{c.rotate(Math.PI/4);c.fillStyle='#352634';c.strokeStyle='#e1b878';c.lineWidth=4;c.fillRect(-25,-25,50,50);c.strokeRect(-25,-25,50,50);c.fillStyle='#f7df94';c.fillRect(-5,-5,10,10);}
      c.restore();
    }
    c.restore();
  }
  function narrativeTrack(n,width,height){
    if(!n||n.intro)return;const x=width-18,y=Math.max(95,height*.26),h=Math.min(180,height*.34);
    c.save();c.strokeStyle='#80786f';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h);c.stroke();
    for(let i=0;i<3;i++){c.fillStyle=n.locks[i]?.broken?'#e6ff78':'#64515d';c.beginPath();c.arc(x,y+h-(i+1)*h/4,4,0,Math.PI*2);c.fill();}
    c.fillStyle=n.seal?.ready?'#efff8f':'#9b7a81';c.beginPath();c.moveTo(x,y-7);c.lineTo(x+5,y);c.lineTo(x,y+7);c.lineTo(x-5,y);c.closePath();c.fill();c.restore();
  }
  // ── CHUNK 6A: THE SPINE ────────────────────────────────────────────────
  // The FRACTURE meter, diegetic: a stress crack down the lower third of the
  // playfield. Ember light seeps through, brighter as the meter fills; every
  // kill sends a pulse travelling up the fault and a '+0.4' ember glyph
  // drifts off the point of the cut. Reads progress without a word.
  var spineLastKills = 0, spinePulses = [], spineFloaters = [];
  function spinePathX(w, frac) {
    const segs = 13, bot = 0.97, top = 0.56, q = 0; // frac 0 (bottom) → 1 (top)
    const f = Math.max(0, Math.min(1, frac)) * segs;
    const i0 = Math.min(segs - 1, Math.floor(f)), u = f - i0;
    const off = (i) => i === 0 || i >= segs ? 0 : (((hash(1379, i, 7) % 1000) / 1000) - 0.5) * 76;
    return w * 0.5 + (off(i0) * (1 - u) + off(i0 + 1) * u);
  }
  function drawSpine(c, w, h, s, motion, time) {
    const pct = s.fracture?.pct ?? 0;
    if (pct <= 0) { spineLastKills = s.kills | 0; spinePulses.length = spineFloaters.length = 0; return; }
    const q = pct / 100, cx = w * 0.5, top = h * 0.56, bot = h * 0.97, segs = 13;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const y = bot - (bot - top) * (i / segs);
      const off = i === 0 || i === segs ? 0 : (((hash(1379, i, 7) % 1000) / 1000) - 0.5) * (30 + 46 * q);
      pts.push([cx + off, y]);
    }
    // Pulses and floaters spawn on kills.
    const kills = s.kills | 0;
    if (kills > spineLastKills) {
      for (let k = 0; k < Math.min(3, kills - spineLastKills); k++) {
        spinePulses.push({ frac: 0, age: 0 });
        spineFloaters.push({ x: cx + ((hash(991, kills, k) % 100) - 50) * 0.8, y: bot - 26, age: 0 });
      }
      spineLastKills = kills;
    } else if (kills < spineLastKills) spineLastKills = kills;
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    // The fault itself.
    c.strokeStyle = '#0a0812';
    c.lineWidth = 3.2 + 3.6 * q;
    c.globalAlpha = Math.min(1, 0.35 + 0.6 * q);
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    // Ember light seeping through.
    const grad = c.createLinearGradient(0, top, 0, bot);
    grad.addColorStop(0, 'rgba(255,196,110,0)');
    grad.addColorStop(0.35, `rgba(255,170,80,${0.18 + 0.4 * q})`);
    grad.addColorStop(1, `rgba(255,120,60,${0.3 + 0.5 * q})`);
    c.strokeStyle = grad; c.lineWidth = 1.3 + 1.7 * q; c.globalAlpha = 1;
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    // Fault glints when the meter runs hot.
    if (pct >= 60) for (let i = 1; i < segs; i++) {
      const flicker = motion ? 0.5 + 0.5 * Math.sin(time * 0.055 + i * 1.7) : 0.85;
      c.globalAlpha = (pct >= 75 ? 0.55 : 0.3) * flicker;
      c.fillStyle = '#ffd88a';
      c.beginPath(); c.arc(pts[i][0], pts[i][1], 1.6 + q, 0, Math.PI * 2); c.fill();
    }
    // Kill pulses travelling toward the top.
    for (let i = spinePulses.length - 1; i >= 0; i--) {
      const pulse = spinePulses[i];
      pulse.age++; pulse.frac = Math.min(1, pulse.age / 42);
      if (pulse.frac >= 1) { spinePulses.splice(i, 1); continue; }
      const y = bot - (bot - top) * pulse.frac, x = spinePathX(w, pulse.frac), flare = 1 - pulse.frac;
      c.globalAlpha = 0.35 + 0.55 * flare;
      c.fillStyle = '#ffe9b0';
      c.beginPath(); c.arc(x, y, 2.4 + 3.2 * flare, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.18 * flare;
      c.beginPath(); c.arc(x, y, 7 + 8 * flare, 0, Math.PI * 2); c.fill();
    }
    // '+0.4' glyphs drifting up off the cut.
    if (spineFloaters.length > 12) spineFloaters.splice(0, spineFloaters.length - 12);
    c.font = "700 11px 'Space Mono',monospace"; c.textAlign = 'center';
    for (let i = spineFloaters.length - 1; i >= 0; i--) {
      const f = spineFloaters[i];
      f.age++; f.y -= 0.85;
      if (f.age > 56) { spineFloaters.splice(i, 1); continue; }
      c.globalAlpha = Math.max(0, 0.9 - f.age / 56);
      c.fillStyle = '#e6ff9e';
      c.fillText('+0.4', f.x, f.y);
    }
    c.restore();
  }

  // ── CHUNK 6A: THE CUTSCENE OVERLAY ─────────────────────────────────────
  // Screen-space painters for the two cutscenes, keyed off `s.cutscene`
  // (mirrored by the shell every tick). Draws after everything, before the
  // DOM HUD — the chips live in the DOM, not here.
  function watcherMask(c, x, y, scale, { glow = 0, split = 0, eye = 1 } = {}) {
    c.save();
    c.translate(x, y); c.scale(scale, scale);
    if (glow > 0) { c.shadowColor = '#ffd98c'; c.shadowBlur = 26 * glow; }
    for (const side of [-1, 1]) {
      c.save();
      if (split > 0) c.translate(side * split * 46, -split * 10);
      c.fillStyle = '#141020'; c.strokeStyle = '#e8b45e'; c.lineWidth = 7;
      c.beginPath();
      c.moveTo(side * 4, 54); c.lineTo(side * 90, 54); c.lineTo(side * 92, -55);
      c.lineTo(side * 62, -30); c.lineTo(side * 35, -91); c.lineTo(side * 4, -46);
      c.closePath(); c.fill(); c.stroke();
      // Eye slit, ignited to ember.
      c.shadowBlur = 0;
      c.globalAlpha = 0.3 + 0.7 * eye;
      c.fillStyle = '#dff58c';
      c.fillRect(side < 0 ? -69 : 24, -7, 45, 9);
      c.restore();
    }
    c.restore();
  }
  function jaggedLine(c, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  }
  function fracturePath(seed, x0, y0, x1, y1, segs = 9) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, bow = Math.sin(u * Math.PI) * (hash(seed, 3, 9) % 120 - 60);
      const nx = x0 + (x1 - x0) * u, ny = y0 + (y1 - y0) * u;
      const off = (i === 0 || i === segs) ? 0 : (hash(seed, i, 21) % 1000 / 1000 - 0.5) * 120 + bow;
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      pts.push([nx - dy / len * off, ny + dx / len * off]);
    }
    return pts;
  }
  function drawCutsceneOverlay(c, w, h, s, v, p, time, motion) {
    const cs = s.cutscene;
    if (!cs) return;
    const flash = motion ? 1 : 0.35;
    const sx = (p.x - v.x) * v.scale, sy = (p.y - v.y) * v.scale;
    const t = cs.t, easeOut = (u) => 1 - Math.pow(1 - u, 3), easeIn = (u) => u * u * u;
    const wash = (a) => { c.fillStyle = `rgba(4,4,10,${a})`; c.fillRect(0, 0, w, h); };
    c.save();
    // Letterbox bars for the locked beats.
    if (cs.lockInput) {
      const barT = Math.min(1, Math.min(t, 1 - t) / 0.16);
      const barH = 30 * easeOut(barT);
      c.fillStyle = '#050510';
      c.fillRect(0, 0, w, barH); c.fillRect(0, h - barH, w, barH);
    }
    switch (cs.beatId) {
      case 'cold-dark': {
        wash(0.96 - 0.06 * t);
        // Sparks falling from the dark.
        for (let i = 0; i < 26; i++) {
          const x = hash(11, i, 3) % 1000 / 1000 * w;
          const y = ((hash(11, i, 5) % 1000) / 1000 * h * 0.35 + t * h * 0.42);
          const size = 1 + (hash(11, i, 7) % 1000) / 1000 * 2.2;
          c.globalAlpha = (0.35 + 0.65 * ((hash(11, i, 9) % 1000) / 1000)) * (1 - t * 0.4);
          c.fillStyle = hash(11, i, 13) % 3 ? '#ffb066' : '#ffe9b0';
          c.fillRect(x, y, size, size * 1.8);
        }
        // Two eyes open, very slowly.
        const eye = Math.max(0, Math.min(1, (t - 0.22) / 0.55));
        if (eye > 0) for (const side of [-1, 1]) {
          c.save();
          c.translate(w / 2 + side * 52, h * 0.4); c.rotate(side * 0.16); c.scale(1, Math.max(0.06, eye));
          const g = c.createRadialGradient(0, 0, 0, 0, 0, 40);
          g.addColorStop(0, `rgba(255,233,176,${0.9 * eye})`);
          g.addColorStop(0.45, `rgba(255,176,102,${0.55 * eye})`);
          g.addColorStop(1, 'rgba(255,176,102,0)');
          c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 40, 13, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = `rgba(20,16,8,${0.9 * eye})`; c.beginPath(); c.ellipse(0, 0, 3.2, 10.5, 0, 0, Math.PI * 2); c.fill();
          c.restore();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'cold-watcher': {
        wash(0.88);
        // The seam breathes below it.
        const breathe = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
        const sy = h * 0.66, pts = fracturePath(335, w * 0.08, sy, w * 0.92, sy, 13);
        const glow = c.createRadialGradient(w / 2, sy, 0, w / 2, sy, h * 0.34);
        glow.addColorStop(0, `rgba(221,255,137,${0.16 + 0.3 * breathe})`); glow.addColorStop(1, 'rgba(221,255,137,0)');
        c.fillStyle = glow; c.fillRect(0, sy - h * 0.34, w, h * 0.68);
        c.globalAlpha = 0.85; c.strokeStyle = '#0a0812'; c.lineWidth = 13; c.lineJoin = 'miter'; jaggedLine(c, pts); c.stroke();
        c.globalAlpha = 0.45 + 0.5 * breathe; c.strokeStyle = '#ddff89'; c.lineWidth = 3; jaggedLine(c, pts); c.stroke();
        c.globalAlpha = 1;
        watcherMask(c, w / 2, h * 0.3, Math.min(w, h) * 0.0016 + 0.55, { glow: easeIn(t), eye: 0.2 + 0.8 * t });
        break;
      }
      case 'cold-tear': {
        const f = t < 0.18 ? t / 0.18 : t > 0.62 ? Math.max(0, 1 - (t - 0.62) / 0.38) : 1;
        wash(0.5);
        c.fillStyle = `rgba(255,244,214,${f * flash})`; c.fillRect(0, 0, w, h);
        // The crack races the seam line.
        const origin = [w / 2, h * 0.66], cornerTargets = [[0, 0], [w, 0], [0, h], [w, h], [w / 2, 0]];
        const reach = easeOut(Math.min(1, t / 0.55));
        cornerTargets.forEach(([tx, ty], i) => {
          const pts = fracturePath(411 + i, origin[0], origin[1], origin[0] + (tx - origin[0]) * reach, origin[1] + (ty - origin[1]) * reach, 8);
          c.globalAlpha = f; c.strokeStyle = '#ffb256'; c.lineWidth = 9; jaggedLine(c, pts); c.stroke();
          c.globalAlpha = f; c.strokeStyle = '#fffdf2'; c.lineWidth = 2.5; jaggedLine(c, pts); c.stroke();
        });
        // Shards drift down like snow.
        for (let i = 0; i < 22; i++) {
          const x = hash(517, i, 3) % 1000 / 1000 * w;
          const y = h * 0.66 + t * (h * 0.3 + (hash(517, i, 5) % 200));
          const rot = (hash(517, i, 7) % 628) / 100;
          c.save(); c.globalAlpha = Math.max(0, 1 - t * 0.85); c.translate(x, y); c.rotate(rot);
          c.fillStyle = hash(517, i, 11) % 4 ? '#2a2136' : '#ddff89';
          c.fillRect(-3, -5, 6, 10); c.restore();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'cold-fangs': {
        wash(0.62 - 0.3 * t);
        const e = easeOut(t);
        const fang = (x, size, lean) => {
          c.save(); c.translate(x, -90 + (h * 0.58 + 90) * e); c.rotate(lean);
          c.fillStyle = '#e8e4d8'; c.strokeStyle = '#0b0a10'; c.lineWidth = 3.4;
          c.beginPath(); c.moveTo(0, size * 0.62); c.lineTo(-size * 0.34, -size * 0.5); c.lineTo(-size * 0.1, -size * 0.18); c.lineTo(size * 0.34, -size * 0.5); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#0b0a10'; c.beginPath(); c.arc(-size * 0.11, 0, size * 0.055, 0, Math.PI * 2); c.arc(size * 0.11, 0, size * 0.055, 0, Math.PI * 2); c.fill();
          c.restore();
        };
        fang(w / 2 - 160, 56, -0.12); fang(w / 2, 70, 0); fang(w / 2 + 160, 56, 0.12);
        // The pad slams forward.
        if (t > 0.55) {
          const k = (t - 0.55) / 0.45;
          c.globalAlpha = Math.min(0.85, k * 0.85 * flash); c.fillStyle = '#fff8ea';
          c.fillRect(0, h * 0.86, w, h * 0.14);
          c.globalAlpha = Math.max(0, 0.8 * (1 - k));
          c.strokeStyle = '#ffe9b0'; c.lineWidth = 3;
          for (let i = 0; i < 10; i++) {
            const x = (hash(631, i, 3) % 1000) / 1000 * w, r = 6 + k * 46;
            c.beginPath(); c.arc(x, h * 0.88, r, Math.PI, 0); c.stroke();
          }
        }
        c.globalAlpha = 1;
        break;
      }
      case 'cold-settle': {
        wash(0.55 * (1 - t));
        watcherMask(c, w / 2, h * 0.3, Math.min(w, h) * 0.0016 + 0.55, { glow: Math.max(0, 1 - t * 1.6), eye: Math.max(0, 1 - t) });
        break;
      }
      case 'sector-locks': {
        // The old room is visibly letting go: three anchor locks drop and
        // flare instead of silently teleporting the player to a new counter.
        wash(0.24 + 0.18 * (1 - t));
        const fall = easeIn(t), glow = 0.35 + 0.65 * (1 - t);
        for (let i = 0; i < 3; i++) {
          const x = w * (0.28 + i * 0.22), y = h * 0.56 + fall * (h * 0.22 + i * 8);
          c.save();
          c.translate(x, y);
          c.rotate((i - 1) * 0.42 + t * (i % 2 ? 1 : -1));
          c.globalAlpha = glow;
          c.fillStyle = '#171323'; c.strokeStyle = '#e1b878'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(0, -24); c.lineTo(24, 0); c.lineTo(0, 24); c.lineTo(-24, 0); c.closePath(); c.fill(); c.stroke();
          c.globalAlpha = 0.8 * glow; c.strokeStyle = '#ddff89'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-12, -2); c.lineTo(-3, 7); c.lineTo(14, -10); c.stroke();
          c.restore();
        }
        break;
      }
      case 'sector-seam': {
        // The Watcher is not a menu narrator. It is the thing opening the next
        // room: its eyes wake, then the seam tears behind the player.
        wash(0.18);
        const breathe = 0.45 + 0.55 * Math.sin(t * Math.PI);
        watcherMask(c, w / 2, h * 0.27, Math.min(w, h) * 0.00155 + 0.5, { glow: breathe * flash, eye: 0.25 + 0.75 * t });
        const seamY = h * 0.66, reach = easeOut(Math.min(1, t * 1.2));
        const pts = fracturePath(1200 + (s.narrative?.sector || 1), w / 2, seamY, w / 2 + (w * 0.46) * reach, seamY + Math.sin(t * Math.PI) * 18, 11);
        c.globalAlpha = 0.55 + 0.45 * breathe; c.strokeStyle = '#ddff89'; c.lineWidth = 3; jaggedLine(c, pts); c.stroke();
        c.globalAlpha = 0.28 * breathe; c.strokeStyle = '#ffb256'; c.lineWidth = 12; jaggedLine(c, pts); c.stroke();
        c.globalAlpha = 1;
        break;
      }
      case 'sector-rise': {
        // A vertical lift gives the crossing a destination: the next arena is
        // being pulled up through the wound, with real fragments moving toward
        // the new horizon rather than an unexplained screen flash.
        wash(0.12 * (1 - t));
        const lift = easeOut(t), horizon = h * (0.78 - 0.42 * lift);
        c.globalAlpha = 0.55 + 0.45 * lift;
        c.strokeStyle = '#ddff89'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, horizon); c.lineTo(w, horizon); c.stroke();
        for (let i = 0; i < 9; i++) {
          const x = (i + 0.5) * w / 9, y0 = h + (i % 3) * 30, y1 = horizon + (i % 4) * 16;
          c.globalAlpha = (0.14 + 0.08 * (i % 3)) * (0.35 + 0.65 * lift);
          c.strokeStyle = i % 2 ? '#ffb066' : '#ddff89'; c.lineWidth = 2 + (i % 2);
          c.beginPath(); c.moveTo(x, y0); c.lineTo(x + (i - 4) * 12 * lift, y1); c.stroke();
        }
        watcherMask(c, w / 2, horizon - h * 0.18, Math.min(w, h) * 0.0012 + 0.38, { glow: 0.55 * flash, eye: 0.9, split: 0.22 * lift });
        c.globalAlpha = 1;
        break;
      }
      case 'sector-release': {
        // The new room is already underneath the live run. This is only the
        // last breath of the crossing; control returns without a title card.
        const fade = Math.max(0, 0.16 * (1 - t));
        if (fade) { c.fillStyle = `rgba(8,7,20,${fade})`; c.fillRect(0, 0, w, h); }
        for (let i = 0; i < 12; i++) {
          const x = (hash(1411 + (s.narrative?.sector || 1), i, 3) % 1000) / 1000 * w;
          const y = h * 0.32 + ((hash(1411, i, 5) % 1000) / 1000) * h * 0.42 - t * h * 0.12;
          c.globalAlpha = Math.max(0, 0.5 * (1 - t)); c.fillStyle = i % 3 ? '#ddff89' : '#ffb066'; c.fillRect(x, y, 2, 5);
        }
        c.globalAlpha = 1;
        break;
      }
      case 'shatter-freeze': {
        wash(0.3);
        const snap = Math.min(1, t / 0.4);
        watcherMask(c, w / 2, h * 0.22, Math.min(w, h) * 0.0013 + 0.4, { glow: snap * flash, eye: t < 0.5 ? 1 : 0.55, split: 0 });
        break;
      }
      case 'shatter-core': {
        wash(0.2);
        const r = 10 + 62 * easeOut(t);
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, '#05060c'); g.addColorStop(0.62, '#05060c');
        g.addColorStop(0.85, '#241c12'); g.addColorStop(1, 'rgba(221,255,137,0)');
        c.fillStyle = g; c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 0.5 + 0.5 * t; c.strokeStyle = '#ddff89'; c.lineWidth = 2.4;
        c.shadowColor = '#ddff89'; c.shadowBlur = 24;
        c.beginPath(); c.arc(sx, sy, r * 0.86, 0, Math.PI * 2); c.stroke();
        c.shadowBlur = 0; c.globalAlpha = 0.45 + 0.3 * t;
        c.setLineDash([10, 14]); c.lineDashOffset = -t * 90; c.lineWidth = 2;
        c.beginPath(); c.arc(sx, sy, r * 1.35, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        // The world bends: vignette pulls inward.
        const pull = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78);
        pull.addColorStop(0, 'rgba(6,5,14,0)'); pull.addColorStop(1, `rgba(6,5,14,${0.62 * t})`);
        c.globalAlpha = 1; c.fillStyle = pull; c.fillRect(0, 0, w, h);
        break;
      }
      case 'shatter-crack': {
        const f = t < 0.22 ? 1 : Math.max(0, 1 - (t - 0.22) / 0.78);
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 1.15 * easeOut(Math.min(1, t / 0.6 + 0.12)));
        g.addColorStop(0, `rgba(255,252,238,${f * flash})`); g.addColorStop(0.35, `rgba(255,214,140,${0.8 * f * flash})`); g.addColorStop(1, 'rgba(255,190,110,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        const reach = easeOut(Math.min(1, t / 0.5));
        for (const [tx, ty] of [[0, 0], [w, 0], [0, h], [w, h]]) {
          const pts = fracturePath(771, sx, sy, sx + (tx - sx) * reach, sy + (ty - sy) * reach, 9);
          c.globalAlpha = f; c.strokeStyle = '#ffbe6e'; c.lineWidth = 9; jaggedLine(c, pts); c.stroke();
          c.globalAlpha = f; c.strokeStyle = '#fffdf2'; c.lineWidth = 2.6; jaggedLine(c, pts); c.stroke();
        }
        // Shards lift in rings.
        for (let i = 0; i < 16; i++) {
          const ang = (hash(881, i, 3) % 628) / 100, ring = 120 + (hash(881, i, 5) % 340), rr = easeOut(t) * ring;
          const x = sx + Math.cos(ang) * rr, y = sy + Math.sin(ang) * rr * 0.82 - t * 26;
          c.save(); c.globalAlpha = Math.max(0, 0.9 - t * 0.45); c.translate(x, y); c.rotate(ang + t);
          c.fillStyle = hash(881, i, 7) % 4 ? '#241c32' : '#ffd98c';
          c.fillRect(-4, -6, 8 + (hash(881, i, 9) % 8), 12); c.restore();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'shatter-sky': {
        wash(0.24);
        // The COLLAPSE SKY drops in; the shards settle and STAY.
        c.globalAlpha = 0.35 + 0.65 * easeOut(t);
        drawShatteredSky(c, w, h, { shatter: Math.max(6, Math.round(56 - 44 * t)) }, motion ? time : 0, motion);
        c.globalAlpha = 1;
        // The Watcher splits down the middle.
        watcherMask(c, w / 2, h * 0.24, Math.min(w, h) * 0.00135 + 0.42, { glow: 0.4 * flash, eye: 0.8, split: easeOut(t) });
        break;
      }
      case 'shatter-borders': {
        wash(0.1);
        // One pulse travelling clockwise around the borders.
        const inset = 22, per = 2 * (w - 2 * inset) + 2 * (h - 2 * inset), head = (t * 1.15 % 1) * per;
        const seg = per / 4, side = Math.floor(head / seg), local = (head - side * seg) / seg;
        const edge = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
        const corners = [[inset, inset], [w - inset, inset], [w - inset, h - inset], [inset, h - inset], [inset, inset]];
        c.strokeStyle = '#ddff89'; c.globalAlpha = 0.4; c.lineWidth = 6;
        c.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset);
        const [a, b] = [corners[side], corners[side + 1]];
        const [x0, y0] = edge(a, b, Math.max(0, local - 0.12)), [x1, y1] = edge(a, b, local);
        c.globalAlpha = 0.95; c.lineWidth = 9; c.shadowColor = '#ddff89'; c.shadowBlur = 20;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.shadowBlur = 0;
        // Aurora band + ember rain.
        const aurora = c.createLinearGradient(0, 0, 0, h * 0.15);
        aurora.addColorStop(0, `rgba(221,255,137,${0.34 + 0.14 * Math.sin(time * 0.09)})`); aurora.addColorStop(1, 'rgba(221,255,137,0)');
        c.globalAlpha = 1; c.fillStyle = aurora; c.fillRect(0, 0, w, h * 0.15);
        for (let i = 0; i < 44; i++) {
          const x = hash(993, i, 3) % 1000 / 1000 * w;
          const y = h * 0.16 + ((hash(993, i, 5) % 1000) / 1000 * h * 0.2 + t * h * 0.62);
          c.globalAlpha = 0.8 * (1 - t * 0.3); c.fillStyle = hash(993, i, 7) % 3 ? '#ffb066' : '#ffe9b0';
          c.beginPath(); c.arc(x, y, 1.4 + (hash(993, i, 9) % 1000) / 1000 * 2.4, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'shatter-dolly': {
        // Second-long white flicker as the world, not the cube, takes focus.
        const flick = t < 0.12 ? (t < 0.06 ? 0.5 : 0.32) * flash : 0;
        if (flick > 0) { c.fillStyle = `rgba(255,255,255,${flick})`; c.fillRect(0, 0, w, h); }
        // The spine bursts full-bright.
        if (t < 0.42) {
          const k = 1 - t / 0.42;
          const g = c.createLinearGradient(0, h, 0, h * 0.3);
          g.addColorStop(0, `rgba(255,250,226,${0.85 * k})`); g.addColorStop(0.5, `rgba(255,214,140,${0.4 * k})`); g.addColorStop(1, 'rgba(255,214,140,0)');
          c.globalAlpha = 1; c.fillStyle = g;
          c.fillRect(w * 0.5 - (3 + 9 * k), h * 0.3, 6 + 18 * k, h * 0.7);
        }
        break;
      }
      case 'shatter-release': {
        const fade = Math.max(0, 0.22 - t * 0.22);
        if (fade > 0) { c.fillStyle = `rgba(255,255,255,${fade * flash})`; c.fillRect(0, 0, w, h); }
        break;
      }
      default:
        break;
    }
    c.restore();
  }
  function draw(run, alpha, aim, motion, device = "mouse") {
    transform();
    const { world, state: s, combat } = run, v = lastView = camera.view(alpha), p = bodyPose(world.player, alpha), nearest = run.nearest(), time = mix(world.previousClock, world.clock, alpha);
    const animationAge = age => age > 0 ? age - 1 + Math.max(0, Math.min(1, alpha)) : age;
    // A dash is an event, not a velocity state. Once the launch has happened,
    // all dash-owned geometry shares this bearing even if the physics body
    // banks, bounces, or is steered before the 15-tick animation expires.
    const launchAngle = Number.isFinite(s.launchAngle)
      ? s.launchAngle
      : Math.atan2(world.player.velocity.y, world.player.velocity.x);
    const dash = dashFor(animationAge(s.slashAge), world.player.velocity.x, world.player.velocity.y, launchAngle);
    if (dash && dash.phase !== "windup") {
      if (dashTravel.age === null || s.slashAge < dashTravel.age)
        dashTravel = { age: 0, x: p.x, y: p.y, along: 0 };
      dashTravel.age = s.slashAge;
      dashTravel.along = Math.hypot(p.x - dashTravel.x, p.y - dashTravel.y) / (R * 2);
    } else if (!dash) {
      dashTravel = { age: null, x: 0, y: 0, along: 0 };
    }
    if (drawTrace)
      drawTrace.push({
        id: "@cube",
        kind: "cube",
        mode: s.phase,
        alpha,
        x: p.x,
        y: p.y,
        ex: world.player.position.x,
        ey: world.player.position.y,
        px: (world.player.plugin.previous ?? world.player.position).x,
        py: (world.player.plugin.previous ?? world.player.position).y,
        sx: (p.x - v.x) * v.scale,
        sy: (p.y - v.y) * v.scale,
        // Where the cube sits in the VIEWPORT, 0..1. This is the number the pin
        // is about: it must not move while the camera is pinned.
        ux: (p.x - v.x) / v.w,
        uy: (p.y - v.y) / v.h
      });
    syncScene(run, nearest);
    if (s.opening) back.bench(v);
    else if (["tokyo", "foundry", "manga", "synth", "void"].includes(s.equipment?.world)) drawEquipmentWorld(c, w, h, s.equipment.world, motion ? time : 0,{x:v.panX*v.scale,y:v.panY*v.scale,scale:v.scale});
    else back.world(v, s.seed, s.band,motion?time:0);
    // CHUNK 2/3: the sky breaks before the words do. The meter is on the run;
    // once the event is spent the sky stays in shards for the rest of the run.
    if (s.arenaMode === 'SHATTERED' || s.shatter > 0) {
      drawShatteredSky(c, w, h, s, motion ? time : 0, motion);
      drawShatteredRails(c, w, h, v, world.arena, motion ? time : 0, motion);
    } else {
      drawFractureSky(c, w, h, s.fracture?.pct ?? 0, motion ? time : 0, motion);
    }
    narrativeBackdrop(s.narrative,w,h,time,motion);
    // CHUNK 6B: the arena behind the landlord darkens one level, so the slab
    // reads against the sky and not against the pips.
    for (const e of combat.enemies.values()) {
      if (e.kind === 'monolith') {
        c.save();
        c.fillStyle = 'rgba(6,5,16,0.34)';
        c.fillRect(0, 0, w, h);
        c.restore();
        break;
      }
    }
    narrativeTrack(s.narrative,w,h);
    if(s.narrative&&!s.narrative.intro&&s.narrative.seal){
      const n=s.narrative,live=n.locks.filter(lock=>!lock.broken),q=live.length?live.reduce((best,lock)=>Math.hypot(lock.x-p.x,lock.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?lock:best,live[0]):n.seal;
      const sx=(q.x-v.x)*v.scale,sy=(q.y-v.y)*v.scale;
      if(sx<35||sx>w-35||sy<70||sy>h-35){const dx=sx-w/2,dy=sy-h/2,k=Math.min((w/2-30)/Math.max(1,Math.abs(dx)),(h/2-70)/Math.max(1,Math.abs(dy)));c.save();c.translate(w/2+dx*k,h/2+dy*k);c.rotate(Math.atan2(dy,dx));c.fillStyle=n.seal.ready?'#e6ff78':'#dfb977';c.globalAlpha=.8;c.beginPath();c.moveTo(11,0);c.lineTo(-7,-6);c.lineTo(-3,0);c.lineTo(-7,6);c.closePath();c.fill();c.restore();}
    }
    if(s.visualTutorial){
      if(s.visualTutorial.guide?.kind!=='dodge')drawTutorialGuidance(c,v,s.visualTutorial,p,motion,device);
      // A quiet edge chevron points toward the real rail or unlocked exit when
      // it lies beyond the camera, without adding another HUD panel.
      const lesson=s.visualTutorial,q=!['watch','dodge','resolve','wait-next'].includes(lesson.guide?.kind)?lesson.guide:null;
      if(q){const sx=(q.x-v.x)*v.scale,sy=(q.y-v.y)*v.scale;if(sx<26||sx>w-26||sy<35||sy>h-26){
        const dx=sx-w/2,dy=sy-h/2,k=Math.min((w/2-28)/Math.max(1,Math.abs(dx)),(h/2-42)/Math.max(1,Math.abs(dy)));
        c.save();c.translate(w/2+dx*k,h/2+dy*k);c.rotate(Math.atan2(dy,dx));c.globalAlpha=.72;c.fillStyle='#d9ff83';c.beginPath();c.moveTo(12,0);c.lineTo(-7,-7);c.lineTo(-3,0);c.lineTo(-7,7);c.closePath();c.fill();c.restore();
      }}
    }
    if (s.held || s.panicTicks > 0 && s.phase === "playing") {
      const g = c.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.16, w / 2, h * 0.52, Math.max(w, h) * 0.7);
      g.addColorStop(0, "rgba(10,8,18,0)");
      g.addColorStop(0.58, "rgba(10,8,18,0.26)");
      g.addColorStop(1, "rgba(7,5,12,0.72)");
      c.save();
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.restore();
    }
    c.save();
    const shakeScale = shakeLevel === "off" ? 0 : shakeLevel === "low" ? 0.34 : 1, shakeX = motion && shakeScale ? shake.x * shakeScale : 0, shakeY = motion && shakeScale ? shake.y * shakeScale : 0, shakeRoll = motion && shakeScale && shakeLevel === "full" ? shake.rollDeg : 0;
    if(!s.visualTutorial)clipWorldToHUD(c, w, h, hudTop(), hudGutter());
    if (shakeX || shakeY) c.translate(shakeX, shakeY);
    if (shakeRoll) {
      c.translate(w / 2, h / 2);
      c.rotate(shakeRoll * Math.PI / 180);
      c.translate(-w / 2, -h / 2);
    }
    c.scale(v.scale, v.scale);
    c.translate(-v.x, -v.y);
    if(s.visualTutorial)drawTutorialScene(c,s.visualTutorial,combat,p,v.scale,motion,time);
    if(s.narrative)narrativeWorld(s.narrative,v.scale,time,motion);
    if(s.dimension&&!s.visualTutorial)drawDimensionField(c,s.dimension,v,motion,{separation:shakeLevel!=='off'});
    if(motion&&shakeLevel!=='off')for(const hit of contactBursts.slice(-3))drawHitRegistration(c,hit,18-hit.life,motion);
    if(s.wave?.shatterTrace&&!s.wave.shatterFx)drawSettledSeam(c,s.wave.shatterTrace,s.equipment);
    if(s.wave?.breach||s.wave?.shatterFx)drawDimensionBreach(c,s.wave.breach,s.dimension,motion,s.wave.shatterFx,s.equipment);
    if (!s.wave?.spawnPadGone && inView(v, s.visualTutorial?{x:-400,y:0}:SPAWN, 140)){if(s.visualTutorial){c.save();c.translate(-400,0);pad(c);c.restore();}else pad(c);}
    if(s.wave?.platform){
      const q=s.wave.platform;
      if(s.wave.shattered)drawPlatformSettlement(c,q,{age:s.wave.restAge||0,motion});
      drawPlatformMagnet(c,q,{active:!!s.wave.magnet?.active,time:s.wave.restAge||0,motion});
      const summon=motion?Math.min(1,(s.wave.restAge||0)/24):1;
      c.save();
      c.globalAlpha=.12*summon;c.fillStyle=INK.acid;c.beginPath();c.moveTo(q.x+28,q.y);c.lineTo(q.x+q.w-28,q.y);c.lineTo(q.x+q.w-65,q.y-110);c.lineTo(q.x+65,q.y-110);c.closePath();c.fill();
      c.globalAlpha=1;c.translate(q.x+q.w/2,q.y+12);c.scale(Math.max(.08,summon),1);c.translate(-q.x-q.w/2,-q.y-12);
      poly2(c,"#0e101a",[[q.x-6,q.y-4],[q.x+q.w+6,q.y-4],[q.x+q.w-15,q.y+q.h+12],[q.x+15,q.y+q.h+12]]);
      poly2(c,"#302e43",[[q.x,q.y],[q.x+q.w,q.y],[q.x+q.w-17,q.y+q.h+6],[q.x+17,q.y+q.h+6]]);
      line(c,INK.acid,4,q.x,q.y,q.x+q.w,q.y);
      for(let i=0;i<6;i++){c.fillStyle=i%2?"#c5d98b":"#737e52";c.fillRect(q.x+12+i*46,q.y+9,25,5);}
      for(const xx of [q.x+24,q.x+q.w-24]){poly2(c,"#ada2bd",[[xx-4,q.y+q.h+6],[xx+4,q.y+q.h+6],[xx,q.y+q.h+17]]);}
      c.fillStyle=INK.paper;c.font="700 13px monospace";c.textAlign="center";c.fillText("LAND / UPGRADE",q.x+q.w/2,q.y+q.h+38);c.restore();
    }
    if (s.opening) {
      for (const pegs of s.opening.racks) rackInk(c, pegs, combat.enemies);
      if (s.opening.returning) {
        const a = s.opening.anchor;
        c.save();
        c.globalAlpha = 0.65;
        line(c, INK.acid, 2, a.x, a.y, p.x, p.y);
        c.restore();
      }
    } else {
      walls(c, v, p, s.floorFlash,world.arena);
      if (s.questPortal) {
        const q = s.questPortal, t = motion ? q.age * 0.035 : 0;
        c.save();
        c.translate(q.x, q.y);
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = i === 1 ? "#bb7bff" : "#ffd773";
          c.lineWidth = i === 1 ? 10 : 4;
          c.beginPath();
          c.ellipse(0, 0, q.r + i * 12, q.r * 0.84 + i * 12, t + i, 0, Math.PI * 1.75);
          c.stroke();
        }
        c.fillStyle = "#b36bff33";
        c.beginPath();
        c.arc(0, 0, q.r, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      if (s.questPart && !s.equipment) drawQuestPart(c, s.questPart, p.x, p.y, 1, motion ? time * 0.03 : 0);
      if (s.net || s.caught) {
        const y = s.caught ? p.y + R * (Math.abs(Math.cos(p.angle)) + Math.abs(Math.sin(p.angle))) + 2 : s.line - 85;
        if (y < v.y + v.h + 30) {
          const lip = s.caught ? y - 28 : y;
          c.save();
          c.beginPath();
          c.moveTo(v.x - 8, lip);
          c.quadraticCurveTo((v.x + p.x) / 2, y, p.x, y);
          c.quadraticCurveTo((p.x + v.x + v.w) / 2, y, v.x + v.w + 8, lip);
          c.strokeStyle = "#1c2530";
          c.lineWidth = 11;
          c.stroke();
          c.strokeStyle = "#b7b291";
          c.lineWidth = 6;
          c.stroke();
          c.setLineDash([10, 15]);
          c.strokeStyle = "#4a6158";
          c.lineWidth = 5;
          c.stroke();
          c.restore();
        }
      }
    }
    {
      for (const e of shards) {
        const q = pose(e, alpha);
        c.save();
        c.globalAlpha = fade("shard", ANIM.shard.life - e.life);
        c.translate(q.x, q.y);
        c.rotate(q.angle);
        if (motion && e.opts.paper) {
          const age = 32 - e.life;
          c.rotate(e.local);
          c.scale(1, 1 - 0.4 * Math.sin(age * 0.095) ** 2);
          c.rotate(-e.local);
        }
        c.scale(e.r, e.r);
        cutHalf(c, e.kind, e.path, e.local, e.side, e.opts);
        c.restore();
      }
      if (motion)
        for (const e of sparks) {
          c.save();
          c.globalAlpha = fade("spark", ANIM.spark.life - e.life);
          c.translate(mix(e.px, e.x, alpha), mix(e.py, e.y, alpha));
          c.rotate(e.angle);
          poly2(c, e.col, [
            [e.l, 0],
            [-e.l, -2],
            [-e.l * 0.6, 2]
          ]);
          c.restore();
        }
    }
    if (motion) speedField(c, world, v, time, run.state, dash ? launchAngle : null);
    if (motion && s.phase === "playing") {
      // Element shapes replace the generic ribbon during a launch; no stacking.
      if(s.slashAge>=0&&s.slashAge<=20)drawElementalDash(c,{x:p.x,y:p.y,vx:world.player.velocity.x,vy:world.player.velocity.y,angle:launchAngle,travel:dashTravel.along*R*2,age:animationAge(s.slashAge),element:dashElement(s.equipment,s.sword),equipment:s.equipment,sword:s.sword,buff:s.waveBuff,radius:R,motion});
      else streak(c, trail, p, s.blade > 0);
    }
    if (motion && s.impact && s.impact.source!=='cut'&&s.impact.source!=='bank') {
      const w2 = wave(s.impactAge);
      if (w2) {
        c.save();
        c.globalAlpha = w2.alpha * 0.85;
        arc(c, INK.paper, 2.6 / v.scale, s.impact.x, s.impact.y, w2.r);
        c.globalAlpha = w2.alpha * 0.55;
        arc(c, INK.rose, 1.4 / v.scale, s.impact.x, s.impact.y, w2.r * 0.72);
        c.restore();
      }
    }
    if (motion && s.hyperLevel > 0.02) {
      const k = s.hyperLevel;
      const burst = s.hyperAge >= 0 && s.hyperAge < HYPER_BURST ? s.hyperAge / HYPER_BURST : -1;
      if (burst >= 0) {
        const t = burst, ease = 1 - Math.pow(1 - t, 3);
        c.save();
        c.translate(p.x, p.y);
        c.globalAlpha = (1 - t) * 0.85;
        c.strokeStyle = INK.acid;
        c.lineWidth = Math.max(1, (7 - 5 * t) / v.scale);
        c.beginPath();
        c.arc(0, 0, R * (1.4 + 7.5 * ease), 0, TAU);
        c.stroke();
        if (t > 0.12) {
          const t2 = (t - 0.12) / 0.88;
          c.globalAlpha = (1 - t2) * 0.5;
          c.lineWidth = Math.max(0.8, 3 * (1 - t2) / v.scale);
          c.beginPath();
          c.arc(0, 0, R * (1.2 + 5.2 * (1 - Math.pow(1 - t2, 3))), 0, TAU);
          c.stroke();
        }
        c.globalAlpha = (1 - t) * 0.9;
        c.strokeStyle = INK.paper;
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * TAU + 0.19, r0 = R * (1.5 + 6.5 * ease), r1 = r0 + R * (1.9 + 2.2 * (1 - t));
          c.lineWidth = Math.max(0.6, (2.6 - 1.8 * t) / v.scale);
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }
        c.globalAlpha = 1;
        c.restore();
      }
      const n = 6 + Math.round(6 * k);
      c.save();
      c.translate(p.x, p.y);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + 0.26, len = R * (1.3 + 1.15 * k);
        c.globalAlpha = 0.12 + 0.42 * k;
        c.strokeStyle = i % 2 ? INK.acid : INK.paper;
        c.lineWidth = (1.3 + 1.5 * k) / v.scale;
        c.beginPath();
        c.moveTo(Math.cos(a) * R * 1.1, Math.sin(a) * R * 1.1);
        c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        c.stroke();
      }
      if (k > 0.15) {
        c.globalAlpha = 0.22 + 0.34 * k;
        c.strokeStyle = INK.acid;
        c.lineWidth = (5 + 9 * k) / v.scale;
        c.beginPath();
        c.arc(0, 0, R * 1.02, 0, TAU);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.restore();
    }
    if (motion && s.boom && s.boom.source!=='bank' && s.boomAge < 26) {
      const k = 1 - s.boomAge / 26, power = clamp(s.boom.speed / MAX_SPEED, 0, 1.4), bx = s.boom.x, by = s.boom.y, a = Math.atan2(s.boom.ny, s.boom.nx);
      c.save();
      for (let i = 0; i < 3; i++) {
        const t = (s.boomAge - i * 2.5) / 26;
        if (t < 0 || t > 1) continue;
        const r = (18 + 120 * power) * t * t, al = (1 - t) * (1 - t) * 0.6 * (0.5 + power * 0.5);
        c.globalAlpha = al;
        c.save();
        c.translate(bx, by);
        c.rotate(a);
        c.scale(1, 0.55);
        arc(c, INK.acid, 2.4 / v.scale, 0, 0, r);
        c.restore();
      }
      const tx = -Math.sin(a), ty = Math.cos(a);
      for (let i = 0; i < 7; i++) {
        const side = i % 2 ? 1 : -1, u = (i - 3) / 3, len = (26 + 150 * power) * k, sp = 0.3 + 0.7 * Math.abs(u);
        c.globalAlpha = 0.5 * k;
        c.strokeStyle = INK.acid;
        c.lineWidth = 2.2 * k / v.scale;
        c.beginPath();
        c.moveTo(bx + u * 26 * side, by + u * 26 * side);
        c.lineTo(bx + tx * len * sp * side, by + ty * len * sp * side);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.restore();
    }
    for (const e of combat.enemies.values())
      if (inView(v, e, 870)) drawEnemyWarning(c, e, { ...pose(e, alpha), r: e.r }, time,v.scale,motion,world.arena);
    for (const l of combat.links) {
      const a = pose(l.a, alpha), b = pose(l.b, alpha);
      c.save();
      if (l.mode === "tell") {
        c.setLineDash([5, 10]);
        line(c, "#bf7fa7", 1.5, a.x, a.y, b.x, b.y);
        c.setLineDash([]);
        const k = clamp(l.f, 0, 1) * 0.46;
        line(c, "#fba9dc", 3, a.x, a.y, mix(a.x, b.x, k), mix(a.y, b.y, k));
        line(c, "#fba9dc", 3, b.x, b.y, mix(b.x, a.x, k), mix(b.y, a.y, k));
      } else {
        line(c, INK.rose, 9, a.x, a.y, b.x, b.y);
        line(c, "#ffe4ea", 3, a.x, a.y, b.x, b.y);
      }
      c.restore();
    }
    for (const m of beams) {
      const u = 1 - m.life / 12, grow = 0.55 + u * 0.45, fadeOut = Math.min(1, m.life / 5), dx = Math.cos(m.angle), dy = Math.sin(m.angle), h2 = m.reach * grow;
      c.save();
      c.globalAlpha = fadeOut;
      c.lineCap = "round";
      c.strokeStyle = m.through ? INK.acid : INK.paper;
      c.lineWidth = (m.through ? 7 : 4.5) / v.scale;
      c.beginPath();
      c.moveTo(m.x - dx * h2, m.y - dy * h2);
      c.lineTo(m.x + dx * h2, m.y + dy * h2);
      c.stroke();
      c.globalAlpha = fadeOut * 0.92;
      c.strokeStyle = INK.paper;
      c.lineWidth = 1.8 / v.scale;
      c.stroke();
      c.restore();
    }
    for (const m of (s.visualTutorial?[]:pops)) {
      const u = 1 - m.life / 40, rise = motion ? u * 26 : 0;
      const beat = m.beat ? 1 + 0.18 * m.beat : 1;
      c.save();
      c.globalAlpha = m.life / 40 * (m.life < 8 ? m.life / 8 : 1);
      const labelScreen = toScreen(v, { x: m.x, y: m.baseY - rise });
      const labelSafe = overlayPoint(w, h, labelScreen, { radius: Math.min(70, Math.max(32, m.text.length * 7)), top: hudTop(), gutter: hudGutter() });
      c.translate(v.x + labelSafe.x / v.scale, v.y + labelSafe.y / v.scale);
      c.scale(beat / v.scale, beat / v.scale);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = `800 ${m.big ? 26 : 17}px/1 Riot, Impact, sans-serif`;
      c.lineWidth = 4;
      c.strokeStyle = INK.black;
      c.lineJoin = "round";
      c.strokeText(m.text, 0, 0);
      c.fillStyle = m.big ? INK.paper : "#cfc6d8";
      c.fillText(m.text, 0, 0);
      c.restore();
    }
    for(const impact of contactBursts){const age=(impact.type==='break'?27:18)-impact.life;if(['cut','armor'].includes(impact.type))drawCombatHit(c,impact,age,motion);else drawContactBurst(c,{...impact,age,motion});if(impact.type==='break'){drawPlayerFracture(c,{x:impact.x,y:impact.y,age,motion,equipment:impact.equipment,contact:impact.contact});}if(impact.type==='break'&&impact.sword){const t=motion?age:3;c.save();c.globalAlpha=impact.life/27;drawSwordWeapon(c,{x:impact.x+t*(impact.contact?.vx||0)*.18,y:impact.y+t*t*.12,radius:R,angle:(impact.contact?.angle||0)+t*.07,active:false,aiming:true,sword:impact.sword,motion:false});c.restore();}}
    for(const ward of wardBreaks)drawWardFracture(c,{x:ward.x,y:ward.y,age:24-ward.life,motion,equipment:ward.equipment,sword:ward.sword,angle:ward.contact?.angle||0,strength:ward.contact?.strength||0});
    for (const m of imprints) {
      c.save();
      c.globalAlpha = fade("imprint", ANIM.imprint.life - m.life);
      if (m.type === "cut" || m.type === "armor")
        contactInk(c, m, fade("imprint", ANIM.imprint.life - m.life), motion);
      else if (m.type === "shear") {
        shearInk(c, m.x, m.y, m.angle, Math.hypot(m.end.x - m.x, m.end.y - m.y), SHEAR.width);
      } else {
        c.translate(m.x, m.y);
        c.rotate(m.angle);
        const split = motion ? (13 - m.life) * 0.7 : 3;
        poly2(c, "#ffa6ce", [
          [-18, -2 - split],
          [-4, -4 - split],
          [-7, 1 - split]
        ]);
        poly2(c, INK.paper, [
          [1, 1 + split],
          [12, 3 + split],
          [-2, 6 + split]
        ]);
        line(c, INK.acid, 2.8, -8, 9, 5, -8);
      }
      c.restore();
    }
    if ((aim?.power && !s.visualTutorial) || (aim?.power && !aim.anchor) || s.story && s.opening?.rest && s.edge > 0 && !s.opening.finishing || s.phaseLineTicks > 0) {
      const shot = drawArc(
        c,
        run,
        aim?.power ? aim : run.suggestion(),
        alpha,
        v.scale,
        !aim?.power,
        time,
        v
      );
      const marked = aim?.lock?.id || aim?.target;
      if (marked && !shot?.lock && combat.enemies.has(marked)) {
        const e = combat.enemies.get(marked), q = pose(e, alpha);
        for (let i = 0; i < 2; i++)
          arc(c, INK.acid, 2 / v.scale, q.x, q.y, e.r + 6, -0.44 + i * Math.PI, 0.44 + i * Math.PI);
      }
    }
    for (const e of combat.enemies.values()) {
      if (!inView(v, e, 100)) continue;
      const q = pose(e, alpha);
      c.globalAlpha = 1;
      c.filter = "none";
      if (drawTrace)
        drawTrace.push({
          id: e.id,
          kind: e.kind,
          mode: e.mode,
          alpha,
          x: q.x,
          y: q.y,
          // The raw pre/post positions, so a test can prove the interpolator
          // actually used them rather than happening to be between them.
          px: e.px,
          py: e.py,
          ex: e.x,
          ey: e.y,
          // Device space: the space the player sees.
          sx: (q.x - v.x) * v.scale,
          sy: (q.y - v.y) * v.scale
        });
      if (s.equipment?.world === "manga") {
        c.save();
        c.filter = "grayscale(1)";
      }
      const reaction=contactBursts.findLast(hit=>hit.type==='armor'&&hit.entityId===e.id);
      c.save();
      const anticipation=resolveFangAnticipation(e,motion);
      if(e.kind==='fang'&&(e.mode==='tell'||e.mode==='rush')){c.translate(q.x,q.y);c.rotate(e.aim||0);c.translate(anticipation.offset,0);c.scale(anticipation.x,anticipation.y);c.rotate(-(e.aim||0));c.translate(-q.x,-q.y);}
      if(reaction&&motion){const age=18-reaction.life,k=(.045+(reaction.contact?.strength??.3)*.09)*Math.exp(-age*.3);c.translate(q.x,q.y);c.rotate(reaction.contact?.angle||0);c.scale(1-k,1+k*.6);c.rotate(-(reaction.contact?.angle||0));c.translate(-q.x,-q.y);}
      if(e.kind==='monolith')drawMonolithSignals(c,q.x,q.y,e.r,{lashTell:e.lashTell,slamTell:e.slamTell,lensTell:e.lensTell,lensT:e.lensT},v.scale,time);
      foe(c, e.kind, q.x, q.y, e.r, q.angle, {
        wake: e.wakeAt,
        hp: e.hp,
        paper: e.paper,
        // Eased hit flash. `e.flash` counts DOWN from ANIM.flash.life, so the
        // amount rises as it decays, which is exactly the attack the eye
        // needs: instant white, then a quick settle back to the real colour.
        // A hard boolean here used to pop the whole shape to flat white for
        // two frames, which on a moving target reads as a stutter.
        flash: e.flash > 0 ? fade("flash", ANIM.flash.life - e.flash)*(reaction?.55:1) : 0,
        fault: e.fault,
        mode:e.mode,clock:e.clock,span:e.span,aim:e.aim,
        active:e.mode==='rush'||combat.hazards.some(h=>!h.spent&&h.sourceId===e.id),
        // CHUNK 6B: the landlord's tells — crack-crawl, the dropped plate,
        // and the dilating iris — travel through opts to the painter.
        lashTell: e.lashTell || 0,
        slamTell: e.slamTell || 0,
        slamPlate: e.slamPlate ?? -1,
        lensTell: e.lensTell || 0,
        lensT: e.lensT || 0,
        time:motion?time:0
      });c.restore();
      if (s.equipment?.world === "manga") c.restore();
    }
    for (const a of combat.hazards) {
      const x = mix(a.px, a.x, alpha), y = mix(a.py, a.y, alpha);
      if (a.kind === "zone") {
        drawEnemyZone(c,a.zone,true,v.scale);
      } else if (a.kind === "ring") {
        c.save();
        c.globalAlpha = a.spent ? 0.26 : 1;
        arc(c, "#b93863", 6, x, y, mix(a.previousRadius, a.radius, alpha));
        arc(c, "#ffb7c8", 2, x, y, mix(a.previousRadius, a.radius, alpha));
        c.restore();
      } else if (a.kind === "shock") {
        // CHUNK 6B: the landlord's slam — a bone-white concussion ring, not a
        // Pulse. Cracked and amber, spent fading.
        c.save();
        c.globalAlpha = a.spent ? 0.3 : Math.max(0.25, 1 - a.radius / ((a.maxRadius || 150) + 30));
        arc(c, "#7d6a52", 7, x, y, mix(a.previousRadius, a.radius, alpha));
        arc(c, "#ffe4b3", 2.4, x, y, mix(a.previousRadius, a.radius, alpha));
        c.restore();
      } else if (a.source === "monolith") {
        // Debris off the slab — a tumbling ember rock, not a needle.
        c.save();
        c.translate(x, y);
        c.rotate(a.angle);
        const markerScale = Math.min(1.8, Math.max(1, 0.85 / v.scale));
        c.scale(markerScale, markerScale);
        poly2(
          c,
          "#241a14",
          [[11,0],[2,-8],[-8,-6],[-13,2],[-6,9],[5,7]],
          INK.black,
          Math.max(1.8,1.4/v.scale/markerScale)
        );
        line(c, '#ff8f4d', Math.max(1.5,1.35/v.scale/markerScale), -7, 1, 4, 3);
        line(c, '#ffd9a0', Math.max(1.2,1.1/v.scale/markerScale), -4, -3, 5, -2);
        c.restore();
      } else {
        c.save();
        c.translate(x, y);
        c.rotate(a.angle);
        // Keep the projectile legible at phone zoom without changing collision.
        const markerScale=Math.min(1.8,Math.max(1,.85/v.scale));
        c.scale(markerScale,markerScale);
        poly2(
          c,
          a.source === "crown" ? "#ffc27f" : "#d5adff",
          a.source === "crown" ? [[10,0],[-5,-6],[-3,-2],[-17,-5],[-12,0],[-17,5],[-3,2],[-5,6]]
            : [[10,0],[-9,-4],[-18,0],[-9,4]],
          INK.black,
          Math.max(1.8,1.4/v.scale/markerScale)
        );
        line(c,'#fff7ef',Math.max(1.5,1.6/v.scale/markerScale),-8,0,7,0);
        c.restore();
      }
    }
    // Falling streaks belong to the fall event. During a committed dash the
    // launch wake owns the motion read, so an upward fall streak would be a
    // contradictory second arrow.
    if (!dash && !["dying", "over"].includes(s.phase) && world.player.velocity.y > 3) {
      c.save();
      c.globalAlpha = 0.25;
      c.strokeStyle = "#c0b8cc";
      c.lineWidth = 1.5 / v.scale;
      for (const dx of [-14, 0, 14]) {
        c.beginPath();
        c.moveTo(p.x + dx, p.y - 34);
        c.lineTo(p.x + dx, p.y - 34 - Math.min(38, world.player.velocity.y));
        c.stroke();
      }
      c.restore();
    }
    if (!["dying", "over"].includes(s.phase)) {
      if (s.drive > 0) {
        const a = motion ? time * 0.065 : 0;
        for (let j = 0; j < 3; j++)
          arc(c, INK.acid, 2, p.x, p.y, R * 1.52, a + j * TAU / 3, a + j * TAU / 3 + 0.65);
      }
      if (s.blade > 0 && !s.sword) {
        const da = s.slashAngle - s.previousSlash;
        const bearing = s.previousSlash + alpha * Math.atan2(Math.sin(da), Math.cos(da));
        const vis = bladeAlpha(s.blade, 38, time);
        if (motion)
          drawSweep(c, p, bearing, R * s.reach, s.shots % 2 ? 1 : -1, vis);
        c.save();
        c.globalAlpha = vis * 0.42;
        c.translate(p.x, p.y);
        c.rotate(bearing);
        c.beginPath();
        c.moveTo(R * 0.5, 0);
        c.arc(0, 0, R * s.reach * 0.96, -0.34, 0.34);
        c.closePath();
        c.fillStyle = INK.acid;
        c.fill();
        c.globalAlpha = vis * 0.5;
        c.strokeStyle = INK.paper;
        c.lineWidth = 1.6 / v.scale;
        c.stroke();
        c.restore();
        blade(c, p.x, p.y, bearing, R, vis, s.reach);
      } else if (!s.sword && (s.opening?.rest || s.phase === "ready" && s.drive > 0) && nearest) {
        blade(
          c,
          p.x,
          p.y,
          Math.atan2(nearest.y - p.y, nearest.x - p.x),
          R,
          0.94,
          s.opening?.reach ?? s.reach
        );
      }
      if (motion && dashDust.length) {
        for (const d of dashDust) {
          const u = d.age / d.life, a = (1 - u) * (1 - u);
          if (a < 0.02) continue;
          c.globalAlpha = a * 0.95;
          c.fillStyle = d.hot ? INK.acid : INK.paper;
          const sp = Math.hypot(d.vx, d.vy) || 1, ux = Math.abs(d.vx / sp) > 0.5, len = d.len * R * (d.brake ? 1 - u * 0.5 : 1 + u * 0.8), thick = len * (d.brake ? 0.3 : 0.75);
          if (ux) c.fillRect(d.x - len, d.y - thick * 0.5, len * 2, thick);
          else c.fillRect(d.x - thick * 0.5, d.y - len, thick, len * 2);
        }
        c.globalAlpha = 1;
      }
      // Dash deformation is applied once below from the committed event pose.
      // The standalone cube-smear painter remains available to previews, but
      // gameplay does not stack three extra body copies on the elemental wake.
      c.save();
      if (s.invul > 0 && motion) c.globalAlpha = 0.86 + 0.14 * Math.abs(Math.sin(s.invul * 0.12));
      c.translate(p.x, p.y);
      const damageReaction=contactBursts.findLast(hit=>hit.type==='hurt');
      if(damageReaction&&motion){const t=(18-damageReaction.life)/18,k=(.09+(damageReaction.contact?.strength||0)*.1)*Math.sin(t*Math.PI);const a=damageReaction.contact?.angle||0;c.rotate(a);c.scale(1-k,1+k*.5);c.rotate(-a);}
      const bodyBase = c.getTransform?.();
      if (aim?.power && aim.anchor && !aim.held) {
        const a = Math.atan2(aim.y, aim.x) || 0, load = clamp(aim.power, 0, 1) * 0.16;
        const nx = Math.abs(Math.cos(a)), ny = Math.abs(Math.sin(a));
        c.scale(1 - load * 0.5 * nx, 1 - load * 0.5 * ny);
      }
      if (motion && s.blade > 0) {
        const snap = 0.105 * fade("blade", (time - s.swingStart) * 1.4);
        const nx = Math.abs(Math.cos(s.slashAngle)), ny = Math.abs(Math.sin(s.slashAngle));
        c.scale(1 + snap * nx, 1 + snap * ny);
        c.scale(1 - snap * 0.72 * ny, 1 - snap * 0.72 * nx);
      }
      const visualSpeed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
      const visualVx = dash ? Math.cos(launchAngle) * visualSpeed : world.player.velocity.x;
      const visualVy = dash ? Math.sin(launchAngle) * visualSpeed : world.player.velocity.y;
      const poseAnim = cubePose({
        vx: visualVx,
        vy: visualVy,
        slashAge: animationAge(s.slashAge),
        fallAge: s.fallAge,
        landAge: animationAge(s.landAge),
        hold: holdDir,
        facing,
        suppressFall: !!dash
      });
      if (poseAnim.move.speed >= 6) holdDir = poseAnim.move.index;
      const splat = splatFor(s.splat ? animationAge(s.splat.age) : -1, s.splat && { x: s.splat.nx, y: s.splat.ny });
      const dWide = (poseAnim.wide ?? 1) * (splat ? splat.sx : dash ? dash.sx : 1);
      const dTall = (poseAnim.tall ?? 1) * (splat ? splat.sy : dash ? dash.sy : 1);
      if (dWide !== 1 || dTall !== 1) c.scale(dWide, dTall);
      if (!dash && poseAnim.stretch > 4e-3) {
        const k = poseAnim.stretch;
        const sx = Math.sign(world.player.velocity.x) || 0, sy = Math.sign(world.player.velocity.y) || 0;
        const wx = sx ? sy ? 0.6 : 1 : 0, wy = sy ? sx ? 0.6 : 1 : 0;
        const rawX = 1 + k * 0.34 * wx - k * 0.2 * wy, rawY = 1 + k * 0.34 * wy - k * 0.2 * wx;
        const sx2 = Math.min(STRETCH_ALONG, Math.max(STRETCH_ACROSS, rawX)), sy2 = Math.min(STRETCH_ALONG, Math.max(STRETCH_ACROSS, rawY));
        c.scale(sx2, sy2);
      }
      const bodyAngle = p.angle;
      if (poseAnim.stretch > 0.02) {
        const k = Math.min(1, poseAnim.stretch / 0.2), back2 = poseAnim.heading - bodyAngle + Math.PI, n = 2 + Math.round(k * 4);
        c.save();
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * R * 0.42, len = R * (0.55 + 1.5 * k) * (1 - Math.abs(i - (n - 1) / 2) / n), slide = R * (0.9 + 0.5 * k);
          const ox = Math.cos(back2) * slide + Math.cos(back2 + Math.PI / 2) * off, oy = Math.sin(back2) * slide + Math.sin(back2 + Math.PI / 2) * off;
          c.globalAlpha = 0.42 * k * (0.45 + 0.55 * Math.sin((i + 0.5) / n * Math.PI));
          line(
            c,
            i === n - 1 >> 1 ? INK.paper : INK.acid,
            Math.max(0.9, (1.8 - 0.3 * Math.abs(i - (n - 1) / 2)) / v.scale),
            ox,
            oy,
            ox + Math.cos(back2) * len,
            oy + Math.sin(back2) * len
          );
        }
        c.globalAlpha = 1;
        c.restore();
      }
      if (motion && !world.grounded && !dash) {
        const vx = world.player.velocity.x, vy = world.player.velocity.y, speed = Math.hypot(vx, vy), e = stretchFor(speed, MAX_SPEED, s.hyper ? HYPER_SPEED : MAX_SPEED);
        if (e.along > 1.001) {
          const ax = Math.abs(vx) / (speed || 1), ay = Math.abs(vy) / (speed || 1);
          c.scale(
            1 + (e.along - 1) * ax - (1 - e.across) * ay,
            1 + (e.along - 1) * ay - (1 - e.across) * ax
          );
        }
      }
      if (poseAnim.sonic > 0.02) {
        const k = poseAnim.sonic, h2 = poseAnim.heading;
        c.save();
        c.rotate(h2 - bodyAngle);
        c.globalAlpha = 0.45 + 0.5 * k;
        c.strokeStyle = INK.paper;
        c.lineWidth = Math.max(0.8, 2.2 / v.scale);
        const nose = R * (2.1 + 1.5 * k), mouth = R * 1.05;
        for (let i = -1; i <= 1; i += 2) {
          c.beginPath();
          c.moveTo(mouth, i * R * (0.85 + 0.25 * k));
          c.lineTo(nose, i * R * 0.1);
          c.stroke();
        }
        c.globalAlpha = 0.3 + 0.4 * k;
        c.lineWidth = Math.max(0.6, 1.4 / v.scale);
        c.beginPath();
        c.moveTo(mouth, -R * 0.95);
        c.lineTo(mouth, R * 0.95);
        c.stroke();
        c.restore();
        c.save();
        c.rotate(h2 - bodyAngle);
        c.globalAlpha = 0.5 + 0.5 * k;
        c.strokeStyle = INK.acid;
        c.lineWidth = Math.max(0.9, (2.6 + 1.8 * k) / v.scale);
        c.beginPath();
        c.arc(R * (0.55 + 0.5 * k), 0, R * 0.82, -Math.PI * 0.62, Math.PI * 0.62);
        c.stroke();
        c.restore();
        c.globalAlpha = 1;
      }
      if (motion && s.impact) {
        const q = squashed(s.impact.speed ?? 0, s.impact.nx, s.impact.ny, s.impactAge);
        if (q) {
          const nxA = Math.abs(Math.cos(q.axis)), nyA = Math.abs(Math.sin(q.axis));
          c.scale(
            1 + (q.across - 1) * nxA + (q.along - 1) * nyA,
            1 + (q.across - 1) * nyA + (q.along - 1) * nxA
          );
        }
      }
      if (nearest && (s.phase === "ready" || s.opening?.rest)) {
        const toward = (nearest.x - p.x) * Math.cos(p.angle) + (nearest.y - p.y) * Math.sin(p.angle);
        facing = Math.sign(toward) || facing;
      }
      {
        // Ghost positions are sampled from the simulation. The speed tier only
        // controls how many measured samples remain legible; it never supplies
        // a heading or a synthetic offset.
        const speed = s.railSettle ? 0 : (Number.isFinite(s.moved) && s.moved > 0 ? s.moved : Math.hypot(world.player.velocity.x, world.player.velocity.y)), g = ghostFor(speed, MAX_SPEED);
        if (motion && !s.splat && g.count && s.slashAge >= DASH.windup && s.slashAge < DASH.windup + DASH.active + 6) {
          c.save();
          let n = 0;
          ghosts.each((gx, gy, ga, gf, age) => {
            if (n >= Math.min(3, g.count) || age > 0.1) return;
            n++;
            const k = 1 - (n - 1) / (g.count + 0.6);
            c.globalAlpha = g.alpha * k * Math.max(0, 1 - age / 0.1);
            c.save();
            c.translate(gx - p.x, gy - p.y);
            // The hero is screen-axis aligned; after-images are the same flat
            // silhouette, not rotated copies of a velocity vector.
            cube(c, 0, 0, R * (0.86 + 0.14 * k), 0, 0, gf);
            c.restore();
          });
          c.globalAlpha = 1;
          c.restore();
        }
      }
      {
        const speed = s.railSettle ? 0 : (Number.isFinite(s.moved) && s.moved > 0 ? s.moved : Math.hypot(world.player.velocity.x, world.player.velocity.y)), m = morphWedge(c, speed, MAX_SPEED, Math.max(s.hyper ? s.hyperLevel : 0, poseAnim.sonic));
        if (!dash && motion && m) {
          const a = Math.atan2(world.player.velocity.y, world.player.velocity.x);
          c.save();
          c.rotate(a - bodyAngle);
          c.globalAlpha = m.alpha;
          c.fillStyle = INK.acid;
          c.beginPath();
          c.moveTo(-R * 0.4, -m.width * 0.5);
          c.lineTo(-m.length, 0);
          c.lineTo(-R * 0.4, m.width * 0.5);
          c.closePath();
          c.fill();
          c.globalAlpha = 1;
          c.restore();
        }
      }
      if (motion && !world.grounded && !dash) {
        const vx = world.player.velocity.x, vy = world.player.velocity.y, speed = Math.hypot(vx, vy), smear = stretchFor(speed, MAX_SPEED, s.hyper ? HYPER_SPEED : MAX_SPEED).blur;
        if (smear > 1) {
          const along = Math.atan2(vy, vx), steps = smear > 12 ? 3 : 2;
          c.save();
          c.rotate(along - bodyAngle);
          for (let i = steps; i >= 1; i--) {
            const u = i / (steps + 1);
            c.globalAlpha = 0.3 * (1 - u * 0.6);
            c.translate(-1, 0);
            c.save();
            c.translate(-smear * u, 0);
            c.scale(1, 1 - 0.1 * u);
            cube(c, 0, 0, R, 0, 0, facing);
            c.restore();
            c.globalAlpha = 1;
            c.translate(1, 0);
          }
          c.restore();
        }
      }
      if (poseAnim.sonic > 0.02) {
        const k = poseAnim.sonic;
        c.save();
        c.rotate(poseAnim.heading - bodyAngle);
        c.scale(1 + 0.3 * k, 1 - 0.16 * k);
        c.rotate(-(poseAnim.heading - bodyAngle));
      }
      const speedNow = Math.hypot(world.player.velocity.x, world.player.velocity.y);
      const grip = 0.5 + 0.45 * Math.min(1, speedNow / MAX_SPEED);
      const field = jelly2.field(
        grip,
        // `lean` is the cell-animation lead: the leading corner dips. Positive
        // lean means moving toward +x, so the corner at -x lags. Under a dash
        // the dash's own stretch dominates, so the dip is damped out.
        -poseAnim.lean * 1.6 * (dash ? 0.35 : 1),
        // The fall leans the body back, so the dip runs the other way.
        poseAnim.fall ? -poseAnim.fall.lean * 1.2 : 0
      );
      const blinkPhase = Math.sin(time * 0.021) + Math.sin(time * 0.0137);
      const blink = blinkPhase > 1.72 ? Math.max(0.05, 1 - (blinkPhase - 1.72) * 7) : 1;
      const atRest = !poseAnim.move.moving && !poseAnim.fall;
      const breathe = atRest ? Math.sin(time * 0.045) : 0;
      let look = null;
      if (dash) look = [dash.core.x, dash.core.y];
      if (splat) look = [splat.core.x, splat.core.y];
      else if (!dash && nearest) {
        const dx = nearest.x - p.x, dy = nearest.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d < 900) {
          const ca = Math.cos(-p.angle), sa = Math.sin(-p.angle);
          look = [
            Math.max(-1, Math.min(1, (dx * ca - dy * sa) / d)),
            Math.max(-1, Math.min(1, (dx * sa + dy * ca) / d))
          ];
        }
      }
      // The elemental wake is the single launch-direction punctuation. The
      // position sampler below is the only remaining after-image source; it
      // records where the cube actually was instead of inventing a second
      // velocity-shaped trail.
      const boundedBody = bodyBase && Number.isFinite(bodyBase.a) && !splat;
      if (boundedBody) {
        c.setTransform(bodyBase.a, bodyBase.b, bodyBase.c, bodyBase.d, bodyBase.e, bodyBase.f);
        const age = animationAge(s.slashAge);
        const settle = age >= 7 ? Math.max(0, 1 - (age - 7) / 5) : 1;
        const bx = dash ? 1 + (dash.sx - 1) * settle : 1;
        const by = dash ? 1 + (dash.sy - 1) * settle : 1;
        c.scale(clamp(bx, STRETCH_ACROSS, STRETCH_ALONG), clamp(by, STRETCH_ACROSS, STRETCH_ALONG));
      }
      {
        // ── CHUNK 3: THE F=m·a AURA ─────────────────────────────────────
        //
        // A SHATTERED arena pays its border tax back to the player: the
        // kinetic stage rides on the cube as a ring of banked force —
        // ×2 cyan, ×3 magenta, ×4 OVERCHARGED white-hot with orbiting
        // flecks and the formula etched beneath it.
        const kin = s.arenaMode === 'SHATTERED' ? Math.min(4, Math.max(1, s.kineticStage | 0)) : 0;
        if (kin > 1) {
          const col = kin >= 4 ? '#ffffff' : kin === 3 ? '#ff5db1' : '#9bf6ff';
          const breathe = motion ? 0.68 + 0.32 * Math.sin(time * 0.13 + 1.7) : 1;
          c.globalAlpha = 0.34 + 0.15 * kin * breathe;
          c.strokeStyle = col;
          c.lineWidth = Math.max(0.8, (1.4 + 1.15 * kin) / v.scale);
          c.beginPath(); c.arc(0, 0, R * (1.3 + 0.14 * kin), 0, Math.PI * 2); c.stroke();
          c.globalAlpha = 0.16 + 0.1 * kin * breathe;
          c.beginPath(); c.arc(0, 0, R * (1.65 + 0.18 * kin), 0, Math.PI * 2); c.stroke();
          if (kin >= 3) {
            // The formula, etched small beneath the cube.
            c.globalAlpha = 0.62 * breathe;
            c.fillStyle = col;
            c.font = `600 ${Math.max(7, Math.round(9 / v.scale))}px ui-monospace, Menlo, monospace`;
            c.textAlign = 'center';
            c.fillText('F=m·a', 0, R * 1.98);
          }
          if (kin >= 4) {
            // Orbiting flecks: overcharged matter thrown off the sphere.
            for (let i = 0; i < 6; i++) {
              const a = (hash(977, i, 91) % 360) * Math.PI / 180 + (motion ? time * 0.075 : 0);
              const rr = R * 1.02;
              c.globalAlpha = 0.55 + 0.35 * breathe;
              c.fillStyle = i % 2 ? '#ffffff' : '#ffe6a8';
              c.beginPath(); c.arc(Math.cos(a) * rr, Math.sin(a) * rr, Math.max(0.7, 1.9 / v.scale), 0, Math.PI * 2); c.fill();
            }
          }
          c.globalAlpha = 1;
        }
      }
      cube(c, 0, 0, R, p.angle, motion ? time : 0, facing, {
        // The two expression channels the pose system computes. `lift` is the
        // falling scarf plus a little air-speed, so the character reads as
        // being pushed by the world it is moving through.
        equipment: s.equipment,
        aiming: s.held,
        attackProgress:motion&&s.blade>0?1-Math.min(1,s.blade/12):-1,
        reducedMotion:!motion,
        contact:motion&&!!s.impact&&s.impactAge<3,
        combo: s.chain,
        speed: Math.hypot(world.player.velocity.x, world.player.velocity.y),
        overdrive: s.drive > 0,
        eyes: poseAnim.eyes,
        lift: (poseAnim.fall?.scarfLift ?? 0) + Math.min(0.5, poseAnim.move.speed / MAX_SPEED) * 0.5,
        blink: motion ? blink : 1,
        breathe: motion && !boundedBody ? breathe : 0,
        look,
        field: boundedBody ? null : field
      });
      if (poseAnim.sonic > 0.02) c.restore();
      c.restore();
      const fallRow = (() => {
        // The committed dash wake owns the motion read. A live downward
        // velocity during that event must not resurrect airborne fall cels.
        if (!motion || dash) return null;
        const vy = Math.round(Math.max(0, world.player.velocity.y));
        if (vy > FALL_SAMPLES) return null;
        const o = vy * FALL_ROW.width;
        if (FALL_TABLE[o + FALL_ROW.k] < 0) return null;
        return {
          trail: FALL_TABLE[o + FALL_ROW.trail],
          cels: FALL_TABLE[o + FALL_ROW.cels],
          rush: FALL_TABLE[o + FALL_ROW.rush]
        };
      })();
      if (fallRow && fallRow.trail > 0.05) {
        const k = fallRow.trail, cels = fallRow.cels, rush = fallRow.rush;
        c.save();
        c.translate(p.x, p.y);
        for (let cel = cels - 1; cel >= 0; cel--) {
          const fade2 = 1 - cel / Math.max(1, cels), lift = cel * R * 1.5 * (0.5 + rush), scale = 1 - cel * 0.17;
          for (let i = 0; i < 3; i++) {
            const len = R * (1.6 + 2.4 * k) * (1 - i * 0.22) * scale, spread = R * 0.9 * (i - 1) * scale;
            c.globalAlpha = 0.16 * k * fade2 * (1 - i * 0.22);
            line(
              c,
              i === 1 ? INK.paper : INK.acid,
              Math.max(0.8, (2.4 - i * 0.6) / v.scale) * scale,
              spread,
              -R * 0.9 - lift,
              spread * 1.5,
              -R * 0.9 - lift - len
            );
          }
        }
        if (rush > 0.15) {
          c.globalAlpha = 0.5 * rush;
          c.strokeStyle = INK.paper;
          for (let i = 0; i < 5; i++) {
            const y = -R * (1.4 + i * 1.5) * (0.5 + rush), w2 = R * (0.9 + 0.5 * rush) * (1 - i * 0.14);
            line(c, INK.paper, Math.max(0.6, 1.2 / v.scale), -w2, y, w2, y);
          }
        }
        c.globalAlpha = 1;
        c.restore();
      }
      const upgradePhase=upgradeVisualPhase(s,motion),structural=['reach','cleaver','barrier'].includes(upgradePhase.buff?.id),visualBuff=structural?upgradePhase.buff:s.waveBuff;
      drawCombatAccent(c,{x:p.x,y:p.y,radius:R,angle:s.slashAngle||0,age:s.slashAge,blade:s.blade,buff:visualBuff?.id,shield:structural?upgradePhase.shield:s.waveShield,finish:structural?upgradePhase.amount:1,equipment:s.equipment,sword:s.sword,motion,reach:(s.reach||1)*(s.waveBuff?.reach||1),suppressWake:!!dash});
      if(s.waveBuff?.id==='guard')drawCutExit(c,{x:p.x,y:p.y,radius:R,remaining:s.cutGrace,source:combat.enemies.get(s.cutGraceFrom)||cutExitSource,sourceId:s.cutGraceFrom,equipment:s.equipment,sword:s.sword,motion});
      if(s.waveShield>0&&s.waveBuff?.id!=='barrier'){c.save();c.strokeStyle='#d5ef9e';c.lineWidth=1.8/v.scale;for(const side of [-1,1]){c.beginPath();c.arc(p.x,p.y,R*1.43,side<0?2.3:-.85,side<0?4.0:.85);c.stroke();}c.restore();}
      if(s.sword){
        const swordReach=(s.reach||1)*s.sword.reach*(s.waveBuff?.reach||1);
        const swordAngle=s.held&&aim?Math.atan2(aim.y,aim.x):s.slashAngle;
        drawSwordWeapon(c,{x:p.x,y:p.y,radius:R,angle:swordAngle,active:s.blade>0,aiming:s.held,sword:s.sword,reach:swordReach,charge:s.swordCharge,motion,time,buff:visualBuff,equipment:s.equipment,bladeRemaining:s.blade,finish:structural?upgradePhase.amount:1,age:s.slashAge,reveal:structural?1:s.waveBuff?Math.min(1,(s.wave?.age||0)/18):1});
        for(const attack of s.swordFx||[])drawSwordAttack(c,attack,s.sword,!motion);
      }
      if (s.equipment?.head === "oni" && s.hp === 1 && s.blade > 0) drawEquipmentSlash(c, p.x, p.y, p.x + Math.cos(s.slashAngle) * 80, p.y + Math.sin(s.slashAngle) * 80, "blood", 1,{progress:1-Math.min(1,s.blade/12),equipment:s.equipment,reducedMotion:!motion});
      drawEquipmentEffects(c, motion ? s.equipmentFx : { ...s.equipmentFx, bursts: [] }, motion ? time : 0, ARENA.y + ARENA.h);
      if (s.equipment?.head === "beacon") {
        for (const enemy of combat.enemies.values()) if (enemy.kind === "fang" && enemy.mode === "tell") {
          const ex = clamp(enemy.x, v.x + 35, v.x + v.w - 35), ey = clamp(enemy.y, v.y + 50, v.y + v.h - 45);
          c.save();
          c.strokeStyle = "#ffb963";
          c.lineWidth = 2 / v.scale;
          c.strokeRect(ex - 12, ey - 12, 24, 24);
          c.restore();
        }
      }
      if (s.equipmentScar?.ticks > 0) {
        const q = s.equipmentScar;
        drawEquipmentSlash(c, q.x, q.y, q.tx, q.ty, "laser", q.ticks / 30);
      }
      if (s.equipment?.head === "neko" && s.edgeReturn > 0 && motion) {
        for (let i = 0; i < 5; i++) disk(c, corePalette(s.equipment.core).primary, p.x - 20 - i * 8, p.y + 15 + Math.sin(time * 0.2 + i) * 12, 2);
      }
      if (s.equipment?.slash && s.equipment.slash !== "razor" && s.blade > 0) drawEquipmentSlash(c, p.x - Math.cos(s.slashAngle) * 45, p.y - Math.sin(s.slashAngle) * 45, p.x + Math.cos(s.slashAngle) * 80, p.y + Math.sin(s.slashAngle) * 80, s.equipment.slash, Math.min(1, s.blade / 12),{progress:1-Math.min(1,s.blade/12),time,equipment:s.equipment,reducedMotion:!motion});
      if (!s.sword && motion && s.slashAge >= 0) slashArc(c, p.x, p.y, R, animationAge(s.slashAge), s.slashAngle, 1 / v.scale,s.equipment);
      if (s.held || aim?.power) {
        const val = s.held ? s.focus : aim.power;
        arc(
          c,
          INK.acid,
          2.4 / v.scale,
          p.x,
          p.y,
          R + 12,
          -Math.PI * 0.94,
          -Math.PI * 0.94 + Math.PI * 0.88 * val
        );
      }
    }
    const landAnim = motion ? landFor(s.landAge) : null;
    if (world.grounded && landAnim && landAnim.shock > 0.02) {
      const L2 = landAnim, sh = L2.shock, fy = p.y + R * 0.9;
      c.save();
      const rw = R * (0.9 + 3.4 * (1 - L2.settle)), rh = rw * 0.26;
      c.globalAlpha = 0.5 * sh;
      c.strokeStyle = INK.paper;
      c.lineWidth = Math.max(0.8, (3.2 * sh + 0.6) / v.scale);
      c.beginPath();
      c.ellipse(p.x, fy, rw, rh, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.34 * sh;
      c.strokeStyle = INK.acid;
      c.lineWidth = Math.max(0.6, 1.4 / v.scale);
      c.beginPath();
      c.ellipse(p.x, fy, rw * 0.62, rh * 0.62, 0, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 4; i++) {
        const t = (i + 0.5) / 4, dir = i < 2 ? -1 : 1, out = R * (1.1 + 3.6 * (1 - L2.settle) * (0.5 + t)), up = -R * 0.12 * (1 - t) * sh;
        c.globalAlpha = 0.42 * sh * (1 - t * 0.6);
        line(
          c,
          INK.quiet,
          Math.max(0.7, (1.8 - t) / v.scale),
          p.x + dir * R * 0.5,
          fy - up,
          p.x + dir * out,
          fy - up * 2.4
        );
      }
      if (sh > 0.35) {
        c.globalAlpha = 0.6 * sh;
        for (let i = -1; i <= 1; i += 2) {
          line(
            c,
            INK.paper,
            Math.max(0.7, 1.6 / v.scale),
            p.x + i * R * 0.34,
            fy,
            p.x + i * R * 0.5,
            fy + R * 0.5 * sh
          );
        }
      }
      c.globalAlpha = 1;
      c.restore();
    }
    // Attack-specific hit marks stay on top of the cube and enemy silhouettes.
    for(const impact of contactBursts)if(impact.attack){
      const age=(impact.type==='break'?27:18)-impact.life;
      drawEnemyAttackImpact(c,{...impact,age,motion,scale:v.scale});
    }
    c.restore();
    if(s.visualTutorial?.guide?.kind==='dodge')drawTutorialGuidance(c,v,s.visualTutorial,p,motion,device);
    {
      const ux = s.visualTutorial ? 1 : 1 / v.scale, sp = toScreen(v, p);
      if (!s.opening?.free && (s.phase !== "ready" || s.visualTutorial))
        for (let i = 0; i < 3; i++) {
          const x = sp.x + (i - 1) * 9 * ux, y = s.visualTutorial ? sp.y + R * Math.SQRT2 * v.scale + 8 : sp.y + (R * Math.SQRT2 + 9) * ux;
          c.fillStyle = INK.black;
          c.fillRect(x - 4.6 * ux, y - ux, 9.2 * ux, 6 * ux);
          c.fillStyle = i < s.edge ? INK.acid : "#766978";
          c.fillRect(x - 3.5 * ux, y, 7 * ux, 3.6 * ux);
          if (i === s.edge) {
            c.fillStyle = INK.paper;
            c.fillRect(x - 3.5 * ux, y, 7 * ux * Math.min(1, (s.recharge || 0) / (s.regenWindow || 60)), 3.6 * ux);
          }
        }
    }
    if (!s.visualTutorial && (s.phase === "playing" || s.caught) && !s.opening?.finishing) pointer(c, v, p, nearest);
    if (s.warning > 0 && s.phase === "playing") {
      c.save();
      const base = h - 20, k = clamp(s.warning, 0, 1), gap = 46 - 30 * k, len = 5 + 9 * k;
      c.globalAlpha = 0.22 + 0.5 * k;
      line(c, "#6f8fa3", 1, 0, base, w, base);
      for (let x = 8; x < w; x += gap) line(c, "#6f8fa3", 1, x, base, x, base - len);
      if (k > 0.55) {
        c.globalAlpha = 0.35 + 0.5 * ((k - 0.55) / 0.45);
        line(c, INK.acid, 2, 0, base, w, base);
      }
      c.restore();
    }
    if (s.panic && s.panicTicks > 0 && s.phase === "playing") {
      c.save();
      c.translate(-v.x * v.scale, -v.y * v.scale);
      c.scale(v.scale, v.scale);
      const burn = clamp(s.panicTicks / ARC.slowTicks, 0, 1), pulse = 0.72 + 0.28 * Math.abs(Math.sin(s.panicTicks * 0.42)), dx = s.panic.x - p.x, dy = s.panic.y - p.y, far = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), near = R * Math.SQRT2 + 20, span = Math.min(58 + 26 * (1 - burn), far - near);
      if (span > 6) {
        c.save();
        c.translate(p.x + Math.cos(ang) * near, p.y + Math.sin(ang) * near);
        c.rotate(ang);
        c.globalAlpha = (0.5 + 0.45 * burn) * pulse;
        const wide = 8 + 5 * burn, tip = Math.max(0, span);
        poly2(c, INK.cool, [
          [0, -wide],
          [tip * 0.72, -wide * 0.56],
          [tip, 0],
          [tip * 0.72, wide * 0.56],
          [0, wide]
        ]);
        c.globalAlpha = 0.55 + 0.45 * burn;
        for (let i = 0; i < 2; i++) {
          const at = tip * (0.42 + 0.3 * i), w2 = wide * (0.34 - 0.08 * i);
          poly2(c, INK.paper, [
            [at - w2, -w2 * 1.5],
            [at + w2, 0],
            [at - w2, w2 * 1.5],
            [at - w2 * 0.35, 0]
          ]);
        }
        c.restore();
      }
      c.save();
      c.globalAlpha = 0.32 + 0.5 * burn;
      arc(c, INK.paper, 2.2 / v.scale, p.x, p.y, R + 10 + 30 * (1 - burn));
      c.globalAlpha = 0.6 + 0.4 * burn;
      arc(c, INK.cool, 1.6 / v.scale, p.x, p.y, R + 6 + 52 * (1 - burn) ** 1.6);
      c.restore();
      c.restore();
    }
    if(!s.opening&&!s.visualTutorial){c.save();c.setTransform(viewport.width/w,0,0,viewport.height/h,0,0);for(const item of enemyThreatIndicators(v,combat)){const q=overlayPoint(v.width,v.height,item,{radius:16,top:hudTop(),gutter:hudGutter()});c.save();c.translate(q.x,q.y);c.rotate(item.angle);c.fillStyle="#ffb7a7";c.beginPath();c.moveTo(10,0);c.lineTo(-7,-6);c.lineTo(-7,6);c.closePath();c.fill();c.restore();}drawPlayerDamageReceipt(c,v,p,s);c.restore();}
    if (scene && !s.visualTutorial) drawStory(c, { v, p, e: nearest && { ...pose(nearest, alpha), r: nearest.r }, shot: run.suggestion(), scene, device, age: sceneTicks + alpha, motion, aim: !!aim?.power });
    if(s.visualTutorial?.stage===4 && s.visualTutorial.finishDelay>0){
      const age=42-s.visualTutorial.finishDelay, fade=Math.max(0,1-age/32);
      c.save();c.setTransform(viewport.width/w,0,0,viewport.height/h,0,0);
      c.globalAlpha=motion?fade*.9:Math.min(.5,fade*.7);c.strokeStyle='#fff';c.lineCap='round';c.lineWidth=Math.max(4,Math.min(w,h)*(motion?.045:.018));
      c.beginPath();c.moveTo(-w*.08,h*.88);c.lineTo(w*1.08,h*.1);c.stroke();c.restore();
    }
    if (stain > 0) {
      c.save();
      c.globalAlpha = stain * 0.7;
      c.strokeStyle = INK.rose;
      c.lineWidth = 10;
      c.strokeRect(0, 0, w, h);
      c.restore();
    }
    const landingPointer=s.wave?.phase==='return'&&s.wave.platform?{x:s.wave.platform.x+s.wave.platform.w/2,y:s.wave.platform.y}:null;
    if (s.questPortal||s.wave?.breach||landingPointer) {
      const q = s.questPortal||s.wave?.breach||landingPointer, sx = (q.x - v.x) * v.scale, sy = (q.y - v.y) * v.scale;
      if (sx < 30 || sy < 30 || sx > w - 30 || sy > h - 30) {
        const dx = sx - w / 2, dy = sy - h / 2, k = Math.min((w / 2 - 36) / Math.max(1, Math.abs(dx)), (h / 2 - 90) / Math.max(1, Math.abs(dy)));
        c.save();
        c.setTransform(viewport.width / w, 0, 0, viewport.height / h, 0, 0);
        const safe = overlayPoint(w, h, { x: w / 2 + dx * k, y: h / 2 + dy * k }, { top: hudTop(), gutter: hudGutter() });
        c.translate(safe.x, safe.y);
        c.rotate(Math.atan2(sy - safe.y, sx - safe.x));
        c.fillStyle = "#ffd773";
        c.beginPath();
        c.moveTo(17, 0);
        c.lineTo(-9, -10);
        c.lineTo(-4, 0);
        c.lineTo(-9, 10);
        c.closePath();
        c.fill();
        c.restore();
      }
    }
    if (s.phase === "dying" && s.fatal) {
      c.save();c.setTransform(viewport.width / w,0,0,viewport.height / h,0,0);
      const darkness=Math.min(.28,(27-s.death)/90);c.fillStyle=`rgba(16,11,20,${Math.max(0,darkness)})`;c.fillRect(0,0,w,h);c.restore();
    }
    if (!s.opening && !s.teachingArena) {
      c.save();
      minimap(c, world, combat, v, s, motion);
      c.restore();
    }
    // CHUNK 6A: the diegetic spine under the DOM HUD, and the cutscene
    // overlay above everything (the chips themselves are DOM).
    c.save();
    c.setTransform(viewport.width / w, 0, 0, viewport.height / h, 0, 0);
    drawSpine(c, w, h, s, motion, time);
    drawCutsceneOverlay(c, w, h, s, v, p, time, motion);
    c.restore();
  }
  return {
    reset,
    resize,
    get scene() {
      return scene;
    },
    onViewport,
    questView: () => ({ ...lastView }),
    viewSnapshot: () => ({ ...camera.view(1), hudTop: hudTop(), hudGutter: hudGutter() }),
    // OFF / LOW / FULL. Pulled from options rather than passed every frame so
    // a mid-run change takes effect on the very next frame.
    setTrainingScale(value) {camera.setTrainingScale(value);lastView=camera.view(1);},
    // CHUNK 1: arena modes pull the lens back a touch so the 1.3x table reads.
    setFieldScale(value) {camera.setFieldScale(value);lastView=camera.view(1);},
    setShakeLevel(level) {
      shakeLevel = level === "off" || level === "low" ? level : "full";
    },
    // Read-only hooks for the headless camera checks.
    effectState() {
      return { ghosts: ghosts.size, trail: trail.length, beams: beams.length };
    },
    mapFade() {
      return mapOpacity;
    },
    shakeState() {
      return {
        px: shake.px,
        trauma: shake.trauma,
        rollDeg: shake.rollDeg,
        level: shakeLevel,
        effPx: shake.px * (shakeLevel === "off" ? 0 : shakeLevel === "low" ? 0.34 : 1)
      };
    },
    field(origin, side) {
      camera.reset(origin, side);
      lastView = camera.view(1);
      trail.length = 0;
      pops.length = beams.length = imprints.length = shards.length = sparks.length = 0;
      ghosts.clear();
      ghostClock = 0;
    },
    event,
    tick,
    draw,
    title(t) {
      transform();
      back.title(w, h, t);
    },
    worldPoint(x, y) {
      const v = lastView;
      return { x: v.x + x / v.scale, y: v.y + y / v.scale };
    },
    get revision() {
      return revision;
    },
    get animationState() {
      return anim;
    },
    dispose() {
    }
  };
}

// consolidated/catalog.js
var catalog_exports = {};
__export(catalog_exports, {
  ITEMS: () => ITEMS,
  SLOTS: () => SLOTS
});
var SLOTS = Object.freeze(["head", "eyes", "body", "core", "tail", "slash", "dash", "pointer", "radar", "trajectory", "world"]);
var item = (id, slot, name, price, tag, detail) => Object.freeze({ id, slot, name, price, tag, detail });
var ITEMS = Object.freeze([
  item("none", "head", "Bare Head", 0, "Original Cut", "No headgear. Clean silhouette."),
  item("halo", "head", "Gold Halo", 250, "Focus Float", "While holding aim and falling, gravity is 15% lighter."),
  item("neko", "head", "Cyber Ears", 200, "Neon Paws", "Pink ears perk on launch. Cosmetic wall sparks."),
  item("viper", "head", "Viper Horns", 300, "Fast Narrow", "20% faster launch, 15% thinner cut. Blade lifetime scales down to preserve straight-line active reach; ballistic landing distance can change."),
  item("oni", "head", "Broken Oni", null, "Last Health", "Defeat a Crown at 1 HEALTH to unlock. Kills at 1 HEALTH earn 50% more score."),
  item("ninja", "eyes", "Ninja Slits", 0, "Sharp Focus", "Classic expressive eyes."),
  item("visor", "eyes", "Cyber Visor", 200, "Scan Line", "Sweeping cyan visor. Appearance only."),
  item("blaze", "eyes", "SSJ Blaze", 150, "Golden Gaze", "Gold-white eyes with small light streaks while aiming. Appearance only."),
  item("paper", "body", "Paper Ninja", 0, "Comic Paper", "White paper shell with a bold black edge."),
  item("obsidian", "body", "Obsidian Stealth", 200, "Lime Edge", "Matte black shell, inset neon-lime seams."),
  item("hologram", "body", "Hologram Wire", 500, "Visible Core", "Transparent cyan wire shell with a visible spinning core. Appearance only."),
  item("standard", "core", "Standard Heart", 0, "Balanced Build", "Balanced movement. Three EDGE bars."),
  item("time", "core", "Time Crystal", 400, "Focus Recovery", "Kills start a 120-tick window of twice-normal passive FOCUS recovery."),
  item("riot", "core", "Riot Reactor", 500, "Quick Overdrive", "Overdrive activates every four consecutive kills instead of six (1.5x faster). Maximum two EDGE bars."),
  item("glass", "core", "Glass Cannon", null, "Double Score", "Challenge: reach SECTOR 05. Double score; maximum 1 HEALTH, including Crown repairs."),
  item("ribbon", "tail", "Ninja Ribbon", 0, "Folded Cloth", "Yellow-green ribbon that follows your movement."),
  item("wings", "tail", "Prism Wings", 400, "Wall Recharge", "First side-wall contact per airborne streak restores one EDGE. Floor contact resets it."),
  item("ghost", "tail", "Ghost Scarf", 350, "Lingering Blade", "Twin spectral ribbons. Adds six simulation ticks to each launch blade; never repeats a hit on the same enemy in one shot."),
  item("razor", "slash", "White Razor", 0, "Clean Cut", "White cut flash and shard impact."),
  item("katana", "slash", "Katana Ink", 150, "Brush Stroke", "Layered black-and-white brush cut with ink droplets."),
  item("laser", "slash", "Neon Laser", 250, "Electric Scar", "Cyan-pink cut scar lingers for half a second with a quiet electric accent. Cosmetic only."),
  item("twilight", "world", "Twilight Undercut", 0, "Plum Skyline", "Original twilight arena."),
  item("tokyo", "world", "Cyber Tokyo", 450, "Neon Rain", "Electric-blue skyline and diagonal neon rain. Danger colors stay unchanged."),
  item("foundry", "world", "Blood Foundry", 300, "Crimson Industry", "Crimson sky, orange furnace pipes and a deeper procedural bass voice. Danger colors stay unchanged."),
  item("crown", "head", "Cube Crown", 600, "Armor Break", "Removes two Crown/Bastion plates per hit. Launch speed is 8% lower; no effect on Hyper steering."),
  item("samurai", "head", "Samurai Crest", 350, "Wide Horizontal", "Within 25 degrees of horizontal, cuts are 20% wider."),
  item("coil", "head", "Lightning Coil", 400, "Chain Spark", "A direct slice zaps one enemy within 160 pixels for one plate. Sparks cannot trigger more sparks."),
  item("beacon", "head", "Danger Beacon", 250, "Early Warning", "Shows an amber threat bracket when a Fang begins winding up, before its charge."),
  item("glitch", "eyes", "Glitch X-Eyes", 250, "Signal Error", "Mismatched X and ring eyes with stepped cyan/pink color changes. No full-screen flashes."),
  item("smug", "eyes", "Smug Half-Lid", 150, "Cool Stare", "Half-lidded eyes open gold in Overdrive."),
  item("hypno", "eyes", "Hypno Spiral", 300, "Rift Gaze", "Twin animated purple spirals."),
  item("sniper", "eyes", "Sniper Dot", 250, "Single Sight", "One crimson sight inside a black band."),
  item("prism", "body", "Prism Shell", 550, "Wall Needles", "Faceted crystal. Side-wall contact launches two upward needles; each removes one Fang plate. 45-tick cooldown."),
  item("iron", "body", "Bastion Iron", 450, "Rush Guard", "Blocks one Fang rush per run and pushes you clear. Arena walls already do no health damage."),
  item("lava", "body", "Lava Cracked", 350, "Combo Heat", "Charcoal shell with magma seams that brighten as the chain grows."),
  item("gold", "body", "Gold Foil", 800, "Mirror Finish", "Polished gold facets and a white star glint while nearly still."),
  item("grav", "core", "Grav Core", 450, "Aim Pull", "While aiming, pulls small Fangs within 220 pixels gently toward the aim line. Maximum 0.35 pixels per simulation tick."),
  item("magnet", "core", "Magnet Dynamo", 350, "Close Throughcut", "Close passes within 100 pixels have a 20% wider blade, helping real two-contact Throughcuts. Quest rules unchanged."),
  item("echo", "core", "Echo Heart", 550, "Ghost Blade", "Every third direct chain kill leaves a stationary ghost blade for 30 simulation ticks, slicing nearby Fangs once each."),
  item("viper-tails", "tail", "Viper Tails", 250, "Forked Ribbons", "Twin crimson streamers with ember stitches."),
  item("anchor", "tail", "Anchor Chain", 400, "Floor Breaker", "Floor rebound is 15% stronger and clears Fangs within 170 pixels. Floor recovery cooldown still applies."),
  item("thrusters", "tail", "Mini Thrusters", 450, "Jet Rebound", "Twin jet nozzles. Earned rail rebounds are 8% stronger; cannot compound above the existing speed ceiling."),
  item("spectrum", "tail", "Neon Spectrum", 600, "Speed Colors", "Rainbow ribbon shifts faster at higher movement speed."),
  item("glitch-fx", "slash", "Glitch Tear", 400, "RGB Fracture", "Offset stepped red/cyan scar with a crunchy hit accent."),
  item("confetti", "slash", "Gold Confetti", 650, "Victory Shards", "Gold foil fragments fan out on impacts, with a soft bright chime."),
  item("comic", "slash", "Comic Impact", 300, "Manga Burst", "Black/yellow starburst at each impact."),
  item("pixel", "slash", "Pixel Shatter", 350, "Arcade Debris", "Square debris falls with gravity for 30 simulation ticks; never collides or deals damage."),
  item("manga", "world", "Manga Paper", 700, "Printed World", "Warm paper, crosshatched skyline and black comic marks. Danger lasers keep their color."),
  item("synth", "world", "Synthwave Grid", 550, "Neon Horizon", "Striped sunset, perspective grid, violet mountain silhouettes and a higher synth voice."),
  item("chamfer","body","Chamfer Frame",280,"Cut Corners","Eight beveled corners and CORE-linked edge caps. Cosmetic profile only; hitbox and movement unchanged."),
  item("notched","body","Notched Frame",320,"Vented Shape","Inward-cut side vents repeat your CORE chevron. Cosmetic only; no collision or combat changes."),
  item("segmented","body","Segmented Frame",380,"Linked Plates","Layered side plates share CORE conduits and world rim light. Cosmetic only; no extra armor."),
  item("dash-auto", "dash", "Adaptive Dash", 0, "Build Resonance", "Dash trails follow your equipment and sword. Cosmetic only."),
  item("dash-ink", "dash", "Ink Dash", 150, "Brush Wake", "A sharp ink-brush wake. Cosmetic only; movement is unchanged."),
  item("dash-fire", "dash", "Ember Dash", 250, "Flame Wake", "Layered flame ribbons trail your launch. Cosmetic only."),
  item("dash-lightning", "dash", "Volt Dash", 300, "Electric Wake", "Angular electric streaks follow your launch. Cosmetic only."),
  item("dash-ice", "dash", "Frost Dash", 300, "Crystal Wake", "Crystalline shards mark your launch. Cosmetic only."),
  item("dash-water", "dash", "Tide Dash", 250, "Flowing Wake", "Sweeping water ribbons follow your launch. Cosmetic only."),
  item("dash-void", "dash", "Void Dash", 350, "Orbital Wake", "Broken orbital rings trail your launch. Cosmetic only."),
  item("dash-echo", "dash", "Echo Dash", 350, "Afterimage Wake", "Geometric afterimages trace your launch. Cosmetic only."),
  item("pointer-reticle", "pointer", "Field Reticle", 0, "Clean Aim", "A segmented reticle marks the point where you press. Cosmetic only."),
  item("pointer-diamond", "pointer", "Prism Pointer", 200, "Cut Crystal", "A faceted diamond marks your drag origin. Cosmetic only."),
  item("pointer-orbit", "pointer", "Orbit Pointer", 250, "Twin Orbits", "Broken orbital arcs frame your drag origin. Cosmetic only."),
  item("pointer-cross", "pointer", "Crosshair Pointer", 200, "Precision Mark", "Four precision brackets mark your drag origin. Cosmetic only."),
  item("radar-base", "radar", "Field Radar", 0, "Local Scan", "The standard local radar tracks nearby enemies and objectives."),
  item("radar-1", "radar", "Long-Range Array", 1200, "Range +35%", "See 35% farther on the radar. Existing enemy and objective markers remain visible."),
  item("radar-2", "radar", "Threat Array", 3000, "Range +70%", "See 70% farther and mark nearby active projectiles and danger zones."),
  item("radar-3", "radar", "Oracle Array", 6500, "Range +120%", "See 120% farther, active hazards and live enemy wind-ups, plus your current heading."),
  item("trajectory-base", "trajectory", "Field Trajectory", 0, "Launch Preview", "A short calculated launch path appears while aiming. Stops at the first solid surface."),
  item("trajectory-1", "trajectory", "Vector Lens", 1200, "Extended Path", "Shows more of the calculated launch path while aiming."),
  item("trajectory-2", "trajectory", "Impact Lens", 3000, "Impact Markers", "A longer path adds time ticks and a first-impact marker for the current field snapshot."),
  item("trajectory-3", "trajectory", "Oracle Lens", 6500, "Flight Analysis", "Shows the longest visible path, impact marker and live speed, angle and estimated time. Enemies can move; it does not predict bounces."),
  item("void", "world", "Pro Void", 1e3, "Clean Space", "Pitch-black background, restrained white boundary detail and sparse audio. Danger colors remain visible.")
]);

// consolidated/vault-art.js
var vault_art_exports = {};
__export(vault_art_exports, {
  drawForcePreview: () => drawForcePreview,
  drawVaultScene: () => drawVaultScene
});
function drawVaultScene(c, w, h, { time: now = 0, age = 0, ticket = {} } = {}) {
  c.fillStyle = "#100e14";
  c.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.26, py = h * 0.6;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, h * 0.65);
  g.addColorStop(0, "#6f4a2266");
  g.addColorStop(1, "#100e1400");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.save();
  c.translate(cx, cy);
  c.strokeStyle = "#ffd773";
  c.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    c.save();
    c.rotate(now * 18e-5 * (i % 2 ? -1 : 1) + i * 0.45);
    c.strokeRect(-38 - i * 9, -38 - i * 9, 76 + i * 18, 76 + i * 18);
    c.restore();
  }
  c.fillStyle = "#fff3bd";
  c.beginPath();
  c.ellipse(0, 0, 48, 17, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#201126";
  c.beginPath();
  c.arc(0, 0, 12, 0, Math.PI * 2);
  c.fill();
  c.restore();
  const beam = Math.min(1, age * 1.5);
  c.fillStyle = `rgba(255,216,116,${0.15 * beam})`;
  c.beginPath();
  c.moveTo(cx - 12, cy + 30);
  c.lineTo(cx + 12, cy + 30);
  c.lineTo(cx + 65, py + 30);
  c.lineTo(cx - 65, py + 30);
  c.fill();
  cube(c, cx, py + Math.sin(now * 2e-3) * 5, 24);
  drawQuestPart(
    c,
    ticket.prize,
    cx,
    py - Math.max(0, 1 - age) * h * 0.3,
    1,
    now * 2e-3
  );
  if (ticket.bonus) drawQuestPart(c, "chest", cx + 100, py, 0.8, now * 2e-3);
  for (let i = 0; i < 40; i++) {
    const t = (now * 4e-4 + i * 0.137) % 1, a = i * 2.4;
    c.fillStyle = "#ffd773";
    c.fillRect(cx + Math.cos(a) * t * 170, py + Math.sin(a) * t * 100, 3, 3);
  }
}
function drawForcePreview(c, id, time = 0) {
  c.clearRect(0, 0, 100, 85);
  cube(c, 50, 53, 15);
  drawQuestPart(c, id, 50, 53, 0.5, time * 2e-3);
}

// consolidated/engine-entry.js
function drawCubeHero(ctx, spec = {}) {
  const { x = 0, y = 0, radius = 23, angle = 0, time = 0, face = 1, equipment = {}, cursor = { x: 0, y: 0 }, motion = true, pose: pose2 = {} } = spec;
  ctx.save();
  try {
    cube(ctx, x, y, radius, angle, motion ? time : 0, face, { ...livingPose(time, cursor, motion), ...pose2, equipment, reducedMotion:!motion });
  } finally {
    ctx.restore();
  }
}
function drawShopCardArt(ctx, width, height, spec = {}) {
  ctx.save();
  try {
    drawLabCard(ctx, width, height, spec.equipment || {}, spec.slot || "body", spec.time || 0, !!(spec.hovered || spec.selected), spec.motion !== false,spec.sword||null);
    if (spec.locked) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "#110c1de8";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#80738c";
      ctx.font = "bold 50px sans-serif";
      ctx.fillText("?", width * 0.453125, height * 0.615789);
    }
  } finally {
    ctx.restore();
  }
}
function drawSlashEffect(ctx, spec = {}) {
  const { x = 0, y = 0, endX = 100, endY = -30, id = "razor", strength = 1 } = spec;
  ctx.save();
  try {
    drawEquipmentSlash(ctx, x, y, endX, endY, id, strength,{progress:spec.progress,time:spec.time,equipment:spec.equipment,reducedMotion:spec.reducedMotion,contact:spec.contact});
  } finally {
    ctx.restore();
  }
}
function drawEnemyShape(ctx, spec = {}) {
  const { kind = "fang", x = 0, y = 0, radius = 23, angle = 0, options = {} } = spec;
  ctx.save();
  try {
    foe(ctx, kind, x, y, radius, angle, options);
  } finally {
    ctx.restore();
  }
}

/**
 * A compact study card for THE WATCH. This belongs beside the rest of the art
 * API so callers never grow a second, slightly different enemy renderer in a
 * menu component. The card is a silhouette plus one live tell, not a tutorial
 * screenshot and not a second combat simulation.
 */
export function drawTrainingCard(ctx, width = 280, height = 150, {
  lessonId = 'fang', kind = 'fang', count = 1, time = 0, selected = false, motion = true,
} = {}) {
  const w = Math.max(1, Number(width) || 280), h = Math.max(1, Number(height) || 150);
  const t = motion ? (Number.isFinite(time) ? time : 0) * 0.0015 : 0;
  ctx.save();
  try {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#100e19'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2c2740'; ctx.lineWidth = 1;
    for (let x = 16; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 16; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = selected ? '#ddff89' : '#5b5068'; ctx.lineWidth = selected ? 2 : 1; ctx.strokeRect(.75, .75, w - 1.5, h - 1.5);
    const pulse = 1 + .06 * Math.sin(t * 4), cy = h * .48;
    ctx.globalAlpha = .18; ctx.fillStyle = selected ? '#ddff89' : '#b99bd8'; ctx.beginPath(); ctx.arc(w / 2, cy, 34 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    const foeCard = (enemyKind, x, y, radius, angle = 0) => drawEnemyShape(ctx, {
      kind: enemyKind, x, y, radius, angle,
      options: { mode: 'tell', clock: Math.floor(t * 60), span: 1, aim: angle, hp: enemyKind === 'monolith' ? 10 : 2 },
    });
    if (lessonId === 'slash') {
      foeCard('fang', w * .33, cy + 5, 18, -.22); foeCard('fang', w * .5, cy - 8, 21, 0); foeCard('fang', w * .67, cy + 5, 18, .22);
    } else if (lessonId === 'link' || count > 1) {
      ctx.strokeStyle = '#f3b1d4'; ctx.globalAlpha = .42; ctx.lineWidth = 3; ctx.setLineDash([6, 7]);
      ctx.beginPath(); ctx.moveTo(w * .34, cy); ctx.lineTo(w * .66, cy); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      foeCard(kind, w * .34, cy, 20, Math.sin(t) * .08); foeCard(kind, w * .66, cy, 20, -Math.sin(t) * .08);
    } else {
      const radius = lessonId === 'monolith' ? 34 : lessonId === 'crown' ? 27 : lessonId === 'bastion' ? 25 : 22;
      foeCard(kind, w / 2, cy, radius, lessonId === 'rift' ? t * .35 : Math.sin(t) * .06);
    }
    ctx.fillStyle = '#dfff70'; ctx.globalAlpha = .82; ctx.fillRect(w / 2 - 18, h * .82, 36, 2); ctx.globalAlpha = 1;
  } finally { ctx.restore(); }
}
function drawWorldBackdrop(ctx, width, height, worldId = "twilight", time = 0, camera = { x: 0, y: 0 }) {
  ctx.save();
  try {
    drawEquipmentWorld(ctx, width, height, worldId, time, camera);
  } finally {
    ctx.restore();
  }
}
function drawBestStrokeMini(ctx, width, height, strokeSpec) {
  ctx.save();
  try {
    return drawStrokePrint(ctx, width, height, strokeSpec);
  } finally {
    ctx.restore();
  }
}
function evaluatePreviewPose(mode = "slice", time = 0, pointerState = {}, spec = {}) {
  const auto = choreography(spec.motion === false ? 18 : time, mode);
  let state = pointerState.state ? structuredClone(pointerState.state) : null;
  if (pointerState.command || pointerState.step) {
    const toy = createLabScene();
    if (state) Object.assign(toy.state, state);
    const cmd = pointerState.command;
    if (cmd) {
      if (cmd.type === "aim") toy.aim(cmd.x, cmd.y);
      else if (cmd.type === "fire") toy.fire(cmd.x, cmd.y);
      else if (cmd.type === "adopt") toy.adoptPose(cmd);
      else if (cmd.type === "reset") toy.reset();
    }
    for (let i = 0; i < Math.max(0, Math.min(600, Math.floor(pointerState.step || 0))); i++) toy.tick();
    state = structuredClone(toy.state);
  }
  const manual = state && (state.manual > 0 || !!state.drag);
  return { pose: manual ? { ...auto, x: state.x, y: state.y, split: !state.dummy.alive, cut: state.freeze > 0, crouch: 0 } : auto, target: state ? { ...state.dummy } : { x: 472, y: 181, alive: !auto.split }, state };
}
/** State-derived assembly/expiry, never wall-clock animation or a gameplay delay. */
export function upgradeVisualPhase(state={},motion=true){
 const active=state.waveBuff,expired=state.wave?.expiredBuff;
 if(active)return Object.freeze({buff:active,amount:motion?Math.min(1,Math.max(0,(state.wave?.age??18)/18)):1,shield:state.waveShield||0,expiring:false});
 const age=state.wave?.restAge??99;
 if(motion&&expired&&age<12)return Object.freeze({buff:expired,amount:Math.max(0,1-age/12),shield:state.wave?.expiredShield||0,expiring:true});
 return Object.freeze({buff:null,amount:0,shield:0,expiring:false});
}
/** Local, single-contact punctuation. Plates removed come from the real hit.
 * Material shapes describe force, not independent attacks or damage rays. */
export function drawUpgradeArmorContact(c,{x=0,y=0,age=0,upgrade=null,armorRemoved=0,secondary=false,equipment={},sword=null,contact=null,motion=true}={}){
 if(!['reach','cleaver'].includes(upgrade)||secondary||armorRemoved<=0||age<0||age>=16)return;
 const d=resolveUpgradeConstruction(equipment,sword),t=motion?age/16:.2,k=Math.min(1,contact?.strength??.4),heavy=upgrade==='cleaver';
 c.save();try{c.translate(x,y);c.rotate(contact?.angle||0);c.globalAlpha=(1-age/16)**2;c.strokeStyle=d.energy;c.fillStyle=d.face;c.lineWidth=heavy?2.5:1.5;
 if(heavy){
  // A short compressed impact seam. No broad crescent implying extra reach.
  c.beginPath();c.moveTo(-6,-14);c.lineTo(3,0);c.lineTo(-6,14);c.stroke();
 }else{c.beginPath();c.moveTo(-13,0);c.lineTo(9,0);c.stroke();}
 for(let i=0;i<Math.min(3,armorRemoved);i++){
 const side=i%2?1:-1,px=4+t*(14+k*12),py=side*(8+i*4+t*15);c.save();c.translate(px,py);c.rotate(side*t*.8);
 c.beginPath();if(d.material==='paper'){c.moveTo(-8,-3);c.lineTo(7,-1);c.lineTo(2,6);c.lineTo(-2,1);}else if(d.material==='spectral'){c.moveTo(-7,4);c.lineTo(-7,-4);c.lineTo(7,-4);c.lineTo(7,-1);c.lineTo(-4,-1);c.lineTo(-4,4);}else{c.moveTo(-6,-4);c.lineTo(4,-4);c.lineTo(8,1);c.lineTo(3,5);c.lineTo(-5,3);}c.closePath();c.fill();c.stroke();
 if(d.material==='furnace'){c.strokeStyle=d.edge;c.beginPath();c.moveTo(-3,-2);c.lineTo(4,2);c.stroke();}c.restore();
 }
 }finally{c.restore();}
}

/** Construction precedes palette: an upgrade belongs to the purchased body.
 * Pure descriptor; never resolves recipes or changes attack statistics. */
export function resolveUpgradeConstruction(equipment={},sword=null){
 const spectral=equipment.body==='hologram'||equipment.core==='echo'||['wraith','phantom','arcade'].includes(sword?.build);
 const furnace=equipment.body==='lava'||['forge','sun'].includes(sword?.build);
 const material=spectral?'spectral':furnace?'furnace':equipment.body==='iron'?'metal':equipment.body==='prism'?'crystal':'paper';
 const h=resolveVisualHarmony(equipment,0,{});
 return Object.freeze({material,ink:'#171320',face:material==='furnace'?'#44343b':material==='spectral'?'#302e49':material==='metal'?'#7f8b9a':material==='crystal'?'#b6ccd9':'#e8ddc9',edge:material==='furnace'?'#ffbf86':h.light,energy:h.primary,shadow:material==='paper'?'#9e8b97':'#363044'});
}
/** One sacrificial panel fitted below the face. No orbit, no extra actor. */
export function drawFittedWard(c,{x=0,y=0,radius=22,equipment={},sword=null,charges=1,finish=1}={}){
 if(charges<=0)return;const d=resolveUpgradeConstruction(equipment,sword),r=radius;
 c.save();try{c.translate(x,y);c.scale(r,r);c.lineJoin='miter';
 for(let layer=0;layer<Math.min(2,charges);layer++){
 c.save();c.translate(.84+layer*.10,-.2+layer*.06);c.scale(.34*Math.max(.05,finish),.9);c.globalAlpha=Math.min(1,finish);const pts=d.material==='paper'?[[-1.03,.28],[-.46,.48],[.05,.35],[.91,.24],[1.01,.72],[.51,1.05],[-.62,1.02],[-1.04,.75]]:d.material==='furnace'?[[-1.02,.35],[-.64,.23],[-.49,.43],[.55,.43],[.71,.23],[1.02,.35],[.91,.96],[-.91,.96]]:d.material==='spectral'?[[-1.04,.37],[-.56,.48],[.56,.48],[1.04,.37],[.87,.94],[-.87,.94]]:[[-1.02,.33],[-.64,.23],[.64,.23],[1.02,.33],[.9,.9],[0,1.05],[-.9,.9]];
 c.beginPath();pts.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fillStyle=d.face;c.globalAlpha=(d.material==='spectral'?.65:1)*finish;c.fill();c.globalAlpha=finish;c.strokeStyle=d.ink;c.lineWidth=.085;c.stroke();
 c.strokeStyle=d.energy;c.lineWidth=.04;
 if(d.material==='paper'){c.beginPath();c.moveTo(-.99,.32);c.lineTo(-.35,.72);c.lineTo(.91,.28);c.moveTo(-.35,.72);c.lineTo(-.6,.99);c.stroke();c.fillStyle=d.shadow;c.beginPath();c.moveTo(-.35,.72);c.lineTo(.91,.28);c.lineTo(.52,1);c.closePath();c.fill();}
 else if(d.material==='furnace'){c.strokeStyle=d.edge;c.beginPath();c.moveTo(-.77,.48);c.lineTo(-.62,.65);c.lineTo(-.7,.87);c.moveTo(.65,.48);c.lineTo(.51,.7);c.lineTo(.7,.86);c.stroke();c.fillStyle='#1c1925';for(const xx of[-.32,0,.32])c.fillRect(xx-.07,.61,.14,.18);}
 else if(d.material==='spectral'){c.beginPath();c.moveTo(-.94,.42);c.lineTo(-.8,.82);c.lineTo(-.18,.82);c.moveTo(.18,.82);c.lineTo(.8,.82);c.lineTo(.94,.42);c.stroke();c.strokeStyle=d.edge;c.lineWidth=.025;c.beginPath();c.moveTo(-.5,.56);c.lineTo(.5,.56);c.stroke();}
 else{c.beginPath();c.moveTo(-.75,.42);c.lineTo(0,.87);c.lineTo(.75,.42);c.stroke();}
 c.restore();}
 }finally{c.restore();}
}
/** Draw inside the existing weapon silhouette: reinforces its construction,
 * never swaps a rapier/echo/pulse weapon for a generic cleaver. */
function drawUpgradeBladeInlay(c,{root,tip,width,radius,upgrade,equipment,sword,finish=1}){
 if(!['reach','cleaver','fleet','comet','linger'].includes(upgrade))return;const d=resolveUpgradeConstruction(equipment,sword),span=tip-root,R=radius;c.globalAlpha=finish;
 c.lineWidth=R*.035;c.strokeStyle=d.energy;
 if(upgrade==='linger'){c.beginPath();c.moveTo(root+span*.12,0);c.lineTo(root+span*.24,-width);c.moveTo(root+span*.29,0);c.lineTo(root+span*.41,-width);c.stroke();return;}
 if(['fleet','comet'].includes(upgrade)){
  // A taut folded binding / hot seam / resolved contour at the existing root.
  // Short-blade has one deeper crease, not another detached engine.
  const end=root+span*(upgrade==='comet'?.34:.2);
  c.strokeStyle=d.material==='furnace'?d.edge:d.energy;c.lineWidth=R*.045;
  c.beginPath();c.moveTo(root,width*.25);c.lineTo(end,-width*.28);c.stroke();
  if(upgrade==='comet'){c.strokeStyle=d.shadow;c.beginPath();c.moveTo(end,-width);c.lineTo(end+R*.06,width);c.stroke();}
  return;
 }
 if(upgrade==='reach'){
 const joints=d.material==='paper'?[.46,.77]:d.material==='spectral'?[.65,.86]:[.64];
 for(const u of joints){const xx=root+span*u;c.beginPath();c.moveTo(xx-R*.06,-width);c.lineTo(xx+R*.08,width);c.stroke();}
 if(d.material==='furnace'){c.strokeStyle=d.edge;c.lineWidth=R*.055;c.beginPath();c.moveTo(root+span*.6,width*.12);c.lineTo(tip,0);c.stroke();}
 if(d.material==='spectral'){c.setLineDash([R*.12,R*.08]);c.beginPath();c.moveTo(root+span*.6,0);c.lineTo(tip,0);c.stroke();c.setLineDash([]);}
 }else{
 c.fillStyle=d.face;c.beginPath();c.moveTo(root,-width*.55);c.lineTo(root+span*.7,-width*.55);c.lineTo(root+span*.85,-width*.12);c.lineTo(root,width*.02);c.closePath();c.fill();
 if(d.material==='paper'){c.strokeStyle=d.shadow;c.beginPath();c.moveTo(root,-width*.3);c.lineTo(root+span*.75,-width*.3);c.lineTo(root+span*.35,0);c.stroke();}
 else if(d.material==='furnace'){c.strokeStyle=d.edge;c.lineWidth=R*.055;c.beginPath();c.moveTo(root+span*.2,0);c.lineTo(root+span*.38,-width*.35);c.lineTo(root+span*.52,-width*.1);c.lineTo(root+span*.8,-width*.4);c.stroke();}
 else if(d.material==='spectral'){c.strokeStyle=d.energy;for(const u of[.25,.55]){c.beginPath();c.moveTo(root+span*u,-width);c.lineTo(root+span*(u+.09),width);c.stroke();}}
 }
}

// Sword artwork is a pure projection of the authoritative profile supplied by the caller.
// No catalogue resolution, simulation or persistence lives in the renderer.
function drawSwordWeapon(c, spec = {}) {
  const {x=0,y=0,radius=24,angle=0,active=false,aiming=false,charge=0,motion=true,time=0}=spec;
  const original=spec.sword||{family:'standard',color:'#deff73',reach:1,width:1};
  const buff=spec.buff,upgrade=buff?.id||buff,finish=spec.finish??1;
  const sword={...original,...(upgrade==='breaker'?{family:'breaker',width:1.3}:upgrade==='duelist'?{family:'rapier'}:{})};
  const family=sword.family||'standard',color=sword.color||'#deff73',R=radius;
  const extension=upgrade==='reach'?1+.2*finish:upgrade==='comet'?.85:1;
  const length=active?3.6*R*(spec.reach??sword.reach??1):R*(family==='rapier'?2.35:1.95)*extension;
  const width=R*(family==='cleaver'?.42:family==='breaker'?.32:family==='rapier'?.085:family==='reaper'?.22:.16)*(active?(sword.width||1):1);
  const root=R*1.08,tip=Math.max(root+8,length),span=tip-root;
  c.save();
  try{
    c.translate(x,y);if(!active&&!aiming)c.translate(0,R*.62);
    if(motion&&!active&&!aiming&&spec.reveal!=null){const unfold=Math.max(0,Math.min(1,spec.reveal));c.scale(.55+.45*(1-Math.pow(1-unfold,3)),1);}
    const swing=active&&motion&&Number.isFinite(spec.age)?(-.5+Math.min(1,spec.age/10)*.75)*(upgrade==='cleaver'?1.1:.55):0;
    c.rotate((active||aiming?angle:-.18)+swing);
    c.lineJoin='miter';c.lineCap='butt';
    const shape=(pts,fill,stroke='#100e19',lw=R*.12)=>{c.beginPath();for(let i=0;i<pts.length;i++)i?c.lineTo(...pts[i]):c.moveTo(...pts[i]);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}};
    // A short wrapped tang and keyed collar physically connect blade to shell.
    shape([[R*.78,-R*.11],[root+R*.15,-R*.11],[root+R*.15,R*.12],[R*.78,R*.12]],'#302d43');
    for(let i=0;i<3;i++){c.strokeStyle='#a69bb3';c.lineWidth=R*.035;c.beginPath();c.moveTo(R*(.81+i*.07),-R*.07);c.lineTo(R*(.86+i*.07),R*.07);c.stroke();}
    shape([[root-R*.08,-R*.27],[root+R*.12,-R*.19],[root+R*.12,R*.21],[root-R*.08,R*.28]],'#85778e');
    let pts;
    if(family==='cleaver')pts=[[root,-width*.72],[tip-span*.19,-width],[tip,width*.2],[tip-span*.13,width],[root,width*.48]];
    else if(family==='breaker')pts=[[root,-width*.65],[tip-span*.18,-width*.68],[tip,-width*.16],[tip-span*.10,width*.66],[root,width*.58]];
    else if(family==='reaper')pts=[[root,-width*.32],[tip-span*.29,-width*.62],[tip,-width*2.0],[tip-span*.05,width*.05],[tip-span*.37,width*.7],[root,width*.34]];
    else if(family==='echo')pts=[[root,-width*.5],[tip-span*.17,-width*.67],[tip,0],[tip-span*.25,width*.63],[root,width*.28]];
    else if(family==='pulse')pts=[[root,-width*.65],[tip-span*.17,-width*.85],[tip,0],[tip-span*.17,width*.6],[root,width*.45]];
    else pts=[[root,-width*.5],[tip-span*.16,-width*.6],[tip,0],[tip-span*.16,width*.6],[root,width*.5]];
    const construction=resolveUpgradeConstruction(spec.equipment,original);
    if(upgrade==='cleaver'){
      // A thick back-spine, not a wider damage sweep or a replacement sword.
      const spine=R*(construction.material==='spectral'?.15:.22)*finish;
      shape([[root,-width*.5],[root+span*.55,-width*.5-spine],[root+span*.77,-width*.25],[root+span*.52,0],[root,width*.15]],construction.face,construction.ink,R*.06);
      c.strokeStyle=construction.material==='furnace'?construction.edge:construction.energy;c.lineWidth=R*.035;c.beginPath();c.moveTo(root+span*.1,-width*.5-spine*.2);c.lineTo(root+span*.53,-width*.5-spine*.7);c.stroke();
    }
    shape(pts,['reach','cleaver','fleet','comet','linger'].includes(upgrade)?construction.face:upgrade==='duelist'?'#efc9e9':'#f5eddf');
    // Broad cel face and a dark central ridge. The bright edge stays clean.
    c.save();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();
    c.fillStyle=family==='breaker'?'#6a6579':'#9d8baa';c.beginPath();c.moveTo(root,-width);c.lineTo(tip,0);c.lineTo(root,width*.1);c.closePath();c.fill();
    c.fillStyle=color;c.beginPath();c.moveTo(root,width*.2);c.lineTo(tip,0);c.lineTo(tip,width*3);c.lineTo(root,width);c.closePath();c.fill();
    c.strokeStyle='#fff8e9';c.lineWidth=R*.035;c.beginPath();c.moveTo(root+R*.13,width*.34);c.lineTo(tip-span*.13,width*.34);c.stroke();
    if(['cleaver','breaker'].includes(family)){for(let i=0;i<3;i++){const xx=root+span*(.18+i*.13);c.strokeStyle='#393346';c.lineWidth=R*.045;c.beginPath();c.moveTo(xx,-width*.46);c.lineTo(xx-R*.11,width*.14);c.stroke();}}
    if(family==='pulse'){const count=sword.chargeMax||3;for(let i=0;i<count;i++){const xx=root+span*(.12+i*.75/count);c.fillStyle=i<charge?'#caffed':'#242336';c.fillRect(xx,-width*.25,span*.5/count,width*.40);c.fillStyle='#161526';c.fillRect(xx+span*.62/count,-width, R*.05,width*2);}}
    if(family==='rapier'){c.strokeStyle='#534766';c.lineWidth=R*.04;c.beginPath();c.moveTo(root+R*.12,0);c.lineTo(tip-span*.1,0);c.stroke();}
    drawUpgradeBladeInlay(c,{root,tip,width,radius:R,upgrade,equipment:spec.equipment,sword:original,finish});
    if(upgrade==='duelist'){c.strokeStyle='#fff4fd';c.lineWidth=R*.06;c.beginPath();c.moveTo(root,0);c.lineTo(root+span*.55,-width*.4);c.lineTo(tip,0);c.stroke();}
    if(upgrade==='linger'&&active){
      // The live edge is on THIS weapon, never an extra floating echo sword.
      c.globalAlpha=motion?Math.min(1,.35+(spec.bladeRemaining??4)/6):1;c.strokeStyle=construction.edge;c.lineWidth=R*.085;c.beginPath();c.moveTo(root+span*.12,width*.3);c.lineTo(tip,0);c.stroke();
      c.strokeStyle=construction.energy;c.lineWidth=R*.035;c.beginPath();c.moveTo(root+span*.12,width*.3-R*.045);c.lineTo(tip,0);c.stroke();
    }
    c.restore();
    if(family==='echo'){
      const off=R*(active?.32:.23);shape([[root+span*.18,off],[tip-span*.17,off],[tip-span*.06,off+R*.10],[root+span*.31,off+R*.12]],color,'#181324',R*.075);
    }
    if(sword.tier==='zenith'){
      shape([[root-R*.12,-R*.08],[root,-R*.19],[root+R*.1,-R*.08],[root,R*.04]],color,'#120d20',R*.055);
    }else{c.fillStyle=color;c.fillRect(root-R*.02,-R*.08,R*.06,R*.15);}
    if(aiming&&!active){c.globalAlpha=.45;c.setLineDash([R*.12,R*.15]);c.strokeStyle=color;c.lineWidth=R*.035;c.beginPath();c.moveTo(tip+R*.2,0);c.lineTo(tip+R*.6,0);c.stroke();c.setLineDash([]);}
    if(active&&motion){
      c.globalAlpha=.19;c.fillStyle=color;c.beginPath();c.moveTo(root,width*.45);c.quadraticCurveTo(root-span*.4,width*3.2,root-span*.9,width*1.2);c.quadraticCurveTo(root-span*.2,width*.9,tip,0);c.closePath();c.fill();
      c.globalAlpha=.7;c.strokeStyle='#fff6e9';c.lineWidth=R*.04;c.beginPath();c.moveTo(root+span*.25,width*.7);c.lineTo(tip,0);c.stroke();
    }
  }finally{c.restore();}
}
function drawSwordAttack(c, attack, sword, reducedMotion=false){
  c.save();
  try{
    const pending=!attack.fired,opacity=pending?.23:Math.max(0,Math.min(1,attack.life/14));
    const dx=attack.tx-attack.x,dy=attack.ty-attack.y,len=Math.hypot(dx,dy);
    if(!len)return;
    c.translate(attack.x,attack.y);c.rotate(Math.atan2(dy,dx));
    c.globalAlpha=opacity;c.strokeStyle=sword.color||'#bda6ff';c.lineWidth=pending?1.5:2;
    if(pending)c.setLineDash([5,8]);
    c.beginPath();c.moveTo(0,0);c.lineTo(len,0);c.stroke();c.setLineDash([]);
    if(!pending){
      const w=attack.width/2;c.fillStyle=sword.color||'#bda6ff';c.globalAlpha=opacity*.18;c.beginPath();c.moveTo(0,0);c.lineTo(len*.18,-w);c.lineTo(len,0);c.lineTo(len*.18,w);c.closePath();c.fill();
      c.globalAlpha=opacity;drawSwordWeapon(c,{x:len*.35,y:0,radius:18,active:true,sword:{...sword,family:attack.kind==='pulse'?'pulse':'rapier'},reach:len*.65/(3.6*18),motion:!reducedMotion});
    }else{
      c.fillStyle=sword.color||'#bda6ff';c.beginPath();c.moveTo(len,0);c.lineTo(len-9,-4);c.lineTo(len-9,4);c.closePath();c.fill();
    }
  }finally{c.restore();}
}

/** Fast movement separates two small background laminations, never an actor
 * copy, continuous ribbon, full-screen warp or unbounded particle emitter. */
export function drawWakeSeparation(c,{x=0,y=0,angle=0,age=0,speed=0,motion=true,enabled=true,scale=1}={}){
 if(!motion||!enabled||![x,y,angle,age,speed].every(Number.isFinite)||speed<28||age<0||age>=18)return;
 const force=Math.max(0,Math.min(1,(speed-28)/28)),t=age/18;
 const release=1-Math.exp(-t*9),fade=(1-t)*(1-t),length=32+force*30;
 c.save();try{c.translate(x,y);c.rotate(angle);c.lineJoin='miter';
 for(const [side,ratio]of [[-1,1],[1,.68]]){
  const offset=side*(23+force*9+release*3),start=-32-release*5,end=start-length*ratio;
  c.globalAlpha=fade*(.18+force*.12);c.fillStyle='#10141f';
  c.beginPath();c.moveTo(start,offset);c.lineTo(start-9,offset+side*3);c.lineTo(end,offset+side*2);c.lineTo(end+12,offset-side*2);c.closePath();c.fill();
  c.strokeStyle='#b8bbb7';c.lineWidth=Math.max(.7,.8/Math.max(.1,scale));c.globalAlpha=fade*(.16+force*.11);
  c.beginPath();c.moveTo(start-3,offset-side*1.5);c.lineTo(start-12,offset-side*3);c.lineTo(end+7,offset-side*1.5);c.stroke();
 }
 }finally{c.restore();}
}

/** Frame Bite: a local rail bevel compresses along the real inward normal.
 * Decorative only. No copy/warp/shake, no geometry outside a narrow wall band. */
export function drawFrameBite(c,{x=0,y=0,angle=0,age=0,intensity=.3,motion=true,evidence=false,life=1800,scale=1}={}){
 if(![x,y,angle,age,intensity].every(Number.isFinite)||age<0||age>=(evidence?life:18))return;
 const force=Math.max(0,Math.min(.8,intensity)),length=28+force*64;
 const t=age/18,compression=motion?Math.exp(-t*6):.55;
 const depth=2+force*8*compression;
 c.save();try{c.translate(x,y);c.rotate(angle);c.lineJoin='miter';c.lineCap='butt';
 const polygon=points=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();};
 if(evidence){
  c.globalAlpha=.13*Math.max(0,1-age/life);c.strokeStyle='#b9aa92';c.lineWidth=Math.max(.8,.8/Math.max(.1,scale));
  c.beginPath();c.moveTo(1,-length*.65);c.lineTo(1,-12);c.lineTo(4,-7);c.lineTo(2,3);c.lineTo(5,9);c.lineTo(1,15);c.lineTo(1,length*.48);c.stroke();return;
 }
 const fade=(1-t)*(1-t);
 c.globalAlpha=fade*(.46+force*.35);c.fillStyle='#11131d';
 polygon([[0,-length],[3,-length*.82],[3,-14],[depth+2,-6],[depth,7],[3,16],[3,length*.72],[0,length]]);c.fill();
 c.fillStyle='#a69b87';c.globalAlpha=fade*(.35+force*.4);
 polygon([[0,-length],[1.5,-length],[1.5,-15],[depth,-5],[depth-1,6],[1.5,14],[1.5,length*.72],[0,length*.72]]);c.fill();
 c.strokeStyle='#ede2c6';c.lineWidth=Math.max(.9,1/Math.max(.1,scale));c.globalAlpha=fade*(.38+force*.38);
 c.beginPath();c.moveTo(1,-length*.75);c.lineTo(1,-15);c.lineTo(depth,-5);c.moveTo(depth-1,7);c.lineTo(1,14);c.lineTo(1,length*.55);c.stroke();
 // Unequal delamination cuts travel along the rail, not toward the actor.
 c.globalAlpha*=.55;c.strokeStyle='#c0b6a4';
 for(const [side,factor]of [[-1,.9],[1,.63]]){const reach=length*factor*(motion?.55+.45*(1-Math.exp(-t*9)):.8);c.beginPath();c.moveTo(4,side*18);c.lineTo(6,side*(reach*.6));c.lineTo(3,side*reach);c.stroke();}
 }finally{c.restore();}
}

/** World-space, background-only reactions. Reads immutable visual snapshots;
 * no camera shake, additive blend, gameplay writes or random allocation. */
function drawDimensionField(c,field,view,motion=true,{separation=true}={}){
 if(!field)return;
 const visible=item=>!view||item.x>=view.x-200&&item.x<=view.x+view.w+200&&item.y>=view.y-200&&item.y<=view.y+view.h+200;
 const scale=view?.scale||1;
 c.save();c.lineCap="round";c.lineJoin="round";
 for(const mark of field.scars){
  if(!visible(mark))continue;
  if(mark.kind==='bank'){if(mark.age>=18)drawFrameBite(c,{...mark,evidence:true,motion,scale});continue;}
  const fade=Math.max(0,1-mark.age/mark.life),length=26+mark.intensity*86;
  c.save();c.translate(mark.x,mark.y);c.rotate(mark.angle);
  c.globalAlpha=((motion ? .09 : .075)+Math.min(.13,mark.intensity*.16))*fade;
  c.strokeStyle=mark.kind==='bank'?"#cbb691":"#acb8cc";c.lineWidth=Math.max(.8,1/scale);
  const sign=mark.id%2?1:-1;
  c.beginPath();c.moveTo(0,0);c.lineTo(length*.25,sign*4);c.lineTo(length*.48,-sign*5);c.lineTo(length*.72,sign*2);c.lineTo(length,-sign*7);c.moveTo(length*.48,-sign*5);c.lineTo(length*.55,-sign*18);c.lineTo(length*.7,-sign*24);c.stroke();
  c.restore();
 }
 // Only the newest three samples can separate. Low-speed movement retains
 // a single quiet dust crease rather than stacking a second trail.
 const activeWakes=field.wakes.slice(-3);
 if(motion)for(const wake of activeWakes){
  if(!visible(wake))continue;
  const speed=Number.isFinite(wake.speed)?wake.speed:wake.intensity*84;
  if(speed>=28){drawWakeSeparation(c,{...wake,speed,motion,enabled:separation,scale});continue;}
  const t=wake.age/wake.life;
  c.save();c.translate(wake.x,wake.y);c.rotate(wake.angle);
  c.globalAlpha=(1-t)*(.07+wake.intensity*.12);c.strokeStyle="#bac3c9";c.lineWidth=Math.max(.7,.8/scale);
  c.beginPath();c.moveTo(-30,19);c.lineTo(-40-t*8,18);c.lineTo(-49-t*8,20);c.stroke();c.restore();
 }

 for(const hit of field.impulses){
  if(!visible(hit))continue;
  if(hit.kind==='bank'){drawFrameBite(c,{...hit,motion,scale});continue;}
  const t=hit.age/hit.life;
  c.save();c.translate(hit.x,hit.y);c.rotate(hit.angle);
  c.strokeStyle=hit.kind==='bank'?"#d0bd98":"#b0c6cc";c.lineWidth=Math.max(.8,1.1/scale);c.globalAlpha=(1-t)*(.11+hit.intensity*.2);
  if(!motion){
   // Same event location, static compact pressure notch instead of expansion.
   c.beginPath();c.moveTo(4,-10);c.lineTo(13,0);c.lineTo(4,10);c.stroke();
  }else if(hit.kind==='launch'){
   c.beginPath();c.ellipse(-10-t*10,0,8+t*20,17+t*32,0,Math.PI*.6,Math.PI*1.4);c.stroke();
   c.globalAlpha*=.6;c.beginPath();c.moveTo(-22-t*35,-15);c.lineTo(-36-t*38,-19);c.moveTo(-22-t*35,15);c.lineTo(-36-t*38,19);c.stroke();
  }else{
   const reach=16+hit.intensity*76+t*22;
   c.beginPath();c.moveTo(-10,-9);c.lineTo(reach,0);c.lineTo(-10,9);c.stroke();
  }
  c.restore();
 }
 c.restore();
}
/** Real seam state only: decorative room strain never opens a stitch. */
export function resolveTensionStitch(q={}){
 const step=q.ready?2:Math.min(1,Math.max(0,q.cue?.step||0)),hit=q.feedback;
 const reason=hit?(hit.reason|| (hit.kind==='NEW DASH'?'fresh':hit.kind==='MORE SPEED'?'slow':'sealed')):null;
 return {step,ready:!!q.ready,reason,label:hit?(reason==='fresh'?'NEW DASH':reason==='slow'?'MORE SPEED':hit.kind||'SEALED'):q.ready?'CUT THROUGH':'SEALED'};
}
/** Embedded, asymmetric surface lips. Static except for a real contact. */
export function drawTensionStitch(c,q={},motion=true,equipment={}){
 if(![q.x,q.y].every(Number.isFinite))return;
 const state=resolveTensionStitch(q),hit=q.feedback,age=hit?.age||0,live=!!hit&&age>=0&&age<24;
 const h=resolveVisualHarmony(equipment,0,{}),edge=blend(h.rim,'#ded9c4',.6);
 const fade=live?(1-age/24)**2:0,flex=live&&state.reason!=='fresh'?(motion?Math.sin(Math.PI*age/24):.45)* (state.reason==='slow'?3:1.5):0;
 const open=state.ready?8:state.step===1?2:0;
 const cut=[[-3,-62],[3,-39],[-4,-17],[4,4],[-2,24],[4,43],[-3,65]];
 const polygon=pts=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
 c.save();try{c.translate(q.x,q.y);c.lineJoin='miter';c.lineCap='butt';
 // Unequal local patches feather into existing scenery; no enclosing crystal.
 c.globalAlpha=.42;c.fillStyle='#171a25';polygon([[-51,-54],[-18,-68],[-3,-62],[-4,64],[-29,73],[-44,31],[-38,-13]]);c.fill();
 c.globalAlpha=.29;c.fillStyle='#45414a';polygon([[5,-60],[32,-48],[45,-14],[36,21],[49,54],[16,69],[2,61]]);c.fill();
 c.globalAlpha=1;c.fillStyle='#0d111b';polygon([...cut.map(([x,y])=>[x-open-flex,y]),...cut.slice().reverse().map(([x,y])=>[x+open+flex+2,y])]);c.fill();
 for(const side of [-1,1]){
 c.strokeStyle=side<0?edge:'#8c8194';c.globalAlpha=state.ready?.9:.65;c.lineWidth=side<0?2:1.3;
 c.beginPath();cut.forEach(([x,y],i)=>{const px=x+side*(open+flex+2);i?c.lineTo(px,y):c.moveTo(px,y);});c.stroke();
 // Short exposed underside folds instead of a luminous frame.
 c.globalAlpha=.42;c.strokeStyle='#baa68e';c.lineWidth=1;c.beginPath();c.moveTo(side*(open+8),-38);c.lineTo(side*(open+12),-27);c.moveTo(side*(open+7),24);c.lineTo(side*(open+11),37);c.stroke();
 }
 // Stitches release only at earned milestones, never on idle or field strain.
 for(let i=0;i<3;i++){
 const y=-36+i*36,released=state.ready||(state.step===1&&i===0),gap=released?open+5:0;
 c.globalAlpha=released?.45:.9;c.strokeStyle=released?'#8e8492':edge;c.lineWidth=2;
 c.beginPath();if(released){c.moveTo(-18-gap,y-3);c.lineTo(-8-gap,y);c.moveTo(8+gap,y);c.lineTo(17+gap,y+3);}else{c.moveTo(-15-flex,y-4);c.lineTo(-9-flex,y+3);c.lineTo(10+flex,y-2);c.lineTo(16+flex,y+4);}c.stroke();
 }
 // Registration/halftone fragments are fixed scenery detail, not particles.
 c.globalAlpha=.22;c.fillStyle=edge;for(const [x,y]of [[-29,-39],[-34,-33],[-25,-30],[29,34],[33,40],[27,44]])c.fillRect(x,y,1.5,1.5);
 if(state.ready){c.globalAlpha=.85;c.strokeStyle=h.light;c.lineWidth=1.8;for(const side of [-1,1]){c.beginPath();c.moveTo(side*53,-6);c.lineTo(side*43,0);c.lineTo(side*53,6);c.stroke();}}
 if(live&&state.reason!=='fresh'){
 c.save();c.rotate(hit.angle||0);c.globalAlpha=fade*.85;c.strokeStyle='#e3c6a3';c.lineWidth=1.8;
 const length=state.reason==='slow'?20:10;c.beginPath();c.moveTo(-length,-3);c.lineTo(-3,0);c.lineTo(state.reason==='slow'?8:2,2);c.stroke();c.restore();
 }
 c.globalAlpha=1;c.fillStyle=edge;c.textAlign='center';c.font='700 11px monospace';c.fillText(state.label,0,89);
 }finally{c.restore();}
}

function drawDimensionBreach(c,breach,field,motion=true,burst=null,equipment={}){
 if(breach)drawTensionStitch(c,breach,motion,equipment);
 else if(burst)drawReleaseCut(c,burst,motion,equipment);
}
function drawEncounterRoster(c,w,h,brief){
  c.save();try{
    c.clearRect(0,0,w,h);c.fillStyle='#11141c';c.fillRect(0,0,w,h);
    const roster=Object.entries(brief.counts||{}).filter(([,count])=>count>0),step=w/Math.max(1,roster.length);
    roster.forEach(([kind,count],i)=>{const x=step*(i+.5);foe(c,kind,x,h*.38,Math.min(17,step*.25),kind==='fang'?-.25:0,{hp:TYPES[kind]?.hp||1,mode:'idle'});c.fillStyle='#e9dfef';c.font='13px monospace';c.textAlign='center';c.fillText(`${count} ${kind==='bastion'?'ARMOR':kind.toUpperCase()}`,x,h-7);});
  }finally{c.restore();}
}
function drawSwordChamber(c,spec={}) {
  const {equipment={},state:s,player:p,enemies=[],time:age=0,motion=true,panX=0,panY=0,labelScale=1}=spec;
  if(!s||!p)return;
  c.save();try{
  drawWorldBackdrop(c,640,360,equipment.world,0,{x:0,y:0});c.fillStyle='#0e1018a8';c.fillRect(0,0,640,360);
  c.strokeStyle='#b6b0c015';c.lineWidth=1;for(let x=0;x<640;x+=32){c.beginPath();c.moveTo(x,40);c.lineTo(x,328);c.stroke();}for(let y=40;y<330;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}
  c.fillStyle='#c6b8cd';c.font=`${12*labelScale}px monospace`;c.fillText('REAL COMBAT / FIXED TARGETS',24,30);
  c.save();c.translate(320-panX*.65,235-panY*.65);c.scale(.65,.65);
  c.strokeStyle='#8a8098';c.lineWidth=2;c.beginPath();c.moveTo(-470,70);c.lineTo(470,70);c.stroke();
  for(const e of enemies){drawEnemyShape(c,{kind:e.kind,x:e.x,y:e.y,radius:e.r,angle:e.angle,options:{hp:e.hp,flash:e.flash,mode:'idle'}});c.fillStyle='#e9dfec';c.font=`${16*labelScale}px monospace`;c.textAlign='center';c.fillText(`${e.hp} HP`,e.x,e.y+e.r+28);}
  for(const a of s.swordFx)drawSwordAttack(c,a,s.sword,!motion);
  drawElementalDash(c,{x:p.x,y:p.y,vx:p.vx||0,vy:p.vy||0,age:s.slashAge,element:dashElement(equipment,s.sword),equipment,sword:s.sword,buff:s.waveBuff,radius:24,motion});
  if(!s.impact)drawCubeDashSmear(c,{x:p.x,y:p.y,vx:p.vx||0,vy:p.vy||0,age:s.slashAge,radius:24,equipment,motion});
  drawCubeHero(c,{x:p.x,y:p.y,radius:24,angle:0,equipment,motion:motion,time:age,face:1});
  drawSwordWeapon(c,{x:p.x,y:p.y,radius:24,angle:s.slashAngle,active:s.blade>0,sword:s.sword,reach:(s.reach||1)*s.sword.reach,charge:s.swordCharge,motion:motion,time:age});c.restore();
  }finally{c.restore();}
}

function drawPreviewScene(ctx, spec = {}) {
  const { equipment = {}, time = 0, mode = "slice", state, options = {} } = spec;
  const scene = state ? { state } : createLabScene();
  ctx.save();
  try {
    drawLabScene(ctx, equipment, time, mode, scene, options);
    if(options.pressOrigin)drawPointerMark(ctx,options.pressOrigin.x,options.pressOrigin.y,equipment,options.pressOrigin.power,options.pressOrigin.cancel);
    const f = options.fusionElapsed;
    if (options.motion !== false && f >= 0 && f < 260) {
      ctx.globalAlpha = (1 - f / 260) * 0.18;
      ctx.fillStyle = corePalette(equipment.core).light;
      ctx.fillRect(0, 0, 640, 400);
    }
  } finally {
    ctx.restore();
  }
}
var aimVisuals = Object.freeze({ ARC, speedRgb, speedInk, speedBand, arcPath, threatAhead, corridorReach, magnetize, impactPreview, predictAim });
export {
  SHAPE_MODIFIERS,
  resolveVisualHarmony,
  resolveBodyConstruction,
  resolveCharacterPerformance,
  resolveSlashSweep,
  resolveArtDirection,
  HYBRIDS,
  ITEMS,
  MUTATIONS,
  SLOTS,
  SPARKS2 as SPARKS,
  aimVisuals,
  corePalette,
  createRenderer as createArtRenderer,
  drawBestStrokeMini,
  drawCubeHero,
  drawEnemyShape,
  drawSpecimen as drawFieldSpecimen,
  drawForcePreview,
  drawPreviewScene,
  drawShopCardArt,
  drawSlashEffect,
  drawSwordWeapon,
  drawSwordChamber,
  drawEncounterRoster,
  drawDimensionField,
  drawDimensionBreach,
  drawSwordAttack,
  drawVaultScene,
  drawWorldBackdrop,
  evaluatePreviewPose,
  animation_exports as legacy_animation,
  art_exports as legacy_art,
  atmosphere_exports as legacy_atmosphere,
  bake_exports as legacy_bake,
  camera_exports as legacy_camera,
  catalog_exports as legacy_catalog,
  cut_ink_exports as legacy_cut_ink,
  equipment_art_exports as legacy_equipment_art,
  equipment_details_art_exports as legacy_equipment_details_art,
  field_guide_exports as legacy_field_guide,
  guide_exports as legacy_guide,
  harmony_exports as legacy_harmony,
  hero_art_exports as legacy_hero_art,
  hybrids_exports as legacy_hybrids,
  impact_exports as legacy_impact,
  lab_art_exports as legacy_lab_art,
  lab_scene_exports as legacy_lab_scene,
  motion_exports as legacy_motion,
  print_exports as legacy_print,
  quest_art_exports as legacy_quest_art,
  radar_exports as legacy_radar,
  renderer_exports as legacy_renderer,
  shapes_exports as legacy_shapes,
  smear_exports as legacy_smear,
  storyboard_exports as legacy_storyboard,
  vault_art_exports as legacy_vault_art,
  world_clip_exports as legacy_world_clip
};

/** A directional exit cue for one contacted enemy, NOT universal invulnerability. */
export function drawCutExit(c,{x=0,y=0,radius=22,remaining=0,source=null,sourceId=null,equipment={},sword=null,motion=true}={}){
 if(remaining<=0||!source||source.id!==sourceId)return;
 const d=resolveUpgradeConstruction(equipment,sword),r=radius,a=Math.atan2(source.y-y,source.x-x);
 c.save();try{c.translate(x,y);c.rotate(a);c.globalAlpha=motion?Math.min(.85,.35+remaining/30):.7;c.lineWidth=Math.max(1.3,r*.065);c.strokeStyle=d.energy;
 // Two close-fitting, OPEN flanks face only the contacted enemy. The front
 // and opposite side remain empty: another enemy can still hurt the player.
 for(const side of[-1,1]){c.beginPath();if(d.material==='paper'){c.moveTo(r*.72,side*r*.9);c.lineTo(r*1.13,side*r*.62);c.lineTo(r*1.23,side*r*.3);}else if(d.material==='furnace'){c.moveTo(r*.77,side*r*.9);c.lineTo(r*1.18,side*r*.9);c.lineTo(r*1.18,side*r*.3);}else{c.moveTo(r*.8,side*r*.85);c.lineTo(r*1.18,side*r*.64);c.moveTo(r*1.18,side*r*.5);c.lineTo(r*1.18,side*r*.28);}c.stroke();}
 }finally{c.restore();}
}

/** Pure, bounded combat accents. Simulation ages, never wall-clock animation. */
export function drawCombatAccent(c,{x=0,y=0,radius=18,angle=0,age=-1,blade=0,buff=null,shield=0,motion=true,reach=1,equipment={},sword=null,finish=1,suppressWake=false}={}){
 const colors={fleet:'#9be8ff',reach:'#d8f19c',breaker:'#ffb36e',linger:'#c6acff',bounty:'#ffe38b',guard:'#a0efda',barrier:'#d8f19c',comet:'#80d6ff',cleaver:'#ff996b',duelist:'#ff93c8',bastion:'#b4c9ff'};
 const tint=colors[buff]||'#d8f19c',r=radius;
 if(['fleet','comet','linger','guard'].includes(buff))return;
 if(['reach','cleaver','barrier'].includes(buff)){if(buff==='barrier')drawFittedWard(c,{x,y,radius,equipment,sword,charges:shield,finish});return;}
 c.save();c.translate(x,y);c.rotate(angle);
 // Temporary boosts alter the weapon/action, not the purchased hat/body.
 if(buff&&(!['barrier','bastion'].includes(buff)||shield>0)){
 c.strokeStyle=tint;c.lineWidth=1.4;c.globalAlpha=.8;
 if(['barrier','bastion'].includes(buff)){
 for(const side of (buff==='bastion'&&shield>1?[-1,1]:[1])){c.save();c.translate(0,side*r*1.05);c.beginPath();c.moveTo(-r*.85,-r*.16);c.lineTo(r*.65,-r*.16);c.lineTo(r*.95,r*.07);c.lineTo(r*.5,r*.3);c.lineTo(-r*.8,r*.2);c.closePath();c.fillStyle='#414859';c.fill();c.stroke();c.restore();}
 }else{
 const inset={fleet:.98,reach:1.01,breaker:1.04,linger:1.07,bounty:1.1,guard:1.13,comet:1.16,cleaver:1.19,duelist:1.22}[buff]||1;
 c.beginPath();c.moveTo(-r*.85,-r*inset);c.lineTo(r*.65,-r*inset);c.lineTo(r*.95,-r*.8);c.stroke();
 }
 }
 if(!suppressWake&&motion&&age>=0&&age<16){
  const u=age/16,fade=(1-u)*(1-u);c.globalAlpha=fade;
  // Three tapered wake wedges read as propulsion, not another damage beam.
  for(let i=0;i<3;i++){const side=(i-1)*r*.7,len=r*(2.8+u*3)*(i===1?1.2:.75);c.fillStyle=i===1?'#fff5d9':tint;c.beginPath();c.moveTo(-r*.9,side);c.lineTo(-r-len,side-r*.12);c.lineTo(-r-len*.65,side+r*.19);c.closePath();c.fill();}
 }
 if(blade>0&&age>=0&&age<24){
  const u=motion?Math.min(1,age/18):.55;
  const sweep=-1.25+u*2.15,outer=r*(2.1+Math.min(1.6,reach)*.25),inner=outer-r*(buff==='cleaver'?.62:buff==='duelist'?.16:.34);
  c.globalAlpha=motion?Math.max(0,1-age/25):.65;c.fillStyle=tint;
  // Closed tapered crescent, travelling across the forward cutting plane.
  c.beginPath();c.arc(0,0,outer,sweep-.85,sweep);c.quadraticCurveTo(Math.cos(sweep+.12)*outer,Math.sin(sweep+.12)*outer,Math.cos(sweep)*inner,Math.sin(sweep)*inner);c.arc(0,0,inner,sweep,sweep-.72,true);c.closePath();c.fill();
  c.strokeStyle='#fff5df';c.lineWidth=1.4;c.beginPath();c.arc(0,0,outer,sweep-.66,sweep-.08);c.stroke();
 }
 c.restore();
}

/** Matched preview geometry and plate counts derived from the equipped profile.
 * Illustrative fixed three-plate target, no invented extra enemy health. */
export function upgradeComparison(equipment={},sword=null,buff=null){
 const baseReach=3.6*18*(sword?.reach||1),boostReach=baseReach*(buff?.reach||1);
 const baseDamage=(equipment.head==='crown'?2:1)+(sword?.armor||0),boostDamage=baseDamage+(buff?.armor||0);
 return Object.freeze({baseReach,boostReach,targetOffset:baseReach+16+(boostReach-baseReach)*.5,plates:3,baseLeft:Math.max(0,3-baseDamage),boostLeft:Math.max(0,3-boostDamage)});
}

/** Upgrade card is a miniature demonstration of the equipped creature. */
export function drawWaveUpgradePreview(c,w,h,{equipment={},sword=null,buff=null,time=0,motion=true}={}){
 const t=motion?Math.min(1,Math.max(0,time/1100)):1;
 const u=Math.min(1,Math.max(0,(t-.15)/.7)),id=buff?.id||'reach';
 c.save();try{c.clearRect(0,0,w,h);c.scale(w/360,h/200);
 c.fillStyle='#141420';c.fillRect(0,0,360,200);
 const defensive=!!buff?.shield,scoring=!!buff?.score,armor=!!buff?.armor,comparison=upgradeComparison(equipment,sword,buff);
 for(let row=0;row<2;row++){
 const boosted=row===1,y=57+row*93,color=boosted?'#d8f19c':'#948c9d';
 c.fillStyle=boosted?'#20282a':'#1e1b28';c.fillRect(5,y-38,350,79);
 c.fillStyle=color;c.font='bold 20px monospace';c.fillText(boosted?'BOOST':'NOW',12,y-25);
 const fast=id==='fleet'||id==='comet',travel=fast?u*120*(boosted?(buff?.speed||1):1):u*28;
 const x=67+travel,r=18,contact=u>.65;
 c.strokeStyle='#514c60';c.lineWidth=1;c.beginPath();c.moveTo(15,y+26);c.lineTo(345,y+26);c.stroke();
 drawCubeHero(c,{x,y,radius:r,equipment,motion:false,pose:{look:[1,0]}});
 if(defensive){
 const charges=boosted?(buff.shield||1):0;
 if(charges&&(!contact||charges>1))drawCombatAccent(c,{x,y,radius:r,buff:id,shield:contact?charges-1:charges,equipment,sword,motion:false});
 const px=contact?x+28:290-u*200;c.fillStyle='#f88fa5';if(!contact){c.beginPath();c.moveTo(px-10,y);c.lineTo(px+8,y-6);c.lineTo(px+8,y+6);c.closePath();c.fill();}
 if(contact&&boosted)drawWardFracture(c,{x:x+23,y,age:4+(u-.65)*30,equipment,sword,motion});
 const count=contact&&!boosted?2:3;for(let i=0;i<3;i++){c.fillStyle=i<count?'#dfedb0':'#4a4052';c.fillRect(18+i*13,y+32,9,4);}
 c.fillStyle=color;c.font='bold 12px monospace';c.fillText(contact?(boosted?'BLOCKED':'HEALTH −1'):'',220,y+7);
 }else if(fast){
 const element=dashElement(equipment,sword),baseReach=3.6*r*(sword?.reach||1),localBuff=boosted?buff:null;
 // Ghost-free local wake: the actual elemental renderer with the same boost envelope.
 // Show the release moment only during requested playback; idle comparison stays still.
 if(motion&&u>.05&&u<.9)drawElementalDash(c,{x:x-r*.65,y,vx:20*(boosted?buff.speed:1),vy:0,age:Math.max(0,(u-.05)*20),element,equipment,sword,buff:localBuff,radius:r,motion});
 drawSwordWeapon(c,{x,y,radius:r,sword:sword||undefined,equipment,buff:localBuff,active:true,reach:(sword?.reach||1)*(boosted?(buff.reach||1):1),motion:false});
 c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(67,y+24);c.lineTo(x,y+24);c.stroke();
 // Same relative target distance in both rows. Normal blade connects;
 // short blade leaves a gap. This is a reach inset, not a homing target.
 const tx=x+baseReach*(id==='comet'?.925:1)+15,canHit=id!=='comet'||!boosted,hit=u>.8&&canHit;
 if(hit)cutFigure(c,'fang',tx,y,12,0,0,(u-.8)*20,{hp:1});else foe(c,'fang',tx,y,12,0,{hp:1});
 if(boosted&&id==='comet'){
 c.strokeStyle='#dcaaa0';c.setLineDash([2,3]);c.lineWidth=1;c.beginPath();c.moveTo(x+baseReach*.85,y+14);c.lineTo(tx-12,y+14);c.stroke();c.setLineDash([]);
 }
 c.fillStyle=color;c.font='bold 11px monospace';c.fillText(boosted?(id==='comet'?'FASTER / SHORTER':'FASTER / SAME REACH'):'SAME LAUNCH TIME',135,y+37);
 }else if(scoring){
 const tx=190,hit=contact; if(hit)cutFigure(c,'fang',tx,y,15,0,0,(u-.65)*30,{hp:1});else foe(c,'fang',tx,y,15,0,{});
 drawSwordWeapon(c,{x,y,radius:r,sword:sword||undefined,active:true,angle:0,reach:sword?.reach||1,motion:false});
 if(hit){c.fillStyle=color;c.font='bold 19px monospace';c.fillText('+'+(boosted?Math.round(100*buff.score):100),252,y+5);}
 }else if(id==='guard'){
 const tx=x+48,elapsed=Math.max(0,(u-.65)*56),remaining=contact?Math.max(0,(boosted?15+(buff?.guard||8):15)-elapsed):0;
 if(contact)cutFigure(c,'fang',tx,y,14,0,0,(u-.65)*12,{hp:1});else foe(c,'fang',tx,y,14,0,{hp:1});
 drawSwordWeapon(c,{x,y,radius:r,sword:sword||undefined,equipment,active:!contact,angle:0,motion:false});
 drawCutExit(c,{x,y,radius:r,remaining,source:{id:'demo',x:tx,y},sourceId:'demo',equipment,sword,motion});
 c.fillStyle=color;c.font='bold 11px monospace';c.fillText(boosted?'MORE TIME TO EXIT':'SAME TARGET ONLY',170,y+34);
 }else{
 const tx=id==='reach'?95+comparison.targetOffset:95+comparison.baseReach+8,canHit=id!=='reach'||boosted;
 const attackContact=id==='linger'?u>.83:contact;
 const alive=!attackContact||!canHit||(id==='linger'&&!boosted)||(armor&&(boosted?comparison.boostLeft:comparison.baseLeft)>0);
 if(alive)foe(c,armor?'bastion':'fang',tx,y,16,0,{hp:armor?(contact?(boosted?comparison.boostLeft:comparison.baseLeft):3):1});else cutFigure(c,armor?'bastion':'fang',tx,y,16,0,0,(u-.65)*26,{hp:1});
 const reach=(sword?.reach||1)*(boosted?(buff?.reach||1):1);
 const active=id==='linger'?u<(boosted?1.01:.72):true;
 drawSwordWeapon(c,{x,y,radius:r,sword:sword||undefined,active,angle:0,reach,buff:boosted?buff:null,equipment,motion:false});
 if(id==='reach'){c.strokeStyle=boosted?'#d8f19c':'#736b7d';c.lineWidth=2;c.beginPath();c.moveTo(x+20,y+24);c.lineTo(x+(boosted?comparison.boostReach:comparison.baseReach),y+24);c.stroke();}
 if(armor&&contact&&boosted)drawUpgradeArmorContact(c,{x:tx,y,age:(u-.65)*30,upgrade:id,armorRemoved:3-comparison.boostLeft,equipment,sword,motion});
 if(armor){for(let i=0;i<3;i++){c.fillStyle=i<(contact?(boosted?comparison.boostLeft:comparison.baseLeft):3)?'#ffbf8b':'#4b4353';c.fillRect(234+i*17,y-6,12,12);}}
 if(id==='linger'&&contact){c.fillStyle=color;c.font='bold 11px monospace';c.fillText(boosted?'STILL CUTTING':'FINISHED',235,y+5);}
 }
 }
 }finally{c.restore();}
}

/** Six large readable fragments, not a particle cloud; ages are simulation ticks. */
export function drawWardFracture(c,{x=0,y=0,radius=22,age=0,motion=true,angle=0,strength=0,equipment={},sword=null}={}){
 if(age<0||age>=24)return;const u=motion?age/24:.3,r=radius,d=resolveUpgradeConstruction(equipment,sword);
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=(1-age/24)*.95;
 for(let i=0;i<6;i++){const a=i*Math.PI/3+.2,distance=r*(1.1+u*(1.5+Math.min(1,strength)));c.save();c.translate(Math.cos(a)*distance,Math.sin(a)*distance+u*u*r);c.rotate(a+(motion?u*1.3:0));c.beginPath();if(d.material==='paper'){c.moveTo(-r*.3,-r*.17);c.lineTo(r*.33,-r*.07);c.lineTo(r*.06,r*.28);c.lineTo(-r*.13,r*.04);}else if(d.material==='spectral'){c.moveTo(-r*.28,-r*.2);c.lineTo(r*.3,-r*.2);c.lineTo(r*.3,-r*.11);c.lineTo(-r*.18,-r*.11);c.lineTo(-r*.18,r*.2);c.lineTo(-r*.28,r*.2);}else{c.moveTo(-r*.28,-r*.2);c.lineTo(r*.22,-r*.16);c.lineTo(r*.3,r*.03);c.lineTo(r*.16,r*.25);c.lineTo(-r*.17,r*.15);}c.closePath();c.fillStyle=i%2?d.face:d.energy;c.fill();c.strokeStyle='#242437';c.lineWidth=1.8;c.stroke();c.restore();}
 c.strokeStyle='#efffd2';c.lineWidth=2*(1-u)+.4;c.beginPath();c.arc(0,0,r*(1.2+u*1.5),-.8,.6);c.stroke();c.restore();
}

/** Outcome first, theme second. Armor is the ENEMY's material, not the skin
 * worn by the attacker. No gameplay damage, timers, random state or imports. */
export function resolveCombatHit(hit={}){
 const armored=['bastion','crown'].includes(hit.kind),secondary=!!hit.secondary||!!hit.fromShear;
 const outcome=hit.type==='armor'?'buckle':hit.type==='cut'&&armored?'hollow':hit.type==='cut'&&!secondary&&(hit.contact?.normalSpeed||0)>=28?'shear':'bite';
 return Object.freeze({outcome,material:armored?'metal':['rift','prism'].includes(hit.kind)?'spectral':'paper',chips:Math.min(3,Math.max(0,hit.armorRemoved??(armored?1:0))),angle:hit.cut??hit.contact?.angle??0,secondary});
}
/** A short local registration slip samples ONLY the background already drawn.
 * Called before actors/HUD. At most three active patches, <7 ticks, <=2 backing
 * pixels; motion-off never copies. No readback/filter/fullscreen distortion. */
export function drawHitRegistration(c,hit,age=0,motion=true){
 if(!motion||age<0||age>=7||![hit.x,hit.y].every(Number.isFinite)||resolveCombatHit(hit).outcome!=='shear'||!c.canvas)return;
 const m=c.getTransform(),px=m.a*hit.x+m.c*hit.y+m.e,py=m.b*hit.x+m.d*hit.y+m.f;
 const size=Math.min(80,Math.max(8,32*Math.hypot(m.a,m.b))),sx=Math.max(0,Math.floor(px-size)),sy=Math.max(0,Math.floor(py-size*.4));
 if(px+size<0||px-size>c.canvas.width||py+size*.4<0||py-size*.4>c.canvas.height)return;
 const w=Math.min(c.canvas.width-sx,Math.ceil(size*2)),h=Math.min(c.canvas.height-sy,Math.ceil(size*.8));if(w<1||h<1)return;
 const shift=Math.min(2,Math.max(.5,Math.hypot(m.a,m.b)))*(1-age/7);
 c.save();try{c.setTransform(1,0,0,1,0,0);c.globalAlpha=.65;c.beginPath();c.rect(sx,sy,w,h);c.clip();c.drawImage(c.canvas,sx,sy,w,h,sx+Math.cos(resolveCombatHit(hit).angle)*shift,sy+Math.sin(resolveCombatHit(hit).angle)*shift,w,h);}finally{c.restore();}
}
/** Pressure Bite / Shear Release / Plate Buckle / Hollow Break.
 * Force at 0–3 ticks, separation at 3–11, quiet evidence to 18. */
export function drawCombatHit(c,hit={},age=0,motion=true){
 if(!['cut','armor'].includes(hit.type)||age<0||age>=18||![hit.x,hit.y].every(Number.isFinite))return;
 const p=resolveCombatHit(hit),d=resolveUpgradeConstruction(hit.equipment,hit.sword),r=Math.min(34,Math.max(10,hit.r||22)),k=Math.min(1,Math.max(0,hit.contact?.strength??.3));
 const t=motion?age/18:.22,release=Math.max(0,(t-.12)/.88),fade=(1-age/18)**2,hot=p.material==='metal'?'#e8c49a':p.material==='spectral'?d.energy:'#e8dfcc';
 c.save();try{c.translate(hit.x,hit.y);c.rotate(p.angle);c.lineJoin='miter';c.lineCap='butt';c.globalAlpha=fade;
 const shape=(pts,fill,edge='#18141f',width=1.5)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=width;c.stroke();};
 const stroke=(pts,col,width)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=width;c.stroke();};
 if(p.outcome==='buckle'){
  // Concave plate face: survives the hit. It never splits the whole target.
  const dent=motion?Math.max(0,1-age/7)*(4+k*4):3;
  if(age<9||!motion)shape([[-r*.7,-r*.48],[-r*.48+dent,0],[-r*.7,r*.48],[-r*.93,r*.28],[-r*.93,-r*.28]],'#756977',hot,1.7);
  stroke([[-r*.7,-r*.36],[-r*.45,0],[-r*.7,r*.36]],hot,2);
 }else if(p.outcome==='hollow'){
  // Dark undersides, asymmetric shell lips; the core has no armor left.
  for(const side of[-1,1]){c.save();c.translate(0,side*(3+release*14));c.rotate(side*release*.2);shape([[-r*.72,side*3],[r*.15,side*5],[r*.52,side*r*.48],[-r*.45,side*r*.6]],'#3c3441',hot,1.7);stroke([[-r*.55,side*5],[r*.13,side*7]],'#c79f7c',1);c.restore();}
 }else{
  // A compression bite, not a radial starburst. Fast release opens the stroke.
  const length=p.outcome==='shear'?r*(1.6+k*.6):r*.68;
  if(age<8||!motion){shape([[-length,-2],[-r*.2,-4],[r*.35,0],[-r*.2,3],[-length*.8,2]],'#17131f',hot,1.2);}
  if(p.outcome==='shear')for(const side of[-1,1])stroke([[-r*.65,side*(3+release*8)],[r*.7,side*(1+release*12)]],hot,1.4);
 }
 const count=p.secondary?1:p.material==='metal'?p.chips:2;
 if(motion)for(let i=0;i<count;i++){
  const side=i%2?1:-1,offset=release*(9+k*13);c.save();c.translate((i-1)*4+offset*.35,side*(6+offset+i*3));c.rotate(side*release*.7);
  if(p.material==='metal')shape([[-5,-3],[3,-4],[6,0],[1,4],[-4,2]],'#857888',hot,1);
  else if(p.material==='spectral')stroke([[-5,3],[-5,-3],[5,-3]],hot,1.6);
  else shape([[-6,-2],[5,0],[-1,3],[-2,0]],hot,'#25202a',.8);
  c.restore();
 }
 // Restrained evidence occupies only the original cutting plane, never a beam.
 if(age>=8){c.globalAlpha=fade*.35;stroke([[-r*.75,1],[-r*.12,-1],[r*.55,0]],d.shadow,1);}
 }finally{c.restore();}
}

/** Local directional hit punctuation. No full-screen flash or gameplay pause. */
export function drawContactBurst(c,{x=0,y=0,type='cut',contact=null,age=0,motion=true}={}){
 const life=type==='break'?27:18;if(age<0||age>=life)return;
 const k=Math.max(0,Math.min(1,contact?.strength??.35)),u=age/life;
 const hurt=type==='hurt'||type==='break',armor=type==='armor',ward=type==='waveBlock';
 const tint=hurt?'#f18a9d':armor?'#ffc58a':ward?'#b4c9ff':'#e5f6af';
 c.save();c.translate(x,y);c.rotate(contact?.angle||0);c.globalAlpha=(1-u)*(1-u);
 const spread=motion?u:0.18,reach=12+k*22;
 c.fillStyle='#14121d';c.beginPath();c.moveTo(-7,-3);c.lineTo(reach,-reach*.45);c.lineTo(7,0);c.lineTo(reach,reach*.45);c.lineTo(-7,3);c.closePath();c.fill();
 c.strokeStyle=tint;c.lineWidth=armor?2.8:1.8;
 // Tangential contacts scrape along the surface rather than radiating equally.
 const scrape=(contact?.tangentSpeed||0)>(contact?.normalSpeed||0)*1.6;
 const count=motion?(k>.65?7:4):3;
 for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*(scrape?.45:2.5),r0=7+spread*reach,r1=r0+(1-u)*reach*(i%2?.55:1);c.beginPath();c.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);c.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);c.stroke();}
 if(hurt){c.strokeStyle='#fff0df';c.lineWidth=2;c.beginPath();c.moveTo(-8,-12);c.lineTo(-15,0);c.lineTo(-8,12);c.stroke();}
 c.restore();
}

/** Full-size clipped hero halves retain the face/loadout through the final beat. */
export function drawPlayerFracture(c,{x=0,y=0,age=0,motion=true,equipment={},contact=null,radius=22}={}){
 if(age<0||age>=27)return;const a=contact?.angle||0,k=contact?.strength||0,r=radius,t=motion?Math.max(0,age-2):2;
 c.save();c.translate(x+(motion?(contact?.vx||0)*t*.12:0),y+(motion?(contact?.vy||0)*t*.08+t*t*.06:0));c.rotate(a);
 c.globalAlpha=age<17?1:Math.max(0,(27-age)/10);
 for(const side of [-1,1]){c.save();c.translate(0,side*t*(.45+k*.7));c.rotate(side*t*(motion?.009:0));c.beginPath();c.rect(-r*3,side<0?-r*3:0,r*6,r*3);c.clip();drawCubeHero(c,{radius:r,angle:-a,equipment,motion:false,pose:{blink:.35}});c.strokeStyle='#fff2dc';c.lineWidth=1.6;c.beginPath();c.moveTo(-r*.9,0);c.lineTo(r*.9,0);c.stroke();c.restore();}c.restore();
}

/** Silent 1500ms cause→action→result stories, presentation-only, no simulation. */
export function drawEquipmentStory(c,w,h,{id='standard',slot='core',equipment={},time=0,motion=true}={}){
 time=motion?((time%1500)+1500)%1500:1020;
 const t=motion?time/1500:.68;
 const act=Math.max(0,Math.min(1,(t-.25)/.4)),done=t>.65,r=23;
 c.save();try{c.clearRect(0,0,w,h);c.scale(w/300,h/170);
 c.fillStyle='#181824';c.fillRect(0,0,300,170);
 if(slot==='world'){drawWorldBackdrop(c,300,170,id,motion?time/16.667:0);}
 c.strokeStyle='#665370';c.lineWidth=2;c.beginPath();c.moveTo(18,137);c.lineTo(282,137);c.stroke();
 const wall=['prism','wings','thrusters','anchor'].includes(id),defense=id==='iron',focus=['halo','grav','time'].includes(id);
 let x=55+act*125,y=108;
 if(wall){x=id==='anchor'?135:65+Math.sin(act*Math.PI)*165;y=id==='anchor'?48+Math.sin(act*Math.PI)*67:105;}
 if(focus){x=92;y=id==='halo'?76+act*25:101;}
 if(defense)x=65+Math.sin(act*Math.PI)*75-(done?22:0);
 if(id==='viper')x=55+act*150;
 const line=(color,x1,y1,x2,y2,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
 const target=(tx,ty,dead=false,kind='fang')=>{if(dead){c.save();c.globalAlpha=Math.max(0,1-(t-.65)*1.8);cutFigure(c,kind,tx,ty,15,0,-.2,act*9,{hp:1,twist:act*.2});c.restore();}else foe(c,kind,tx,ty,15,0,{hp:kind==='crown'?3:1,time:time/16.667});};
 const pips=(count,filled,px=22,py=20,color='#d8f19c')=>{for(let i=0;i<count;i++){c.fillStyle=i<filled?color:'#484354';c.fillRect(px+i*16,py,12,5);}};
 if(focus&&t<.65){c.fillStyle='#070a1255';c.fillRect(0,0,300,170);c.strokeStyle='#c5b0ff';c.lineWidth=2;c.beginPath();c.arc(x,y,24,0,TAU);c.stroke();}
 if(wall){line('#b49bc9',251,35,251,137,5);if(id==='anchor'){target(97,124,done);target(195,124,done);if(done){c.strokeStyle='#ffbd79';c.lineWidth=4;c.beginPath();c.ellipse(145,133,act*90,12,0,Math.PI,TAU);c.stroke();}}else {target(237,48,done&&id==='prism');if(done&&id==='prism')for(const dx of [-5,5])line('#c6a2ff',245+dx,105,235+dx,42,3);if(id==='wings')pips(3,done?3:2);if(id==='thrusters'&&done){line('#ffad62',x+22,y,x+52,y-8,6);line('#fff2b2',x+20,y,x+39,y,3);}}}
 else if(id==='grav'){for(const s of [-1,1]){const ty=100+s*(40-act*30);target(205,ty);line('#ad8ee9',120,100,191,ty,1.5);}line('#d8f19c',115,100,260,100,1);}
 else if(id==='beacon'){if(t<.6){line('#ffc179',260,45,280,75,4);line('#ffc179',280,75,260,105,4);}if(t>.6)line('#ff6689',280,75,110,100,3);target(280,75);}
 else if(id==='coil'){target(177,108,done);target(210,65,done);if(done){c.strokeStyle='#92efff';c.lineWidth=3;c.beginPath();c.moveTo(177,108);c.lineTo(198,96);c.lineTo(187,86);c.lineTo(210,65);c.stroke();}}
 else if(id==='samurai'){target(196,83,done);target(196,119,done);}
 else if(id==='echo'){pips(3,Math.min(3,Math.floor(t*5)));target(210,108,done);if(done){drawEquipmentSlash(c,104,120,133,70,'laser',.75,{progress:act});target(115,83,t>.8);}}
 else if(defense){target(155,108);pips(3,3,22,20,'#efc3a7');if(done){c.strokeStyle='#ffe98c';c.lineWidth=4;c.beginPath();c.arc(x,y,25,-1.1,1.1);c.stroke();}}
 else if(id==='magnet'){target(193,92,done);if(act>.2){line('#ff83a5',x,101,210,101,9);line('#96dcff',x,101,210,101,2);}}
 else if(id==='crown'){target(200,105,done,'crown');if(done){for(const s of [-1,1]){c.fillStyle='#ffc78f';c.fillRect(204+s*act*26,75-act*10,9,6);}pips(3,1,202,52,'#ffbd79');}else pips(3,3,202,52,'#ffbd79');}
 else if(id==='ghost'){target(205,108,t>.8);if(t>.65&&t<.9)drawEquipmentSlash(c,145,110,220,105,'laser',1,{progress:.5});}
 else if(!id.startsWith('foe-')&&!['world','eyes','body'].includes(slot)){target(203,108,done);}
 if(['oni','glass'].includes(id)){pips(1,1,22,20,'#ff6f91');if(done){c.fillStyle='#ffe28c';c.font='bold 17px monospace';c.fillText(id==='glass'?'×2':'+50%',209,54);}}
 if(id==='time'){pips(6,done?Math.min(6,1+Math.floor((t-.65)/.35*6)):1,22,20);}
 if(id==='riot'){pips(2,2);pips(4,Math.min(4,Math.floor(t*6)),110,20,'#ffcd77');if(done){c.strokeStyle='#dbfc8f';c.lineWidth=4;c.beginPath();c.arc(x,y,27,0,TAU);c.stroke();}}
 if(id==='lava'){pips(4,Math.min(4,Math.floor(t*6)),22,20,'#ffbc87');c.strokeStyle=t>.65?'#fff4c2':'#ff906b';c.lineWidth=1+t*2;c.beginPath();c.moveTo(x-12,y-15);c.lineTo(x-4,y-3);c.lineTo(x-9,y+7);c.lineTo(x+1,y+15);c.stroke();}
 const aim=['learn-aim','halo','grav'].includes(id)&&t<.65;
 if(id==='learn-aim'){x=65;y=105;line('#d8f19c',85,105,201,105,1.5);c.strokeStyle='#bddb99';c.beginPath();c.arc(x,y,27,0,TAU);c.stroke();}
 if(id==='viper'&&act>0&&t<.7)line('#ef7a92',30,108,x+35,108,1);
 if(id==='learn-cut')pips(3,done?3:2);
 if(id==='learn-chain'){pips(6,Math.min(6,Math.floor(t*9)));if(done){c.strokeStyle='#ffe28c';c.lineWidth=4;c.beginPath();c.arc(x,y,27,0,TAU);c.stroke();}}
 // Enemy lessons share real enemy silhouettes, but use deliberately staged encounters.
 if(id.startsWith('foe-')){const kind=id.slice(4);target(216,103,done&&kind!=='rift',kind);if(kind==='prism'){target(215,53);if(!done)line('#c6a0ed',216,103,215,53,3);}if(kind==='fang'&&t<.55)line('#f17591',216,103,70,103,2);if(kind==='fork'&&done){target(242,81);target(242,124);}if(kind==='rift'){x=done?75:170;c.strokeStyle='#f17591';c.beginPath();c.arc(216,103,36*(1-t*.6),0,TAU);c.stroke();}if(kind==='bastion'){pips(2,t<.45?2:t<.7?1:0,199,53,'#ffc88e');if(t<.4){line('#f07f99',250,46,261,57,3);line('#f07f99',261,46,250,57,3);}}if(kind==='crown'){pips(3,Math.max(0,3-Math.floor(t*5)),193,45);pips(3,t>.9?3:2,22,20);if(t>.65){const u=(t-.65)/.35;c.fillStyle='#d8f19c';c.beginPath();c.arc(216+(x-216)*u,90-30*Math.sin(u*Math.PI),5,0,TAU);c.fill();}}if(done){line('#d8f19c',263,30,269,36,3);line('#d8f19c',269,36,281,21,3);}}
 c.save();c.translate(x,y);c.scale(t<.25?1-t*.3:1+(t<.65?.14:0),t<.25?1+t*.2:1-(t<.65?.09:0));drawCubeHero(c,{radius:r,equipment,time:motion?time/16.667:0,motion,pose:{look:[1,0]}});c.restore();
 if(!aim&&!defense&&act>0&&t<.8){drawEquipmentSlash(c,x-18,y,x+55,y,id==='samurai'?'comic':equipment.slash||'razor',.9,{progress:act,equipment,reducedMotion:!motion});}
 if(aim){c.fillStyle='#e4f4c8';c.beginPath();c.arc(42,129,4,0,TAU);c.fill();line('#b8c69e',42,129,27,129,2);}
 }finally{c.restore();}
}

/** Stylized, illustrative sensor schematic used in both card and demo. */
export function drawSensorPreview(c,w,h,{slot='radar',level=0,time=0,motion=true}={}){
 level=Math.max(0,Math.min(3,Math.floor(level)||0));c.save();try{
 c.clearRect(0,0,w,h);c.scale(w/300,h/170);c.fillStyle='#111721';c.fillRect(0,0,300,170);
 const grad=c.createLinearGradient(0,0,300,170);grad.addColorStop(0,'#173438');grad.addColorStop(.55,'#161d2a');grad.addColorStop(1,'#251d31');c.fillStyle=grad;c.fillRect(0,0,300,170);
 c.strokeStyle='#a3d9c51c';c.lineWidth=.6;for(let x=0;x<=300;x+=20){c.beginPath();c.moveTo(x,0);c.lineTo(x,170);c.stroke();}for(let y=0;y<=170;y+=20){c.beginPath();c.moveTo(0,y);c.lineTo(300,y);c.stroke();}
 c.fillStyle='#b9d7c9';c.font='bold 9px monospace';c.textAlign='left';c.fillText(slot==='radar'?'FIELD / SENSOR ARRAY':'FIELD / VECTOR LENS',14,17);
 c.textAlign='right';c.fillStyle='#e6f89d';c.fillText(level?`TIER 0${level}`:'STANDARD',286,17);
 c.strokeStyle='#a6f2dc';c.globalAlpha=.7;c.lineWidth=1;c.beginPath();c.moveTo(14,24);c.lineTo(286,24);c.stroke();c.globalAlpha=1;
 if(slot==='radar'){
   const x=150,y=100,r=60;c.fillStyle='#07131c';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
   c.strokeStyle='#8ee1c8';c.lineWidth=1.5;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
   c.globalAlpha=.3;for(let i=1;i<=3;i++){c.beginPath();c.arc(x,y,r*i/3,0,TAU);c.stroke();}c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();c.globalAlpha=1;
   const sweep=motion?time*.001: -.7;c.strokeStyle='#b7ffd7';c.globalAlpha=.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(sweep)*r,y+Math.sin(sweep)*r);c.stroke();c.globalAlpha=1;
   for(const [i,dx,dy] of [[0,-23,-18],[1,26,-31],[2,42,8],[3,-40,20]]){if(i>level+1)continue;c.fillStyle=i===3?'#ffba83':'#ff7899';c.beginPath();c.arc(x+dx,y+dy,i===1?3.7:2.8,0,TAU);c.fill();if(level>=3&&i===1){c.strokeStyle='#ffd5ae';c.setLineDash([2,2]);c.beginPath();c.arc(x+dx,y+dy,8,0,TAU);c.stroke();c.setLineDash([]);}}
   c.fillStyle='#e3ff9d';c.beginPath();c.moveTo(x,y-5);c.lineTo(x+5,y+4);c.lineTo(x-5,y+4);c.closePath();c.fill();
   for(let i=0;i<level;i++){c.fillStyle='#c9ebac';c.fillRect(18+i*9,139,6,4);}
   c.fillStyle='#abc2bd';c.font='8px monospace';c.textAlign='left';c.fillText(['LOCAL','RANGE +35%','RANGE +70% / HAZARDS','RANGE +120% / LIVE TELLS'][level],14,158);
 }else{
   const pts=[];for(let i=0;i<=30;i++){const t=i/30;pts.push({x:45+211*t,y:128-138*t+50*t*t});}
   const count=[11,16,23,31][level];c.strokeStyle='#425d64';c.lineWidth=8;c.lineCap='round';c.beginPath();pts.slice(0,count).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
   c.strokeStyle='#d7ffac';c.lineWidth=2.2;c.beginPath();pts.slice(0,count).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
   c.fillStyle='#ecffd5';for(let i=3;i<count;i+=4){const p=pts[i];c.beginPath();c.arc(p.x,p.y,2,0,TAU);c.fill();}
   c.save();c.translate(45,128);c.rotate(-.65);c.fillStyle='#f8f4e4';c.fillRect(-9,-9,18,18);c.strokeStyle='#14151d';c.lineWidth=2;c.strokeRect(-9,-9,18,18);c.restore();
   if(level>=2){const p=pts[count-1];c.strokeStyle='#ffd79c';c.lineWidth=1.4;for(let j=0;j<4;j++){c.beginPath();c.arc(p.x,p.y,11,j*Math.PI/2+.12,j*Math.PI/2+1);c.stroke();}}
   if(level>=3){c.fillStyle='#10272d';c.fillRect(145,102,130,30);c.strokeStyle='#9de3ca';c.strokeRect(145,102,130,30);c.fillStyle='#d9f6df';c.font='8px monospace';c.textAlign='left';c.fillText('SPD 32.0  ANG -38°',151,113);c.fillText('IMPACT ~0.60s',151,124);}
   c.textAlign='left';c.fillStyle='#abc2bd';c.font='8px monospace';c.fillText(['SHORT PATH','EXTENDED PATH','TIME TICKS / IMPACT','LIVE FLIGHT ANALYSIS'][level],14,158);
 }
 }finally{c.restore();}
}

/** Letterboxed shop story; canvas operations belong to the portable engine. */
export function drawShopDemo(ctx,width,height,{veil=0,demoMode='story',...story}={}){
 const scale=Math.min(width/300,height/170);
 ctx.save();ctx.fillStyle='#181824';ctx.fillRect(0,0,width,height);
 ctx.translate((width-300*scale)/2,(height-170*scale)/2);ctx.scale(scale,scale);
 if(demoMode==='story'&&['radar','trajectory'].includes(story.slot))drawSensorPreview(ctx,300,170,{slot:story.slot,level:sensorTier(story.equipment?.[story.slot],story.slot),motion:story.motion,time:story.time});else if(demoMode==='dash')drawShopElementDash(ctx,300,170,story);else if(demoMode==='slash')drawShopElementSlash(ctx,300,170,story);else if(demoMode==='arrow')drawDragArrowPreview(ctx,300,170,{equipment:story.equipment,sword:story.sword});else drawEquipmentStory(ctx,300,170,story);ctx.restore();
 if(veil&&demoMode!=='arrow'){ctx.save();ctx.fillStyle=`rgba(24,24,36,${veil})`;ctx.fillRect(0,0,width,height);ctx.restore();}
}

/** Rest-deck pole shoes, with restrained inward ticks only when capturing. */
export function drawPlatformMagnet(c,q,{active=false,time=0,motion=true}={}){
 if(!q)return;c.save();try{
 c.strokeStyle=active?'#d9edac':'#819075';c.fillStyle='#282e32';c.lineWidth=2;
 for(const side of [-1,1]){const x=q.x+q.w/2+side*(q.w/2-36);
 c.beginPath();c.moveTo(x-side*10,q.y-3);c.lineTo(x-side*10,q.y-12);c.lineTo(x+side*6,q.y-12);c.lineTo(x+side*6,q.y-3);c.stroke();
 if(active){const drift=motion?(time%36)/36:0;c.globalAlpha=motion?.28+(1-drift)*.3:.48;const y=q.y-30-drift*22;
 c.beginPath();c.moveTo(x-side*6,y-5);c.lineTo(x,y);c.lineTo(x+side*6,y-5);c.stroke();c.globalAlpha=1;}
 }
 }finally{c.restore();}
}

/** Bounded, screen-space press mark. Every spoke is calculated from equal angles;
 * power grows the inner diamond without changing the gesture's actual dead zone. */
export function pointerVisual({equipment={},power=0,cancel=false}={}){
 const id=['pointer-reticle','pointer-diamond','pointer-orbit','pointer-cross'].includes(equipment.pointer)?equipment.pointer:'pointer-reticle';
 const color=cancel?'#ee8d93':({'pointer-reticle':'#d8efa9','pointer-diamond':'#a9e8f4','pointer-orbit':'#d4b6f4','pointer-cross':'#ffc48e'}[id]);
 const p=Number.isFinite(power)?Math.max(0,Math.min(1,power)):0;
 const paths=[];
 if(id==='pointer-diamond'){
   paths.push([[0,-17],[17,0],[0,17],[-17,0],[0,-17]]);
   paths.push([[0,-12],[12,0],[0,12],[-12,0],[0,-12]]);
 }else if(id==='pointer-orbit'){
   for(let k=0;k<4;k++){const pts=[];for(let i=0;i<=8;i++){const a=k*Math.PI/2+.18+i*(Math.PI/2-.36)/8;pts.push([Math.cos(a)*16,Math.sin(a)*16]);}paths.push(pts);}
 }else if(id==='pointer-cross'){
   for(let k=0;k<4;k++){const a=k*Math.PI/2,cs=Math.cos(a),sn=Math.sin(a);paths.push([[11,-5],[17,-5],[17,5],[11,5]].map(([x,y])=>[x*cs-y*sn,x*sn+y*cs]));}
 }else{
   for(let k=0;k<4;k++){const a=k*Math.PI/2,cs=Math.cos(a),sn=Math.sin(a);paths.push([[10,0],[16,0]].map(([x,y])=>[x*cs-y*sn,x*sn+y*cs]));}
 }
 const r=3+3*p;paths.push([[0,-r],[r,0],[0,r],[-r,0],[0,-r]]);
 const path=paths.map(pts=>pts.map(([x,y],i)=>`${i?'L':'M'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')).join(' ');
 return {id,color,paths,path};
}
function drawPointerMark(c,x,y,equipment,power=0,cancel=false){
 const mark=pointerVisual({equipment,power,cancel});c.save();try{c.translate(x,y);c.strokeStyle=mark.color;c.lineWidth=1.8;c.lineJoin='round';c.lineCap='round';for(const pts of mark.paths){c.beginPath();pts.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();}}finally{c.restore();}
}

/** Stable screen-space arrow geometry, shared by native drag overlay and Shop. */
export function dragArrowVisual({dx=0,dy=-1,power=.5,equipment={},sword=null}={}){
 const element=dashElement(equipment,sword),palette={ink:['#e4edb2','#fff8e7'],fire:['#ffaf78','#ffe6bb'],lightning:['#86dcf0','#e9fbff'],ice:['#b0d9ef','#f3fbff'],echo:['#d0a9e9','#f7eaff'],void:['#b2a5da','#e8e0ff'],water:['#8edbce','#e2fff5']}[element];
 const p=Number.isFinite(power)?Math.max(0,Math.min(1,power)):0,len=38+p*68;
 const head=element==='ice'?[[len,0],[len-18,-8],[len-12,0],[len-18,8]]:element==='fire'?[[len,0],[len-22,-10],[len-16,-2],[len-28,4],[len-18,3],[len-21,9]]:[[len,0],[len-18,-8],[len-13,0],[len-18,8]];
 const shaft=element==='lightning'?[[6,-2],[len*.45,-2],[len*.57,-7],[len*.54,-1],[len-17,-1],[len-17,2],[len*.45,2],[len*.42,6],[len*.43,1],[6,2]]:[[6,-1],[len-20,-3],[len-13,0],[len-20,3],[6,1]];
 const accent=element==='echo'?[[[12,-7],[len-27,-7]],[[5,7],[len-34,7]]]:element==='void'?[[[13,-7],[24,-7]],[[len-36,7],[len-25,7]]]:element==='water'?[[[10,7],[24,10],[len-28,5]]]:element==='fire'?[[[11,7],[24,4],[20,9],[36,5]]]:element==='ice'?[[[18,-6],[25,-10],[32,-6]],[[18,6],[25,10],[32,6]]]:element==='lightning'?[[[10,-7],[22,-10],[19,-5],[30,-7]]]:[[[12,6],[len-30,6]]];
 const path=points=>points.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ');
 return {element,color:palette[0],light:palette[1],angle:Math.atan2(Number.isFinite(dy)?dy:0,Number.isFinite(dx)?dx:0),length:len,shaft,head,accent,shaftPath:path(shaft)+' Z',headPath:path(head)+' Z',accentPath:accent.map(path).join(' ')};
}
export function drawDragArrowPreview(c,w,h,{equipment={},sword=null,power=.7}={}){
 const arrow=dragArrowVisual({dx:1,dy:-.55,power,equipment,sword}),x=w*.44,y=h*.53;
 c.save();try{c.fillStyle='#181824';c.fillRect(0,0,w,h);c.translate(x,y);c.rotate(arrow.angle);c.strokeStyle='#8b819b';c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.moveTo(-70,0);c.lineTo(0,0);c.stroke();c.setLineDash([]);c.strokeStyle=arrow.color;c.lineWidth=1.5;drawPointerMark(c,0,0,equipment,power);
 for(const points of [arrow.shaft,arrow.head]){c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fillStyle=arrow.color;c.fill();c.strokeStyle='#15121e';c.lineWidth=1.2;c.stroke();}
 c.strokeStyle=arrow.light;c.lineWidth=1;for(const points of arrow.accent){c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();}
 c.restore();}catch(error){c.restore();throw error;}
 c.save();c.fillStyle=arrow.color;c.font='bold 12px monospace';c.textAlign='center';c.fillText((equipment.pointer||'pointer-reticle').replace('pointer-','').toUpperCase()+' / PULL BACK',w/2,h-16);c.restore();
}
/** An elemental cut demonstration, not simulated damage or a new unlock. */
export function resolveShopSlashPose(time=0,motion=true){
 const t=motion?Math.max(0,Math.min(1100,Number.isFinite(time)?time:0)):510;
 const swing=Math.max(0,Math.min(1,(t-300)/220)),ease=1-(1-swing)**3;
 return {x:116+(t<300?-Math.sin(t/300*Math.PI/2)*5:8*ease),y:105,angle:t<300?-.35-t/300*.8:-1.15+ease*2.05,
 progress:swing,contact:t>=405,split:Math.max(0,Math.min(1,(t-405)/320)),phase:t<300?'WIND UP':t<405?'SWEEP':t<485?'CONTACT':t<740?'FOLLOW THROUGH':'CUT STUDY'};
}
export function drawShopElementSlash(c,w,h,{equipment={},sword=null,time=0,motion=true}={}){
 const p=resolveShopSlashPose(time,motion),color=dragArrowVisual({equipment,sword}).color;
 c.save();try{c.fillStyle='#181824';c.fillRect(0,0,w,h);c.scale(w/300,h/170);
 c.strokeStyle='#51465d';c.lineWidth=1;c.beginPath();c.moveTo(22,138);c.lineTo(278,138);c.stroke();
 // A stationary cut specimen makes this a blade action, not a dash.
 if(p.contact)cutFigure(c,'fang',222,99,17,0,0,p.split*8,{hp:1});else foe(c,'fang',222,99,17,0,{hp:1});
 if(p.progress>0&&p.progress<1){drawEquipmentSlash(c,p.x+16,p.y-10,239,91,equipment.slash||'katana',.95,{progress:p.progress,equipment,reducedMotion:!motion});}
 if(!motion||p.phase==='CUT STUDY'){c.globalAlpha=.45;drawEquipmentSlash(c,p.x+16,p.y-10,239,91,equipment.slash||'katana',.65,{progress:.72,equipment,reducedMotion:true});c.globalAlpha=1;}
 drawCubeHero(c,{x:p.x,y:p.y,radius:22,equipment,motion:false,pose:{look:[1,0]}});
 drawSwordWeapon(c,{x:p.x,y:p.y,radius:22,sword:sword||undefined,angle:p.angle,active:true,motion:false,reach:.95});
 if(p.contact&&p.split<.2){c.strokeStyle='#f4e6bd';c.lineWidth=2;c.beginPath();c.moveTo(211,85);c.lineTo(228,109);c.stroke();}
 c.fillStyle=color;c.font='bold 10px monospace';c.textAlign='left';c.fillText((equipment.slash||'katana').toUpperCase()+' / SLASH',20,23);
 c.fillStyle='#a99cb6';c.font='9px monospace';c.textAlign='right';c.fillText(p.phase,280,23);
 }finally{c.restore();}
}

/** Underlayer is a quieter construction of the current world, never a tunnel. */
export function drawReleaseCut(c,burst={},motion=true,equipment={}){
 const {x,y,age=0,angle=0}=burst;if(![x,y,age,angle].every(Number.isFinite)||age<0||age>=64)return;
 const h=resolveVisualHarmony(equipment,0,{}),edge=blend(h.rim,'#d2c5b3',.6),u=motion?1-Math.exp(-Math.max(0,age-1)*.13):.68;
 const fade=Math.max(0,1-age/64)**2,world=equipment.world||'twilight';
 const poly=points=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();};
 c.save();try{c.translate(x,y);c.rotate(angle);c.lineJoin='miter';
 // The revealed substrate stays still. Only its covering material separates.
 c.save();poly([[-82,-13-u*26],[-27,-28-u*12],[29,-22-u*24],[86,-8],[70,24+u*23],[9,29+u*23],[-71,16+u*20]]);c.clip();
 c.globalAlpha=fade*.82;c.fillStyle='#10141e';c.fillRect(-90,-65,180,130);
 c.rotate(-angle);c.strokeStyle='#655d6b';c.lineWidth=2;c.globalAlpha=fade*.4;
 if(world==='foundry'||world==='tokyo'){
  for(const px of [-52,7,53]){c.fillStyle='#272c36';c.fillRect(px,-95,9,190);c.beginPath();c.moveTo(px-10,-35);c.lineTo(px+22,-35);c.moveTo(px-10,32);c.lineTo(px+22,32);c.stroke();}
  if(world==='foundry'){c.globalAlpha=fade*.18;c.fillStyle='#a66b52';c.fillRect(-40,15,35,50);}
 }else if(world==='manga'){
  c.lineWidth=1;for(const py of [-35,-4,29]){c.beginPath();c.moveTo(-90,py);c.lineTo(90,py+7);c.stroke();}
  for(let px=-60;px<=60;px+=15)for(let py=-40;py<45;py+=15){c.fillStyle='#8e8295';c.fillRect(px,py,1.5,1.5);}
  c.beginPath();c.moveTo(-48,-25);c.lineTo(-48,-10);c.moveTo(-55,-18);c.lineTo(-40,-18);c.stroke();
 }else if(world==='void'||world==='synth'){
  c.strokeStyle=world==='void'?'#776a91':'#6e8992';for(const px of [-43,16,51]){c.beginPath();c.moveTo(px,-47);c.lineTo(px+9,-21);c.lineTo(px-5,3);c.moveTo(px+2,19);c.lineTo(px+8,40);c.stroke();}
 }else{
  c.fillStyle='#282b35';c.fillRect(-55,-65,12,130);c.fillRect(31,-65,7,130);c.beginPath();c.moveTo(-75,18);c.lineTo(66,18);c.moveTo(-50,-38);c.lineTo(36,39);c.stroke();
 }c.restore();
 // Two unequal lips peel across the cut, away from the crossing axis.
 const sections=[{side:-1,points:[[-78,-6],[-62,-49],[-15,-66],[62,-44],[81,-8],[25,-4],[-12,1]],shift:25},{side:1,points:[[-84,8],[-33,3],[14,8],[66,3],[58,40],[11,59],[-64,41]],shift:20}];
 for(const section of sections){const {side,points}=section;c.save();c.translate(side*u*3,side*u*section.shift);c.rotate(side*u*.045);c.globalAlpha=fade*.82;
  poly(points.map(([px,py])=>[px+2,py+side*5]));c.fillStyle='#10121b';c.fill();
  poly(points);c.fillStyle=side<0?'#35313b':'#292b35';c.fill();c.strokeStyle=edge;c.lineWidth=1.4;c.stroke();
  c.globalAlpha*=.45;c.strokeStyle=h.trim;c.lineWidth=.8;c.beginPath();c.moveTo(points[0][0]+8,points[0][1]+side*4);c.lineTo(20,side*10);c.stroke();c.restore();
 }
 // Three unequal corner fragments, not a radial shard ring.
 if(age>=5)for(const [px,py,size]of [[-67,-39,7],[57,34,5],[38,-45,4]]){c.save();const side=py<0?-1:1;c.translate(px+u*(px<0?-8:8),py+side*u*24);c.rotate(side*u*.18);c.globalAlpha=fade*.55;c.fillStyle='#524752';poly([[-size,-3],[size,-1],[size*.5,4],[-size*.6,2]]);c.fill();c.restore();}
 if(age<7){c.globalAlpha=(1-age/7)*.85;c.strokeStyle=h.light;c.lineWidth=2;c.beginPath();c.moveTo(-68,0);c.lineTo(74,0);c.stroke();}
 }finally{c.restore();}
}
export function drawSettledSeam(c,trace={},equipment={}){
 if(![trace.x,trace.y].every(Number.isFinite))return;c.save();try{c.translate(trace.x,trace.y);c.rotate(trace.angle||0);c.globalAlpha=.15;c.strokeStyle=blend(resolveVisualHarmony(equipment,0,{}).rim,'#99909d',.7);c.lineWidth=1;
 c.beginPath();c.moveTo(-65,-7);c.lineTo(-27,-5);c.lineTo(-12,-9);c.lineTo(34,-6);c.moveTo(-38,8);c.lineTo(12,11);c.lineTo(56,7);c.stroke();}finally{c.restore();}
}
export function drawPlatformSettlement(c,q,{age=0,motion=true}={}){
 if(!q||age<0||age>=28)return;const fade=(1-age/28)**2,drop=motion?(1-Math.exp(-age*.2))*4:2;
 c.save();try{c.strokeStyle='#d4c6a6';c.globalAlpha=fade*.35;c.lineWidth=1.4;
 for(const side of [-1,1]){const x=q.x+q.w/2+side*q.w*.35;c.beginPath();c.moveTo(x-side*18,q.y+q.h+8+drop);c.lineTo(x,q.y+q.h+11+drop);c.lineTo(x+side*10,q.y+q.h+8+drop);c.stroke();}
 }finally{c.restore();}
}

/** Shop staging samples the actual dash renderer; fixed reference pose in
 * reduced motion is a still illustration, never a moving replacement effect. */
export function resolveShopDashPose(time=0,motion=true){
 if(!motion)return {x:211,y:101,age:2,speed:42,phase:'DASH STUDY',progress:.82};
 const t=Math.max(0,Math.min(1100,Number.isFinite(time)?time:0));
 if(t<300)return {x:88-Math.sin(t/300*Math.PI/2)*7,y:101,age:-1,speed:0,phase:'LOAD',progress:0};
 if(t<530){const progress=(t-300)/230,ease=1-(1-progress)**3;return {x:81+ease*150,y:101,age:progress*6,speed:42,phase:'RELEASE',progress};}
 const settle=Math.min(1,(t-530)/210);return {x:231-Math.sin(settle*Math.PI)*5,y:101,age:6+settle*15,speed:42*(1-settle),phase:t<740?'BRAKE':'DASH STUDY',progress:1};
}
export function drawShopElementDash(c,w,h,{equipment={},sword=null,time=0,motion=true}={}){
 const pose=resolveShopDashPose(time,motion),element=dashElement(equipment,sword),color=dragArrowVisual({equipment,sword}).color;
 c.save();try{c.fillStyle='#181824';c.fillRect(0,0,w,h);c.scale(w/300,h/170);
 // Quiet start/end registration makes displacement readable without a target,
 // cut enemy or slash arc that would suggest this is a weapon demonstration.
 c.strokeStyle='#51465e';c.lineWidth=1;c.beginPath();c.moveTo(22,137);c.lineTo(280,137);c.stroke();
 for(const x of [87,222]){c.strokeStyle='#85758e';c.globalAlpha=.5;c.beginPath();c.moveTo(x-9,143);c.lineTo(x+9,143);c.moveTo(x,140);c.lineTo(x,146);c.stroke();}c.globalAlpha=1;
 if(pose.age>=0){
  // motion:true evaluates the production shape at a frozen age for a still
  // sample. No wall-clock/tween input survives in reduced-motion mode.
  drawElementalDash(c,{x:pose.x,y:pose.y,vx:pose.speed,vy:0,age:pose.age,element,equipment,sword,radius:24,motion:true});
 }
 const demoAge=!motion?4:time<300?Math.max(0,time/300*DASH.windup):time<530?DASH.windup+(time-300)/230*DASH.active:DASH.windup+DASH.active+Math.min(1,(time-530)/210)*DASH.recover;
 const shape=dashFor(demoAge,42,0);
 drawCubeDashSmear(c,{x:pose.x,y:pose.y,vx:42,vy:0,age:demoAge,radius:24,equipment,motion});
 c.save();c.translate(pose.x,pose.y);c.scale(shape.sx,shape.sy);drawCubeHero(c,{radius:24,equipment,motion:false,pose:{look:[1,0]}});c.restore();
 drawSwordWeapon(c,{x:pose.x,y:pose.y,radius:24,sword:sword||undefined,equipment,active:false,motion:false});
 c.fillStyle=color;c.font='bold 11px monospace';c.textAlign='left';c.fillText(element.toUpperCase()+' / DASH',20,24);
 c.fillStyle='#a99cb6';c.font='9px monospace';c.textAlign='right';c.fillText(pose.phase,280,24);
 }finally{c.restore();}
}

/** Short, local aftermath of an actual enemy hit, not an extra damage zone.
 * Geometry and color encode the authoritative attack, including reduced motion. */
export function drawEnemyAttackImpact(c,{x=0,y=0,type='hurt',attack=null,age=0,motion=true,scale=1}={}){
 const kind=attack?.kind,life=type==='break'?27:18;
 if(!kind||age<0||age>=life||!['fang-rush','pulse-ring','prism-needle','crown-needle','prism-link','fork-swipe','bastion-slam','rift-strike','well-compression'].includes(kind))return;
 const t=age/life,u=motion?t:.16,fade=(1-t)*(1-t),angle=Number.isFinite(attack.angle)?attack.angle:0;
 c.save();try{
  c.translate(x,y);c.rotate(angle);const size=Math.min(2.8,Math.max(1,.8/Math.max(.1,scale)));c.scale(size,size);c.globalAlpha=fade;c.lineJoin='round';c.lineCap='round';
  const stroke=(color,width,points)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(...points[i]):c.moveTo(...points[i]);c.stroke();};
  const ring=(color,width,r,start=-Math.PI,end=Math.PI)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(0,0,r,start,end);c.stroke();};
  if(kind==='fang-rush'){
   // A forward bite, visibly directional rather than an explosion.
   const d=19+u*16;for(const side of [-1,1]){const p=[[-d,side*14],[-5,side*5],[d*.65,side*13]];stroke('#241522',5,p);stroke('#ff7a8f',2.5,p);}stroke('#fff1e8',2,[[7,-5],[16,0],[7,5]]);
  }else if(kind==='pulse-ring'){
   // Expanding double annulus echoes the actual Pulse wavefront.
   const r=22+u*24;ring('#241522',6,r);ring('#ff9eb3',2.5,r);ring('#fff1e8',1.7,Math.max(10,r-7));
  }else if(kind==='prism-needle'){
   // One long, sharp puncture and a diamond-shaped aperture.
   const d=27+u*16,p=[[-d,0],[d*.72,0]];stroke('#211a31',7,p);stroke('#d5adff',2.8,p);
   const diamond=[[0,-10],[10,0],[0,10],[-10,0],[0,-10]];stroke('#fff0ff',2,diamond);
  }else if(kind==='crown-needle'){
   // Broken radial spokes mark a Crown volley, not a Prism's single shot.
   const r=22+u*12;for(let i=0;i<6;i++){const a=i*Math.PI/3,cs=Math.cos(a),sn=Math.sin(a),p=[[cs*(r-7),sn*(r-7)],[cs*(r+8),sn*(r+8)]];stroke('#241522',5,p);stroke('#ffc27f',2.3,p);}ring('#fff0df',1.7,11);
  }else if(kind==='prism-link'){
   const d=29+u*10;for(const y2 of [-7,7]){const p=[[-d,y2],[d,y2]];stroke('#1c192c',6,p);stroke('#b5a6ff',2.5,p);}stroke('#fff3ff',2,[[0,-14],[0,14]]);
  }else if(kind==='fork-swipe'){
   for(const a of [0,Math.PI/2]){c.save();c.rotate(a);const p=[[-30,0],[30,0]];stroke('#241522',7,p);stroke('#ffd0af',3,p);c.restore();}
  }else if(kind==='bastion-slam'){
   const p=[[-24,-18],[11,-18],[27,0],[11,18],[-24,18]];stroke('#241522',7,p);stroke('#ffe4a9',3,p);
  }else if(kind==='rift-strike'){
   const d=24+u*9;for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,p=[[Math.cos(a)*12,Math.sin(a)*12],[Math.cos(a)*d,Math.sin(a)*d]];stroke('#241522',6,p);stroke('#ffc3ce',2.5,p);}ring('#fff0df',2,10);
  }else{
   const d=27-u*8;for(let i=0;i<4;i++){const a=i*Math.PI/2; c.save();c.rotate(a);const p=[[d,-7],[d-9,0],[d,7]];stroke('#241522',6,p);stroke('#e4ceff',2.5,p);c.restore();}ring('#fff0ff',2,9);
  }
 }finally{c.restore();}
}
