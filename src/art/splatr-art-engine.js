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
// ── CHUNK 2: THE THREE-COLOUR LAW ────────────────────────────────────────
// One vocabulary for the whole field, and three words in it:
//
//   SAFE    green  — you may cut this, with the blade you are holding NOW.
//   LETHAL  rose   — this will hurt you. Wind-ups, live hazards, landed hits.
//   REWARD  gold   — this pays you. Health, credits, a wave reward.
//
// The enemy body palette is deliberately free of the safe band (see
// `ENEMY_HUES` in src/color-law.js and the test that re-reads these literals),
// so green can only ever mean one thing. Nothing here is a new hue invented for
// this pass: the greens are the acid the game already paints with, the red is
// the hit line's own rose, and the gold is the pad's upgrade gold.
var LAW = {
  safe: "#ddff89",
  safeCore: "#f4ffd0",
  safeEdge: "#9dc94a",
  lethal: "#ff2b4a",
  lethalPale: "#ffd0d8",
  reward: "#ffd166",
  rewardCore: "#fff1c4",
  rewardEdge: "#b47b18"
};
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
    // CHUNK 2: hot rust, not gold. A Bastion pays nothing when it breaks, and
    // under the three-colour law gold is reserved for what DOES pay (see LAW).
    "#ff6b3d",
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
    drawNotchedVents(c,eq,p);
  }
  // One material language across arbitrary mixes: head mounts and lower
  // tail socket carry the CORE trim, without recoloring the eye cuts.
  if(eq.head && eq.head!=="none")for(const side of [-1,1])seam(c,[[side*.63,-.91],[side*.78,-.84]],h.trim,.035);
  seam(c,[[-.91,.64],[-.77,.75],[-.59,.75]],h.trim,.035);
  drawArmorShellState(c,eq,p);
  c.restore();
}
/** Portable state view; only authority-owned contacts/charges create a cue. */
function armorShellPose(state={},angle=0){
 const active=state.phase==='playing';
 return {shellAmount:active?(state.shellSpring?.amount||0):0,
  shellContactAngle:(state.shellSpring?.angle??state.shellImpact?.angle??state.shellRelease?.angle??0)-angle,
  shellGlanceAge:active?(state.shellImpact?.age??-1):-1,
  shellReleasedAmount:active?(state.shellRelease?.amount||0):0,
  shellReleaseAge:active?(state.shellRelease?.age??-1):-1};
}
function shellCompression(p={}){
 if(p.shellAmount>0)return .4+.6*Math.min(1,p.shellAmount/4);
 return !p.reducedMotion&&p.shellReleasedAmount>0&&p.shellReleaseAge>=0&&p.shellReleaseAge<9?(.4+.6*Math.min(1,p.shellReleasedAmount/4))*Math.max(0,1-p.shellReleaseAge/9):0;
}
/** No particles, independent timers or collider deformation. Bevel line follows
 * the actual contact bearing; interlocking plates hold only a real reserve. */
export function drawArmorShellState(c,eq={},p={}){
 const a=Number.isFinite(p.shellContactAngle)?p.shellContactAngle:0,pal=corePalette(eq.core);
 c.save();try{
 if(eq.body==='chamfer'&&p.shellGlanceAge>=0&&p.shellGlanceAge<7){
  const age=p.reducedMotion?0:p.shellGlanceAge,quadrant=Math.round(a/(Math.PI/2))*Math.PI/2;
  c.rotate(quadrant);c.globalAlpha*=1-age/7;
  seam(c,[[.72,-.96],[.98,-.70],[.98,-.20]],pal.light,.075);
  if(!p.reducedMotion){
   const t=age/7;c.translate(.94,-.62+t*.35);c.rotate(a-quadrant+Math.PI/4);
   seam(c,[[-.12,0],[.15,0]],pal.primary,.045);
  }
 }
 if(eq.body==='segmented'){
  const k=shellCompression(p);if(!(k>0))return;
  const dx=-Math.cos(a)*k*.14,dy=-Math.sin(a)*k*.14;
  for(const side of [-1,1]){
   c.save();c.translate(dx,dy);
   panel(c,[[side*.68,.22],[side*.97,.18],[side*.97,.79],[side*.66,.77]],'#37544e',.035);
   seam(c,[[side*.73,.34],[side*.94,.31]],pal.light,.055);
   seam(c,[[side*.73,.55],[side*.94,.52]],pal.primary,.045);c.restore();
  }
  // One compressed central ratchet, not an extra whole-body squash.
  seam(c,[[-.38,.79],[-.21,.72],[-.08,.81],[.06,.72],[.19,.81],[.34,.74]],pal.light,.05);
 }
 }finally{c.restore();}
}
/** Normalized BODY-local vent gates. Reads an actual recovery view; no
 * independent clock, particles, thrust, resource writes or ambient pulsing. */
export function drawNotchedVents(c,eq={},pose={}) {
  if(eq.body!=='notched'||!pose.focusRecovering||pose.aiming||!(pose.focusLevel<1)||!(pose.focusLevel>=0))return;
  const palette=corePalette(eq.core),age=pose.recoveryAge??8;
  c.save();try{
    for(const side of [-1,1]){
      panel(c,[[side*.77,.47],[side*1.01,.36],[side*1.04,.78],[side*.78,.69]],'#101723',.025);
      for(let i=0;i<3;i++)seam(c,[[side*.83,.46+i*.1],[side*1.01,.41+i*.13]],i===1?palette.light:palette.primary,.055);
      if(!pose.reducedMotion&&age>=0&&age<6){
        c.globalAlpha=1-age/6;
        seam(c,[[side*1.08,.58],[side*(1.26+age*.025),.58]],palette.light,.045);
        c.globalAlpha=1;
      }
    }
  }finally{c.restore();}
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
/** Seven fixed mechanical grammars. Names describe construction, not powers.
 * No actor, charge clock, emitter or ownership is retained in this catalogue. */
export const CORE_MECHANISMS=freezeConstruction({
 standard:{title:'Standard Heart',mechanism:'SEALED CROSS BRACE',parts:'DRY COVER / CENTRAL KEEPER',receipt:'BALANCED / NO STORED CORE ATTACK'},
 grav:{title:'Grav Core',mechanism:'INWARD IRIS',parts:'THREE SHUTTERS / NEGATIVE CENTER',receipt:'AIM PULL / SMALL FANGS WITHIN 220'},
 time:{title:'Time Crystal',mechanism:'CALIBRATED ESCAPEMENT',parts:'FORKED RAILS / CRYSTAL INDEX',receipt:'AFTER-KILL FOCUS RECOVERY / NOT A FREEZE'},
 riot:{title:'Riot Reactor',mechanism:'IGNITION PISTON',parts:'OPPOSED SHOES / REACTOR SLUG',receipt:'4 CHAIN TO DRIVE / MAX EDGE 2'},
 glass:{title:'Glass Cannon',mechanism:'SUSPENDED FRACTURE',parts:'SPLIT CRADLE / FRAGILE FACET',receipt:'SCORE x2 / MAX HEALTH 1 / NOT A SHIELD'},
 magnet:{title:'Magnet Dynamo',mechanism:'TWIN POLE CLAMP',parts:'OPPOSED POLES / OPEN CONTACT GAP',receipt:'CLOSE CUT WIDTH +20% WITHIN 100'},
 echo:{title:'Echo Heart',mechanism:'THREE LATCH REGISTER',parts:'THREE CHAIN CELLS / OUTLINED PLATES',receipt:'EVERY 3 CHAIN / STATIONARY CORE BLADE'},
});
const CORE_CARRIERS=freezeConstruction({
 paper:[[-.72,-.29],[.61,-.29],[.73,-.13],[.73,.26],[-.60,.30],[-.72,.16]],
 gold:[[-.72,-.19],[-.53,-.30],[.63,-.30],[.73,-.10],[.73,.24],[-.56,.30],[-.72,.12]],
 obsidian:[[-.73,-.12],[-.43,-.30],[.39,-.27],[.73,-.11],[.62,.23],[.18,.30],[-.61,.25]],
 prism:[[-.72,-.13],[-.44,-.30],[.41,-.30],[.73,-.11],[.61,.21],[.13,.30],[-.55,.25]],
 hologram:[[-.72,-.29],[.73,-.29],[.73,.29],[-.72,.29]],
 iron:[[-.72,-.19],[-.59,-.30],[.58,-.30],[.73,-.15],[.73,.20],[.56,.30],[-.59,.30],[-.72,.16]],
 lava:[[-.72,-.19],[-.52,-.29],[-.12,-.24],[.26,-.30],[.62,-.25],[.73,-.10],[.66,.17],[.45,.30],[-.21,.25],[-.61,.30],[-.72,.11]],
 chamfer:[[-.56,-.30],[.56,-.30],[.73,-.12],[.73,.12],[.56,.30],[-.56,.30],[-.72,.12],[-.72,-.12]],
 notched:[[-.72,-.29],[.73,-.29],[.73,-.09],[.66,.005],[.73,.10],[.73,.29],[-.72,.29],[-.72,.10],[-.65,.005],[-.72,-.09]],
 segmented:[[-.72,-.26],[-.25,-.26],[-.25,-.30],[.23,-.30],[.23,-.26],[.73,-.26],[.73,.26],[.23,.26],[.23,.30],[-.25,.30],[-.25,.26],[-.72,.26]],
});
export function resolveCoreMechanism(core='standard'){return Object.hasOwn(CORE_MECHANISMS,core)?CORE_MECHANISMS[core]:CORE_MECHANISMS.standard;}
/** Read-only view of EXISTING authority. No inferred shot charge or timer.
 * Time reports real passive return, never pretends to know its private bonus
 * timer. Echo distinguishes chain remainder from actual stationary sources. */
export function coreMechanismPose(state={}){
 const playing=state.phase==='playing'&&!state.opening,finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
 let echoes=0;if(playing)for(const source of state.equipmentFx?.echoes||[])if(!source.upgradeEcho&&source.ticks>0)echoes++;
 return {coreLive:playing,coreChain:playing?Math.max(0,Math.floor(finite(state.chain))):0,
  coreEchoes:echoes,coreDrive:playing&&finite(state.drive)>0,
  corePull:playing&&state.held===true,coreRecovering:playing&&state.focusRecoveryActive===true,
  coreFocus:playing?Math.max(0,Math.min(1,finite(state.focus))):0,
  coreHull:playing&&Number.isFinite(state.hp)?Math.max(0,state.hp):null};
}
/** Fitted, capped cartridge. Opaque shells are not made transparent. This
 * replaces the old small floating symbol; the chamber itself owns all energy.
 * Body-local bounds x[-.66,.81], y[.32,.94] protect eyes and side shell cues. */
function drawCoreChamber(c,eq,t,palette,pose2={}){
 const id=Object.hasOwn(CORE_MECHANISMS,eq.core)?eq.core:'standard',body=resolveBodyConstruction(eq.body),
  material=resolveAssemblyConstruction(eq).material,detail=(pose2.artRadius??48)>=38,
  live=pose2.coreLive===true,drive=live&&pose2.coreDrive===true,
  pull=live&&pose2.corePull===true,recover=live&&pose2.coreRecovering===true,
  chain=live&&Number.isFinite(pose2.coreChain)?Math.max(0,Math.floor(pose2.coreChain)):0,
  echoes=live&&Number.isFinite(pose2.coreEchoes)?Math.max(0,pose2.coreEchoes):0,
  emission=Math.max(0,Math.min(1,pose2.emission??1)),clock=pose2.reducedMotion?0:t;
 c.save();try{
 c.translate(.075,.635);
 const outer=CORE_CARRIERS[Object.hasOwn(CORE_CARRIERS,eq.body)?eq.body:'paper'];
 panel(c,outer,material.shade,.045);
 panel(c,[[-.69,-.18],[-.56,-.265],[.56,-.265],[.67,-.15],[-.55,-.15],[-.66,-.05]],material.edge,0);
 panel(c,[[-.64,-.13],[.61,-.13],[.64,.15],[.52,.23],[-.54,.23],[-.64,.13]],material.well,.025);
 // Opaque casing, not a transparent hole through the cube.
 const well=[[-.55,-.17],[.54,-.17],[.61,-.08],[.61,.12],[.50,.22],[-.53,.22],[-.62,.11],[-.62,-.08]];
 c.save();path(c,well);c.clip();
 panel(c,well,'#10141e',0);
 panel(c,[[-.61,-.17],[.59,-.17],[.52,-.09],[-.46,-.09],[-.46,.22],[-.61,.22]],body.shadow,0);
 // Fixed silhouettes remain different even when energy is disabled.
 const bright=blend(material.face,palette.primary,.30*emission),edge=blend(material.edge,palette.light,.45*emission),
  energy=blend('#444554',palette.primary,emission),secondary=blend('#3e4353',palette.secondary,emission),
  light=blend(material.edge,palette.light,emission);
 if(id==='standard'){
  panel(c,[[-.53,-.12],[-.12,-.12],[.01,.015],[-.17,.19],[-.54,.19]],material.face,.025);
  panel(c,[[.53,-.12],[.13,-.12],[.01,.015],[.18,.19],[.54,.19]],material.shade,.025);
  seam(c,[[-.49,-.09],[-.04,.04],[-.19,.17]],edge,.035);
  panel(c,[[-.14,-.10],[.14,-.10],[.23,.04],[.11,.17],[-.11,.17],[-.23,.04]],material.well,.025);
  seam(c,[[-.09,.025],[.10,.025]],energy,.055);
 }else if(id==='grav'){
  // Broad iris jaws route inward. Only a real aim field closes the aperture.
  const spin=clock*.012,aperture=pull?.045:.105;
  c.save();c.translate(0,.025);c.scale(1,.68);c.rotate(spin);
  for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);
   panel(c,[[aperture,-.04],[.18,-.23],[.37,-.14],[.28,.11],[.12,.16]],i%2?material.shade:bright,.026);
   seam(c,[[.35,-.11],[.23,-.15],[aperture,-.015]],pull?light:energy,.032);
  }
  circle(c,0,0,aperture,'#05070e');c.restore();
  if(detail)for(const side of [-1,1])seam(c,[[side*.49,-.10],[side*.40,.015],[side*.49,.14]],secondary,.03);
 }else if(id==='time'){
  for(const side of [-1,1]){
   panel(c,[[side*.15,-.15],[side*.42,-.15],[side*.42,-.06],[side*.30,-.06],[side*.30,.12],[side*.43,.12],[side*.43,.19],[side*.15,.19]],bright,.022);
   if(detail)for(let i=0;i<3;i++)seam(c,[[side*.35,-.09+i*.10],[side*.45,-.09+i*.10]],edge,.02);
  }
  panel(c,[[0,-.17],[.20,.02],[0,.22],[-.20,.02]],secondary,.025);
  panel(c,[[0,-.14],[.13,.02],[0,.17]],light,0);
  panel(c,[[0,-.14],[-.13,.02],[0,.17]],energy,0);
  // Calibration index is ambient mechanism motion, never a fill/charge meter.
  const index=Math.sin(clock*.05)*.09;
  seam(c,[[-.095,index+.02],[.095,index+.02]],edge,.025);
  if(recover){const focus=Math.max(0,Math.min(1,pose2.coreFocus||0));seam(c,[[-.48,.18],[-.48,.18-.28*focus]],light,.045);}
 }else if(id==='riot'){
  const gap=drive?.105:0;
  for(const side of [-1,1]){
   panel(c,[[side*(.26+gap),-.14],[side*.53,-.14],[side*.53,.17],[side*(.26+gap),.17]],material.face,.028);
   seam(c,[[side*.48,-.09],[side*.48,.12]],drive?light:secondary,.055);
   if(detail)for(let i=0;i<2;i++)seam(c,[[side*(.28+gap),-.07+i*.16],[side*.43,-.07+i*.16]],material.well,.025);
  }
  panel(c,[[.05,-.19],[-.22,.04],[-.045,.035],[-.10,.23],[.23,-.03],[.04,-.025]],drive?light:energy,.02);
  if(drive)seam(c,[[-.16,-.15],[.20,-.15]],energy,.04);
 }else if(id==='glass'){
  for(const side of [-1,1]){
   panel(c,[[side*.31,-.14],[side*.52,-.14],[side*.39,.04],[side*.53,.18],[side*.31,.18],[side*.19,.04]],material.face,.025);
  }
  panel(c,[[0,-.18],[.31,-.025],[.16,.21],[-.17,.21],[-.31,-.025]],'#746879',.025);
  panel(c,[[0,-.18],[.31,-.025],[.02,.025]],edge,0);
  panel(c,[[0,-.18],[-.31,-.025],[.02,.025]],bright,0);
  panel(c,[[.02,.025],[.31,-.025],[.16,.21]],'#b2a5b6',0);
  panel(c,[[.02,.025],[-.31,-.025],[-.17,.21]],secondary,0);
  seam(c,[[.01,-.15],[-.04,-.025],[.07,.055],[.02,.19]],secondary,.035);
  // Fragile construction is not an invented renewable shield gauge.
  if(live&&pose2.coreHull===0)seam(c,[[-.25,-.08],[.20,.17]],'#171320',.065);
  if(detail){const x=Math.sin(clock*.025)*.025;seam(c,[[.09+x,-.09],[.19+x,-.04]],light,.022);}
 }else if(id==='magnet'){
  for(const side of [-1,1]){
   const col=side<0?energy:secondary;
   panel(c,[[side*.10,-.15],[side*.46,-.15],[side*.53,-.07],[side*.53,.18],[side*.32,.18],[side*.32,-.015],[side*.10,-.015]],col,.025);
   panel(c,[[side*.10,-.15],[side*.23,-.15],[side*.23,-.015],[side*.10,-.015]],edge,0);
   seam(c,[[side*.37,.04],[side*.47,.04]],material.well,.03);
  }
  // Open gap; no cosmetic tether/pull beam between non-targets.
  seam(c,[[-.07,.17],[.07,.17]],bright,.035);
 }else if(id==='echo'){
  const count=chain%3;
  for(let i=0;i<3;i++){
   const x=-.46+i*.33,filled=live&&i<count;
   panel(c,[[x,-.14],[x+.24,-.14],[x+.29,-.07],[x+.29,.17],[x+.03,.17],[x,.10]],filled?secondary:'#1b1929',.022);
   seam(c,[[x+.01,-.10],[x+.20,-.10],[x+.25,-.045],[x+.25,.13]],filled?light:bright,.03);
   if(detail){const offset=Math.sin(clock*.03+i)*.008;seam(c,[[x+.05,.02+offset],[x+.19,.02+offset]],filled?energy:material.shade,.03);}
  }
  // A stationary source is NOT a fourth charge cell or a next-dash pulse.
  if(echoes>0)seam(c,[[-.46,.20],[.44,.20]],light,.04);
 }
 c.restore();
 // Seated fasteners/wall stay over internal movement. Never cut eye surfaces.
 for(const side of [-1,1]){
  if(body.kind==='facet')panel(c,[[side*.58,-.09],[side*.69,-.03],[side*.62,.17],[side*.55,.07]],material.face,.018);
  else if(body.kind==='fold'||eq.body==='gold'){
   panel(c,[[side*.56,-.12],[side*.70,-.08],[side*.68,.17],[side*.57,.12]],material.face,.018);
   seam(c,[[side*.57,-.10],[side*.66,.13]],material.edge,.025);
  }else if(body.kind==='glass'){
   seam(c,[[side*.59,-.11],[side*.69,-.11],[side*.69,.16],[side*.59,.16]],material.edge,.025);
  }else{
   panel(c,[[side*.60,-.08],[side*.69,-.08],[side*.69,.15],[side*.59,.15]],material.face,.018);
   if(detail)seam(c,[[side*.62,-.015],[side*.66,-.015]],material.well,.027);
  }
 }
 seam(c,[[-.55,.265],[.51,.265],[.66,.18]],material.edge,.028);
 }finally{c.restore();}
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
/** Shared functional/artistic family priority: most recipe parts wins;
 * equal specificity keeps catalogue order. Never reorder the discovery list. */
function selectedHybrid(matches) {
  let active = null;
  for (const match of matches) {
    if (match.complete && (!active || match.total > active.total)) active = match;
  }
  return active;
}
function activeHybrid(eq) {
  return selectedHybrid(hybridMatches(eq));
}
function hybridHint(eq) {
  const matches = hybridMatches(eq), active = selectedHybrid(matches);
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
  const h=resolveVisualHarmony(eq,0,pose),selected=activeHybrid(eq),family=selected?.id||null;
  const performance=pose.performance||resolveCharacterPerformance(pose,0);
  const detail=radius<29?0:radius<49?1:2;
  return Object.freeze({family,detail,energy:h.primary,light:h.light,
    accent:family?blend(h.primary,selected.color,.22):h.trim,
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
  }else if(id==='phantom'){
    panel(c,[[-.94,-.72],[-1.17,-.72],[-1.17,.73],[-.93,.93]],'#18333c',.055);
    seam(c,[[-1.13,-.59],[-1.13,.65],[-.95,.80]],d.light,.045);
  }
  c.restore();
}
// Front construction replaces the old generic family stripe. All plates stay
// in the shell silhouette, outside eye cuts and the supported core chamber.
const ASSEMBLY_FAMILY_PLATES=freezeConstruction({
 wyrm:[[[.66,.23],[.97,.17],[.88,.78],[.60,.91],[.70,.55]],[[-.75,.24],[-.47,.39],[-.56,.75],[-.75,.88]]],
 ronin:[[[-.75,.27],[.90,.22],[.90,.37],[-.75,.45]],[[-.73,.55],[.90,.49],[.89,.64],[-.73,.70]]],
 king:[[[-.76,.28],[-.22,.30],[.00,.60],[-.28,.91],[-.75,.77]],[[.79,.24],[.96,.21],[.96,.85],[.79,.95]]],
 phantom:[[[-.76,-.65],[-.58,-.65],[-.58,.78],[-.27,.78],[-.27,.94],[-.76,.94]],[[.79,-.68],[.97,-.68],[.97,.89],[.79,.89]]],
 reaper:[[[-.76,.22],[-.44,.39],[-.45,.86],[-.77,.73]],[[.71,.29],[.97,.18],[.97,.80],[.70,.94]]],
 eater:[[[-.78,.22],[-.51,.41],[-.63,.65],[-.36,.90],[-.72,.85],[-.87,.54]],[[.80,.27],[.96,.34],[.89,.84],[.72,.94]]],
 sun:[[[-.76,.22],[.02,.50],[-.36,.90],[-.74,.77]],[[.02,.50],[.93,.20],[.78,.86]]],
 glacier:[[[-.75,-.69],[-.42,-.81],[-.08,-.65],[-.37,-.56]],[[.40,-.78],[.79,-.86],[.98,-.68],[.72,-.53]],[[-.77,.34],[-.56,.23],[-.51,.77],[-.75,.91]]],
 briar:[[[-.84,.19],[-.60,.34],[-.73,.53],[-.53,.74],[-.75,.94],[-.91,.65]],[[.79,-.69],[.96,-.79],[.96,-.55],[.76,-.44]]],
 sentinel:[[[-.79,.25],[-.53,.28],[-.53,.85],[-.78,.94]],[[.76,.22],[.97,.22],[.97,.86],[.76,.93]]],
 arcade:[[[-.77,.25],[-.55,.25],[-.55,.58],[-.38,.58],[-.38,.77],[-.19,.77],[-.19,.95],[-.77,.95]],[[.78,-.73],[.97,-.73],[.97,-.54],[.78,-.54]]],
 storm:[[[-.73,-.69],[-.59,-.91],[-.28,-.91],[-.14,-.64]],[[.20,-.66],[.36,-.91],[.70,-.91],[.87,-.70]],[[-.76,.25],[-.55,.32],[-.55,.86],[-.76,.94]]],
 forge:[[[-.76,.22],[-.40,.36],[-.39,.90],[-.76,.81]],[[.70,.24],[.97,.17],[.97,.78],[.71,.95]],[[-.73,-.68],[.85,-.76],[.79,-.56],[-.64,-.50]]],
 wraith:[[[-.77,-.70],[-.58,-.70],[-.58,.78],[-.32,.78],[-.32,.95],[-.77,.95]],[[.76,-.71],[.96,-.74],[.96,.93],[.76,.93]]],
 bulwark:[[[-.77,.22],[-.45,.30],[-.43,.71],[-.62,.94],[-.79,.72]],[[.70,.29],[.97,.20],[.97,.75],[.79,.96],[.65,.75]]],
 razoredge:[[[-.77,.20],[-.56,.28],[-.43,.88],[-.72,.95]],[[.75,.22],[.96,.18],[.96,.84],[.75,.95]],[[-.71,-.68],[.03,-.60],[.85,-.77],[.85,-.62],[.03,-.45],[-.68,-.54]]],
 orbit:[[[-.78,.23],[-.48,.40],[-.53,.74],[-.79,.91]],[[.73,.32],[.95,.18],[.95,.81],[.72,.94]],[[-.71,-.70],[.08,-.57],[.85,-.76],[.68,-.48],[.09,-.38],[-.54,-.48]]],
});
function drawHybridIntegration(c,eq,t,p){
 const a=resolveAssemblyConstruction(eq),shapes=ASSEMBLY_FAMILY_PLATES[a.family];if(!shapes)return;
 const d=resolveArtDirection(eq,p.artRadius??24,p),m=a.material;
 c.save();try{
 path(c,SHAPE_MODIFIERS.find(x=>x.id===eq.body)?.outline||HERO_SHELL);c.clip();
 // Static structural zones only. Protect the eyes and chamber from all families.
 c.beginPath();c.rect(-2,-2,4,4);c.rect(-.73,-.53,1.61,.76);c.rect(-.66,.32,1.47,.62);c.clip('evenodd');
 shapes.forEach((shape,i)=>{
  panel(c,shape,i%2?m.shade:m.well,.045);
  // A broad bevel face, not a glowing family aura or additional emitter.
  seam(c,[shape[0],shape[1],shape[2]],i%2?m.light||m.edge:d.rim,.045);
 });
 if(d.detail){
  if(['sentinel','storm','bulwark'].includes(a.family))for(let i=0;i<3;i++)seam(c,[[-.73,.41+i*.14],[-.59,.41+i*.14]],d.energy,.035);
  if(['ronin','razoredge'].includes(a.family))for(let i=0;i<3;i++)seam(c,[[-.67+i*.18,.33],[-.63+i*.18,.43]],d.light,.025);
  if(['king','sun','forge'].includes(a.family))panel(c,[[-.66,.37],[-.49,.48],[-.63,.66],[-.72,.51]],d.accent,.025);
  if(a.family==='arcade')for(let i=0;i<3;i++){c.fillStyle=i%2?d.accent:m.edge;c.fillRect(-.71+i*.14,.80,.09,.09);}
 }
 }finally{c.restore();}
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
  // Spark routing can terminate at the casing, never become fake charge cells
  // or paint over the seven mechanisms' protected live-state interior.
  c.beginPath();c.rect(-10,-10,20,20);c.rect(-.55,.455,1.25,.41);c.clip('evenodd');
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
      seam(c,[[-.72,.76],[-.62,.76]],d.accent,.035);
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
function freezeConstruction(x){if(x&&typeof x==="object"){Object.values(x).forEach(freezeConstruction);Object.freeze(x);}return x;}
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
/** Shared shell architecture: broad cel planes, never a new collision shape.
 * Surface names describe construction only, not unimplemented powers. */
const ASSEMBLY_MATERIALS=freezeConstruction({
 paper:{name:'FOLDED PAPER',mount:'FOLDED TAB',face:'#f0e6ce',edge:'#fffbed',shade:'#b29787',well:'#514344'},
 obsidian:{name:'KEYED OBSIDIAN',mount:'INSET KEY',face:'#343849',edge:'#a6adc0',shade:'#131824',well:'#080d17'},
 hologram:{name:'PROJECTED MESH',mount:'VERTEX BRACKET',face:'#205060',edge:'#9ae9ef',shade:'#122936',well:'#0c1b29'},
 prism:{name:'FACETED CRYSTAL',mount:'FACET COLLAR',face:'#b39ed3',edge:'#f5e6ff',shade:'#54466f',well:'#28223c'},
 iron:{name:'BOLTED IRON',mount:'BOLTED PLATE',face:'#71838f',edge:'#dbe1df',shade:'#33414b',well:'#1b2631'},
 lava:{name:'CRACKED BASALT',mount:'THERMAL SEAT',face:'#51444a',edge:'#a59891',shade:'#211d29',well:'#100f18'},
 gold:{name:'FOLDED FOIL',mount:'CREASED SEAT',face:'#d6af63',edge:'#fff3bd',shade:'#886236',well:'#49352a'},
 chamfer:{name:'MACHINED BEVEL',mount:'BEVELED SEAT',face:'#9aaec0',edge:'#ecf4fb',shade:'#4c657a',well:'#253746'},
 notched:{name:'VENTED FRAME',mount:'RECESSED SOCKET',face:'#b887a0',edge:'#ffe0e9',shade:'#74445c',well:'#352434'},
 segmented:{name:'INTERLOCKED PLATES',mount:'FLOATING SEAT',face:'#8eb2a4',edge:'#d7eee1',shade:'#3d6058',well:'#1c3633'},
});
const assemblyCache=new Map(),ASSEMBLY_CACHE_LIMIT=128;
/** A bounded immutable construction cache, keyed only by visual-owning slots.
 * No actors, canvas surfaces, time, ownership or mutable equipment are retained. */
export function resolveAssemblyConstruction(equipment={}){
 const eq=equipment||{},body=Object.hasOwn(ASSEMBLY_MATERIALS,eq.body)?eq.body:'paper';
 const key=[body,eq.head||'none',eq.eyes||'ninja',eq.core||'standard',eq.tail||'ribbon',eq.slash||'razor',eq.world||'twilight'].join('|');
 let value=assemblyCache.get(key);if(value)return value;
 const selected=activeHybrid({...eq,body,head:eq.head||'none',eyes:eq.eyes||'ninja',core:eq.core||'standard',tail:eq.tail||'ribbon',slash:eq.slash||'razor',world:eq.world||'twilight'});
 value=freezeConstruction({body,head:eq.head||'none',eyes:eq.eyes||'ninja',core:eq.core||'standard',tail:eq.tail||'ribbon',
  headTitle:ITEMS.find(i=>i.id===(eq.head||'none'))?.name||'Bare Head',
  coreTitle:ITEMS.find(i=>i.id===(eq.core||'standard'))?.name||'Standard Heart',
  tailTitle:ITEMS.find(i=>i.id===(eq.tail||'ribbon'))?.name||'Ribbon',
  material:ASSEMBLY_MATERIALS[body],family:selected?.id||null,familyTitle:selected?.title||'CUSTOM ASSEMBLY',
  headSeat:[0,-.96],tailSeat:[-.96,-.30],weaponSeat:[.87,.62],
  worldRim:{tokyo:'#89ccd6',foundry:'#dca780',manga:'#c7bfc8',synth:'#c9a1c6',void:'#acb6ce'}[eq.world]||'#d9d6c6'});
 if(assemblyCache.size>=ASSEMBLY_CACHE_LIMIT)assemblyCache.delete(assemblyCache.keys().next().value);
 assemblyCache.set(key,value);return value;
}
export function assemblyCacheStats(){return Object.freeze({entries:assemblyCache.size,limit:ASSEMBLY_CACHE_LIMIT});}
export function clearAssemblyCache(){assemblyCache.clear();}
/** Large material shapes survive at gameplay scale. Detail is radius-gated;
 * nothing emits, pulses, opens a cooling vent or claims a charge at idle. */
function drawAssemblyShell(c,eq,p){
 const a=resolveAssemblyConstruction(eq),m=a.material,detail=p.artRadius>=38,pal=corePalette(eq.core);
 c.save();try{
 // One deep lower chassis beneath the face. Eye cuts are drawn later on top.
 panel(c,[[-.77,.20],[.91,.16],[.91,.88],[-.70,.91]],m.shade,.045);
 if(a.body==='paper'){
  panel(c,[[-.77,.20],[.91,.16],[.08,.74]],m.edge,.035);
  panel(c,[[-.77,.20],[.08,.74],[-.70,.91]],m.face,0);
  panel(c,[[.91,.16],[.91,.88],[.08,.74]],m.face,0);
  seam(c,[[-.67,.87],[.08,.74],[.84,.85]],m.well,.035);
  if(detail)seam(c,[[-.63,.39],[-.38,.47]],m.shade,.025);
 }else if(a.body==='obsidian'){
  panel(c,[[-.76,.23],[-.09,.44],[-.37,.93],[-.74,.87]],m.face,.04);
  panel(c,[[-.09,.44],[.91,.17],[.66,.83],[-.37,.93]],'#242938',.04);
  seam(c,[[-.73,.24],[-.09,.44],[.66,.83]],m.edge,.038);
  if(detail)seam(c,[[-.09,.44],[-.37,.86]],'#656e88',.025);
 }else if(a.body==='hologram'){
  panel(c,[[-.74,.22],[.89,.19],[.89,.88],[-.73,.89]],m.well,.035);
  seam(c,[[-.73,.52],[.89,.49]],m.face,.045);
  seam(c,[[-.30,.23],[-.30,.88],[.30,.87],[.30,.21]],m.face,.03);
  for(const side of [-1,1])seam(c,[[side*.50,.22],[side*.77,.22],[side*.77,.42]],m.edge,.05);
  seam(c,[[-.73,.69],[-.73,.89],[-.47,.89]],m.edge,.045);
 }else if(a.body==='prism'){
  panel(c,[[-.76,.21],[.02,.28],[-.30,.92],[-.72,.82]],m.edge,.04);
  panel(c,[[.02,.28],[.91,.18],[.80,.85],[-.30,.92]],m.face,.04);
  panel(c,[[.02,.28],[.80,.85],[.27,.80]],'#75638f',0);
  if(detail)seam(c,[[-.71,.25],[-.44,.42],[-.28,.80]],'#ffffffb0',.028);
 }else if(a.body==='iron'){
  panel(c,[[-.78,.22],[.91,.18],[.91,.81],[.70,.96],[-.56,.96],[-.77,.79]],m.face,.07);
  panel(c,[[-.65,.34],[.78,.31],[.78,.79],[-.56,.83]],m.shade,.035);
  seam(c,[[-.65,.34],[.78,.31]],m.edge,.055);
  for(const [x,y]of [[-.66,.29],[.80,.27],[-.63,.82]]){circle(c,x,y,.055,m.well);if(detail)seam(c,[[x-.027,y],[x+.027,y]],m.edge,.02);}
 }else if(a.body==='lava'){
  panel(c,[[-.77,.24],[-.14,.24],[-.29,.57],[-.03,.74],[-.20,.94],[-.73,.86]],m.face,.05);
  panel(c,[[.06,.23],[.89,.19],[.90,.84],[.02,.93],[.19,.68],[-.07,.54]],'#39323c',.05);
  seam(c,[[-.04,.25],[-.17,.54],[.09,.72],[-.07,.91]],'#d9845b',.065);
  if(detail)seam(c,[[.09,.72],[.50,.56],[.89,.68]],'#9d604b',.035);
 }else if(a.body==='gold'){
  panel(c,[[-.76,.22],[.89,.18],[.89,.87],[-.65,.90]],m.face,.04);
  panel(c,[[-.76,.22],[.18,.57],[-.65,.90]],m.edge,0);
  panel(c,[[.18,.57],[.89,.18],[.79,.83]],m.shade,0);
  seam(c,[[-.70,.24],[.18,.57],[.80,.85]],'#fff4c7',.045);
  if(detail)panel(c,[[-.65,.66],[-.38,.78],[-.65,.89]],'#fff8dc',0);
 }else if(a.body==='chamfer'){
  panel(c,[[-.76,.22],[.75,.19],[.92,.34],[.92,.74],[.71,.95],[-.55,.95],[-.77,.74]],m.face,.05);
  panel(c,[[-.60,.35],[.67,.32],[.78,.43],[.78,.72],[.61,.82],[-.50,.82],[-.63,.70]],m.shade,.035);
  seam(c,[[-.76,.71],[-.55,.94],[.71,.94],[.91,.74]],m.edge,.05);
 }else if(a.body==='notched'){
  panel(c,[[-.76,.20],[.90,.18],[.90,.38],[.72,.46],[.78,.74],[.62,.93],[-.57,.93],[-.76,.72]],m.face,.05);
  panel(c,[[-.56,.36],[.64,.32],[.61,.78],[-.47,.82]],m.shade,.035);
  // Physical recesses stay unlit: C25 alone owns the active vent slats.
  for(const side of [-1,1])panel(c,[[side*.74,.39],[side*.94,.35],[side*.94,.80],[side*.74,.75]],m.well,.025);
 }else if(a.body==='segmented'){
  const k=shellCompression(p),dx=-Math.cos(p.shellContactAngle||0)*k*.14,dy=-Math.sin(p.shellContactAngle||0)*k*.14;
  for(const side of [-1,1]){
   c.save();c.translate(dx,dy);
   panel(c,[[side*.07,.25],[side*.85,.20],[side*.85,.83],[side*.11,.91]],m.face,.065);
   seam(c,[[side*.13,.51],[side*.83,.46]],m.well,.07);
   seam(c,[[side*.16,.30],[side*.76,.27]],m.edge,.045);c.restore();
  }
 }
 // Restrained rim: world light may tint a surface, never recolor the face/core.
 seam(c,[[.93,.22],[.93,.84],[.77,.95]],a.worldRim,.03);
 // A supported core seat even on the free Standard Heart. No fake power light.
 if((eq.core||'standard')==='standard'){
  panel(c,[[.07,.55],[.49,.52],[.65,.66],[.48,.84],[.08,.85],[-.02,.70]],m.well,.035);
  for(let i=0;i<3;i++)panel(c,[[.08+i*.15,.65],[.17+i*.15,.64],[.17+i*.15,.76],[.08+i*.15,.77]],m.edge,0);
 }
 }finally{c.restore();}
}
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
/** A fitted mechanical/material joint, not an ability indicator. Socket-local
 * dimensions are bounded; callers seat it under the owned attachment. */
function drawAssemblySocket(c,assembly,detail=false){
 const m=assembly.material,id=assembly.body;
 panel(c,[[-.32,-.11],[.23,-.11],[.32,-.03],[.25,.13],[-.28,.13]],m.well,.045);
 if(id==='paper'||id==='gold'){
  panel(c,[[-.31,-.11],[-.05,-.04],[-.08,.14],[-.31,.08]],m.face,.025);
  panel(c,[[.23,-.11],[.31,-.03],[.25,.13],[.04,.09]],m.edge,.025);
  seam(c,[[-.25,-.06],[-.08,-.02]],m.edge,.025);
 }else if(id==='hologram'){
  seam(c,[[-.32,.09],[-.32,-.12],[-.15,-.12]],m.edge,.035);
  seam(c,[[.14,.13],[.32,.13],[.32,-.08]],m.edge,.035);
 }else if(id==='iron'){
  panel(c,[[-.32,-.13],[.32,-.13],[.32,.13],[-.32,.13]],m.face,.035);
  for(const x of [-.23,.23]){circle(c,x,0,.045,m.well);if(detail)seam(c,[[x-.025,0],[x+.025,0]],m.edge,.017);}
 }else if(id==='prism'||id==='obsidian'||id==='chamfer'){
  panel(c,[[-.33,-.01],[-.22,-.15],[.20,-.15],[.34,0],[.22,.14],[-.22,.14]],m.face,.035);
  seam(c,[[-.23,-.12],[.20,-.12],[.29,0]],m.edge,.04);
  panel(c,[[-.13,-.04],[.14,-.04],[.14,.05],[-.13,.05]],m.well,0);
 }else if(id==='lava'){
  panel(c,[[-.33,-.12],[-.07,-.07],[.13,-.15],[.33,-.05],[.27,.14],[-.27,.14]],m.face,.035);
  seam(c,[[-.10,-.09],[-.04,.02],[-.12,.12]],'#b67858',.035);
 }else if(id==='notched'){
  panel(c,[[-.32,-.13],[.32,-.13],[.32,.14],[-.32,.14]],m.shade,.035);
  for(const x of [-.21,.16])panel(c,[[x,-.07],[x+.07,-.07],[x+.07,.09],[x,.09]],m.well,0);
  seam(c,[[-.30,-.11],[.29,-.11]],m.edge,.03);
 }else{
  for(const side of [-1,1])panel(c,[[side*.05,-.12],[side*.30,-.12],[side*.30,.13],[side*.05,.13]],m.face,.035);
  seam(c,[[-.27,.07],[-.07,.07]],m.edge,.025);
 }
}
function attachmentCollars(c,eq,t,p){
 const a=resolveAssemblyConstruction(eq),detail=p.artRadius>=38;
 c.save();try{
 if(eq.tail){
  const roots=eq.tail==='thrusters'?[-.5,.48]:[eq.tail==='anchor'?.25:eq.tail==='wings'?0:eq.tail==='spectrum'||eq.tail==='viper-tails'?-.55:-.34];
  for(const y of roots){c.save();c.translate(-.92,y);c.rotate(Math.PI/2);drawAssemblySocket(c,a,detail);c.restore();}
 }
 if(eq.head&&eq.head!=='none'){
  c.save();c.translate(0,-.96);c.scale(2.15,.9);drawAssemblySocket(c,a,detail);c.restore();
 }
 }finally{c.restore();}
}
/** Seven physical tail rigs. Motion reads accepted action/velocity, never an
 * independent idle clock. No tail path is a weapon or a particle source. */
export function drawTailToolkit(c,{equipment={},pose={},radius=23}={}){
 const id=equipment.tail||'ribbon',raw=pose.tailAbility,q=raw?.kind===id?raw:null,
  reduced=pose.reducedMotion===true,lag=reduced?0:Math.max(-.3,Math.min(.3,(pose.performance?.tailLag||0)+(pose.tailMotion?.bend||0))),
  flash=reduced?0:Math.max(0,Math.min(1,q?.flash||0)),detail=radius>=38,
  active=q?.active===true,ready=q?.ready===true,mat=resolveAssemblyConstruction(equipment).material;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const plate=(points,color,outline=.045)=>panel(c,points,color,outline);
 const stitch=(points,color,width=.03)=>seam(c,points,color,width);
 c.save();try{
 if(id==='wings'){
  // Two rigid feather banks around a central wall-recharge cartridge.
  for(const side of [-1,1]){
   c.save();c.scale(1,side);c.translate(0,-flash*.07);
   plate([[-.86,-.08],[-1.45,-.27],[-2.92,-1.58],[-2.52,-.43],[-1.28,.03]],'#372b51',.075);
   for(let k=0;k<3;k++){
    const tx=-2.94+k*.36,ty=-1.55+k*.16;
    plate([[-1.06,-.09],[-1.67-k*.15,-.18], [tx,ty],[tx+.22,ty+.65]],k===0?'#cdb8eb':k===1?'#9e81c8':'#725493',.04);
    stitch([[-1.19,-.12],[tx+.08,ty+.15]],'#e4d5f1',.025);
   }
   stitch([[-1.05,-.04],[-1.61,-.24],[-2.66,-1.35]],'#4b3c61',.07);c.restore();
  }
  plate([[-.91,-.35],[-1.39,-.25],[-1.50,0],[-1.35,.26],[-.91,.31]],mat.shade,.055);
  plate([[-1.07,-.18],[-1.31,-.13],[-1.35,.08],[-1.08,.15]],q?(ready?'#d6c0fa':'#332e47'):'#78658f',.025);
  if(q&&!ready)stitch([[-1.3,-.09],[-1.1,.1]],'#9d83b9',.04);
 }else if(id==='anchor'){
  // Chunky interlocked links, then a blunt split-face weight (not a blade).
  const points=[];
  for(let k=0;k<6;k++){
   const u=k/5,x=-1.1-u*1.38,y=.24+u*.50+lag*u*u-flash*.13;points.push([x,y]);
   c.save();c.translate(x,y);c.rotate(k%2?.7:-.35);c.strokeStyle=k%2?'#a5a9b5':'#66707e';c.lineWidth=.095;c.beginPath();c.ellipse(0,0,.2,k%2?.085:.13,0,0,Math.PI*2);c.stroke();c.restore();
  }
  const [x,y]=points.at(-1);c.save();c.translate(x-.26,y+.08);
  plate([[-.44,-.25],[.16,-.37],[.49,-.08],[.44,.42],[-.17,.57],[-.50,.30]],'#727d8b',.085);
  plate([[.16,-.37],[.49,-.08],[.44,.42],[.13,.20]],'#394652',0);
  stitch([[-.39,-.19],[.08,-.28],[.38,-.04]],'#c5c8c6',.045);
  plate([[-.23,-.02],[.04,-.08],[.19,.07],[.02,.24],[-.24,.26]],'#313c49',.025);
  if(q?.action==='floor')stitch([[-.42,.4],[.39,.4]],'#d3b88c',.05);c.restore();
 }else if(id==='thrusters'){
  // Closed idle nozzles. ONLY an accepted marginal jet boost opens exhaust.
  const jet=q?.action==='jet'?flash:0;
  for(const y of [-.59,.57]){
   const dx=jet*.08;
   plate([[-.83,y-.25],[-1.61-dx,y-.26],[-1.91-dx,y-.12],[-1.91-dx,y+.16],[-1.58-dx,y+.29],[-.83,y+.23]],'#66717d',.07);
   plate([[-1.65-dx,y-.25],[-1.91-dx,y-.12],[-1.91-dx,y+.16],[-1.61-dx,y+.27],[-1.48-dx,y+.10],[-1.49-dx,y-.10]],'#293949',.035);
   plate([[-1.69-dx,y-.12],[-1.82-dx,y-.07],[-1.82-dx,y+.1],[-1.68-dx,y+.14]],jet?'#e4bf8c':'#101d2b',.025);
   stitch([[-.91,y-.19],[-1.52,y-.19]],'#b3b7bb',.035);
   rect(-1.20,y-.1,.1,.2,mat.edge);rect(-1.44,y-.1,.06,.2,'#354653');
   if(jet){plate([[-1.89,y-.10],[-2.35-jet*.65,y+.01],[-1.89,y+.13]],'#c38464',0);plate([[-1.9,y-.05],[-2.22-jet*.35,y+.01],[-1.9,y+.07]],'#f1d8a9',0);}
  }
  stitch([[-1.08,-.31],[-1.08,.28]],mat.shade,.11);
 }else if(id==='ghost'){
  for(const [j,len,y]of [[0,3.17,-.49],[1,2.54,.12]]){
   c.save();c.globalAlpha*=j?.62:.78;
   plate([[-.85,y-.17],[-1.60,y-.26],[-2.11,y+.03+lag],[-len,y-.11+lag],[-len+.30,y+.23+lag],[-1.93,y+.34+lag],[-1.31,y+.02],[-.85,y+.12]],j?'#648d9b':'#a4c7cc',.045);
   stitch([[-1.09,y-.10],[-1.63,y-.16],[-2.11,y+.14+lag],[-len+.28,y+.01+lag]],active?'#dff8e7':'#bed6d2',active?.055:.025);
   if(detail)stitch([[-1.13,y+.06],[-1.87,y+.23+lag]],'#415e72',.025);c.restore();
  }
  plate([[-.91,-.38],[-1.18,-.38],[-1.28,-.12],[-1.06,.18],[-.88,.10]],mat.shade,.045);
  if(q)rect(-1.17,-.23,.15,.13,active?'#cce6d3':'#354655');
 }else if(id==='viper-tails'){
  const taut=q?.action==='retention'?flash:0;
  for(const side of [-1,1]){
   const y=side*.30,bend=lag+side*(.11-taut*.09);
   plate([[-.92,y-.13],[-1.44,y-.23],[-2.04,y+.10+bend],[-3.13,y-.16+bend],[-2.85,y+.19+bend],[-1.99,y+.37+bend],[-1.35,y+.06],[-.92,y+.15]],side===1?'#973d55':'#c26370',.055);
   plate([[-1.22,y-.12],[-1.49,y-.14],[-2.05,y+.21+bend],[-2.91,y-.03+bend],[-2.83,y+.08+bend],[-2.02,y+.29+bend]],'#e6b0aa',0);
   if(detail)for(let k=0;k<4;k++)stitch([[-1.66-k*.24,y+.06+bend],[-1.7-k*.24,y+.14+bend]],'#5a2b42',.025);
  }
  plate([[-.91,-.46],[-1.33,-.37],[-1.42,.34],[-.91,.44]],mat.shade,.055);
  stitch([[-1.15,-.31],[-1.2,.29]],q?.action==='retention'?'#e7c7ad':'#a2717f',.05);
 }else if(id==='spectrum'){
  const colors=['#b6a16f','#7dac9c','#a28cbe'],n=Math.max(0,Math.min(2,q?.count||0));
  // Three separated cloth bands. Their hues never cycle with elapsed time.
  for(let k=0;k<3;k++){
   const y=-.51+k*.37,len=3.12-k*.18,bend=lag*(1-k*.2);
   plate([[-1.00,y-.12],[-1.72,y-.06],[-2.17,y-.20+bend],[-len,y-.10+bend],[-len+.27,y+.17+bend],[-2.14,y+.10+bend],[-1.63,y+.20],[-1.00,y+.12]],colors[k],.045);
   stitch([[-1.5,y+.02],[-2.16,y-.05+bend],[-len+.27,y+.02+bend]],'#e0d8bd',.02);
  }
  plate([[-.89,-.75],[-1.38,-.65],[-1.48,.62],[-.89,.67]],mat.shade,.06);
  for(let k=0;k<3;k++){
   rect(-1.31,-.49+k*.33,.25,.21,q?(k<n?colors[k]:'#293740'):'#69717a');
   if(q?.remaining>0)stitch([[-1.32,-.48+k*.33],[-1.08,-.29+k*.33]],'#8b869a',.03);
  }
 }else{
  // Free kit: folded cloth, distinct hem and a real knot, no idle flutter.
  plate([[-.83,-.53],[-1.4,-.65],[-2.08,-.31+lag],[-3.11,-.48+lag],[-2.76,-.08+lag],[-2.05,.04+lag],[-1.38,-.27],[-.83,-.12]],'#29213b',.06);
  plate([[-1.02,-.46],[-1.47,-.52],[-2.06,-.2+lag],[-2.89,-.36+lag],[-2.73,-.18+lag],[-2.06,-.08+lag],[-1.40,-.35]],'#bbc784',0);
  stitch([[-1.38,-.48],[-2.08,-.15+lag],[-2.75,-.26+lag]],'#e1dfb8',.025);
  plate([[-.86,-.57],[-1.12,-.64],[-1.29,-.35],[-1.1,-.09],[-.84,-.13]],mat.shade,.05);
  stitch([[-1.1,-.53],[-1.2,-.35],[-1.08,-.17]],'#bac78c',.04);
 }
 }finally{c.restore();}
}

/** Labelled ability illustration; it does not run collisions or grant EDGE. */
export function drawTailToolkitStudy(c,w,h,{equipment={},study={}}={}){
 const q=study.tail||{},view=q.view||{},motion=q.motion!==false;
 c.save();try{
 c.fillStyle='#101a23';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 c.fillStyle='#23313b';c.fillRect(22,83,596,218);
 c.fillStyle='#bdcdc3';c.font='11px monospace';c.fillText('TAIL TOOLKIT / SLOWED ABILITY ILLUSTRATION',24,26);
 c.fillStyle='#f0ead7';c.font='bold 23px sans-serif';c.fillText((study.title||'TAIL RIG').toUpperCase(),24,57);
 drawCubeHero(c,{x:403,y:195,radius:68,equipment,motion,time:0,pose:{blink:1,breathe:0,tailAbility:view}});
 // Installed shape at gameplay scale; enlarged hardware above is identical.
 drawCubeHero(c,{x:563,y:271,radius:23,equipment,motion,time:0,pose:{blink:1,breathe:0,tailAbility:view}});
 c.fillStyle='#b1c4bb';c.font='10px monospace';c.fillText('PLAY SIZE',530,300);
 c.fillStyle='#d2daca';c.font='bold 13px monospace';c.fillText(q.label||'BASELINE CONTROL',24,332);
 c.fillStyle='#a3b7b4';c.font='11px monospace';
 const id=equipment.tail,text=id==='spectrum'?q.beat===0?'0 / 3 PRIMARY KILLS':q.beat===1?'2 / 3 PRIMARY KILLS':'3RD KILL → +1 EDGE / 120 TICK RECHARGE':id==='wings'?q.beat===0?'READY / FIRST WALL ONLY':'SPENT / FLOOR CONTACT REARMS':id==='thrusters'?'ONLY A REAL MARGINAL BANK BOOST FIRES THE JETS':id==='viper-tails'?'ORDINARY 85% → 87.25% / HYPER UNCHANGED':id==='ghost'?'TWO CLOTH FOLDS / SCARF IS NOT A COLLIDER':id==='anchor'?'QUALIFIED FLOOR ONLY / NO NEW SLAM BUTTON':'NO EXTRA FORCE / NO IDLE FLUTTER';
 c.fillText(text,24,357);c.fillStyle='#708e94';c.font='10px monospace';c.fillText('ILLUSTRATION ONLY / SHOW PRACTICE CONTROLS FOR LIVE TESTING',24,385);
 }finally{c.restore();}
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
  const performance=pose2.performance||resolveCharacterPerformance(pose2,t),q=pose2.eyeAbility?.kind===id?pose2.eyeAbility:null,
    aiming=!!q?.active,hot=!!pose2.overdrive,recover=!!pose2.focusRecovering&&!pose2.aiming&&pose2.focusLevel<1,
    power=aiming?Math.max(0,Math.min(1,pose2.eyePower||0)):0;
  const plate=(points,color,ink=.035)=>panel(c,points,color,ink),line=(points,color,width=.04)=>seam(c,points,color,width);
  c.save();try{
  // Hardware is mounted to the face. Only pupils track; no idle scans or orbit.
  const gaze=Math.max(-1,Math.min(1,pose2.look?.[0]||0))*.035;
  const blink=Math.max(.06,(pose2.blink??1)*(pose2.eyes??1));
  // Expression is not ability state: a tense squint never grants or lights a power.
  c.translate((pose2.look?.[0]||0)*.02,-performance.focus*.025);
  c.translate(0,-.14);c.scale(1+performance.focus*.025,(1-performance.focus*.13)*Math.max(['visor','sniper','glitch','hypno'].includes(id)?.72:.06,blink));c.translate(0,.14);
  if(id==='visor'){
    plate([[-.83,-.36],[.70,-.40],[.82,-.25],[.72,.06],[-.72,.10],[-.83,-.05]],'#111e2b',.055);
    plate([[-.71,-.29],[.66,-.32],[.69,-.22],[.61,-.035],[-.65,.005]],'#164857',0);
    plate([[-.64,-.27],[-.35,-.28],[-.53,-.01],[-.66,0]],'#71a4a8',0);
    line([[-.79,-.15],[-.70,-.15]],'#7e919e',.065);line([[.70,-.16],[.78,-.16]],'#7e919e',.065);
    line([[-.27,-.06],[.47,-.09]],aiming?'#c2ffff':'#4a7a86',aiming?.055:.025);
    if(aiming){for(let i=0;i<3;i++)line([[.24+i*.12,-.26],[.24+i*.12,-.20]],'#a9ffff',.035);}
  }else if(id==='hypno'){
    const charge=aiming?Math.min(1,(q.age||0)/18):0;
    for(const [x,side]of [[-.43,-1],[.43,1]]){
      circle(c,x,-.14,.315,'#111120');circle(c,x,-.14,.258,'#43335d');
      // A true continuous spiral, not concentric disks or a global time glyph.
      c.beginPath();for(let i=0;i<=44;i++){const a=i/44*Math.PI*3.8*side-charge*.65,r=.025+i/44*.205;const px=x+Math.cos(a)*r,py=-.14+Math.sin(a)*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.strokeStyle=q?.remaining>0?'#f0dcff':charge?'#d6b1ff':'#a184be';c.lineWidth=.045;c.stroke();
      line([[x-.23,-.39],[x-.09,-.43]],'#837790',.035);
      if(q?.remaining>0)line([[x-.07,.17],[x+.07,.17]],'#dfbaff',.06);
    }
  }else if(id==='glitch'){
    const cyan=recover?'#8ffff1':'#548b97',pink=recover?'#ff91db':'#9c527e',shift=recover?.035:0;
    plate([[-.78,-.38],[-.16,-.33],[-.14,.04],[-.75,.07]],'#15202a',.03);
    plate([[.17,-.35],[.75,-.39],[.80,.03],[.17,.07]],'#211a2d',.03);
    line([[-.67-shift,-.28],[-.30-shift,-.01]],cyan,.09);line([[-.63+shift,-.015],[-.29+shift,-.29]],pink,.09);
    circle(c,.46,-.14,.19,cyan);circle(c,.46,-.14,.105,'#181829');
    line([[.29,-.26],[.63,-.01]],pink,.055);
    // Deliberate broken conductor; closes ONLY during passive recovery.
    line([[-.13,-.12],[-.04,-.12],[-.04,-.04]],cyan,.035);
    line([[.04,-.04],[.12,-.04]],pink,.035);
    if(recover)line([[-.04,-.04],[.04,-.04]],'#e6fff7',.04);
  }else if(id==='sniper'){
    plate([[-.80,-.29],[.69,-.35],[.80,-.21],[.71,.05],[-.76,.07]],'#211b28',.055);
    line([[-.66,-.14],[-.22,-.14]],'#9c5865',.05);
    circle(c,.37,-.14,.30,'#65404c');circle(c,.37,-.14,.238,'#231b2b');
    const gap=.19-power*.07;
    for(const side of [-1,1]){
      line([[.37+side*gap,-.20],[.37+side*gap,-.08]],power>=.9?'#ffafbd':'#b76a7c',.035);
      line([[.31,-.14+side*gap],[.43,-.14+side*gap]],power>=.9?'#ffafbd':'#b76a7c',.035);
    }
    circle(c,.37+gaze,-.14,power>=.9?.065:.044,power>=.9?'#ffe0dc':'#ea6d85');
  }else if(id==='blaze'){
    for(const side of [-1,1]){
      const x=side*.43;
      plate([[x-side*.30,-.03],[x-side*.27,-.29],[x-side*.10,-.22],[x+side*.01,-.48],[x+side*.12,-.26],[x+side*.31,-.38],[x+side*.23,-.05]],'#3c2c2b',.04);
      plate([[x-side*.22,-.07],[x-side*.17,-.22],[x-side*.05,-.17],[x+side*.02,-.34],[x+side*.11,-.18],[x+side*.23,-.28],[x+side*.17,-.07]],hot?'#ffe4a1':'#b8976b',0);
      line([[x-side*.14,-.10],[x+side*.16,-.15]],q?.flash>0&&!pose2.reducedMotion?'#ffffff':hot?'#fff8db':'#efe2c2',.055*blink);
    }
  }else if(id==='smug'){
    for(const side of [-1,1]){
      const x=side*.44;
      plate([[x-.29,-.28],[x+.29,-.28],[x+.22,hot?.09:-.02],[x-.23,hot?.09:-.02]],'#242331',.035);
      plate([[x-.22,-.19],[x+.22,-.19],[x+.17,hot?.015:-.065],[x-.18,hot?.015:-.065]],hot?'#f3ca72':'#b6c4ad',0);
      line([[x-.32,-.29],[x+.29,-.29]],'#111521',.095);
      if(pose2.combo>0)line([[x-.14,.12],[x+.14,.12]],hot?'#f3ca72':'#829a85',.035);
    }
  }else{
    // Free baseline: two hand-cut apertures with a folded ink rim.
    for(const side of [-1,1]){
      plate([[side*.80,-.39],[side*.12,-.22],[side*.07,.02],[side*.69,-.055]],'#1a2230',.025);
      plate([[side*.70,-.29],[side*.20,-.18],[side*.15,-.065],[side*.63,-.115]],'#faffdb',0);
      line([[side*.66+gaze,-.19],[side*.47+gaze,-.15]],palette.secondary,.035*blink);
    }
  }
  }finally{c.restore();}
}

/** Fitted eye hardware in a quiet editorial shop plate, at two honest sizes. */
export function drawEyeToolkitStudy(c,w,h,{equipment={},study={}}={}){
 const q=study.eye||{},motion=q.motion!==false;
 c.save();try{
  c.fillStyle='#111d27';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
  c.fillStyle='#718c96';c.font='11px monospace';c.fillText('EYE SYSTEM / LABELLED ABILITY ILLUSTRATION',24,27);
  c.fillStyle='#f0eadc';c.font='bold 24px sans-serif';c.fillText((study.title||'EYES').toUpperCase(),24,59);
  c.fillStyle='#1c2b36';c.fillRect(22,79,596,219);
  // Neutral time keeps unearned ambient movement out of this inspection.
  drawCubeHero(c,{x:352,y:191,radius:77,equipment,motion,time:0,pose:{...q.pose,reducedMotion:!motion}});
  drawCubeHero(c,{x:558,y:257,radius:23,equipment,motion,time:0,pose:{...q.pose,reducedMotion:!motion}});
  c.fillStyle='#99aeb5';c.font='10px monospace';c.fillText('PLAY SIZE',526,288);
  c.fillStyle='#c5d2cb';c.font='11px monospace';c.fillText(['BASELINE','CONDITION','RESULT'][q.beat||0],39,105);
  c.fillStyle='#a6c9cb';c.font='11px monospace';c.fillText(q.label||'',24,325);
  c.fillStyle='#f0eadc';c.font='bold 15px monospace';c.fillText(q.benefit||'',24,348);
  c.fillStyle='#b7c5c5';c.font='10px monospace';c.fillText(q.detail||'',24,369);
  c.fillStyle='#738e9a';c.fillText('ILLUSTRATION ONLY / PRACTICE CONTROLS FOR MANUAL TESTING',24,390);
 }finally{c.restore();}
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
  const seat=eq.body==='segmented'?shellCompression(p)*.06:0,
    seatX=-Math.cos(p.shellContactAngle||0)*seat,seatY=-Math.sin(p.shellContactAngle||0)*seat;
  c.save();c.translate(seatX,seatY);
  if (eq.body === "hologram") c.globalAlpha = 0.65;
  drawTailToolkit(c,{equipment:eq,pose:p,radius:r});
  c.restore();
  c.save();
  c.translate(seatX,seatY);
  if (p.forge?.active && p.forge.slot === "head") c.scale(p.forge.scale, p.forge.scale);
  head(c, eq.head, t, palette, ink2);
  c.restore();
  c.save();
  const profile=SHAPE_MODIFIERS.find(x=>x.id===eq.body);if(profile){path(c,profile.outline);c.clip();}
  const profileFill={chamfer:"#b0c4dc",notched:"#d3a6bd",segmented:"#93b8a9"}[eq.body];
  const shell = profileFill || (eq.body === "obsidian" ? "#181821" : eq.body === "hologram" ? "#163348bb" : shellMaterial(c, eq.body) || CREAM);
  sculptedShell(c,eq,palette,shell,ink2);
  drawAssemblyShell(c,eq,p);
  if(eq.body!=="iron"&&(r>=29||eq.body==="lava"))shellDetails(c, eq.body, t, { ...p, palette });
  if (p.equipment) bodyFinish(c, eq, palette, t, p);
  // Rear head silhouettes stay behind the shell. The forward mounting band
  // sits OVER its top plane, while the face remains unobscured below it.
  if(eq.head&&eq.head!=='none'&&eq.head!=='halo'){
    c.save();c.beginPath();c.rect(-2.2,-2.5,4.4,1.85);c.clip();
    if(p.forge?.active&&p.forge.slot==='head')c.scale(p.forge.scale,p.forge.scale);
    c.translate(seatX,seatY);head(c,eq.head,t,palette,ink2);c.restore();
  }
  drawConstructedFace(c,eq);
  c.save();
  if (p.forge?.active && p.forge.slot === "eyes") c.scale(p.forge.scale, p.forge.scale);
  c.translate(.08,-.02);c.scale(.91,.96);
  eyes(c, eq.eyes, t, p, palette);
  c.restore();
  c.save();
  if(p.forge?.active&&p.forge.slot==='core')c.scale(p.forge.scale,p.forge.scale);
  drawCoreChamber(c,{...eq,core:eq.core||'standard'},t,palette,p);
  c.restore();

  if (eq.head === "oni") {
    panel(c, [[-1, -1.04], [-0.2, -1.04], [-0.14, -0.65], [-0.43, -0.43], [-0.88, -0.55], [-1.08, -0.35]], "#fff0cf", ink2 * 0.7);
    panel(c, [[-0.96, -0.95], [-0.3, -0.95], [-0.26, -0.69], [-0.46, -0.76]], "#bba49e", 0);
    seam(c, [[-0.64, -1.03], [-0.55, -0.84], [-0.68, -0.7], [-0.54, -0.52]], "#492c38", 0.055);
  }
  c.restore();
  if(p.equipment){c.save();c.translate(seatX,seatY);attachmentCollars(c,eq,t,p);c.restore();drawHybridIntegration(c,eq,t,p);drawHarmonyBindings(c,eq,t,p);}
  drawSparkMutation(c, eq, t, "front", p);
  drawReactiveShellState(c,eq,p);
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
function drawIndustrialDistrict(c,w,h,camera={},seed=41,band=1,time=0,bake=null) {
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
  // Neutral skyline landmark: distant freight crane, no powered rail or emitter.
  // Continuous world tiles, culled before any paths; kept behind the district.
  const ct=1200*scale,cr=1000*scale,cx=-x*.045,cy=-y*.045;
  for(let row=Math.floor(-cy/cr);row<=Math.floor((h-cy)/cr);row++)for(let col=Math.floor(-cx/ct);col<=Math.floor((w-cx)/ct);col++){
    const px=col*ct+cx,py=row*cr+cy;
    if(px+1050*scale<0||px+110*scale>w||py+850*scale<0||py+80*scale>h)continue;
    c.save();c.translate(px,py);c.scale(scale,scale);
    polygon(c,[[160,850],[196,260],[238,260],[278,850],[250,850],[217,365],[189,850]],p.far);
    polygon(c,[[110,240],[670,90],[1050,240],[1040,260],[668,132],[119,265]],p.far);
    seam(c,[[217,260],[668,110],[991,246]],p.edge+"80",2);
    line2(c,p.far,5,668,110,668,81);line2(c,p.far,3,836,187,836,438);
    c.fillStyle=p.far;c.fillRect(818,435,37,32);
    seam(c,[[836,466],[836,490],[823,499]],p.edge+"80",3);
    for(let k=0;k<3;k++)line2(c,p.edge+"55",2,192-k*4,420+k*122,248+k*7,487+k*122);
    c.restore();
  }
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
      const drawTile=c=>{
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
      };
      if(bake&&tier!==1){
        const bx=tier===0?34:908,by=tier===0?19:-86,bw=tier===0?352:468,bh=tier===0?637:1242;
        // Muted scenery needs only half-resolution art. Keep a whole visible
        // working set in the cache rather than thrashing full-size tiles.
        c.translate(bx,by);c.scale(2,2);
        bake.paint(c,`district:${seed}:${band%4}:${tier}:${n}`,Math.ceil(bw/2),Math.ceil(bh/2),context=>{
          context.save();context.scale(.5,.5);context.translate(-bx,-by);drawTile(context);context.restore();
        });
      }else drawTile(c);
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

/** Architectural world adapters. Two continuous, independently camera-relative
 * tile planes; no simulation, emitters, collision surfaces or powered rails.
 * All static geometry can share the renderer-owned bounded half-resolution bake.
 * Coordinates stay inside each tile so cached/direct paths have identical bounds.
 */
const WORLD_SCENERY = {
 tokyo:{sky:['#080f20','#22384a','#101b2c'],far:'#1c3045',mass:'#142638',edge:'#385265',ink:'#0c1b2b',light:'#7b9aa8',accent:'#926b89'},
 foundry:{sky:['#1c121c','#4b3035','#211b28'],far:'#4a3039',mass:'#30232e',edge:'#6e4b4d',ink:'#211b26',light:'#bd8864',accent:'#985d4e'},
 manga:{sky:['#b1a694','#d0c3aa','#a89d8c'],far:'#a09689',mass:'#857d75',edge:'#625e5c',ink:'#514f52',light:'#dbcfb6',accent:'#77716b'},
 synth:{sky:['#17162b','#432841','#191c33'],far:'#3c2b48',mass:'#24263d',edge:'#64516d',ink:'#171c30',light:'#ad8195',accent:'#7c6b9b'},
 void:{sky:['#040610','#16172a','#070c19'],far:'#1e2038',mass:'#171e31',edge:'#3e425e',ink:'#0d1424',light:'#8b87a9',accent:'#5e577d'}
};
function drawWorldArchitecture(c,id,tier,variant,p){
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const edge=(points,color=p.edge,width=2)=>seam(c,points,color,width);
 const ring=(x,y,rx,ry,color,width=2,rotation=0)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.stroke();};
 if(id==='tokyo'){
  if(tier===0){
   // Needle tower, terraced roof decks and the enormous moon behind the city.
   disk2(c,'#75889738',740,175,105);disk2(c,p.far,760,163,92);
   polygon(c,[[60,680],[60,330],[100,330],[100,280],[170,280],[170,680]],p.far);
   polygon(c,[[258,700],[258,260],[291,240],[291,188],[310,155],[329,188],[329,240],[362,260],[362,700]],p.far);
   edge([[310,78],[310,183]],p.edge,2);ring(310,275,85,18,p.edge,4);
   for(let i=0;i<4;i++){rect(p.far,465+i*80,420-i%2*115,68,300);rect(p.edge+'50',472+i*80,440-i%2*115,2,110);}
   edge([[80,545],[260,545],[440,490],[750,490]],p.edge,9);
  }else{
   const y=115+variant*22;
   // Faceted sidewall with inset window strips, external service spine/sign.
   polygon(c,[[30,775],[30,y+36],[72,y],[244,y],[280,y+32],[280,775]],p.mass);
   polygon(c,[[244,y],[280,y+32],[280,775],[244,775]],p.ink);
   for(let i=0;i<7;i++){rect(p.ink,60,y+62+i*69,156,34);rect(p.light+'65',67,y+68+i*69,52,3);rect(p.edge,135,y+68+i*69,62,3);}
   edge([[45,y+52],[45,750]],p.edge);rect(p.ink,220,y+100,42,205);rect(p.accent,225,y+109,25,184);
   // Architectural sign marks, never gameplay glyphs or status lettering.
   for(let i=0;i<5;i++){rect(p.mass,230,y+123+i*30,15,3);rect(p.mass,236,y+117+i*30,3,16);}
   polygon(c,[[645,780],[645,365],[688,330],[886,330],[927,365],[927,780]],p.mass);
   rect(p.ink,675,385,216,300);for(let i=0;i<5;i++)rect(p.edge,688,403+i*48,183,3);
   edge([[505,60],[505,590],[616,650],[616,780]],p.ink,13);edge([[500,60],[500,592],[612,654]],p.edge,2);
   edge([[280,557],[645,557]],p.ink,30);edge([[280,542],[645,542]],p.edge,3);
   for(let i=0;i<5;i++)edge([[302+i*65,555],[339+i*65,586]],p.edge,3);
   edge([[289,120],[460,178],[645,150]],p.ink,2);
  }
 }else if(id==='foundry'){
  if(tier===0){
   // Monumental crucible pressure vessel rather than a hot-coloured city.
   rect(p.far,560,95,180,615);ring(650,110,90,26,p.edge,5);
   for(let i=0;i<4;i++){ring(650,245+i*115,90,25,p.edge,4);rect(p.edge+'50',575,150+i*115,9,64);}
   edge([[650,100],[650,42],[830,42],[830,585]],p.far,22);
   rect(p.far,95,240,96,485);rect(p.edge,83,227,120,18);
   edge([[155,245],[155,160],[365,160],[365,650]],p.far,32);
   polygon(c,[[62,700],[82,650],[429,650],[458,700]],p.far);
  }else{
   const cy=280+variant*26;
   polygon(c,[[55,780],[55,cy-150],[102,cy-202],[338,cy-202],[383,cy-150],[383,780]],p.mass);
   disk2(c,p.ink,220,cy,129);ring(220,cy,116,116,p.edge,12);disk2(c,'#794b40',220,cy,94);
   // Deep furnace throat, heavy shutters and a recessed warm slit, not lava.
   disk2(c,p.ink,220,cy+8,77);rect(p.accent,157,cy+13,126,27);rect(p.light,178,cy+24,84,3);
   for(let k=0;k<5;k++)rect(p.mass,141,cy-64+k*32,157,13);
   for(let k=0;k<6;k++){const a=k*Math.PI/3;disk2(c,p.edge,220+Math.cos(a)*116,cy+Math.sin(a)*116,4);}
   rect(p.ink,111,cy+165,215,230);for(let k=0;k<5;k++)rect(p.edge,125,cy+184+k*35,185,3);
   edge([[690,40],[690,295],[797,400],[797,780]],p.ink,45);edge([[673,40],[673,300],[780,407],[780,780]],p.edge,3);
   for(let k=0;k<4;k++){rect(p.mass,661,100+k*64,57,12);rect(p.edge,663,101+k*64,53,2);}
   rect(p.ink,465,612,455,23);rect(p.edge,465,610,455,3);
   for(let k=0;k<5;k++)edge([[490+k*82,635],[532+k*82,691]],p.mass,9);
   // Solid hoist block and chain, no spark/rain curtain.
   edge([[470,40],[910,40]],p.ink,20);edge([[860,40],[860,210]],p.edge,3);
   rect(p.mass,840,205,40,45);edge([[860,250],[860,277],[843,285]],p.edge,4);
  }
 }else if(id==='manga'){
  if(tier===0){
   // Large editorial ink panels with sparse halftone patches and a skyline.
   polygon(c,[[62,58],[523,38],[491,303],[78,326]],'#c9bca4');
   edge([[62,58],[523,38],[491,303],[78,326],[62,58]],p.far,4);
   c.fillStyle=p.far;c.beginPath();
   for(let row=0;row<6;row++)for(let col=0;col<9;col++){const px=108+col*31+row%2*10,py=95+row*29;c.moveTo(px+1.4,py);c.arc(px,py,1.4,0,Math.PI*2);}c.fill();
   disk2(c,'#b3a694',729,182,103);
   for(let k=0;k<6;k++){const x=70+k*143,y=480-(k*43)%160;polygon(c,[[x,745],[x,y],[x+35,y-23],[x+105,y-23],[x+105,745]],p.far);}
   edge([[75,610],[887,560]],p.mass,5);
  }else{
   // Slanted printed architecture. Broken hatching seats the ink, not speed FX.
   polygon(c,[[40,766],[61,374],[239,302],[331,327],[320,766]],p.mass);
   polygon(c,[[239,302],[331,327],[320,766],[236,766]],p.ink);
   for(let k=0;k<6;k++){const y=399+k*52;edge([[86,y],[211,y-26]],p.light,10);edge([[91,y+17],[207,y-9]],p.ink,2);}
   polygon(c,[[640,764],[663,284],[856,265],[914,309],[914,764]],p.mass);
   polygon(c,[[856,265],[914,309],[914,764],[849,764]],p.ink);
   for(let k=0;k<7;k++)edge([[689,321+k*54],[826,306+k*54]],p.light,4);
   edge([[46,51],[910,90],[889,221]],p.ink,7);edge([[63,63],[898,101]],p.light,2);
   for(let k=0;k<8;k++)edge([[358+k*22,641],[370+k*22,610]],p.edge,1);
   edge([[360,725],[608,689]],p.ink,5);
   // Small ink registration bars are scenery, not an on-screen objective.
   rect(p.ink,797,119,80,7);rect(p.ink,825,137,49,3);
  }
 }else if(id==='synth'){
  if(tier===0){
   // Eclipsed striped sun and angular mountain basins.
   disk2(c,'#956b83',672,202,135);disk2(c,p.sky[1],700,170,110);
   for(let k=0;k<7;k++)rect(p.sky[1],535,223+k*15,275,3+k);
   polygon(c,[[28,654],[133,433],[243,558],[375,330],[551,615],[689,405],[934,656],[934,755],[28,755]],p.far);
   edge([[133,433],[184,572],[243,558],[375,330],[417,552],[551,615]],p.edge,2);
   edge([[689,405],[748,591],[934,656]],p.edge,2);
   for(let k=0;k<4;k++)edge([[70,682+k*17],[900,682+k*17]],p.edge+'60',1);
  }else{
   // Hollow obelisks and an architectural perspective deck; no moving tunnel.
   for(const [x,y,s]of [[75,120,1],[730,290,.8]]){
    polygon(c,[[x,y+590*s],[x,y+54*s],[x+46*s,y],[x+139*s,y],[x+177*s,y+54*s],[x+177*s,y+590*s]],p.mass);
    polygon(c,[[x+139*s,y],[x+177*s,y+54*s],[x+177*s,y+590*s],[x+139*s,y+590*s]],p.ink);
    rect(p.ink,x+36*s,y+90*s,96*s,340*s);edge([[x+36*s,y+430*s],[x+36*s,y+90*s],[x+132*s,y+90*s]],p.edge,3);
    edge([[x+55*s,y+110*s],[x+55*s,y+407*s]],p.accent,3);
   }
   polygon(c,[[310,581],[574,548],[684,772],[264,772]],p.ink);
   edge([[310,581],[574,548],[684,772]],p.edge,3);
   for(let k=0;k<5;k++){const q=k/5;edge([[310-46*q,581+191*q],[574+110*q,548+224*q]],p.edge+'88',1);}
   edge([[359,575],[342,772]],p.edge,1);edge([[476,561],[526,772]],p.edge,1);
   ring(496,245,98,98,p.edge,5);ring(496,245,86,86,p.mass,2);
   polygon(c,[[479,187],[522,245],[479,303],[489,245]],p.accent);
  }
 }else if(id==='void'){
  if(tier===0){
   // One lensed eclipse and large remote orbital wreckage, not noisy stars.
   ring(680,223,151,151,'#534c6c55',32);ring(680,223,188,46,p.accent,9,-.24);
   disk2(c,'#040610',680,223,112);ring(680,223,113,113,p.light,2);
   c.strokeStyle=p.light;c.lineWidth=3;c.beginPath();c.ellipse(680,223,188,46,-.24,0,Math.PI);c.stroke();
   polygon(c,[[72,609],[125,563],[221,585],[193,637],[116,653]],p.far);
   polygon(c,[[350,112],[374,75],[410,89],[397,126]],p.far);
   edge([[125,563],[221,585],[193,637]],p.edge,2);
   for(let k=0;k<18;k++)disk2(c,p.light+'55',45+(k*137)%866,40+(k*83)%700,k%7===0?1.5:.7);
  }else{
   // Broken orbital gate: offset arc segments, radial ribs and a cut ring seat.
   const cx=250,cy=406,r=190;
   for(let k=0;k<3;k++){
    const a=.32+k*2.1;c.strokeStyle=p.mass;c.lineWidth=54;c.beginPath();c.arc(cx,cy,r,a,a+1.3);c.stroke();
    c.strokeStyle=p.edge;c.lineWidth=3;c.beginPath();c.arc(cx,cy,r-27,a,a+1.3);c.stroke();
    const angle=a+.66;edge([[cx+Math.cos(angle)*177,cy+Math.sin(angle)*177],[cx+Math.cos(angle)*221,cy+Math.sin(angle)*221]],p.edge,9);
   }
   polygon(c,[[690,705],[664,385],[731,308],[805,331],[859,691],[779,761]],p.mass);
   polygon(c,[[731,308],[805,331],[859,691],[804,658]],p.ink);
   edge([[681,396],[737,337],[793,351]],p.edge,3);edge([[703,462],[726,654],[773,689]],p.accent,3);
   polygon(c,[[516,154],[552,123],[612,144],[597,190],[546,202]],p.mass);edge([[516,154],[552,123],[612,144]],p.edge,2);
   polygon(c,[[465,700],[499,667],[557,694],[531,742]],p.mass);
  }
 }
}
function drawEquipmentWorld(c,w,h,id,t=0,camera={},bake=null){
 if(!WORLD_SCENERY[id]){drawIndustrialDistrict(c,w,h,camera,41,1,t,bake);return;}
 const p=WORLD_SCENERY[id],x=Number.isFinite(camera.x)?camera.x:0,y=Number.isFinite(camera.y)?camera.y:0;
 const scale=Math.max(.65,Math.min(1.3,camera.scale||1)),u=Math.max(.4,Math.min(w/740,h/720))*scale;
 c.save();try{
 const sky=c.createLinearGradient(0,0,w,h);p.sky.forEach((color,i)=>sky.addColorStop(i/2,color));c.fillStyle=sky;c.fillRect(0,0,w,h);
 for(let tier=0;tier<2;tier++){
  const depth=tier===0?.055:.19,tw=1000*u,th=(tier===0?1600:800)*u,ox=-x*depth,oy=-y*depth;
  const c0=Math.floor(-ox/tw),c1=Math.floor((w-ox)/tw),r0=Math.floor(-oy/th),r1=Math.floor((h-oy)/th);
  for(let row=r0;row<=r1;row++)for(let col=c0;col<=c1;col++){
   const px=col*tw+ox,py=row*th+oy;if(px>=w||py>=h||px+tw<=0||py+th<=0)continue;
   const variant=hash(41,col,row+tier*71)%3;
   c.save();c.translate(px,py);c.scale(u,u);
   if(bake){c.scale(2,2);bake.paint(c,`world:${id}:${tier}:${tier===1&&(id==='tokyo'||id==='foundry')?variant:0}`,500,tier===0?800:400,context=>{context.save();context.scale(.5,.5);drawWorldArchitecture(context,id,tier,variant,p);context.restore();});}
   else drawWorldArchitecture(c,id,tier,variant,p);
   if(id==='foundry'&&tier===1){c.globalAlpha=.28+Math.sin(t*.025)*.09;c.fillStyle=p.ink;c.fillRect(178,304+variant*26,84,3);}
   c.restore();
  }
 }
 // Bounded environmental motion: no particles, no glow pass. Fixed pose at t=0
 // is used by reduced motion. Rain is eight dim strokes; furnace slit stays local.
 if(id==='tokyo')for(let i=0;i<8;i++){const px=((i*173+t*.6-x*.025)%(w+24)+w+24)%(w+24)-12,py=((i*97+t*1.6-y*.03)%(h+26)+h+26)%(h+26)-13;line2(c,'#88a5ba24',1,px,py,px-4,py+13);}
 // One quiet value veil seats architecture below live combat, without a shader.
 const shade=c.createRadialGradient(w*.5,h*.48,0,w*.5,h*.48,Math.max(w,h)*.7);shade.addColorStop(0,id==='manga'?'#211d2310':'#080c1412');shade.addColorStop(1,id==='manga'?'#211d2330':'#080c1470');c.fillStyle=shade;c.fillRect(0,0,w,h);
 }finally{c.restore();}
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
function drawEquipmentEffects(c, fx, t = 0, floorY = Infinity,glowBake=null) {
  if (!fx) return;
  for (const b of fx.bursts) {
    const progress2 = 1 - b.ticks / 30;
    if (b.style?.startsWith('perk-')) {
      drawPartPerkPulse(c,{x:b.x,y:b.y,kind:b.style.slice(5),age:30-b.ticks});
    } else if (b.style === "spark" && b.from) {
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
    drawBakedGlow(c,glowBake,p.x,p.y,22,'#00f0ff');
    line2(c, "#b88fff", 3, p.x, p.y, p.x - p.vx * 2, p.y - p.vy * 2);
    disk2(c, "#f5d9ff", p.x, p.y, 2);
  }
  for (const e of fx.echoes) {
    drawBakedGlow(c,glowBake,e.x,e.y,37,'#dfff00');
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
export function radarRange(id){return [1,1.35,1.7,2.2][sensorTier(id,'radar')];}
export function trajectorySamples(id){return [24,36,55,95][sensorTier(id,'trajectory')];}
function radarRect(width, height) {
  const side = Math.min(width, height);
  const size = Math.min(160, Math.max(96, side * 0.23), width * 0.34);
  const pad2 = Math.max(12, side * 0.022);
  return { x: width - size - pad2, y: height - size - pad2, w: size, h: size };
}
// The BODY colours. `LAW` owns meaning; these own identity, and by contract
// none of them may read as safe (green) or as reward (gold).
var COLORS = {
  fang: "#ff507b",
  prism: "#b28cff",
  fork: "#ffa54d",
  bastion: "#ff6b3d",
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
    const r = e.kind === "crown" ? 5 : 3,
      isBody = !!TYPES[e.kind];
    blips.push({
      ...project(e, r),
      r,
      id: e.id,
      kind: e.kind,
      mode: e.mode,
      ...(e.frostCold?.phase==='active'?{cold:e.frostCold.kind}:{}),
      // CHUNK 2: only an ENEMY BODY may be drawn in the body palette. A wave
      // source (a wave marker, a breach point, a portal) is not a creature and
      // gets the neutral teal diamond instead of a rose dot that reads as one
      // more thing to cut.
      shape: isBody ? 'body' : 'source',
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
function createBackdrop(c,surface=null) {
  const bake=createArtBake({surface,maxEntries:24,maxPixels:2000000});
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
    drawIndustrialDistrict(c,v.width,v.height,{x:v.panX*v.scale,y:v.panY*v.scale,scale:v.scale},seed,band,time,bake);
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
        // CHUNK 1: the stray "+300" floating-score sticker used to sit here,
        // on top of the hero's key art, over a poster that has nothing to do
        // with scoring. A price tag on a character portrait.
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
  return { world, title, bench,equipment:(w,h,id,time,camera)=>drawEquipmentWorld(c,w,h,id,time,camera,bake),dispose:()=>bake.clear(),bakeStats:()=>bake.stats() };
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
 // CHUNK 2: every strike zone speaks in the LETHAL voice. These were four
 // warm tints, including a gold (Bastion at hue 41) and a pale lavender; a
 // player reading colour as meaning needs one colour for "this will hit you".
 if(!zone)return;const unit=1/Math.max(.1,scale),color={fork:'#ff9a86',bastion:'#ff8f72',rift:'#ff6b86',well:'#ff8fa8'}[zone.kind]||LAW.lethal;
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
 if(enemy.frostCold?.phase==='active'&&enemy.frostCold.kind==='freeze')return {label:`${enemy.kind.toUpperCase()} / ${verb}`,state:'FROZEN',cold:'freeze',progress:enemy.mode==='tell'?clamp(1-enemy.clock/Math.max(1,enemy.span),0,1):null};
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
  list.push({...intent,...(e.frostCold?.phase==='active'?{cold:e.frostCold.kind}:{}),bodyX:p.x,bodyY:p.y,offset:Math.max(25,e.r*v.scale+18),distance});
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
   c.strokeStyle=active?LAW.lethalPale:'#aa9eae';c.lineWidth=active?1.5:1;c.strokeRect(b.x-width/2,b.y-17,width,32);
   c.fillStyle='#fff5ed';c.fillText(b.label,b.x,b.y-9,width-6);
   c.font='bold 10px monospace';c.fillStyle=active?LAW.lethalPale:'#c5b6c5';c.fillText((b.state==='WINDUP'?'CHARGING':b.state==='ATTACK'?'ATTACK':b.state==='RECOVER'?'RECOVER':b.state==='FROZEN'?'FROZEN':'')+(b.cold==='slow'?' / SLOWED':''),b.x,b.y+3,width-6);
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
  add(e,e.kind.toUpperCase(),e.frostCold?.phase==='active'&&e.frostCold.kind==='freeze'?'FROZEN':e.mode==='tell'?'TELL':'ATTACK',`enemy:${e.id}`,e.mode==='tell'&&Number.isFinite(e.clock)&&Number.isFinite(e.span)?clamp(1-e.clock/Math.max(1,e.span),0,1):null,INTENT_VERBS[e.kind]);
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

/**
 * CHUNK 2 — "SAFE TO SLICE".
 *
 * One bracket per body the live blade would actually reach, drawn from the
 * SAME sweep geometry the hit test uses (`src/slice-safe.js` feeds this; the
 * run publishes the exact `reach/width/closeWidth` it swept with). A body that
 * is mid-attack is drawn in the lethal rose and never in green, because "green"
 * has exactly one meaning in this game.
 *
 * Deliberately cheap: no `shadowBlur`, no gradient, four short strokes and one
 * pip per body, all at the world's own stroke scale so it survives a phone
 * zoom. It reads as a target acquisition bracket, not as another enemy.
 */
export function resolveSliceMark(slice={}, time=0){
  if(!slice||!slice.armed)return null;
  const lethal=slice.state==='lethal';
  return Object.freeze({
    id:slice.id,
    kind:slice.kind,
    x:slice.x,
    y:slice.y,
    r:Math.max(6,Number(slice.r)||20),
    // THE BRACKET IS ALWAYS ABOUT THE CUT: green when the blade may take it,
    // rose when it is a live attack. Every other meaning gets its own glyph,
    // so "I can cut this" and "this pays" can never be confused.
    color:lethal?LAW.lethal:LAW.safe,
    core:lethal?LAW.lethalPale:LAW.safeCore,
    shielded:!!slice.shielded,
    reward:!!slice.reward,
    lethal,
    // A slow, deterministic breathing so the mark is alive without a clock the
    // caller has to own.
    pulse:.72+.28*Math.sin((Number(time)||0)*.11+(Number(slice.along)||0)*.012)
  });
}
export function drawSliceSafe(c, slices=[], {scale=1, motion=true, time=0}={}){
  if(!Array.isArray(slices)||!slices.length)return 0;
  const unit=1/Math.max(.1,scale);
  let drawn=0;
  c.save();try{
    c.lineCap='round';c.lineJoin='miter';
    for(const slice of slices){
      const m=resolveSliceMark(slice,time);
      if(!m)continue;
      const gap=m.r+9*unit, arm=Math.max(5*unit,m.r*.42), w=Math.max(1.8,2.4*unit);
      // Four corner brackets: a targeting frame, never a filled shape, so it
      // cannot be mistaken for a body or for a hazard field. Each stroke is
      // laid over a dark underlay, the same trick the hit line uses, so the
      // mark survives a bright body underneath it.
      for(const pass of [0,1]){
        c.globalAlpha=(pass
          ? (motion?m.pulse:1)*(m.lethal?.95:.9)
          : .5*(motion?m.pulse:1));
        c.strokeStyle=pass?m.color:'#0b0408';
        c.lineWidth=pass?w:w+2*unit;
        for(const sx of [-1,1])for(const sy of [-1,1]){
          const x=m.x+sx*gap, y=m.y+sy*gap;
          c.beginPath();
          c.moveTo(x-sx*arm,y);c.lineTo(x,y);c.lineTo(x,y-sy*arm);
          c.stroke();
        }
      }
      // The core pip says WHICH of the three voices this is at a glance. It
      // uses the STRONG ink of its role (a pale highlight would not read as a
      // colour signal on a dark field).
      c.globalAlpha=motion?m.pulse:1;
      c.fillStyle=m.lethal?LAW.lethal:LAW.safe;
      const pip=m.r*.14+1*unit;
      c.beginPath();c.arc(m.x,m.y,pip,0,TAU);c.fill();
      if(m.shielded){
        // Armour notch: cut it and it does NOT die. Red, because that is the
        // honest consequence, and it is the same red as a hazard. One thick
        // tick on the bracket's left top and one on its right bottom, so the
        // gold bounty chevron above the frame has a corner of its own.
        c.strokeStyle=LAW.lethal;c.lineWidth=Math.max(1.8,2.4*unit);
        for(const [sx,sy] of [[-1,-1],[1,1]]){
          const x=m.x+sx*gap, y=m.y+sy*gap;
          c.beginPath();c.moveTo(x-sx*arm,y);c.lineTo(x,y);c.stroke();
        }
      }
      if(m.reward){
        // GOLD IS A PROMISE: a chevron above the frame, never the frame itself.
        // The one body in the field that pays is the one body that wears it.
        const cy=m.y-gap-arm-8*unit, s2=5.5*unit;
        c.globalAlpha=motion?m.pulse:1;
        c.fillStyle=LAW.reward;
        c.beginPath();
        c.moveTo(m.x,cy-s2);c.lineTo(m.x+s2,cy);c.lineTo(m.x,cy+s2);c.lineTo(m.x-s2,cy);
        c.closePath();c.fill();
        c.strokeStyle=LAW.rewardEdge;c.lineWidth=Math.max(1,1.3*unit);c.stroke();
      }
      drawn++;
    }
  }finally{c.restore();}
  return drawn;
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
    c.save();c.translate(p.x,p.y);c.rotate(e.aim);c.strokeStyle=LAW.lethalPale;c.lineWidth=Math.max(1.8,2/Math.max(.1,scale));
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
      arc(c,LAW.lethalPale,Math.max(1.8,2*unit),p.x,p.y,radius);
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
 if(equipment?.dash==='dash-void'){drawVoidLaunch(c,{x,y,vx,vy,angle,age,radius,motion});return;}
 if(equipment?.dash==='dash-ice'){drawFrostLaunch(c,{x,y,vx,vy,angle,age,radius,motion});return;}
 if(equipment?.dash==='dash-fire'){drawEmberLaunch(c,{x,y,vx,vy,angle,age,radius,motion});return;}
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
 }else if(equipment?.dash==='dash-ink'){
 shape([[-r*.72,-r*.88],[-length,-r*.26],[-length*.74,0],[-length*.95,r*.28],[-r*.72,r*.88]],'#181321');
 line([[-length*.91,-r*.08],[-r*.8,-r*.32]],2.4,color);
 for(let i=0;i<3;i++)line([[-length*(.42+i*.17),-r*(.37-i*.34)],[-length*(.59+i*.15),-r*(.35-i*.34)]],1.3,light);
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
  const camera = createCamera(), back = createBackdrop(c,viewport.surface);
  let scene = null, sceneTicks = 0, w, h, lastView, revision = 0, anim = "rest", shake = createShake(), shakeLevel = "full", mapOpacity = 0.92, frameDt = 1, ghosts = createSmear(10), lastSwing = -1, justLaunched = 0, ghostClock = 0, holdDir = 0, stain = 0, facing = 1, rand = randomSource(1);
  const trail = [], shards = [], pops = [], beams = [], imprints = [], sparks = [];
  const dashDust = [];
  const dustPool=createVisualPool(90,{create:()=>({brake:false,x:0,y:0,vx:0,vy:0,life:0,age:0,len:0,hot:false}),clear:()=>{}});
  const sparkPool=createVisualPool(MOTION.maxSparks,{create:()=>({x:0,y:0,px:0,py:0,pa:0,angle:0,vx:0,vy:0,l:0,life:0,col:''}),clear:()=>{}});
  const renderCuller=createRenderCuller();
  const glowBake=viewport.surface?createArtBake({surface:viewport.surface,maxEntries:3,maxPixels:49152}):null;
  const wardBreaks=[],contactBursts=[];let cutExitSource=null;
  const dimensionImpact = createDimensionImpact();
  // CHUNK 1: view-time payloads owned by the shell (main.js): the screen-space
  // aim ring and the "what hit me" reaction. Never read from the simulation.
  let hitFeedbackView = null;
  /** CHUNK 2: bodies the live blade would reach this frame (see slice-safe.js). */
  let sliceMarkView = [];
  function setAimFeedback({ hit = null, slices = null } = {}) {
    hitFeedbackView = hit;
    // CHUNK 2: the "safe to slice" brackets. A snapshot, never a live read of
    // the enemy map -- the painter must not be able to move the simulation.
    if (slices !== null) sliceMarkView = Array.isArray(slices) ? slices : [];
  }
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
    dimensionImpact.reset();dustPool.reset();sparkPool.reset();renderCuller.reset();
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
    dimensionImpact.event(type,d,motion && shakeLevel !== 'off');
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
        if(sparks.length>=MOTION.maxSparks)sparkPool.release(sparks.shift());
        const spark=sparkPool.getFirstDead();if(spark){
          spark.x=x;spark.y=y;spark.px=x;spark.py=y;spark.angle=theta;spark.vx=Math.cos(theta)*speed;spark.vy=Math.sin(theta)*speed;
          spark.l=3+rand()*7;spark.life=10+rand()*6;spark.col=i%2?col:INK.paper;sparks.push(spark);
        }
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
    dimensionImpact.tick(motion && shakeLevel !== 'off');
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
    if (!motion){dashDust.length=0;dustPool.reset();}
    else {
      for (let i = dashDust.length - 1; i >= 0; i--) {
        const d = dashDust[i];d.age++;d.x += d.vx;d.y += d.vy;
        const drag = d.brake ? 0.84 : 0.92;d.vx *= drag;d.vy *= drag;
        if (d.age >= d.life){dustPool.release(d);dashDust.splice(i,1);}
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
            if(dashDust.length>=90)dustPool.release(dashDust.shift());
            const particle=dustPool.getFirstDead();if(!particle)continue;
            particle.brake=brake;particle.x=p.x+src.x*R*.92;particle.y=p.y+src.y*R*.92;particle.vx=b.dx/n*b.speed;particle.vy=b.dy/n*b.speed;
            particle.life=brake?9+rand()*5:15+rand()*8;particle.age=0;particle.len=brake?.22+rand()*.3:.07+rand()*.1;particle.hot=b.hot;dashDust.push(particle);
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
          if(list===sparks)sparkPool.release(e);
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
    const level=sensorTier(state.equipment?.radar,"radar"),range=radarRange(state.equipment?.radar);
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
      // A non-body source on the map is a diamond, not a creature.
      if (blip.shape === 'source') {
        const r2 = Math.max(3, blip.r);
        c2.moveTo(blip.x, blip.y - r2); c2.lineTo(blip.x + r2, blip.y);
        c2.lineTo(blip.x, blip.y + r2); c2.lineTo(blip.x - r2, blip.y);
        c2.closePath();
      } else if (blip.kind === "bastion") c2.rect(blip.x - blip.r, blip.y - blip.r, blip.r * 2, blip.r * 2);
      else if (blip.kind === "crown") {
        c2.moveTo(blip.x, blip.y - blip.r);
        c2.lineTo(blip.x + blip.r, blip.y);
        c2.lineTo(blip.x, blip.y + blip.r);
        c2.lineTo(blip.x - blip.r, blip.y);
        c2.closePath();
      } else c2.arc(blip.x, blip.y, blip.r, 0, TAU);
      if (blip.onScreen) c2.fill();
      else c2.stroke();
      if(blip.cold){c2.strokeStyle='#bce6ec';c2.lineWidth=1.2;c2.beginPath();if(blip.cold==='freeze'){c2.rect(blip.x-blip.r-2,blip.y-blip.r-2,blip.r*2+4,blip.r*2+4);c2.moveTo(blip.x-1,blip.y-2);c2.lineTo(blip.x-1,blip.y+2);c2.moveTo(blip.x+1,blip.y-2);c2.lineTo(blip.x+1,blip.y+2);}else{c2.moveTo(blip.x-blip.r-3,blip.y-3);c2.lineTo(blip.x-blip.r-5,blip.y);c2.lineTo(blip.x-blip.r-3,blip.y+3);}c2.stroke();}
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
  function storyEmotionMotif(c,width,height,emotion,time,motion,intensity=.8){
    if(!emotion)return;
    const clock=motion?time:0,pulse=motion?(.5+.5*Math.sin(clock*.055)):.65,power=Math.max(0,Math.min(1,Number(intensity)||0));
    if(!power)return;
    c.save();c.lineCap='round';c.lineJoin='round';
    if(emotion==='friendship'){
      const x=width*.22,y=height*.17,gap=Math.min(width*.075,54),s=10+4*pulse;
      c.globalAlpha=.16+.15*power;c.strokeStyle='#ffd68c';c.lineWidth=2;
      c.beginPath();c.moveTo(x-gap,y);c.quadraticCurveTo(x,y-height*.035*(.7+pulse),x+gap,y);c.stroke();
      c.globalAlpha=.32+.28*power;c.fillStyle='#ffe7a7';c.beginPath();c.arc(x+(pulse*2-1)*gap,y-height*.012,s*.24,0,Math.PI*2);c.fill();
      for(const side of [-1,1]){c.save();c.translate(x+side*gap,y);c.rotate(side*(.12+.1*pulse));c.globalAlpha=.42+.2*power;c.fillStyle='#171323';c.strokeStyle='#ffd68c';c.lineWidth=2.5;c.beginPath();c.moveTo(0,-s);c.lineTo(s*.72,0);c.lineTo(0,s);c.lineTo(-s*.72,0);c.closePath();c.fill();c.stroke();c.fillStyle='#ddff89';c.globalAlpha=.72;c.beginPath();c.arc(0,0,2.4,0,Math.PI*2);c.fill();c.restore();}
    }else if(emotion==='fear'){
      const x=width*.5,y=height*.17,r=Math.min(width,height)*.14;
      c.globalAlpha=.12+.13*power;c.strokeStyle='#ff7e6d';c.lineWidth=2;
      for(let i=0;i<3;i++){const rr=r*(1+i*.24)+pulse*3;c.beginPath();c.arc(x,y,rr,-Math.PI*.18+clock*.002+i*.7,Math.PI*.72+clock*.002+i*.7);c.stroke();}
      c.globalAlpha=.3+.2*power;c.strokeStyle='#ffb27a';c.beginPath();c.moveTo(x-r*1.25,y);c.lineTo(x-r*.92,y);c.moveTo(x+r*.92,y);c.lineTo(x+r*1.25,y);c.stroke();
    }else if(emotion==='rage'){
      const x=width*.5,y=height*.42,flare=.65+.35*pulse;
      c.globalAlpha=(.12+.16*power)*flare;c.strokeStyle='#ff684f';c.lineWidth=3;
      for(let i=0;i<7;i++){const a=-Math.PI*.92+i*Math.PI*.3+Math.sin(clock*.03+i)*.025,r0=Math.min(width,height)*.08,r1=r0+20+18*pulse;c.beginPath();c.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);c.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);c.stroke();}
      c.globalAlpha=.34+.2*power;c.fillStyle='#ffb066';c.beginPath();c.arc(x,y,3+3*pulse,0,Math.PI*2);c.fill();
    }else if(emotion==='ambition'){
      const base=height*.52,top=height*.09,x=width*.74,step=Math.min(width*.055,42);
      c.globalAlpha=.16+.16*power;c.strokeStyle='#ffe09a';c.lineWidth=2.5;
      for(let i=0;i<4;i++){const y=base-i*(base-top)/4,xx=x-i*step;c.beginPath();c.moveTo(xx-step*1.5,y);c.lineTo(xx+step*.6,y);c.lineTo(xx+step*.6,y-(base-top)/4);c.stroke();}
      c.globalAlpha=.34+.2*power;c.beginPath();c.moveTo(x-3*step,top+20);c.lineTo(x-3*step,top);c.lineTo(x-3*step-10,top+12);c.moveTo(x-3*step,top);c.lineTo(x-3*step+10,top+12);c.stroke();
    }else if(emotion==='love'){
      const y=height*.18,gap=Math.min(width*.13,88),x=width*.5;
      c.globalAlpha=.16+.16*power;c.strokeStyle='#ffe0a0';c.lineWidth=2.5;c.beginPath();c.moveTo(x-gap,y);c.bezierCurveTo(x-gap*.38,y-height*.07,x+gap*.38,y-height*.07,x+gap,y);c.stroke();
      c.globalAlpha=.28+.22*power;c.fillStyle='#ffe7ad';c.beginPath();c.arc(x+(pulse*2-1)*gap,y-height*.035*(.5+pulse),3+2*pulse,0,Math.PI*2);c.fill();
      for(const side of [-1,1]){c.globalAlpha=.45+.2*power;c.fillStyle=side<0?'#ffd68c':'#ddff89';c.beginPath();c.arc(x+side*gap,y,5+2*pulse,0,Math.PI*2);c.fill();}
    }else if(emotion==='resolve'){
      const y=height*.25,gap=Math.min(width*.12,80),x=width*.5;
      c.globalAlpha=.18+.14*power;c.strokeStyle='#ffe0a0';c.lineWidth=3;c.beginPath();c.moveTo(x-gap,y);c.lineTo(x-gap*.42,y-height*.055);c.lineTo(x+gap*.42,y-height*.055);c.lineTo(x+gap,y);c.stroke();
      c.globalAlpha=.34+.2*power;c.fillStyle='#fff0b5';c.beginPath();c.arc(x,y-height*.055,4+3*pulse,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  function narrativeBackdrop(n, width, height, time, motion) {
    if (!n) return;
    const clock=motion?time:0, sector=n.sector, chapter=n.chapter||'';
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
      // Each wave has a visual noun. These motifs are the sentence behind the
      // chapter chip: an eye turns, the seam climbs, and the final seal burns.
      if(chapter==='eye'){
        const ex=width*.5,ey=height*.17,open=.72+.12*Math.sin(clock*.06);
        c.save();c.globalAlpha=.78;c.strokeStyle='#ffb27a99';c.lineWidth=4;c.beginPath();c.ellipse(ex,ey,width*.12,height*.038*open,0,0,Math.PI*2);c.stroke();
        c.fillStyle='#ff6f6288';c.beginPath();c.arc(ex,ey,height*.018,0,Math.PI*2);c.fill();c.fillStyle='#ffe8b2';c.beginPath();c.arc(ex,ey,height*.007,0,Math.PI*2);c.fill();
        c.globalAlpha=.28;c.strokeStyle='#ff8368';c.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4+clock*.012;c.beginPath();c.moveTo(ex+Math.cos(a)*width*.14,ey+Math.sin(a)*height*.05);c.lineTo(ex+Math.cos(a)*width*.19,ey+Math.sin(a)*height*.08);c.stroke();}c.restore();
      } else if(chapter==='seam'||chapter==='last-seal'){
        const sx=width*.5,reach=chapter==='last-seal' ? .38 : .28;c.save();c.globalAlpha=.5;c.strokeStyle='#e8b36f';c.lineWidth=3;c.beginPath();c.moveTo(sx,height*.02);c.lineTo(sx-width*.025,height*reach*.45);c.lineTo(sx+width*.018,height*reach);c.stroke();c.globalAlpha=.22;c.strokeStyle='#ddff89';c.lineWidth=10;c.beginPath();c.moveTo(sx,height*.04);c.lineTo(sx-width*.02,height*reach*.46);c.lineTo(sx+width*.015,height*reach);c.stroke();c.restore();
      } else if(chapter==='landlord'){
        c.save();c.globalAlpha=.34;c.fillStyle='#ff996688';c.beginPath();c.arc(width*.5,height*.24,Math.min(width,height)*.16,0,Math.PI*2);c.fill();c.restore();
      }
      // The chapter noun sets the place; the emotional motif sets the reason
      // to keep cutting. It is animation, not an explanatory overlay.
      storyEmotionMotif(c,width,height,n.emotion,clock,motion,.9);
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
    // A lock is a real piece of the Watcher's machinery. When the blade breaks
    // one, the world answers at that exact coordinate: a ring opens, the
    // conduit snaps, and three fragments leave the anchor. This is intentionally
    // local and short — the sector crossing remains the large story sentence.
    for(const burst of n.lockBursts||[]){
      const age=Math.max(0,burst.age||0),u=motion?Math.min(1,age/30):.18,fade=Math.max(0,1-age/30),spin=(burst.index||0)*.7+u*1.8;
      c.save();c.translate(burst.x,burst.y);c.rotate(spin);c.globalAlpha=.8*fade;
      c.strokeStyle='#e6ff78';c.lineWidth=4/scale;c.beginPath();c.arc(0,0,(38+u*35)/scale,0,Math.PI*2);c.stroke();
      c.globalAlpha=.9*fade;c.strokeStyle='#ffd487';c.lineWidth=2/scale;
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3-.4,r=(22+u*54)/scale,x=Math.cos(a)*r,y=Math.sin(a)*r;
        c.beginPath();c.moveTo(Math.cos(a)*12/scale,Math.sin(a)*12/scale);c.lineTo(x,y);c.stroke();
        c.fillStyle=i===1?'#fff2be':'#ddff89';c.fillRect(x-3/scale,y-3/scale,6/scale,6/scale);
      }
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
  // Screen-space painters for the story sequences, keyed off `s.cutscene`
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
  function drawStoryMechanicDiagram(c,w,h,moment,progress,clock,motion,sx,sy,v,shot='tension'){
    // This is the actual first-wave Pulse lesson, enlarged into a cinematic
    // frame. The ring is whole—there is no invented gap—and the player glyph
    // visibly crosses clear of its expanding rim while the Watcher holds the
    // thread. Each shot changes the composition, not just a caption.
    const phase=motion?Math.max(0,Math.min(1,progress)):0.72,
      pulse=motion?(.5+.5*Math.sin(clock*.08)):.7,
      cx=w*.56,cy=h*.43,scale=Math.min(w,h)/700,
      acid='#ddff89',warm='#ffd487',hot='#ff8068',ink='#121020',pass=shot==='pass',returnShot=shot==='return';
    const watcherX=w*.17,watcherY=h*.2,ring=22*scale+phase*112*scale;
    const escape=Math.max(0,Math.min(1,(phase-.12)/.7)),path=-.54,
      passU=pass?Math.max(0,Math.min(1,(phase-.5)/.32)):0,
      cutterX=pass
        ? cx+(-150+passU*300)*scale
        : cx+Math.cos(path)*(ring+24*scale+escape*42*scale),
      cutterY=pass
        ? cy+Math.sin(path)*(ring+24*scale)-Math.sin(passU*Math.PI)*44*scale
        : cy+Math.sin(path)*(ring+24*scale+escape*42*scale);
    const sourceX=Number.isFinite(moment?.targetX)&&Number.isFinite(v?.scale)
      ? (moment.targetX-v.x)*v.scale : NaN,
      sourceY=Number.isFinite(moment?.targetY)&&Number.isFinite(v?.scale)
      ? (moment.targetY-v.y)*v.scale : NaN;
    const valid=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&x>24&&x<w-24&&y>36&&y<h-30;
    const thread=(x0,y0,x1,y1,alpha,width=2)=>{
      const tremor=motion?(Math.sin(clock*.22)*3+Math.sin(clock*.071)*2)*scale:0;
      c.save();c.globalAlpha=alpha;c.strokeStyle=warm;c.lineWidth=width*scale;c.beginPath();
      c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)*.5+tremor,Math.min(y0,y1)-26*scale+tremor,x1,y1);c.stroke();
      if(motion&&phase>.32){c.globalAlpha=alpha*.28;c.strokeStyle=hot;c.lineWidth=Math.max(1,width*.45)*scale;c.beginPath();c.moveTo(x0,y0+3*scale);c.quadraticCurveTo((x0+x1)*.5-tremor,Math.min(y0,y1)-20*scale-tremor,x1,y1+2*scale);c.stroke();}
      c.restore();
    };
    const ringLine=(r,alpha,width,color=hot)=>{c.save();c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width*scale;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();c.restore();};
    c.save();c.lineCap='round';c.lineJoin='round';
    if(valid(sourceX,sourceY)){
      c.globalAlpha=.2;c.strokeStyle=warm;c.lineWidth=1.5;c.setLineDash([5,10]);c.beginPath();c.moveTo(sourceX,sourceY);c.lineTo(cx,cy);c.stroke();c.setLineDash([]);
      c.globalAlpha=.55;c.strokeStyle=warm;c.lineWidth=2;c.beginPath();c.arc(sourceX,sourceY,18*scale+4*pulse*scale,0,Math.PI*2);c.stroke();
    }
    const threadEndX=phase>.8?watcherX+42*scale:cutterX,
      threadEndY=phase>.8?watcherY+8*scale:cutterY;
    thread(watcherX+40*scale,watcherY+5*scale,threadEndX,threadEndY,.38+.3*(1-phase),2.2);
    // The Watcher does not merely point at the danger: two angular braces
    // visibly take the wave's force. Their light bends toward the ring, then
    // thins when the Cutter gets through.
    if(phase>.18&&!returnShot){
      const braceAlpha=Math.min(.7,(phase-.18)*1.25)*(pass?.9:1);
      c.save();c.globalAlpha=braceAlpha;c.strokeStyle=warm;c.lineWidth=4*scale;c.lineCap='round';
      for(const side of [-1,1]){
        const x0=watcherX+48*scale,y0=watcherY+side*24*scale,
          x1=cx-ring*.62,y1=cy+side*ring*.62;
        c.globalAlpha=braceAlpha;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)*.5-12*scale,Math.min(y0,y1)-side*18*scale,x1,y1);c.stroke();
        c.globalAlpha=braceAlpha*.72;c.beginPath();c.moveTo(x1,y1);c.lineTo(x1+side*13*scale,y1-side*9*scale);c.stroke();
      }
      c.restore();
    }
    // After the pass, the Watcher is still holding the far end; the connection
    // is no longer a comfortable line between friends.
    if(phase>.62&&motion){
      const fx=cx+Math.cos(path)*(ring-4*scale),fy=cy+Math.sin(path)*(ring-4*scale);
      c.globalAlpha=.65*(phase-.62)/.38;c.strokeStyle=hot;c.lineWidth=2*scale;
      for(let i=0;i<4;i++){const a=-.8+i*.52;c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+Math.cos(a)*18*scale,fy+Math.sin(a)*18*scale);c.stroke();}
    }
    // Trailing rings are afterimages of the same expanding annulus, not extra
    // hazards. The leading solid rim is the actionable thing to read.
    ringLine(Math.max(5,ring-46*scale),.1+.12*pulse,2,warm);
    ringLine(Math.max(5,ring-22*scale),.18+.16*pulse,3,warm);
    c.save();c.shadowColor=hot;c.shadowBlur=18*scale;
    ringLine(ring,.52+.25*pulse,5,hot);c.restore();
    if(motion){
      c.save();c.lineCap='round';
      for(let i=0;i<12;i++){
        const a=i*Math.PI*2/12+clock*.018,inner=ring+5*scale+((i*17)%9)*scale,outer=inner+(5+10*phase)*scale;
        c.globalAlpha=.16+.22*pulse;c.strokeStyle=i%3===0?acid:warm;c.lineWidth=(1.2+(i%2))*scale;c.beginPath();c.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);c.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);c.stroke();
      }
      c.restore();
    }
    c.globalAlpha=.1+.06*pulse;c.fillStyle=acid;c.beginPath();c.arc(cx,cy,Math.max(3,ring-10*scale),0,Math.PI*2);c.fill();
    foe(c,'pulse',cx,cy,24*scale,0,{time:clock,mode:'idle'});
    // The Cutter exits the rim's path. This is the same moving-body action the
    // live Pulse collision allows; the visual never claims the ring has a gap.
    if(pass&&motion){
      const slashT=Math.max(0,Math.min(1,passU)),slashFade=Math.sin(Math.PI*slashT);
      c.save();c.translate(cutterX,cutterY);c.rotate(path+.2);c.globalAlpha=.45+.45*slashFade;c.strokeStyle=acid;c.shadowColor=acid;c.shadowBlur=16*scale;c.lineWidth=4*scale;c.beginPath();c.moveTo(-42*scale,28*scale);c.lineTo(34*scale,-34*scale);c.stroke();c.shadowBlur=0;c.globalAlpha=.55*slashFade;c.lineWidth=2*scale;c.beginPath();c.moveTo(-34*scale,37*scale);c.lineTo(43*scale,-25*scale);c.stroke();c.restore();
    }
    cube(c,cutterX,cutterY,pass?20*scale:17*scale,path+.2,0,1);
    c.save();c.globalAlpha=.72+.2*pulse;c.strokeStyle=acid;c.lineWidth=3*scale;c.beginPath();
    c.moveTo(cutterX,cutterY);c.lineTo(cutterX+Math.cos(path)*30*scale,cutterY+Math.sin(path)*30*scale);c.lineTo(cutterX+Math.cos(path)*22*scale-7*scale,cutterY+Math.sin(path)*22*scale-5*scale);c.moveTo(cutterX+Math.cos(path)*30*scale,cutterY+Math.sin(path)*30*scale);c.lineTo(cutterX+Math.cos(path)*22*scale-7*scale,cutterY+Math.sin(path)*22*scale+5*scale);c.stroke();c.restore();
    const watcherGlow=returnShot?.28:phase>.72?.95:.72;
    watcherMask(c,watcherX,watcherY,Math.min(w,h)*.00092+.25,{glow:watcherGlow,eye:returnShot?.22:.42+.45*(1-phase),split:returnShot?.18:phase>.82?(phase-.82)*.25:0});
    c.restore();
  }
  // ── CHUNK 1: "WHAT HIT ME?" ──────────────────────────────────────────────
  // One red line from the cube to the body that hit it, an impact ring on
  // that body, and a rim flash at the screen edge. The rim is capped at 25%
  // opacity by design (src/damage-feedback.js): a flash bright enough to hide
  // the attacker is the bug, not the feature.
  function drawHitFeedback(c, w, h, s, v, p, motion, time, fb) {
    if (!fb || !fb.live) return;
    const dir = fb.direction;
    if (fb.rim > 0) {
      const inner = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78);
      inner.addColorStop(0, 'rgba(200,16,46,0)');
      inner.addColorStop(0.62, `rgba(200,16,46,${fb.rim * 0.5})`);
      inner.addColorStop(1, `rgba(125,0,24,${fb.rim})`);
      c.save();
      c.fillStyle = inner;
      c.fillRect(0, 0, w, h);
      c.restore();
    }
    if (!dir) return;
    const px = (p.x - v.x) * v.scale, py = (p.y - v.y) * v.scale,
      ex = (dir.x - v.x) * v.scale, ey = (dir.y - v.y) * v.scale,
      ramp = Math.max(0, 1 - (fb.age || 0) / 36);
    c.save();
    c.lineCap = 'round';
    // The connector: dark underlay then the red line, so it reads over any
    // wall. It is clipped to the viewport by construction (both ends are).
    const ux = Math.cos(dir.angle), uy = Math.sin(dir.angle),
      startX = px + ux * 26, startY = py + uy * 26,
      pull = Math.min(1, (fb.age || 0) / 6),
      endX = startX + (ex - startX) * pull, endY = startY + (ey - startY) * pull;
    c.globalAlpha = 0.9 * ramp;
    c.strokeStyle = '#0b0408';
    c.lineWidth = 7;
    c.beginPath(); c.moveTo(startX, startY); c.lineTo(endX, endY); c.stroke();
    c.strokeStyle = '#ff2b4a';
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(startX, startY); c.lineTo(endX, endY); c.stroke();
    // Arrowhead at the attacker's end.
    const ah = 11;
    c.fillStyle = '#ff2b4a';
    c.beginPath();
    c.moveTo(ex + ux * 12, ey + uy * 12);
    c.lineTo(ex - ux * 2 - uy * ah, ey - uy * 2 + ux * ah);
    c.lineTo(ex - ux * 2 + uy * ah, ey - uy * 2 - ux * ah);
    c.closePath(); c.fill();
    // The impact ring tightens onto the body.
    const ringR = 34 - 20 * fb.impact;
    c.globalAlpha = 0.9 * ramp;
    c.strokeStyle = LAW.lethalPale;
    c.lineWidth = 2.5;
    c.beginPath(); c.arc(ex, ey, ringR, 0, Math.PI * 2); c.stroke();
    // ── CHUNK 2: THE KILLER POINTER ──────────────────────────────────────
    //
    // The line says WHERE; it still left the player doing the arithmetic on a
    // 960px field with four bodies in it. So the attacker gets named at its own
    // body — one short word, in the same rose as the line, in the same
    // body-first vocabulary as the corner readout (`FANG HIT`, `RING HIT`) —
    // and the name is pinned to the viewport edge when the attacker is off it.
    const label = fb.label || 'HIT';
    c.font = 'bold 12px monospace';
    const tw = Math.min(112, c.measureText(label).width + 12);
    const lx = Math.max(46, Math.min(w - 46, ex)), ly = Math.max(70, Math.min(h - 26, ey - 30));
    c.globalAlpha = 0.92 * ramp;
    c.fillStyle = '#280e18';
    c.fillRect(lx - tw / 2, ly - 10, tw, 19);
    c.strokeStyle = LAW.lethal;
    c.lineWidth = 1.4;
    c.strokeRect(lx - tw / 2, ly - 10, tw, 19);
    c.fillStyle = '#fff4e9';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, lx, ly - 1, tw - 6);
    // A tag stem down to the body, so the word cannot be read as a HUD chip.
    c.globalAlpha = 0.55 * ramp;
    c.strokeStyle = LAW.lethal;
    c.beginPath(); c.moveTo(lx, ly + 9); c.lineTo(lx, ly + 13); c.stroke();
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    // Off-screen attacker: point at it from the edge, because a line clipped by
    // the viewport is not a warning, it is a hint that something happened.
    const off = ex < 8 || ex > w - 8 || ey < hudTop() + 8 || ey > h - 8;
    if (off) {
      const sx = clamp(ex, 22, w - 22), sy = clamp(ey, hudTop() + 22, h - 22);
      c.save();
      c.translate(sx, sy);
      c.rotate(dir.angle);
      c.globalAlpha = 0.95 * ramp;
      c.fillStyle = LAW.lethal;
      c.beginPath(); c.moveTo(15, 0); c.lineTo(0, -8); c.lineTo(0, 8); c.closePath(); c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  function drawCutsceneOverlay(c, w, h, s, v, p, time, motion) {
    const cs = s.cutscene;
    if (!cs) return;
    const flash = motion ? 1 : 0.35;
    const sx = (p.x - v.x) * v.scale, sy = (p.y - v.y) * v.scale;
    const t = cs.t, easeOut = (u) => 1 - Math.pow(1 - u, 3), easeIn = (u) => u * u * u;
    const wash = (a) => { c.fillStyle = `rgba(4,4,10,${a})`; c.fillRect(0, 0, w, h); };
    c.save();
    if(cs.beatId?.startsWith('sector-'))storyEmotionMotif(c,w,h,s.narrative?.emotion,cs.elapsedTotal??time,motion,.82);
    if(cs.beatId?.startsWith('mid-wave-'))storyEmotionMotif(c,w,h,s.storyMoment?.emotion,cs.elapsedTotal??time,motion,.32);
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
        // The hook is deliberately brief: sparks and eyes arrive immediately.
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
      case 'mid-wave-signal': {
        // A mid-wave beat is a signal, not a pause: the Watcher points at the
        // real Pulse while the live formation remains visible underneath.
        wash(.18);
        drawStoryMechanicDiagram(c,w,h,s.storyMoment,t*.25,cs.elapsedTotal??time,motion,sx,sy,v,'signal');
        break;
      }
      case 'mid-wave-tension': {
        // The Pulse rim grows into the friendship line. The player is held for
        // only this readable tell; no gameplay result is invented here.
        wash(.3);
        drawStoryMechanicDiagram(c,w,h,s.storyMoment,.12+.38*t,cs.elapsedTotal??time,motion,sx,sy,v,'tension');
        break;
      }
      case 'mid-wave-pass': {
        // The Watcher takes the impact so the Cutter can clear the rim. This is
        // the story consequence and the actionable Pulse dodge in one motion.
        wash(.24);
        drawStoryMechanicDiagram(c,w,h,s.storyMoment,.5+.32*t,cs.elapsedTotal??time,motion,sx,sy,v,'pass');
        break;
      }
      case 'mid-wave-return': {
        const fade=Math.max(0,.12*(1-t));
        if(fade){c.fillStyle=`rgba(8,7,20,${fade})`;c.fillRect(0,0,w,h);}
        drawStoryMechanicDiagram(c,w,h,s.storyMoment,.82+.18*t,cs.elapsedTotal??time,motion,sx,sy,v,'return');
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
        // A brief white flicker as the world, not the cube, takes focus.
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
    else if (["tokyo", "foundry", "manga", "synth", "void"].includes(s.equipment?.world)) back.equipment(w,h,s.equipment.world,motion?time:0,{x:v.panX*v.scale,y:v.panY*v.scale,scale:v.scale});
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
    if(s.voidWell)drawVoidField(c,{field:s.voidWell,now:world.clock,motion,scale:v.scale,layer:'outer'});
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
    renderCuller.update(world.clock*1000/60,v,combat.enemies.values());
    for (const e of combat.enemies.values()) {
      if (!renderCuller.visible(e,v)) continue;
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
        time:motion?(e.frostCold?.phase==='active'&&e.frostCold.kind==='freeze'?e.frostCold.born:time):0
      });
      if(e.frostCold)drawFrostStatus(c,{x:q.x,y:q.y,radius:e.r,angle:q.angle,status:e.frostCold,now:world.clock,motion});
      if(e.emberBurn)drawEmberBurn(c,{x:q.x,y:q.y,radius:e.r,status:e.emberBurn,now:world.clock,motion});
      c.restore();
      // ── CHUNK 2: GOLD IS A PROMISE, NOT DECORATION ────────────────────
      // The Crown is the one body in the field that PAYS: breaking it restores
      // a hull point. The mark for that is the gold chevron `drawSliceSafe`
      // hangs above its bracket — NOT a ring or a second frame on the body.
      // A body-hugging gold ring was tried in this pass and read as a second
      // targeting bracket, which made "you can cut this" and "this pays" look
      // like the same sentence. The bubble above the active mark is a bubble:
      // it only exists while the bounty is actually within reach.
      if (s.equipment?.world === "manga") c.restore();
    }
    // A small local notch denotes REAL Hypno admission. Not a second target bracket.
    if(s.equipment?.eyes==='hypno')for(const e of combat.enemies.values())if(e.hypnoUntil>world.clock){
      const x=mix(e.px,e.x,alpha),y=mix(e.py,e.y,alpha)-e.r-8;
      if(motion&&e.hypnoUntil-world.clock>10){c.save();c.globalAlpha=.32;seam(c,[[p.x,p.y-6],[x,y+5]],'#c8a3ec',1);c.restore();}
      seam(c,[[x-5,y-3],[x+5,y-3],[x+5,y+3],[x,y+3]],'#ddbaff',1.5);
    }
    // Core damage boundary stays visible over large enemy silhouettes, while
    // actual hazard paint below still has priority over both field layers.
    if(s.voidWell)drawVoidField(c,{field:s.voidWell,now:world.clock,motion,scale:v.scale,layer:'core'});
    // CHUNK 2: "safe to slice", drawn OVER the bodies and UNDER the hazards, so
    // a live ring is never hidden behind a bracket. Screen-space free: the view
    // array is built once per frame by the shell.
    if (sliceMarkView.length && !s.opening) drawSliceSafe(c, sliceMarkView, { scale: v.scale, motion, time });
    for (const a of combat.hazards) {
      const x = mix(a.px, a.x, alpha), y = mix(a.py, a.y, alpha);
      if (a.kind === "zone") {
        drawEnemyZone(c,a.zone,true,v.scale);
      } else if (a.kind === "ring") {
        c.save();
        c.globalAlpha = a.spent ? 0.26 : 1;
        arc(c, "#a3122f", 6, x, y, mix(a.previousRadius, a.radius, alpha));
        arc(c, LAW.lethalPale, 2, x, y, mix(a.previousRadius, a.radius, alpha));
        c.restore();
      } else if (a.kind === "shock") {
        // CHUNK 6B: the landlord's slam — a bone-white concussion ring, not a
        // Pulse. Cracked and amber, spent fading.
        c.save();
        c.globalAlpha = a.spent ? 0.3 : Math.max(0.25, 1 - a.radius / ((a.maxRadius || 150) + 30));
        arc(c, "#5b2a2e", 7, x, y, mix(a.previousRadius, a.radius, alpha));
        arc(c, LAW.lethalPale, 2.4, x, y, mix(a.previousRadius, a.radius, alpha));
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
        line(c, LAW.lethalPale, Math.max(1.2,1.1/v.scale/markerScale), -4, -3, 5, -2);
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
          a.source === "crown" ? LAW.lethalPale : "#d5adff",
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
        focusRecovering:s.focusRecoveryActive&&s.phase==='playing',
        focusLevel:s.focus,
        recoveryAge:s.focusRecoveryAge,
        ...armorShellPose(s,p.angle),
        ...coreMechanismPose(s),
        shellAbility:s.shellAbility,tailAbility:s.tailAbility,eyeAbility:s.eyeAbility,eyePower:aim?.power||0,tailMotion:{bend:motion&&!dash?Math.max(-.18,Math.min(.18,world.player.velocity.y/MAX_SPEED*.18)):0},
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
        drawSwordWeapon(c,{x:p.x,y:p.y,radius:R,angle:swordAngle,active:s.blade>0,aiming:s.held,sword:s.sword,reach:swordReach,charge:s.swordCharge,motion,time,buff:visualBuff,equipment:s.equipment,widthScale:(s.precisionShot?.widthScale??1)*(s.inkCutScale??1)*(s.equipment?.dash==='dash-fire'?.9:1),bladeRemaining:s.blade,finish:structural?upgradePhase.amount:1,age:s.slashAge,reveal:structural?1:s.waveBuff?Math.min(1,(s.wave?.age||0)/18):1});
        for(const attack of s.swordFx||[])drawSwordAttack(c,attack,s.sword,!motion);
      }
      if (s.equipment?.head === "oni" && s.hp === 1 && s.blade > 0) drawEquipmentSlash(c, p.x, p.y, p.x + Math.cos(s.slashAngle) * 80, p.y + Math.sin(s.slashAngle) * 80, "blood", 1,{progress:1-Math.min(1,s.blade/12),equipment:s.equipment,reducedMotion:!motion});
      if(s.equipment?.dash==='dash-void'&&s.held)drawVoidReadiness(c,{x:p.x,y:p.y,radius:R,readyIn:s.voidWell?.readyIn||0});
      drawEquipmentEffects(c, motion ? s.equipmentFx : { ...s.equipmentFx, bursts: [] }, motion ? time : 0, ARENA.y + ARENA.h,motion?glowBake:null);
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
    // ── CHUNK 1: THE CUT CHARGES, ON THE CUBE ────────────────────────────
    //
    // These three marks already existed — as three 7×3.6px bars tucked under
    // the cube at a fixed screen size, which at a 960×540 embed is a smudge
    // nobody can count, in the one place the eye is. They are the whole
    // resource the game is built on ("NO CUTS" was a real dead end for new
    // players) and the far-right HUD copy of them has been deleted.
    //
    // So: same place, same idea, drawn at the player's own scale with a dark
    // well, a full-height block per charge, a crisp white recharge fill, and a
    // red pulse when empty. Screen-space, so the size is honest at every zoom.
    {
      const ux = 1 / Math.max(0.25, v.scale), sp = toScreen(v, p);
      if (!s.opening?.free && (s.phase !== "ready" || s.visualTutorial)) {
        const max = Math.max(1, s.edgeMax || 3),
          now = clamp(s.edge ?? max, 0, max),
          empty = now <= 0,
          pulse = motion ? 0.5 + 0.5 * Math.sin(time * 0.42) : 0.7,
          blockW = 9 * ux, blockH = 8 * ux, gap = 3.5 * ux,
          total = max * blockW + (max - 1) * gap,
          y = s.visualTutorial ? sp.y + R * Math.SQRT2 * v.scale + 10 * ux : sp.y + (R * Math.SQRT2 + 8) * ux,
          x0 = sp.x - total / 2;
        // A dark plate under the row so the charges read on a lit floor or a
        // white flash frame alike.
        c.fillStyle = 'rgba(10,8,16,0.72)';
        c.fillRect(x0 - 3 * ux, y - 2 * ux, total + 6 * ux, blockH + 4 * ux);
        for (let i = 0; i < max; i++) {
          const x = x0 + i * (blockW + gap), filled = i < now;
          c.fillStyle = filled ? INK.acid : empty ? `rgba(255,53,84,${0.45 + 0.55 * pulse})` : '#4b4050';
          c.fillRect(x, y, blockW, blockH);
          if (filled) {
            // One white notch per block so the count survives a colour-blind
            // read and the shapes are countable at a glance.
            c.fillStyle = INK.paper;
            c.fillRect(x + blockW * 0.28, y + blockH * 0.28, blockW * 0.44, blockH * 0.44);
          }
          if (i === now) {
            // The charge being REGENERATED fills in white from the left, so an
            // empty row says when it will not be empty.
            c.fillStyle = INK.paper;
            c.fillRect(x, y, blockW * Math.min(1, (s.recharge || 0) / (s.regenWindow || 60)), blockH);
          }
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
    const fractureImpact = dimensionImpact.snapshot();
    if(fractureImpact&&!s.opening&&!s.visualTutorial)drawDimensionImpact(c,w,h,{
      ...fractureImpact,
      x:fractureImpact.x===null?w*.5:(fractureImpact.x-v.x)*v.scale,
      y:fractureImpact.y===null?h*.5:(fractureImpact.y-v.y)*v.scale,
      motion:motion&&shakeLevel!=='off',low:shakeLevel==='low',
    });
    drawCutsceneOverlay(c, w, h, s, v, p, time, motion);
    c.restore();
    // CHUNK 1: the two pieces of aim/damage feedback that belong in SCREEN
    // space, drawn last so nothing in the world can cover them. Both read a
    // view-time payload the shell sets (`setAimFeedback`); neither invents
    // state. The reticle exists because the OS cursor is hidden over the
    // arena; the hit line exists because "what hurt me?" was the loudest
    // question in the whole report.
    c.save();
    c.setTransform(viewport.width / w, 0, 0, viewport.height / h, 0, 0);
    drawHitFeedback(c, w, h, s, v, p, motion, time, hitFeedbackView);
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
    /** CHUNK 1: screen-space aim ring + damage reaction, supplied per frame. */
    setAimFeedback,
    // Read-only hooks for the headless camera checks.
    effectState() {
      return { ghosts: ghosts.size, trail: trail.length, beams: beams.length, dimensionImpact:dimensionImpact.snapshot() };
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
      dimensionImpact.reset();dustPool.reset();sparkPool.reset();renderCuller.reset();dashDust.length=0;
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
    performanceState(){return {background:back.bakeStats(),dust:dustPool.stats(),sparks:sparkPool.stats(),culling:renderCuller.stats(),glow:glowBake?.stats()||null};},
    dispose() {
      back.dispose();glowBake?.clear();dustPool.reset();sparkPool.reset();renderCuller.reset();
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
  item("neko", "head", "Cyber Ears", 200, "Chain Grace", "Pink ears perk on launch. Cosmetic wall sparks. Adds 12 simulation ticks to the chain expiry window after a kill."),
  item("viper", "head", "Viper Horns", 300, "Fast Narrow", "20% faster launch, 15% thinner cut. Blade lifetime scales down to preserve straight-line active reach; ballistic landing distance can change."),
  item("oni", "head", "Broken Oni", null, "Last Health", "Defeat a Crown at 1 HEALTH to unlock. Kills at 1 HEALTH earn 50% more score."),
  item("ninja", "eyes", "Ninja Slits", 0, "Sharp Focus", "Classic expressive eyes."),
  item("visor", "eyes", "Cyber Visor", 200, "Focus Efficiency", "Fitted cyan glass with aim-only calibration bars. Aiming consumes 10% less FOCUS. Does not slow physics further. No target lock."),
  item("blaze", "eyes", "SSJ Blaze", 150, "Ignition Reserve", "Flame-cut eyes brighten on real Overdrive. On real Overdrive entry return one EDGE after the ordinary kill refund, clamped to the current maximum. Full cap consumes it; no queued refund or timer extension. Replaces the old +8% Drive score."),
  item("paper", "body", "Paper Ninja", 0, "Comic Paper", "White paper shell with a bold black edge."),
  item("obsidian", "body", "Obsidian Stealth", 200, "Precision Bounty", "Matte black shell, inset neon-lime seams. Earn 8% more kill score while airborne. All equipment score perks together cap at +25%."),
  item("hologram", "body", "Hologram Wire", 500, "Precision Phase", "During the first 4 world ticks of a legal launch, phase through one Prism or Crown needle, then recharge for 120 world ticks. The needle continues. No beam, ring, zone, enemy, boss or wall immunity; no aim-cost discount."),
  item("standard", "core", "Standard Heart", 0, "Balanced Build", "Balanced movement. Three EDGE bars."),
  item("time", "core", "Time Crystal", 400, "Focus Recovery", "Kills start a 120-tick window of twice-normal passive FOCUS recovery."),
  item("riot", "core", "Riot Reactor", 500, "Quick Overdrive", "Overdrive activates every four consecutive kills instead of six (1.5x faster). Maximum two EDGE bars."),
  item("glass", "core", "Glass Cannon", null, "Double Score", "Challenge: reach SECTOR 05. Double score; maximum 1 HEALTH, including Crown repairs."),
  item("ribbon", "tail", "Ninja Ribbon", 0, "Folded Cloth", "Yellow-green ribbon that follows your movement."),
  item("wings", "tail", "Prism Wings", 400, "Wall Recharge", "First side-wall contact per airborne streak restores one EDGE. Floor contact resets it."),
  item("ghost", "tail", "Ghost Scarf", 350, "Lingering Blade", "Twin spectral ribbons. Adds six simulation ticks to each launch blade; never repeats a hit on the same enemy in one shot."),
  item("razor", "slash", "White Razor", 0, "Clean Cut", "White cut flash and shard impact."),
  item("katana", "slash", "Katana Ink", 150, "Blade Extension", "Layered black-and-white brush cut with ink droplets. Adds 2 simulation ticks to the active launch blade."),
  item("laser", "slash", "Neon Laser", 250, "Blade Extension", "Cyan-pink cut scar lingers for half a second with a quiet electric accent. Adds 3 simulation ticks to the active launch blade."),
  item("twilight", "world", "Twilight Undercut", 0, "Plum Skyline", "Original twilight arena."),
  item("tokyo", "world", "Cyber Tokyo", 450, "Precision Bounty", "Electric-blue skyline and diagonal neon rain. Danger colors stay unchanged. Earn 8% more kill score at speed 18+. All equipment score perks together cap at +25%."),
  item("foundry", "world", "Blood Foundry", 300, "Precision Bounty", "Crimson sky, orange furnace pipes and a deeper procedural bass voice. Danger colors stay unchanged. Earn 12% more kill score vs armored foes. All equipment score perks together cap at +25%."),
  item("crown", "head", "Cube Crown", 600, "Armor Break", "Removes two Crown/Bastion plates per hit. Launch speed is 8% lower; no effect on Hyper steering."),
  item("samurai", "head", "Samurai Crest", 350, "Wide Horizontal", "Within 25 degrees of horizontal, cuts are 20% wider."),
  item("coil", "head", "Lightning Coil", 400, "Chain Spark", "A direct slice zaps one enemy within 160 pixels for one plate. Sparks cannot trigger more sparks."),
  item("beacon", "head", "Danger Beacon", 250, "Early Warning", "Shows an amber threat bracket when a Fang begins winding up, before its charge."),
  item("glitch", "eyes", "Glitch X-Eyes", 250, "Focus Return", "An offset X and ring joined by broken conductors. The circuit closes during actual passive FOCUS recovery. Passive FOCUS recovery is 12% faster when not aiming."),
  item("smug", "eyes", "Smug Half-Lid", 150, "Chain Grace", "Half-lidded eyes open gold in Overdrive. Adds 12 simulation ticks to the chain expiry window after a kill."),
  item("hypno", "eyes", "Hypno Spiral", 300, "Local Daze", "After 18 continuous aim ticks of usable focus, defer one idle Fang’s new attack for 12 world ticks within 140 and clear static sight. Movement, existing tells, rushes and projectiles continue. Target immunity 90 ticks from acceptance. Walls and bosses resist; no aim-cost discount."),
  item("sniper", "eyes", "Sniper Dot", 250, "Precision Puncture", "At 90% or greater released power, the first direct Crown or Bastion contact removes one extra plate. That shot has a 10% narrower corridor. Bosses and secondary hits do not consume it. No homing or score bonus; extra equipment plates share a +2 cap."),
  item("prism", "body", "Prism Shell", 550, "Wall Needles", "Faceted crystal. Side-wall contact launches two upward needles; each removes one Fang plate. 45-tick cooldown."),
  item("iron", "body", "Bastion Iron", 450, "Rush Guard", "Blocks one Fang rush per run and pushes you clear. Arena walls already do no health damage."),
  item("lava", "body", "Lava Cracked", 350, "Chain Grace", "Charcoal shell with magma seams that brighten as the chain grows. Adds 18 simulation ticks to the chain expiry window after a kill."),
  item("gold", "body", "Gold Foil", 800, "Precision Bounty", "Polished gold facets and a white star glint while nearly still. Earn 10% more kill score on every kill. All equipment score perks together cap at +25%."),
  item("grav", "core", "Grav Core", 450, "Aim Pull", "While aiming, pulls small Fangs within 220 pixels gently toward the aim line. Maximum 0.35 pixels per simulation tick."),
  item("magnet", "core", "Magnet Dynamo", 350, "Close Throughcut", "Close passes within 100 pixels have a 20% wider blade, helping real two-contact Throughcuts. Quest rules unchanged."),
  item("echo", "core", "Echo Heart", 550, "Ghost Blade", "Every third direct chain kill leaves a stationary ghost blade for 30 simulation ticks, slicing nearby Fangs once each."),
  item("viper-tails", "tail", "Viper Tails", 250, "Directional Retention", "Retains 15% of ordinary steering speed loss on a legal relaunch: 85% retention becomes 87.25%, not +15% speed. No gain from rest or straight continuation; Hyper retention and the legal speed ceiling keep priority. Replaces the old speed-score bonus."),
  item("anchor", "tail", "Anchor Chain", 400, "Floor Breaker", "Floor rebound is 15% stronger and clears Fangs within 170 pixels. Floor recovery cooldown still applies."),
  item("thrusters", "tail", "Mini Thrusters", 450, "Jet Rebound", "Twin jet nozzles. Earned rail rebounds are 8% stronger; cannot compound above the existing speed ceiling."),
  item("spectrum", "tail", "Neon Spectrum", 600, "Three-Band Refill", "Three primary kills in one chain return one EDGE, then start a 120-world-tick cooldown. Secondaries do not count. Chain break clears incomplete bands; full EDGE consumes the sequence without a queued refund. Replaces the old +12 chain ticks."),
  item("glitch-fx", "slash", "Glitch Tear", 400, "Blade Extension", "Offset stepped red/cyan scar with a crunchy hit accent. Adds 2 simulation ticks to the active launch blade."),
  item("confetti", "slash", "Gold Confetti", 650, "Precision Bounty", "Gold foil fragments fan out on impacts, with a soft bright chime. Earn 12% more kill score on multi-cuts. All equipment score perks together cap at +25%."),
  item("comic", "slash", "Comic Impact", 300, "Chain Grace", "Black/yellow starburst at each impact. Adds 18 simulation ticks to the chain expiry window after a kill."),
  item("pixel", "slash", "Pixel Shatter", 350, "Blade Extension", "Square debris falls with gravity for 30 simulation ticks; never collides or deals damage. Adds 2 simulation ticks to the active launch blade."),
  item("manga", "world", "Manga Paper", 700, "Precision Bounty", "Warm paper, crosshatched skyline and black comic marks. Danger lasers keep their color. Earn 10% more kill score on multi-cuts. All equipment score perks together cap at +25%."),
  item("synth", "world", "Synthwave Grid", 550, "Focus Return", "Striped sunset, perspective grid, violet mountain silhouettes and a higher synth voice. Passive FOCUS recovery is 15% faster when not aiming."),
  item("chamfer","body","Chamfer Frame",280,"Glancing Recoil", "Reduces the primary armor shove component by 20%, without exceeding incoming speed or the legal ceiling. No extra blade time."),
  item("notched","body","Notched Frame",320,"Vent Cooling", "Recessed side vents open only during real recovery. Passive FOCUS recovery is 12% faster when not aiming. Shared recovery bonus caps at 40%. No aim-cost discount or thrust."),
  item("segmented","body","Segmented Frame",380,"Compression Spring", "Stores 20% of actual forward momentum lost on the first primary armor shove per shot, up to 4 speed for 45 ticks. The next accepted launch returns it once, bounded by pre-impact speed and the legal ceiling. No extra chain grace."),
  item("dash-auto", "dash", "Adaptive Dash", 0, "Build Resonance", "Dash trails follow your equipment and sword. Cosmetic only."),
  item("dash-ink", "dash", "Ink Dash", 150, "Brush Cutter", "Widens the primary cutting corridor by 12%, within the shared +35% positive-width limit. Width gains compose before Viper/Sniper narrowing; temporary width stays separate. No extra blade time, repeated hits, speed, body size or persistent ink hazard."),
  item("dash-fire", "dash", "Ember Dash", 250, "Contact Ignition", "The first eligible direct contact ignites its surviving target and up to two nonboss neighbors within 56 and clear static sight. Each takes one secondary damage at 18 and 36 world ticks. Active burns do not stack or refresh. Shot width is 10% narrower. No extra blade time, primary rewards, chain effects or boss damage from fire."),
  item("dash-lightning", "dash", "Volt Dash", 300, "Precision Bounty", "Angular electric streaks follow your launch. Earn 10% more kill score at speed 18+. All equipment score perks together cap at +25%."),
  item("dash-ice", "dash", "Frost Dash", 300, "Rime Breaker", "The first eligible direct contact chills its surviving victim and at most one nonboss neighbor within 60 and clear static sight. Fangs freeze movement and their own attack clocks for 18 world ticks. Other nonboss bodies move at 70% for 24 world ticks; their tells keep running. Actual thaw starts 90 world ticks of cold immunity. Active cold never stacks or refreshes. Bosses and protected teaching actors resist. Emitted hazards and rushing body contact remain dangerous. No extra damage, player physics change or aim-cost discount."),
  item("dash-water", "dash", "Tide Dash", 250, "Focus Return", "Sweeping water ribbons follow your launch. Passive FOCUS recovery is 10% faster when not aiming."),
  item("dash-void", "dash", "Void Dash", 350, "Collapse Well", "The first eligible direct contact creates one 18-world-tick field at its fixed origin. Up to three nearest movable nonboss survivors within 110 and static sight are selected once. Each is pulled at most 32 total units with solids and post leash respected. Only those selected targets actually within the 28-unit core and static sight at expiry take one secondary armor/health unit. One live field; cooldown 36 from admission. No refresh, eviction, early payout, boss damage, projectile absorption, player phase, primary rewards or recursive procs. Replaces the old armor-score bonus."),
  item("dash-echo", "dash", "Echo Dash", 350, "Chain Grace", "Geometric afterimages trace your launch. Adds 12 simulation ticks to the chain expiry window after a kill."),
  item("pointer-reticle", "pointer", "Field Reticle", 0, "Clean Aim", "A segmented reticle marks the point where you press. Cosmetic only."),
  item("pointer-diamond", "pointer", "Prism Pointer", 200, "Blade Extension", "A faceted diamond marks your drag origin. Adds 1 simulation ticks to the active launch blade."),
  item("pointer-orbit", "pointer", "Orbit Pointer", 250, "Focus Return", "Broken orbital arcs frame your drag origin. Passive FOCUS recovery is 10% faster when not aiming."),
  item("pointer-cross", "pointer", "Crosshair Pointer", 200, "Focus Efficiency", "Four precision brackets mark your drag origin. Aiming consumes 8% less FOCUS. Does not slow physics further."),
  item("radar-base", "radar", "Field Radar", 0, "Local Scan", "The standard local radar tracks nearby enemies and objectives."),
  item("radar-1", "radar", "Long-Range Array", 1200, "Range +35%", "See 35% farther on the radar. Existing enemy and objective markers remain visible."),
  item("radar-2", "radar", "Threat Array", 3000, "Range +70%", "See 70% farther and mark nearby active projectiles and danger zones."),
  item("radar-3", "radar", "Oracle Array", 6500, "Range +120%", "See 120% farther, active hazards and live enemy wind-ups, plus your current heading."),
  item("trajectory-base", "trajectory", "Field Trajectory", 0, "Launch Preview", "A short calculated launch path appears while aiming. Stops at the first solid surface."),
  item("trajectory-1", "trajectory", "Vector Lens", 1200, "Extended Path", "Shows more of the calculated launch path while aiming."),
  item("trajectory-2", "trajectory", "Impact Lens", 3000, "Impact Markers", "A longer path adds time ticks and a first-impact marker for the current field snapshot."),
  item("trajectory-3", "trajectory", "Oracle Lens", 6500, "Flight Analysis", "Shows the longest visible path, impact marker and live speed, angle and estimated time. Enemies can move; it does not predict bounces."),
  item("void", "world", "Pro Void", 1e3, "Precision Bounty", "Pitch-black background, restrained white boundary detail and sparse audio. Danger colors remain visible. Earn 15% more kill score vs landlords. All equipment score perks together cap at +25%.")
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
  // CHUNK 7: a canvas that failed to get a 2D context hands us null, and the
  // first thing this function does is `c.save()` -- which threw an exception
  // straight up through the wave HUD's update and killed the frame loop. An
  // undrawable prop is a cosmetic problem; it must never be a fatal one.
  if (!c || typeof c.save !== 'function') return;
  const {x=0,y=0,radius=24,angle=0,active=false,aiming=false,charge=0,motion=true,time=0}=spec;
  const original=spec.sword||{family:'standard',color:'#deff73',reach:1,width:1};
  const buff=spec.buff,upgrade=buff?.id||buff,finish=spec.finish??1;
  const sword={...original,...(upgrade==='breaker'?{family:'breaker',width:1.3}:upgrade==='duelist'?{family:'rapier'}:{})};
  const family=sword.family||'standard',color=sword.color||'#deff73',R=radius;
  const extension=upgrade==='reach'?1+.2*finish:upgrade==='comet'?.85:1;
  const length=active?3.6*R*(spec.reach??sword.reach??1):R*(family==='rapier'?2.35:1.95)*extension;
  const width=R*(family==='cleaver'?.42:family==='breaker'?.32:family==='rapier'?.085:family==='reaper'?.22:.16)*(active?(sword.width||1)*(spec.widthScale??1):1);
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
    if(spec.equipment){
      c.save();c.translate(R*.91,0);c.scale(R,R);c.rotate(Math.PI/2);
      drawAssemblySocket(c,resolveAssemblyConstruction(spec.equipment),R>=38);c.restore();
    }
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
  drawCubeHero(c,{x:p.x,y:p.y,radius:24,angle:0,equipment,motion:motion,time:age,face:1,pose:{aiming:s.held,focusRecovering:s.focusRecoveryActive,focusLevel:s.focus,recoveryAge:s.focusRecoveryAge,...armorShellPose(s),...coreMechanismPose(s),shellAbility:s.shellAbility,tailAbility:s.tailAbility,eyeAbility:s.eyeAbility}});
  drawSwordWeapon(c,{x:p.x,y:p.y,radius:24,angle:s.slashAngle,active:s.blade>0,sword:s.sword,reach:(s.reach||1)*s.sword.reach,charge:s.swordCharge,widthScale:(s.precisionShot?.widthScale??1)*(s.inkCutScale??1)*(s.equipment?.dash==='dash-fire'?.9:1),motion:motion,time:age});c.restore();
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
   c.textAlign='left';c.fillStyle='#abc2bd';c.font='8px monospace';c.fillText(['SHORT PATH','EXTENDED PATH','TIME MARKS / IMPACT','LIVE FLIGHT ANALYSIS'][level],14,158);
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

/** Local perk receipts: focus dial, blade chevrons, chain links or score diamonds.
 * Render-only, bounded to 30 simulation ticks. Caller gates reduced motion. */
export function drawPartPerkPulse(c,{x=0,y=0,kind='score',age=0,motion=true}={}) {
 if(!c||!motion||age<0||age>=30)return;
 const u=age/30,r=20+u*20,color={focus:'#00F0FF',blade:'#DFFF00',chain:'#c4a2ff',score:'#DFFF00'}[kind]||'#00F0FF';
 c.save();try{c.translate(x,y);c.globalAlpha=(1-u)*.8;c.strokeStyle=color;c.lineWidth=1.8;
 for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2+u*.3);c.beginPath();
 if(kind==='focus')c.arc(0,0,r,.1,.9);
 else if(kind==='blade'){c.moveTo(r-5,-5);c.lineTo(r+5,0);c.lineTo(r-5,5);}
 else if(kind==='chain'){c.ellipse(r,0,6,3,.4,0,Math.PI*2);}
 else{c.moveTo(r-4,0);c.lineTo(r,-5);c.lineTo(r+4,0);c.lineTo(r,5);c.closePath();}
 c.stroke();c.restore();}
 }finally{c.restore();}
}

/** Literal perk comparison overlay for the shop. Numeric deltas, not a second
 * combat simulator. A static readout when motion is disabled. */
export function drawPartPerkDemo(c,w,h,{stat='',value=0,chip='',time=0,motion=true}={}) {
 if(!c)return;
 const t=motion?Math.min(1,Math.max(0,(time%1500-250)/700)):1;
 const labels={blade:'EXTRA CUTTING TIME',grace:'EXTRA COMBO TIME',focus:'FOCUS COST',recovery:'FOCUS RECOVERY'};
 const percent=stat==='focus'||stat==='recovery'||stat.startsWith('score:');
 const base=percent?100:0,next=percent?(stat==='focus'?100-value:100+value):value;
 const max=Math.max(100,next);
 c.save();try{c.fillStyle='#14101ef2';c.fillRect(14,h-94,w-28,80);c.font='bold 12px monospace';c.fillStyle='#00f0ff';c.fillText(labels[stat]||'QUALIFYING KILL SCORE',26,h-72);
 for(const [i,name,n,color] of [[0,'BASE',base,'#9f93ad'],[1,'PART',next,'#dfff00']]){const y=h-54+i*23;c.fillStyle=color;c.fillText(`${name} ${percent?n:Math.round(n/60*100)/100}${percent?'%':'s'}`,26,y+10);c.fillStyle='#3c3149';c.fillRect(142,y,w-210,10);c.fillStyle=color;c.fillRect(142,y,(w-210)*n/max*t,10);}
 }finally{c.restore();}
}

/** A single major-impact envelope. Simulation ticks only, one event at a time;
 * long cooldown prevents a multi-hit chain becoming a strobe. Render-only state. */
export function createDimensionImpact() {
 let shot=null,cooldown=0;
 return {
  event(type,d={},enabled=true) {
   if(!enabled||cooldown>0)return false;
   const rupture=['dimensionBreak','monolithDown'].includes(type);
   const cut=type==='cut'&&!d.small&&!d.paper&&!d.secondary&&!d.fromShear&&(d.throughcut||d.strokeKills>=3||d.kind==='crown');
   if(!rupture&&!cut)return false;
   shot={x:Number.isFinite(d.x)?d.x:null,y:Number.isFinite(d.y)?d.y:null,angle:Number.isFinite(d.cut)?d.cut:Math.PI*-.18,age:0,major:rupture};
   cooldown=90;return true;
  },
  tick(enabled=true) {if(cooldown>0)cooldown--;if(!enabled){shot=null;return;}if(shot&&++shot.age>=24)shot=null;},
  reset(){shot=null;cooldown=0;},
  snapshot:()=>shot?{...shot}:null,
 };
}

/** Anime impact: ink snap -> fractured glass fans -> clean release.
 * No canvas readback, full-screen white flashes, filters, randomness, gameplay
 * writes, or repeating inversion. Drawn below DOM HUD, at most 12 glass panes. */
export function drawDimensionImpact(c,w,h,{x=w*.5,y=h*.5,angle=-.5,age=0,major=false,motion=true,low=false}={}) {
 if(!c||!motion||age<0||age>=24||w<=0||h<=0)return;
 x=Math.max(w*.16,Math.min(w*.84,Number.isFinite(x)?x:w*.5));
 y=Math.max(h*.2,Math.min(h*.8,Number.isFinite(y)?y:h*.5));
 const release=Math.max(0,(age-3)/21),fade=(1-release)**2,extent=Math.hypot(w,h),strength=low?.4:1;
 c.save();try{
 c.globalAlpha=strength*fade;
 // One dark exposure, not alternating light/dark frames.
 c.fillStyle=age<3?'#100c18':'#14101e';c.globalAlpha*=age<3?.34:.12;c.fillRect(0,0,w,h);
 c.globalAlpha=strength*fade;c.translate(x,y);c.rotate(angle);c.lineJoin='miter';
 // A long ink tear, with a single ivory core that releases into two lips.
 const slit=Math.min(w,h)*(major?.16:.11),opening=release*slit*.45;
 for(const side of [-1,1]){
  c.beginPath();c.moveTo(-extent*.58,side*opening);c.lineTo(-slit*.4,side*(4+opening));c.lineTo(slit*.28,side*(2+opening));c.lineTo(extent*.58,side*(opening+8));
  c.lineTo(slit*.7,side*(opening+17));c.lineTo(-slit,side*(opening+11));c.closePath();c.fillStyle='#0a0710';c.fill();
  c.strokeStyle=side<0?'#f5f0e8':'#00f0ff';c.lineWidth=age<3?2.4:1.1;c.stroke();
 }
 const count=major?12:8;
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2+.16*(i%3),cs=Math.cos(a),sn=Math.sin(a),length=Math.min(w,h)*(.25+(i%4)*.055),drift=release*(low?14:54),start=18+drift;
  c.save();c.translate(cs*start,sn*start);c.rotate(a+release*(i%2?-.07:.07));
  c.beginPath();c.moveTo(0,0);c.lineTo(length*.5,-8-(i%3)*3);c.lineTo(length,6+(i%2)*9);c.lineTo(length*.37,9);c.closePath();
  c.fillStyle=i%2?'#20162ecc':'#06050bcc';c.fill();c.strokeStyle=i%3?'#b8b1cb':'#00f0ff';c.lineWidth=.9;c.stroke();
  // Branch cracks are fixed angular geometry, never noisy particle clouds.
  c.beginPath();c.moveTo(length*.25,0);c.lineTo(length*.48,-15);c.lineTo(length*.62,-13);c.stroke();c.restore();
 }
 // The contact stamp stays local: no white full-canvas inversion.
 if(age<3){
  if(!low){
   // A single local negative-space stamp: the anime contact frame, not a
   // full-screen white flash. It never alternates polarity or repeats.
   const radius=Math.min(w,h)*(major?.12:.085);
   c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?radius*.2:radius*(i%4?.7:1.25);const px=Math.cos(a)*r,py=Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();
   c.fillStyle='#f5f0e8';c.fill();c.strokeStyle='#08060d';c.lineWidth=3;c.stroke();
   c.fillStyle='#08060d';c.beginPath();c.moveTo(-radius*.4,-radius*.25);c.lineTo(radius*.3,-radius*.38);c.lineTo(radius*.45,radius*.2);c.lineTo(-radius*.25,radius*.35);c.closePath();c.fill();
  }
  c.strokeStyle='#f5f0e8';c.lineWidth=low?2:4;c.beginPath();c.moveTo(-slit,0);c.lineTo(slit,0);c.stroke();
 }
 }finally{c.restore();}
}

/** Bounded LRU raster bake. Callers supply a surface factory; the portable
 * engine never reaches into the DOM. Cached pixels are explicitly released. */
export function createArtBake({surface,maxEntries=20,maxPixels=1600000}={}){
 const entries=new Map();let pixels=0;
 const drop=key=>{const e=entries.get(key);if(!e)return;pixels-=e.w*e.h;e.canvas.width=e.canvas.height=1;entries.delete(key);};
 return {
  paint(c,key,w,h,draw){
   if(!surface||w*h>maxPixels){draw(c);return false;}
   let e=entries.get(key);
   if(e&&(e.w!==w||e.h!==h)){drop(key);e=null;}
   if(!e){
    while(entries.size&&(entries.size>=maxEntries||pixels+w*h>maxPixels))drop(entries.keys().next().value);
    const canvas=surface(w,h);if(!canvas){draw(c);return false;}canvas.width=w;canvas.height=h;const context=canvas.getContext('2d');
    if(!context){draw(c);return false;}draw(context);e={canvas,w,h};entries.set(key,e);pixels+=w*h;
   }else{entries.delete(key);entries.set(key,e);}
   c.drawImage(e.canvas,0,0,w,h);return true;
  },
  clear(){for(const key of entries.keys())drop(key);},
  stats:()=>({entries:entries.size,pixels}),
 };
}

/** Read-only world tour: real backdrop adapter + unchanged foreground silhouettes.
 * Camera travel is illustrative, never a replay or a source of World powers. */
export function drawWorldArchitectureStudy(c,w,h,{equipment={},time=0,motion=true,bake=null}={}){
 const t=motion?time:0;c.save();try{
 drawEquipmentWorld(c,w,h,equipment.world,t,{x:Math.sin(t*.003)*140,y:-t*1.6,scale:1},bake);
 drawCubeHero(c,{x:w*.46,y:h*.61,radius:23,equipment,motion:false,time:0,pose:{blink:1}});
 foe(c,'fang',w*.72,h*.41,22,.2,{hp:1});foe(c,'prism',w*.66,h*.77,20,0,{hp:1});
 c.fillStyle='#101521da';c.fillRect(16,h-37,w-32,24);c.fillStyle='#e3dfd4';c.font='10px monospace';c.fillText('SCENERY TOUR / UNCHANGED ARENA GEOMETRY',25,h-21);
 }finally{c.restore();}
}

/** Sixteen cause → action → result plates. Existing rules, not invented powers. */
export function drawAbilityShowcase(c,w,h,{equipment={},study={}}={}){
 const q=study.showcase;if(!q)return;const v=q.values,a=q.progress,on=q.phase>0,result=q.phase===2,id=q.id;
 const txt=(text,x,y,color='#dce4d4',size=12)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(text,x,y);};
 const line=(points,color='#7e9c9d',width=2)=>seam(c,points,color,width);
 const bar=(x,y,width,amount,color)=>{c.fillStyle='#394b50';c.fillRect(x,y,width,8);c.fillStyle=color;c.fillRect(x,y,width*Math.max(0,Math.min(1,amount)),8);};
 c.save();try{
 c.fillStyle='#10212b';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 txt('SEE THE PART. KNOW THE POWER.',24,27,'#92bbbc',11);txt(study.title||'',24,60,'#f0ecdd',26);
 for(let i=0;i<3;i++){c.fillStyle=i===q.phase?'#dced99':'#2c4249';c.fillRect(24+i*204,78,188,3);txt(['01  THE PART','02  USE IT','03  THE PAYOFF'][i],24+i*204,99,i===q.phase?'#e5edc1':'#829e9e',10);}
 c.fillStyle='#1a303a';c.fillRect(24,115,280,205);c.fillStyle='#e3dfd0';c.fillRect(316,115,300,205);
 const pose={blink:1,breathe:0,aiming:on&&['halo','grav'].includes(id),coreLive:true,corePull:id==='grav'&&on,coreRecovering:id==='time'&&on,coreFocus:v.focus,coreChain:on?(id==='echo'?3:id==='riot'?4:0):0,coreDrive:id==='riot'&&result,coreEchoes:id==='echo'&&result?1:0,coreHull:id==='glass'||id==='oni'?1:3,combo:id==='neko'&&on?3:0};
 drawCubeHero(c,{x:186,y:242,radius:53,equipment,motion:q.motion,time:0,pose});
 txt('FITTED TO YOUR BUILD',39,137,'#9ab8b7',10);
 c.save();c.translate(338,144);
 const dark='#304c51',green='#4d7250',red='#ab4b55',muted='#7a8884',label=(s,x,y)=>txt(s,x,y,dark,11),enemy=(x,y,kind='fang')=>foe(c,kind,x,y,16,Math.PI,{hp:1,time:0});
 if(id==='halo'){
  label('SAME FALL, WHILE AIMING',0,0);
  line([[40,25],[40,133]],'#9fa6a0');line([[160,25],[160,133]],'#9fa6a0');
  const fall=85*a;circle(c,40,30+fall,10,muted);circle(c,160,30+fall*v.gravity,10,green);
  label('USUAL',14,158);label('15% LIGHTER',121,158);
 }else if(id==='viper'||id==='samurai'||id==='magnet'){
  const width=id==='viper'?v.width:id==='samurai'?v.horizontal:v.closeWidth;
  label(id==='viper'?'FASTER DASH / NARROWER CUT':id==='samurai'?'NEARLY LEVEL / WIDER CUT':'CLOSE PASS / WIDER CUT',0,0);
  c.fillStyle='#adb5a8';c.fillRect(8,33,226,22);c.fillStyle=green;c.fillRect(8,90,226,22*width);
  line([[11,44],[11+190*a,44]],muted);line([[11,101],[11+Math.min(214,190*a*(id==='viper'?v.speed:1)),101]],'#e1edc0',3);
  label('USUAL CUT',8,23);label(id==='viper'?'20% FASTER / 15% NARROWER':id==='magnet'?`CLOSE WIDTH +${Math.round((width-1)*1000)/10}% / LIMIT +35%`:'UP TO +20% WIDTH / LIMIT +35%',8,146);
  if(id==='magnet'){line([[20,118],[100,118]],dark);label('WITHIN 100px',104,123);}
 }else if(id==='crown'){
  label('ONE DIRECT ARMOR HIT',0,0);
  for(let i=0;i<3;i++){c.fillStyle=on&&i<2?'#b9b5a8':dark;c.fillRect(24+i*65,45,45,65);if(on&&i<2)line([[24+i*65,45],[69+i*65,110]],red,2);}
  label(on?'2 PLATES REMOVED':'ARMOR BEFORE THE CUT',6,140);label('TRADEOFF: 8% SLOWER DASH',6,160);
 }else if(id==='coil'){
  label('DIRECT CUT → ONE NEARBY ZAP',0,0);enemy(42,77);enemy(199,77);
  line([[8,35],[65,114]],dark,3);
  if(on)line([[65,75],[108,59],[132,91],[156,67],[180,77]],'#367d91',3);
  label(on?'ONE EXTRA PLATE HIT':'CUT WITH A NEIGHBOR CLOSE',0,142);label('NO REPEATING CHAIN OF ZAPS',0,161);
 }else if(id==='beacon'){
  label('FANG PREPARES TO RUSH',0,0);enemy(143,79);
  if(on){line([[116,49],[108,49],[108,108],[116,108]],'#ad752d',3);line([[174,49],[182,49],[182,108],[174,108]],'#ad752d',3);txt('!',141,44,'#9b5a20',21);}
  label(on?'AMBER WARNING / REACT NOW':'WATCH THE FANG',0,141);label('A WARNING, NOT A SHIELD',0,160);
 }else if(id==='neko'){
  label('MORE TIME TO KEEP THE COMBO',0,0);bar(0,50,235,.64,'#8b9890');bar(0,101,235,.64+Math.min(.3,v.chain/100)*a,green);
  label('USUAL COMBO WINDOW',0,39);label(v.chain>0?`WITH EARS: ABOUT +${Math.round(v.chain/60*100)/100}s`:'COMBO BONUS ALREADY AT LIMIT',0,90);label('CUT AGAIN BEFORE IT FADES',0,150);
 }else if(id==='oni'||id==='glass'){
  label('HIGH REWARD / LOW HEALTH',0,0);for(let i=0;i<3;i++){c.fillStyle=i===0?red:'#b9b7a9';c.fillRect(16+i*40,28,24,24);}
  txt('1 HEALTH',16,77,dark,13);txt(on?(id==='glass'?'100 → 200':'100 → 150'):'100 SCORE',16,118,dark,29);
  label(id==='glass'?'DOUBLE SCORE / MAX HEALTH 1':'+50% SCORE AT LAST HEALTH',0,153);
 }else if(id==='time'){
  label('AFTER A KILL, RELEASE AIM',0,0);bar(0,45,235,v.without,'#8b9890');bar(0,101,235,v.focus,green);
  label('USUAL FOCUS RETURN',0,35);label('TWICE-FAST RETURN',0,91);label('BOOST LASTS 2s AFTER A KILL',0,151);
 }else if(id==='riot'||id==='echo'){
  const count=id==='riot'?v.driveKills:3;label(id==='riot'?'FOUR KILLS TO OVERDRIVE':'THREE DIRECT COMBO KILLS',0,0);
  for(let i=0;i<count;i++){c.fillStyle=on&&i<Math.ceil(a*count)?green:'#acb2a4';c.fillRect(10+i*53,30,37,25);txt(String(i+1),23+i*53,48,'#f8f2dd',14);}
  if(id==='riot'){txt(result?'OVERDRIVE':'BUILD YOUR COMBO',8,105,dark,22);label('TRADEOFF: MAXIMUM 2 EDGE',0,151);}
  else{line([[18,115],[227,115]],'#9faaa3');if(result){line([[100,71],[100,135]],'#836596',5);line([[88,126],[112,126]],dark,3);}label(result?'A BLADE STAYS HERE FOR 0.5s':'THE GHOST STAYS WHERE IT SPAWNS',0,151);}
 }else if(id==='grav'){
  label('HOLD AIM TO DRAW SMALL FANGS IN',0,0);line([[0,115],[237,115]],green,2);if(on){c.globalAlpha=.25;enemy(126,67);c.globalAlpha=1;enemy(126,115-v.pullY);line([[150,68],[150,115-v.pullY]],'#538085',2);}else enemy(126,67);
  label('GENTLE PULL TOWARD THE AIM LINE',0,151);
 }else{
  label(id==='standard'?'A BALANCED START':'NO EXTRA RULES',0,0);
  txt(id==='standard'?'3 EDGE':'YOUR USUAL DASH',8,65,dark,24);txt(id==='standard'?'3 HEALTH':'YOUR USUAL CUT',8,109,dark,22);
  label('A FREE, FULLY USABLE BASELINE',0,152);
 }
 c.restore();
 txt(study.showcaseHeadline||'See how this part helps your next run.',24,347,'#e4edbd',17);
 txt('SLOWED EXAMPLE / NO PURCHASE NEEDED / PRACTICE TO TRY IT YOURSELF',24,382,'#8daead',10);
 }finally{c.restore();}
}

/** One-part study. The selected part is large and always visible. No collateral
 * explosions, noisy tiny dummies, or new gameplay rules are invented here. */
export function drawShopItemStudy(c,w,h,{study={},equipment={},sword=null}={}){
 if(!c)return;
 if(study.dash){drawDashStudy(c,w,h,{equipment,study,sword});return;}
 if(study.aim){drawAimStudy(c,w,h,{equipment,study,sword});return;}
 if(study.showcase){drawAbilityShowcase(c,w,h,{equipment,study});return;}
 if(study.eye){drawEyeToolkitStudy(c,w,h,{equipment,study});return;}
 if(study.tail){drawTailToolkitStudy(c,w,h,{equipment,study});return;}
 if(study.id==='notched'&&study.recovery){drawNotchedRecoveryStudy(c,w,h,{study,equipment});return;}
 if(study.shell){drawArmorShellStudy(c,w,h,{study,equipment});return;}
 if(study.reactive){drawReactiveShellStudy(c,w,h,{study,equipment});return;}
 const {id='',slot='head',family='baseline',progress=0,phase='RESULT',motion=true,perk=null}=study;
 if(slot==='radar'||slot==='trajectory'){drawSensorPreview(c,w,h,{slot,level:sensorTier(id,slot),time:progress*75,motion});return;}
 if(slot==='pointer'){drawDragArrowPreview(c,w,h,{equipment,sword,power:.75});return;}
 if(slot==='dash'){drawShopElementDash(c,w,h,{equipment,sword,time:progress*850,motion});return;}
 if(slot==='slash'){drawShopElementSlash(c,w,h,{equipment,sword,time:progress*850,motion});return;}
 c.save();try{
 c.fillStyle='#14101e';c.fillRect(0,0,w,h);c.scale(w/480,h/300);
 if(slot==='world')drawWorldBackdrop(c,480,300,id,motion?progress*70:0);
 const act=phase==='READY'?0:progress,focus=family==='focus',bounce=family==='movement',hit=family==='defense';
 const x=bounce?155+Math.sin(act*Math.PI)*70:150,y=focus?173-act*20:176;
 c.strokeStyle='#51435f';c.lineWidth=2;c.beginPath();c.moveTo(34,235);c.lineTo(446,235);c.stroke();
 if(bounce){c.fillStyle='#51435f';c.fillRect(262,74,7,162);}
 const pose={aiming:focus,combo:family==='chain'?Math.round(act*5):0,overdrive:id==='blaze'&&act>.5,blink:1,bank:bounce?act:0};
 // Calm, frontal close-up preserves the material, eyes and selected silhouette.
 drawCubeHero(c,{x,y,radius:49,angle:bounce?-act*.15:0,time:motion?act*48:32,equipment,pose});
 if(focus){
  c.strokeStyle='#00f0ff';c.lineWidth=2;c.beginPath();c.arc(x,y,62,-Math.PI*.5,-Math.PI*.5+Math.PI*2*(.45+act*.5));c.stroke();
 }else if(family==='chain'){
  for(let i=0;i<4;i++){c.strokeStyle=i<Math.round(act*4)?'#dfff00':'#51435f';c.lineWidth=3;c.beginPath();c.ellipse(295+i*26,166,16,8,-.4,0,Math.PI*2);c.stroke();}
 }else if(family==='score'){
  c.fillStyle='#dfff00';c.font='bold 32px monospace';c.fillText(`+${perk?.value||0}%`,284,170);
  c.font='12px monospace';c.fillStyle='#eee8f3';c.fillText('QUALIFYING SCORE',280,193);
 }else if(hit){
  foe(c,'fang',318-act*75,174,25,Math.PI,{hp:1});if(act>.6){c.strokeStyle='#00f0ff';c.lineWidth=3;c.beginPath();c.arc(x+9,y,62,-1.2,1.2);c.stroke();}
 }else if(family==='combat'){
  if(id==='coil'&&act>.5){c.strokeStyle='#00f0ff';c.lineWidth=3;c.beginPath();c.moveTo(x+40,y-20);c.lineTo(278,132);c.lineTo(265,161);c.lineTo(330,161);c.stroke();}
  foe(c,'fang',335,170,26,0,{hp:1});
 }
 c.fillStyle='#a99bb7';c.font='12px monospace';c.fillText(phase==='READY'?'1  READY':phase==='TRIGGER'?'2  '+(study.trigger||'TRIGGER'):'3  RESULT',28,35);
 c.fillStyle='#dfff00';c.font='bold 13px monospace';c.fillText((study.benefit||'BASELINE BUILD').slice(0,48),28,276);
 // Perk delta gauges are intentionally labelled; this is not a combat replay.
 if(perk&&(perk.stat==='focus'||perk.stat==='recovery'||perk.stat==='grace'||perk.stat==='blade')){
  const label=perk.stat==='focus'?'AIM COST':perk.stat==='recovery'?'RECOVERY':perk.stat==='grace'?'CHAIN WINDOW':'BLADE WINDOW';
  c.font='11px monospace';c.fillStyle='#eee8f3';c.fillText(label,280,102);
  for(let i=0;i<2;i++){const delta=perk.stat==='focus'?-perk.value:perk.value;c.fillStyle=i?'#00f0ff':'#81728f';c.fillRect(280,116+i*25,(i?100+delta:100)*(.3+act*.7),10);c.fillText(i?`PART ${delta>0?'+':''}${delta}${['focus','recovery'].includes(perk.stat)?'%':' TICKS'}`:'BASE',280,113+i*25);}
 }
 }finally{c.restore();}
}

/** Render metadata only. Never writes visibility/AI state onto game entities.
 * 100ms broadphase with immediate entry checks for fast movers/new spawns. */
export function createRenderCuller({intervalMs=100,padding=100}={}){
 let last=-Infinity,flags=new WeakMap(),scans=0;
 const visible=(e,v)=>{
  let q=flags.get(e);const r=Math.max(padding,e.r||0);
  if(q&&q.x===e.x&&q.y===e.y&&q.r===r&&q.vx===v.x&&q.vy===v.y&&q.w===v.w&&q.h===v.h)return q.visible;
  if(!q){q={};flags.set(e,q);}
  q.x=e.x;q.y=e.y;q.r=r;q.vx=v.x;q.vy=v.y;q.w=v.w;q.h=v.h;
  q.visible=e.x+r>=v.x&&e.x-r<=v.x+v.w&&e.y+r>=v.y&&e.y-r<=v.y+v.h;return q.visible;
 };
 return {
  update(now,view,entities){if(now-last<intervalMs)return false;last=now;for(const e of entities)visible(e,view);scans++;return true;},
  visible,
  reset(){last=-Infinity;flags=new WeakMap();},
  stats:()=>({scans}),
 };
}
/** Fixed cosmetic storage, allocated once. Never pool Matter bodies or retain a
 * killed enemy reference: gameplay ownership/lifetime must remain unchanged. */
export function createVisualPool(maxSize=90,{create=()=>({}),clear=e=>{for(const k of Object.keys(e))delete e[k];}}={}){
 const free=Array.from({length:maxSize},create),active=new Set();
 return {
  getFirstDead(){const e=free.pop();if(!e)return null;active.add(e);return e;},
  release(e){if(!active.delete(e))return false;clear(e);free.push(e);return true;},
  reset(){for(const e of active){clear(e);free.push(e);}active.clear();},
  stats:()=>({maxSize,active:active.size,free:free.length}),
 };
}
export function drawBakedGlow(c,bake,x,y,r=24,color='#00f0ff'){
 if(!bake)return;c.save();try{c.globalCompositeOperation='lighter';c.globalAlpha*=.24;c.translate(x-r,y-r);c.scale(r*2/128,r*2/128);
 bake.paint(c,'glow:'+color,128,128,context=>{const g=context.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color+'a0');g.addColorStop(.3,color+'38');g.addColorStop(1,color+'00');context.fillStyle=g;context.fillRect(0,0,128,128);});
 }finally{c.restore();}
}

/** A labelled comparison, not a promise of instant FOCUS or a combat replay.
 * The caller supplies values from the shared passive-recovery step. */
export function drawNotchedRecoveryStudy(c,w,h,{study={},equipment={}}={}) {
 const q=study.recovery;if(!q)return;
 c.save();try{
 c.fillStyle='#11151d';c.fillRect(0,0,w,h);c.scale(w/480,h/300);
 c.fillStyle='#8faaa1';c.font='11px monospace';c.fillText('NOTCHED FRAME / VENT COOLING',24,28);
 c.fillStyle=q.active?'#dfff9b':'#a5a3b6';c.font='bold 15px monospace';c.fillText(q.phase,24,53);
 drawCubeHero(c,{x:126,y:159,radius:62,equipment,face:1,motion:study.motion,time:0,
   pose:{blink:1,aiming:q.held,focusRecovering:q.active,focusLevel:q.focus,recoveryAge:q.age}});
 const bars=[['WITHOUT NOTCHED',q.without,'#7e788e'],['WITH NOTCHED',q.focus,corePalette(equipment.core).primary]];
 bars.forEach(([label,value,color],i)=>{
  const y=112+i*63;c.font='10px monospace';c.fillStyle='#e7e6d9';c.fillText(label,259,y);
  c.fillStyle='#292936';c.fillRect(259,y+10,190,12);c.fillStyle=color;c.fillRect(259,y+10,190*value,12);
  c.fillStyle='#e7e6d9';c.fillText(Math.round(value*100)+'% FOCUS',259,y+37);
 });
 c.fillStyle='#dfff9b';c.font='bold 12px monospace';c.fillText(`ACTUAL RETURN +${q.marginal}% / TOTAL +${Math.round((q.rate-1)*100)}%`,24,263);
 c.fillStyle='#bcb8ca';c.font='10px monospace';c.fillText('RELEASE AIM TO RECOVER / SHARED BONUS CAP 40%',24,283);
 }finally{c.restore();}
}

/** Enlarged policy illustration, driven by the same recoil/store/return
 * functions as the run. No damage/power is simulated by this renderer. */
export function drawArmorShellStudy(c,w,h,{study={},equipment={}}={}){
 const q=study.shell;if(!q)return;const spring=study.id==='segmented',pal=corePalette(equipment.core);
 c.save();try{
 c.fillStyle='#11151d';c.fillRect(0,0,w,h);c.scale(w/480,h/300);
 c.fillStyle='#8faaa1';c.font='11px monospace';c.fillText(spring?'SEGMENTED / COMPRESSION SPRING':'CHAMFER / GLANCING RECOIL',24,25);
 c.fillStyle='#dfff9b';c.font='bold 12px monospace';c.fillText(q.phase,24,48);
 const t=Math.min(1,q.time/1000),x=study.motion?110+t*70:180;
 const pose={blink:1,shellContactAngle:q.angle,shellAmount:q.stored,
  shellGlanceAge:q.age,shellReleaseAge:q.releaseAge,shellReleasedAmount:q.returned};
 drawCubeHero(c,{x,y:143,radius:49,equipment,face:1,motion:study.motion,time:0,pose});
 foe(c,'bastion',350,143,38,0,{hp:3,flash:q.contact&&q.age<7?8:0,mode:'idle'});
 if(q.contact){
  c.strokeStyle=pal.light;c.lineWidth=2;c.beginPath();c.moveTo(x+55,143);c.lineTo(306,143);c.stroke();
 }
 c.font='10px monospace';c.fillStyle='#bcb8ca';c.fillText('ILLUSTRATION / INCOMING 30 / ARMOR SHOVE 7',24,214);
 c.fillStyle='#eeeada';c.font='bold 12px monospace';
 c.fillText(spring?'ACTUAL LOSS 7 → STORED 1.4 SPEED':`OUTGOING: STANDARD ${q.normal} → CHAMFER ${q.outgoing}`,24,239);
 c.fillStyle='#dfff9b';c.font='bold 12px monospace';
 c.fillText(spring?(q.released?`NEXT LAUNCH: 24 → ${q.nextSpeed.toFixed(1)} / SPENT ONCE`:'STORED ONCE / USE WITHIN ABOUT 0.75s'):'20% LESS SHOVE / SAME DAMAGE & HIT WINDOW',24,263);
 c.fillStyle='#bcb8ca';c.font='10px monospace';c.fillText(spring?'GIVES BACK LOST SPEED / NEVER BREAKS THE SPEED LIMIT':'SLOPED EDGES SOFTEN THE SHOVE / NO EXTRA ARMOR',24,284);
 if(spring&&q.stored>0){c.fillStyle=pal.light;c.font='bold 13px monospace';c.fillText('+1.4',x-12,83);}
 }finally{c.restore();}
}

/** Enlarged assembled-character inspection. Geometry only: no pretend active
 * vents, stored spring, status, charge, projectile or combat consequence.
 * The SAME hero and rest weapon are used in game/cards/this inspection. */
export function drawAssemblyStudy(c,w,h,{equipment={},sword=null,time=0,motion=true,reference=false}={}){
 if(!c||!(w>0&&h>0))return;
 const a=resolveAssemblyConstruction(equipment),m=a.material;
 c.save();try{
 c.fillStyle='#10181d';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 c.fillStyle='#19262c';c.beginPath();c.moveTo(165,64);c.lineTo(495,64);c.lineTo(584,335);c.lineTo(88,335);c.closePath();c.fill();
 c.strokeStyle='#35434a';c.lineWidth=1;
 for(const x of [160,240,320,400,480]){c.beginPath();c.moveTo(x,66);c.lineTo(x,334);c.stroke();}
 c.beginPath();c.moveTo(88,335);c.lineTo(584,335);c.stroke();
 c.fillStyle='#94b5b0';c.font='12px monospace';c.fillText(reference?'REFERENCE BUILD / FREE INSPECTION':'YOUR PREVIEW / ASSEMBLY INSPECTION',24,25);
 c.fillStyle='#edead8';c.font='bold 23px sans-serif';c.fillText(a.familyTitle,24,53);
 c.fillStyle='#080d13';c.beginPath();c.ellipse(342,315,108,10,0,0,Math.PI*2);c.fill();
 const t=motion&&Number.isFinite(time)?time:0;
 drawCubeHero(c,{x:348,y:222,radius:68,equipment,time:t,motion,face:1,pose:{blink:1}});
 drawSwordWeapon(c,{x:348,y:222,radius:68,equipment,sword,motion:false,time:0,active:false});
 const label=(x,y,title,text,points)=>{
  c.strokeStyle='#8aaca1';c.lineWidth=1;c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();
  const [px,py]=points.at(-1);c.fillStyle=m.edge;c.fillRect(px-2,py-2,4,4);
  c.fillStyle='#10181deb';c.fillRect(x-5,y-16,Math.min(180,Math.max(title.length*7,text.length*7))+10,44);
  c.fillStyle='#9eb6ad';c.font='11px monospace';c.fillText(title,x,y-3);
  c.fillStyle='#f0ead7';c.font='bold 13px sans-serif';c.fillText(text,x,y+16);
 };
 label(461,88,'HEAD SEAT',a.headTitle,[[457,97],[417,97],[349,156]]);
 label(24,179,'TAIL ROOT',a.tailTitle,[[143,185],[204,185],[282,201]]);
 label(24,293,'SHELL CONSTRUCTION',m.name,[[161,295],[228,295],[295,275]]);
 label(468,295,'CORE CHAMBER',a.coreTitle,[[464,299],[428,299],[359,265]]);
 c.fillStyle=m.edge;c.fillRect(24,353,3,26);c.fillStyle='#e6e4d4';c.font='bold 13px monospace';c.fillText(m.mount+' / KEYED WEAPON ROOT',37,365);
 c.fillStyle='#93aaa6';c.font='11px monospace';c.fillText(reference?'EXAMPLE ONLY / SHOP SELECTION & OWNERSHIP UNCHANGED':'CONSTRUCTION VIEW / POWERS STAY IN PART IN ACTION',37,385);
 }finally{c.restore();}
}

/** Same installed cartridge + enlarged mechanism, not a simulated activation.
 * Preview mode deliberately supplies NO live counters/Drive/pull/recovery. */
export function drawCoreMechanismStudy(c,w,h,{equipment={},time=0,motion=true}={}){
 if(!c||!(w>0&&h>0))return;
 const d=resolveCoreMechanism(equipment.core),material=resolveAssemblyConstruction(equipment).material;
 const clock=motion&&Number.isFinite(time)?time:0;
 c.save();try{
 c.fillStyle='#10181d';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 c.fillStyle='#99b5b0';c.font='12px monospace';c.fillText('CORE MECHANISM / FREE INSPECTION',24,26);
 c.fillStyle='#f0ead7';c.font='bold 25px sans-serif';c.fillText(d.title.toUpperCase(),24,57);
 c.fillStyle='#17252c';c.fillRect(24,80,285,227);c.fillStyle='#0d131b';c.fillRect(321,80,295,227);
 c.strokeStyle='#3a5358';c.lineWidth=1;c.strokeRect(321,80,295,227);
 c.fillStyle='#90aaa5';c.font='10px monospace';c.fillText('INSTALLED / SAME AS IN PLAY',37,99);c.fillText('ENLARGED FITTED CARTRIDGE',334,99);
 drawCubeHero(c,{x:201,y:228,radius:56,equipment,time:clock,motion,face:1,pose:{blink:1}});
 // Anchor is transformed, never reimplemented as an unrelated shop icon.
 c.save();c.translate(468,189);c.scale(180,180);c.translate(-.075,-.635);
 drawCoreChamber(c,equipment,clock,corePalette(equipment.core),{artRadius:180,reducedMotion:!motion});c.restore();
 c.strokeStyle='#75988e';c.beginPath();c.moveTo(214,264);c.lineTo(294,264);c.lineTo(321,218);c.stroke();
 c.fillStyle=material.edge;c.fillRect(211,261,5,5);
 c.fillStyle='#e6e9d7';c.font='bold 11px monospace';c.fillText(d.mechanism,334,259);
 c.fillStyle='#9eb9af';c.font='9px monospace';c.fillText(d.parts,334,280);
 c.fillStyle=material.edge;c.fillRect(24,326,3,45);c.fillStyle='#e9eadb';c.font='bold 12px monospace';c.fillText(d.receipt,37,339);
 c.fillStyle='#a4bbb0';c.font='10px monospace';c.fillText('PREVIEW HAS NO LIVE CHARGE / POWERS: PART IN ACTION',37,363);
 c.fillStyle='#8ea59e';c.font='10px monospace';c.fillText('TRY PARTS FREELY / BUY AND EQUIP ARE SEPARATE',24,388);
 }finally{c.restore();}
}

/** Fitted reactive hardware. No pose guess, loop or weapon charge can grant
 * readiness. The supplied view comes from the run (or labelled policy study). */
export function drawReactiveShellState(c,eq={},pose={}){
 if(!c||!['hologram','iron','prism'].includes(eq.body))return;
 const raw=pose.shellAbility,q=raw?.kind===eq.body?raw:null,ready=q?.ready===true,
  detail=(pose.artRadius??23)>=38,flash=pose.reducedMotion?0:Math.max(0,Math.min(1,q?.flash||0));
 c.save();try{
 if(eq.body==='hologram'){
  const open=q?.window===true,lit=ready?'#b9ffff':'#496a7d';
  // One vertex gate. The body/eyes/weapon stay visible and collidable.
  panel(c,[[-.60,-.88],[.61,-.88],[.61,-.58],[-.60,-.58]],'#142f40',.035);
  seam(c,[[-.57,-.85],[.58,-.85]],'#8aa7ae',.028);
  for(const side of [-1,1]){
   const x=side*(open?.37:.18);
   seam(c,[[x,-.79],[x+side*.09,-.79],[x+side*.09,-.65],[x,-.65]],lit,.045);
  }
  // A clear side aperture opens only during the legal launch interval.
  for(const side of [-1,1]){
   seam(c,[[side*.96,-.55],[side*.80,-.55],[side*.80,-.42]],open?'#e5ffff':'#4f8796',.035);
   seam(c,[[side*.80,.10],[side*.80,.24],[side*.96,.24]],open?'#e5ffff':'#4f8796',.035);
  }
  if(detail&&!open)seam(c,[[0,-.79],[0,-.65]],lit,.035);
  if(flash>0){c.globalAlpha*=flash;for(const side of [-1,1])panel(c,[[side*1.04,-.39],[side*1.10,-.32],[side*1.04,-.25],[side*.98,-.32]],'#b9ffff',0);}
 }else if(eq.body==='iron'){
  const spent=q?.spent===true;
  panel(c,[[-.53,-.88],[.52,-.88],[.59,-.69],[.44,-.56],[-.43,-.56],[-.59,-.69]],'#293742',.045);
  if(!spent){
   panel(c,[[-.43,-.81],[.41,-.81],[.43,-.64],[-.44,-.64]],'#a9b8ba',.025);
   panel(c,[[-.12,-.84],[.13,-.84],[.13,-.59],[-.12,-.59]],ready?'#e4ecc9':'#78868b',.025);
   seam(c,[[-.07,-.73],[.08,-.73]],'#34434c',.025);
  }else{
   panel(c,[[-.45,-.81],[-.16,-.78],[-.21,-.61],[-.46,-.66]],'#78878a',.025);
   panel(c,[[.20,-.80],[.42,-.81],[.43,-.65],[.22,-.61]],'#63717c',.025);
   seam(c,[[-.15,-.84],[.03,-.74],[-.08,-.67],[.14,-.56]],'#111a24',.065);
  }
  if(detail)for(const side of [-1,1])circle(c,side*.49,-.70,.032,'#dae0d8');
  if(flash>0){c.globalAlpha*=flash;seam(c,[[-.45,-.86],[.45,-.86]],'#ffffde',.055);}
 }else{
  // Exactly two solid needle hardpoints. No ornamental projectile swarm.
  for(const side of [-1,1]){
   panel(c,[[side*.72,-.79],[side*.94,-.88],[side*1.01,-.59],[side*.89,-.28],[side*.74,-.43]],'#45385d',.04);
   panel(c,[[side*.83,-.78],[side*.93,-.71],[side*.89,-.40],[side*.79,-.50]],ready?'#f3e3ff':'#827091',.022);
   if(ready)panel(c,[[side*.85,-.70],[side*.89,-.90],[side*.93,-.67]],'#e4ccff',.02);
   if(detail)seam(c,[[side*.80,-.37],[side*.91,-.49]],ready?'#d7baff':'#514560',.03);
  }
  if(flash>0){c.globalAlpha*=flash;for(const side of [-1,1])seam(c,[[side*.85,-.91],[side*.83,-1.08]],'#fff4ff',.035);}
 }
 }finally{c.restore();}
}

/** Illustrations use the shared phase policy and existing guard/needle rules.
 * They never run a pretend hit through the player's save or live run. */
export function drawReactiveShellStudy(c,w,h,{study={},equipment={}}={}){
 const q=study.reactive;if(!c||!q)return;
 c.save();try{
 c.fillStyle='#10181d';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 const titles={hologram:'HOLOGRAM / PRECISION PHASE',iron:'IRON / ONE STRUCTURAL GUARD',prism:'PRISM / TWO WALL NEEDLES'};
 c.fillStyle='#96b5ac';c.font='12px monospace';c.fillText('ABILITY STUDY / LABELLED ILLUSTRATION',24,25);
 c.fillStyle='#f0ead7';c.font='bold 20px sans-serif';c.fillText(titles[q.kind],24,55);
 c.fillStyle='#1a2c32';c.fillRect(24,75,592,227);
 const phase=q.kind==='hologram',iron=q.kind==='iron',x=phase?274:iron?259:330;
 drawCubeHero(c,{x,y:203,radius:63,equipment,motion:study.motion,time:0,pose:{blink:1,shellAbility:q}});
 c.fillStyle='#d7e7d6';c.font='bold 12px monospace';
 if(phase){
  const needleX=q.phase==='PASS'?x+104:q.phase==='WINDOW'?x-106:x-164;
  c.strokeStyle='#dc8769';c.lineWidth=2;c.beginPath();c.moveTo(needleX-33,203);c.lineTo(needleX+30,203);c.stroke();
  polygon(c,[[needleX+32,203],[needleX+12,197],[needleX+12,209]],'#fff0c9');
  c.fillText('HOSTILE NEEDLE',365,263);
  c.fillStyle='#a4c2b6';c.font='11px monospace';c.fillText('NEEDLE STAYS ALIVE',365,150);c.fillText('WALLS STAY SOLID',365,174);c.fillText('NO GENERAL IMMUNITY',365,198);c.fillText('SLOWED ILLUSTRATION',365,285);
  c.strokeStyle='#78918e';c.lineWidth=4;c.beginPath();c.moveTo(584,94);c.lineTo(584,285);c.stroke();
 }else if(iron){
  foe(c,'fang',420,198,39,Math.PI,{hp:1,mode:'rush'});
  c.fillStyle='#bcd1c0';c.font='11px monospace';c.fillText(q.spent?'LATCH SPENT':'FANG RUSH',392,260);
 }else{
  c.strokeStyle='#78918e';c.lineWidth=5;c.beginPath();c.moveTo(393,88);c.lineTo(393,282);c.stroke();
  if(!q.ready)for(const side of [-1,1]){
   const n=(45-q.remaining)/45,px=x+side*(24+42*n),py=152-53*n;
   polygon(c,[[px,py-18],[px+4,py+7],[px,py+2],[px-4,py+7]],'#ead9ff');
  }
  c.fillStyle='#c8c7d2';c.font='11px monospace';c.fillText(q.ready?'2 HARDPOINTS READY':`${(q.remaining/60).toFixed(1)}s TO RECHARGE`,425,170);
  c.fillText('SIDE WALL ONLY',425,197);
 }
 c.fillStyle='#e6ecd9';c.font='bold 12px monospace';c.fillText(q.phase,24,324);
 c.fillStyle='#a9c3b6';c.font='11px monospace';
 const receipt=phase?'FIRST 4 WORLD TICKS /1 NEEDLE /120-TICK RECHARGE':iron?'ONE FANG RUSH PER RUN / NOT NEEDLES, BEAMS OR RINGS':'TWO REAL NEEDLES /45-TICK COOLDOWN / NO FLOOR PROC';
 c.fillText(receipt,24,350);c.fillStyle='#8ea79d';c.font='10px monospace';c.fillText(phase?'EXCLUDES BOSSES & TUTORIALS / NO AIM-COST DISCOUNT':'ACTUAL LIVE HARDWARE READS AUTHORITY, NOT THIS DEMO CLOCK',24,376);
 }finally{c.restore();}
}

/** Plain-language instrument lessons. Numbers/paths are supplied by the same
 * helpers as play. Only this shop drawing changes; live instruments stay put. */
export function drawAimStudy(c,w,h,{study={},equipment={},sword=null}={}){
 const q=study.aim;if(!q)return;const {id,phase,progress:a}=q,on=phase>0;
 c.save();try{
 c.fillStyle='#10212b';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 const text=(s,x,y,color='#dce5d5',size=12)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.textAlign='left';c.fillText(s,x,y);};
 const stroke=(pts,color='#81aaa5',width=2)=>seam(c,pts,color,width);
 const bar=(x,y,value,color)=>{c.fillStyle='#acb8ab';c.fillRect(x,y,230,12);c.fillStyle=color;c.fillRect(x,y,230*clamp(value,0,1),12);};
 text('AIM & READ / KNOW BEFORE YOU RELEASE',24,26,'#92bbbc',11);text(study.title||'',24,59,'#f0ecdd',26);
 for(let i=0;i<3;i++){c.fillStyle=i===phase?'#dced99':'#2c4249';c.fillRect(24+i*204,78,188,3);text(['01  THE TOOL','02  USE IT','03  THE DIFFERENCE'][i],24+i*204,99,i===phase?'#e5edc1':'#829e9e',10);}
 c.fillStyle='#1b333c';c.fillRect(24,115,280,205);c.fillStyle='#e3dfd0';c.fillRect(316,115,300,205);
 const dark='#304c51',green='#4d7250',muted='#778b87',red='#b1485a',label=(s,x,y)=>text(s,x,y,dark,11);
 if(id==='sniper'){
  drawCubeHero(c,{x:174,y:228,radius:62,equipment,motion:q.motion,time:0,pose:{blink:1,aiming:phase===1,eyePower:q.power}});
  text(on?'90% POWER / READY':'BELOW 90% / USUAL CUT',40,143,'#dce9bc',11);
  label('SAME SHOT / TIGHTER CUT',334,140);c.fillStyle='#a4b0a5';c.fillRect(340,163,230,28);c.fillStyle=green;c.fillRect(340,166,230,28*q.narrow);
  stroke([[340,178],[340+210*a,178]],red,2);
  for(let i=0;i<4;i++){c.fillStyle=phase===2&&i<q.armor+1?'#b7b4a8':dark;c.fillRect(342+i*62,217,39,43);if(phase===2&&i<q.armor+1)stroke([[342+i*62,217],[381+i*62,260]],red,2);}
  label(`USUAL ${q.armor} + PRECISION 1 PLATE`,334,284);label('FIRST ARMOR ONLY / BOSSES RESIST',334,306);
 }else if(q.slot==='pointer'){
  // The actual native drag-mark geometry, enlarged but not re-invented.
  text('YOUR AIMING ORIGIN',40,143,'#a9c9c1',10);
  c.save();c.translate(164,221);c.scale(2.3,2.3);drawPointerMark(c,0,0,equipment,on?a:0);c.restore();
  text('PRESS → PULL BACK → RELEASE',40,300,'#c5dfbc',11);
  if(id==='pointer-orbit'){
   label('RELEASE AIM / FOCUS RETURNS',334,142);label('USUAL',334,179);bar(334,190,q.without,muted);label('WITH ORBIT',334,235);bar(334,246,q.focus,green);label(q.recoveryPoints?`RECOVERY BONUS +${q.recoveryPoints}%`:'RECOVERY ALREADY AT ITS LIMIT',334,294);
  }else if(id==='pointer-cross'){
   label('SAME HOLD / LESS FOCUS USED',334,142);label('USUAL FOCUS COST',334,179);bar(334,190,.7,muted);label('WITH CROSSHAIR',334,235);bar(334,246,.7*(on?q.drain:1),green);label('8% LESS COST / NO TARGET LOCK',334,294);
  }else if(id==='pointer-diamond'){
   label('YOUR CUT LASTS A LITTLE LONGER',334,142);stroke([[340,191],[550,191]],muted,9);stroke([[340,238],[550+(on&&q.blade?14*a:0),238]],green,9);label('USUAL CUT',334,173);label(q.blade?'ABOUT +0.02s OF CUTTING TIME':'EXTRA CUT TIME ALREADY AT LIMIT',334,275);label('THE DIAMOND IS NOT A PROJECTILE',334,301);
  }else{
   label('YOUR FREE REFERENCE MARK',334,142);stroke([[352,216],[542,166]],green,3);circle(c,352,216,7,dark);label('PULL BACK',334,255);label('RELEASE FORWARD',438,198);label('NO EXTRA DAMAGE OR TARGET LOCK',334,301);
  }
 }else if(q.slot==='radar'){
  text('SAME FIELD / MORE INFORMATION',40,143,'#a9c9c1',10);
  c.save();c.translate(46,158);c.fillStyle='#0d1d27';c.fillRect(0,0,234,143);
  const map=q.radar;c.strokeStyle='#5e7b7e';c.lineWidth=1;c.strokeRect(map.viewport.x,map.viewport.y,map.viewport.w,map.viewport.h);
  for(const p of map.blips){c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.r+1,0,TAU);c.fill();if(q.tier===3&&p.id==='near'&&on){stroke([[p.x-5,p.y-8],[p.x-9,p.y-8],[p.x-9,p.y+8],[p.x-5,p.y+8]],'#efbe6c');stroke([[p.x+5,p.y-8],[p.x+9,p.y-8],[p.x+9,p.y+8],[p.x+5,p.y+8]],'#efbe6c');}}
  if(q.tier===3){const x=map.player.x,y=map.player.y;polygon(c,[[x,y-7],[x+5,y+4],[x,y+1],[x-5,y+4]],'#deeda4');}else circle(c,map.player.x,map.player.y,4,'#deeda4');
  if(q.tier>=2&&on){stroke([[120,65],[138,58]],'#f1908b',3);circle(c,169,45,8,'#b2729d');}
  c.restore();
  label(q.tier?'SEE FARTHER THAN THE BASE MAP':'NEARBY CONTACTS, NO UPGRADE',334,142);
  label('BASE RANGE',334,177);bar(334,188,1/2.2,muted);label('THIS RADAR',334,229);bar(334,240,(on?q.range:1)/2.2,green);
  label(q.tier>=2?'ALSO SHOWS ACTIVE HAZARDS':'NO EXTRA ATTACK RANGE',334,279);label(q.tier===3?'ADDS ATTACK WARNINGS + HEADING':q.tier===2?'WARNINGS DO NOT BLOCK DANGER':'MAP REACH, NOT CAMERA ZOOM',334,302);
 }else{
  // One real release forecast, shared by all tiers. Gray is the full example;
  // green is ONLY the sample horizon this lens actually reveals.
  c.fillStyle='#1b333c';c.fillRect(24,115,592,205);
  text('SAME LAUNCH / DIFFERENT VISIBLE DISTANCE',40,139,'#a9c9c1',10);
  const all=q.path,minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y)),maxX=Math.max(...all.map(p=>p.x)),scale=Math.min(520/maxX,111/Math.max(1,maxY-minY)),project=p=>[55+p.x*scale,170+(p.y-minY)*scale];
  const points=all.map(project),visible=q.visible.map(project);
  c.setLineDash([3,5]);stroke(points,'#58716e',1);c.setLineDash([]);stroke(visible.slice(0,Math.max(2,Math.ceil(visible.length*(on?.3+.7*a:.3)))),'#deec9e',3);
  const origin=points[0];circle(c,origin[0],origin[1],5,'#f0eadb');
  if(q.tier>=2&&on)for(let i=10;i<visible.length;i+=10){const [x,y]=visible[i];stroke([[x,y-4],[x,y+4]],'#a9d7d5',1);}
  if(q.impact&&on){const [x,y]=project(q.impact);c.strokeStyle='#f4b482';c.lineWidth=2;c.strokeRect(x-7,y-7,14,14);text('FIRST WALL',x-55,y-14,'#f4c59c',10);}
  text(['SHORT PATH','MORE PATH','TIME MARKS + FIRST IMPACT','SPEED / ANGLE / FIRST IMPACT'][q.tier],40,302,'#dcebb8',11);
  if(q.tier===3)text(`${q.speed.toFixed(1)} SPEED   ${Math.round(q.angle)}°   ${q.impact?(q.impact.ticks/60).toFixed(2)+'s TO WALL':'WALL NOT YET VISIBLE'}`,310,302,'#e8f0d5',10);
 }
 text(study.showcaseHeadline||'See how this tool helps your next shot.',24,348,'#e4edbd',17);
 text('SLOWED EXAMPLE / CURRENT SCENE ONLY / NO GUARANTEED FUTURE HIT',24,381,'#8daead',10);
 }finally{c.restore();}
}

/** Eight dash lessons: production trail on the left, actual rule comparison on
 * the right. These diagrams do not simulate a burn/freeze/relay/replay. */
export function drawDashStudy(c,w,h,{study={},equipment={},sword=null}={}){
 const q=study.dash;if(!q)return;if(q.ember){drawEmberLesson(c,w,h,{study,equipment,sword});return;}if(q.frost){drawFrostLesson(c,w,h,{study,equipment,sword});return;}if(q.void){drawVoidLesson(c,w,h,{study,equipment,sword});return;}const on=q.phase>0,a=q.progress,id=q.id;
 c.save();try{
 c.fillStyle='#10212b';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 const text=(s,x,y,color='#dce5d5',size=12)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.textAlign='left';c.fillText(s,x,y);};
 const stroke=(pts,color='#81aaa5',width=2)=>seam(c,pts,color,width),dark='#304c51',green='#4d7250',muted='#83958b',red='#af515e',label=(s,x,y)=>text(s,x,y,dark,11);
 const bar=(x,y,value,color)=>{c.fillStyle='#b4baad';c.fillRect(x,y,230,12);c.fillStyle=color;c.fillRect(x,y,230*clamp(value,0,1),12);};
 text('DASH LAB / SEE THE TRAIL, UNDERSTAND THE POWER',24,26,'#92bbbc',11);text(study.title||'',24,59,'#f0ecdd',26);
 for(let i=0;i<3;i++){c.fillStyle=i===q.phase?'#dced99':'#2c4249';c.fillRect(24+i*204,78,188,3);text(['01  THE LOOK','02  USE IT','03  THE DIFFERENCE'][i],24+i*204,99,i===q.phase?'#e5edc1':'#829e9e',10);}
 c.save();c.beginPath();c.rect(24,115,280,205);c.clip();c.translate(24,115);
 drawShopElementDash(c,280,205,{equipment,sword,time:q.poseTime,motion:q.motion});c.restore();
 c.fillStyle='#e3dfd0';c.fillRect(316,115,300,205);
 if(id==='dash-ink'){
  label('SAME LAUNCH / WIDER CUTTING LANE',334,141);
  c.fillStyle=muted;c.fillRect(340,167,224,24);c.fillStyle=green;c.fillRect(340,220,224,24*(on?q.farGain:1));
  stroke([[340,179],[340+214*a,179]],'#dfe7ce',2);stroke([[340,232],[340+214*a,232]],'#e9edb6',2);
  label('USUAL LANE',334,158);label(`FARTHER OUT: +${Math.round((q.farGain-1)*100)}% WIDTH`,334,273);
  label(q.nearGain<1.119?`CLOSE PASS: +${Math.round((q.nearGain-1)*100)}% / SHARED LIMIT`:'CLOSE PASS: SAME +12% WIDTH',334,298);
 }else if(id==='dash-lightning'){
  label('CUT WHILE MOVING AT SPEED 18+',334,141);
  stroke([[340,171],[412,171],[400,162],[424,171],[400,180]],green,3);
  text(`${Math.round(100*q.baseScore)} → ${Math.round(100*(on?q.score:q.baseScore))}`,334,232,dark,32);
  label(q.scorePoints?`SCORE BONUS +${q.scorePoints}%`:'SCORE BONUS ALREADY AT LIMIT',334,271);
  label(id==='dash-lightning'?'NO EXTRA ZAP OR EXTRA SPEED':'NO PULL OR EXTRA ARMOR DAMAGE',334,300);
 }else if(id==='dash-water'){
  label('RELEASE AIM / FOCUS RETURNS',334,141);label('USUAL RECOVERY',334,178);bar(334,190,q.without,muted);label('WITH TIDE',334,233);bar(334,245,q.focus,green);
  label(q.recovery?`RECOVERY BONUS +${q.recovery}%`:'RECOVERY ALREADY AT ITS LIMIT',334,277);label('NO EXTRA PUSH OR REBOUND FORCE',334,301);
 }else if(id==='dash-echo'){
  label('MORE TIME BETWEEN COMBO KILLS',334,141);label('USUAL COMBO WINDOW',334,178);bar(334,190,.65,muted);label('WITH ECHO',334,233);bar(334,245,.65+(on?q.grace/60*a:.0),green);
  label(q.grace?`ABOUT +${Math.round(q.grace/60*100)/100}s TO KEEP THE COMBO`:'COMBO BONUS ALREADY AT LIMIT',334,277);label('AFTERIMAGES DO NOT ATTACK AGAIN',334,301);
 }else{
  label('YOUR FREE COMPLETE BASELINE',334,141);drawCubeHero(c,{x:449,y:214,radius:32,equipment,motion:false,time:0,pose:{blink:1}});
  stroke([[344,272],[566,272]],green,3);label('NORMAL SPEED / NORMAL CUT / FREE AIM',334,300);
 }
 text(study.showcaseHeadline||'Use the trail. Know what it really changes.',24,348,'#e4edbd',17);
 text('SLOWED EXAMPLE / NO PURCHASE NEEDED / PRACTICE TO TRY IT YOURSELF',24,381,'#8daead',10);
 }finally{c.restore();}
}

/** A small steady target-attached seam, not a particle emitter or damage area.
 * World time owns expiry/hit contraction; reduced motion keeps a static mark. */
export function drawEmberBurn(c,{x=0,y=0,radius=20,status=null,now=0,motion=true}={}){
 if(!status||now>=status.expires||radius<=0)return;
 const hit=motion?Math.max(0,1-(now-status.lastHit)/4):0,r=radius*(1-.08*hit);
 c.save();try{c.translate(x,y);c.strokeStyle='#f7ad79';c.lineWidth=1.6;c.lineCap='round';
 seam(c,[[-r*.57,-r*.64],[-r*.29,-r*.49],[-r*.38,-r*.18]],'#f7ad79',1.6);
 seam(c,[[r*.35,r*.64],[r*.57,r*.39],[r*.45,r*.13]],'#ffd3a1',1.6);
 c.fillStyle='#ffb77a';c.fillRect(-2,-r*.83,4,3);
 if(motion&&now-status.born<4){const age=now-status.born;c.globalAlpha*=1-age/4;seam(c,[[-r*.68,-r*.8],[-r*.15,-r*1.03],[r*.5,-r*.77]],'#ffe0ac',2);for(let i=0;i<2;i++)c.fillRect((i?1:-1)*(r*.6+age*1.3),-r-age*1.8,2,2);}
 }finally{c.restore();}
}

/** Cause → spread → delayed damage. The shop data is generated by the real
 * burn ledger, including the two deadlines, blocked target and resistant boss. */
export function drawEmberLesson(c,w,h,{study={},equipment={},sword=null}={}){
 const q=study.dash,e=q.ember,on=q.phase>0,values=new Map(e.targets.map(t=>[t.id,t]));
 c.save();try{
 c.fillStyle='#10212b';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 const text=(s,x,y,color='#dce5d5',size=12)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.textAlign='left';c.fillText(s,x,y);},dark='#304c51',orange='#eaa773',line=(pts,color=orange,width=2)=>seam(c,pts,color,width);
 text('EMBER / CONTACT STARTS THE FIRE',24,26,'#a9c4bf',11);text(study.title||'Ember Dash',24,59,'#f2eddd',26);
 for(let i=0;i<3;i++){c.fillStyle=i===q.phase?'#efd29d':'#2c4249';c.fillRect(24+i*204,78,188,3);text(['01  LINE UP','02  IGNITE','03  TWO FIRE HITS'][i],24+i*204,99,i===q.phase?'#f0dbad':'#829e9e',10);}
 c.fillStyle='#1c313b';c.fillRect(24,115,376,201);c.fillStyle='#e3dfd0';c.fillRect(412,115,204,201);
 const target=(id,x,y,r,kind='fang')=>{const v=values.get(id);if(v.hp>0){foe(c,kind,x,y,r,0,{hp:v.hp});if(v.burning)drawEmberBurn(c,{x,y,radius:r,status:{expires:36,lastHit:v.lastHit},now:e.now,motion:q.motion});}else{line([[x-7,y-7],[x+7,y+7]],'#aab9ae',1);line([[x+7,y-7],[x-7,y+7]],'#aab9ae',1);}text(`${v.hp} LEFT`,x-r-3,y+r+17,'#d5dfc7',10);};
 drawCubeHero(c,{x:107,y:213,radius:25,equipment,motion:false,time:0,pose:{blink:1}});
 if(on)drawElementalDash(c,{x:107,y:213,vx:42,vy:0,age:3,element:'fire',radius:23,equipment,sword,motion:true});
 line([[139,213],[213,213]],'#a4bcb1',on?2:1);text('DIRECT CUT',139,246,'#9cb8b1',10);
 target('armor',246,213,26,'crown');target('near-a',338,159,14);target('near-b',338,260,14);
 if(on){line([[274,198],[320,166]],'#a67758',1);line([[274,224],[320,252]],'#a67758',1);}
 text('UP TO 2 NEIGHBORS',264,301,'#a7c0b2',10);
 c.fillStyle='#849b96';c.fillRect(175,127,4,37);text('WALL',138,143,'#a7c0b2',9);circle(c,151,161,4,'#b8c0b2');text('BLOCKED',110,181,'#a7c0b2',9);
 text('REAL FIRE TIMING',428,140,dark,12);text('DIRECT HIT',428,175,dark,11);text(on?'1 PLATE NOW':'LINE UP THE CUT',428,194,dark,11);
 for(const [i,label] of ['AFTER 0.3s','AFTER 0.6s'].entries()){const due=e.now>=[e.first,e.second][i]&&on;c.fillStyle=due?'#a96d40':'#a4b1a0';c.fillRect(428,211+i*39,8,8);text(label,443,220+i*39,dark,11);text(due?'−1':'WAIT',550,220+i*39,dark,11);}
 text('10% NARROWER SHOT',428,293,dark,11);
 text('First contact lights the group. Fire finishes its two hits.',24,345,'#eddbba',17);
 text('BOSSES RESIST / WALLS BLOCK SPREAD / NO EXTRA EDGE OR COMBO',24,370,'#a4bdb3',10);
 text('SLOWED EXAMPLE / REAL GAME TIMING SHOWN IN SECONDS',24,390,'#8daead',10);
 }finally{c.restore();}
}

/** Three detached launch embers inherit a fraction of launch velocity. Fixed
 * population, no replenishment, cone ends quickly; exactly two contact embers. */
export function drawEmberLaunch(c,{x=0,y=0,vx=0,vy=0,angle=null,age=-1,radius=22,motion=true}={}){
 if(!motion||![x,y,vx,vy,age,radius].every(Number.isFinite)||age<0||age>14||Math.hypot(vx,vy)<4||radius<=0)return;
 const a=Number.isFinite(angle)?angle:Math.atan2(vy,vx),speed=Math.hypot(vx,vy),r=Math.min(30,radius);
 c.save();try{c.translate(x,y);c.rotate(a);c.globalAlpha*=.7*(1-age/14)**2;
 if(age<5){const k=1-age/5;seam(c,[[r*.4,-r*.7],[r*.88,0],[r*.4,r*.7]],'#ffbc81',1.8*k);}
 for(let i=0;i<3;i++){const xx=-r*.8-age*speed*(.035+i*.007)-i*4,yy=(i-1)*(4+age*.4);seam(c,[[xx,yy],[xx-3-i,yy+(i-1)]],i===1?'#ffdfa6':'#f5a376',1.5);}
 }finally{c.restore();}
}

/** Leading facets, never ice bullets. Ends with the actual launch envelope;
 * Riot/Lava's core construction stays warm and is not turned into a cold gun. */
export function drawFrostLaunch(c,{x=0,y=0,vx=0,vy=0,angle=null,age=-1,radius=22,motion=true}={}){
 if(!motion||![x,y,vx,vy,age,radius].every(Number.isFinite)||age<0||age>12||radius<=0||Math.hypot(vx,vy)<4)return;
 const a=Number.isFinite(angle)?angle:Math.atan2(vy,vx),r=Math.min(30,radius),fade=(1-age/12)**2;
 c.save();try{c.translate(x,y);c.rotate(a);c.globalAlpha*=fade*.75;
 const line=(p,col,w)=>seam(c,p,col,w);
 line([[r*.35,-r*.8],[r*1.04,0],[r*.35,r*.8]],'#d6f1ef',2.2);
 line([[r*.15,-r*.73],[r*.55,-r*.35]],'#91c3d6',1.5);line([[r*.15,r*.73],[r*.55,r*.35]],'#91c3d6',1.5);
 // Two finite trailing facets refer to the launched shell, not projectiles.
 for(const side of [-1,1])line([[-r*.85-age*.8,side*r*.55],[-r*1.25-age,side*r*.38],[-r*1.08-age,side*r*.7]],'#aacfdc',1.4);
 }finally{c.restore();}
}

/** Read-only target clock presentation: closed stop-collar for frozen Fangs,
 * open drag brackets for slowed heavy bodies; broken rim only on real thaw.
 * Damage/warnings are never recolored safe. No ambient pulse or emitter. */
export function drawFrostStatus(c,{x=0,y=0,radius=20,angle=0,status=null,now=0,motion=true,labels=true}={}){
 if(!status||![x,y,radius,angle,now].every(Number.isFinite)||radius<=0)return;
 const active=status.phase==='active'&&now<status.until,thaw=status.phase==='immune'&&now-status.thawedAt>=0&&now-status.thawedAt<8;
 const immune=status.phase==='immune'&&now<status.immunityUntil;
 if(!active&&!thaw&&!immune)return;
 const r=radius+4,freeze=status.kind==='freeze',age=now-status.born;
 c.save();try{c.translate(x,y);c.rotate(angle);c.lineJoin='miter';c.lineCap='butt';
 if(active){
  if(freeze){seam(c,[[-r*.78,-r*.7],[r*.2,-r*.7],[r*.92,0],[r*.2,r*.7],[-r*.78,r*.7],[-r*.78,-r*.7]],'#bce1e4',1.8);}
  else{for(const side of [-1,1])seam(c,[[side*r*.62,-r*.86],[side*r*.92,-r*.62],[side*r*.92,r*.62],[side*r*.62,r*.86]],'#9cc8d8',1.8);}
  if(labels){c.save();c.rotate(-angle);c.fillStyle='#d7e8df';c.font='8px sans-serif';c.textAlign=freeze?'center':'left';c.fillText(freeze?'FROZEN':'SLOWED',freeze?0:r+7,freeze?-r-17:3);c.restore();}
  // A shape-coded stop notch never covers the enemy's active mouth/plates.
  c.save();c.rotate(-angle);seam(c,[[-5,-r-5],[-5,-r-11]],'#e4f1df',2);seam(c,[[freeze?1:5,-r-5],[freeze?1:1,-r-11]],'#e4f1df',2);c.restore();
  if(motion&&age>=0&&age<5){c.globalAlpha*=1-age/5;for(let i=0;i<3;i++){const a=-2.5+i*.9,xx=Math.cos(a)*(r+age*2),yy=Math.sin(a)*(r+age*2);seam(c,[[xx,yy-2],[xx+2,yy],[xx,yy+2]],'#d8f0ec',1.4);}}
 }else{
  if(!thaw){c.save();c.rotate(-angle);seam(c,[[-5,-r-6],[-1,-r-10]],'#8ba8b2',1.2);seam(c,[[2,-r-6],[6,-r-10]],'#8ba8b2',1.2);c.restore();return;}
  const t=(now-status.thawedAt)/8;c.globalAlpha*=motion?1-t:.6;
  for(const side of [-1,1]){const d=motion?t*7:0;seam(c,[[side*(r*.7+d),-r*.35],[side*(r*.9+d),0],[side*(r*.7+d),r*.35]],'#aac6cb',1.2);}
 }
 }finally{c.restore();}
}

/** Match the actual power: paused Fang countdown, slower heavy locomotion,
 * emitted shot continuing and a separate, finite recovery window after thaw. */
export function drawFrostLesson(c,w,h,{study={},equipment={},sword=null}={}){
 const f=study.dash.frost,{sample:s,baseline:b,now}=f,active=f.started,freeze=active&&s.fang.status?.phase==='active',slow=active&&s.heavy.status?.phase==='active',immune=active&&s.fang.status?.phase==='immune';
 c.save();try{c.fillStyle='#10212b';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 const text=(s,x,y,color='#dfebde',size=12)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.textAlign='left';c.fillText(s,x,y);},line=(p,col='#a6cdd4',width=1.5)=>seam(c,p,col,width);
 text('FROST / A REAL OPENING, NOT A DAMAGE TRAIL',24,26,'#a3bdc3',11);text(study.title||'Frost Dash',24,59,'#f2eddd',26);
 for(let i=0;i<3;i++){c.fillStyle=i===f.phase?'#d1e6df':'#2c4249';c.fillRect(24+i*204,78,188,3);text(['01  CUT INTO THE GROUP','02  STOP / SLOW','03  THAW / RESIST'][i],24+i*204,99,i===f.phase?'#e0efdf':'#829e9e',10);}
 c.fillStyle='#1b303b';c.fillRect(24,115,354,198);c.fillStyle='#e3dfd0';c.fillRect(390,115,226,198);
 text('FANG / ATTACK COUNTDOWN',40,138,'#bdd5cf',11);
 const fangX=105-Math.min(30,Math.abs(s.fang.x+70)*.12),fang={...s.fang,x:fangX,y:185,r:21};
 if(active&&freeze)drawFrostStatus(c,{x:fang.x,y:fang.y,radius:fang.r,angle:Math.PI,status:s.fang.status,now,motion:f.motion,labels:false});
 foe(c,'fang',fang.x,fang.y,fang.r,Math.PI,{hp:1,mode:active?s.fang.mode:'tell',clock:active?s.fang.clock:30,span:66,aim:Math.PI,time:0});
 if(active&&!freeze&&s.fang.status)drawFrostStatus(c,{x:fang.x,y:fang.y,radius:fang.r,angle:Math.PI,status:s.fang.status,now,motion:f.motion,labels:false});
 text(!active?'LINE UP':freeze?'FROZEN':immune?'THAWED / COLD RESIST':'MOVING AGAIN',151,166,'#d9ebe1',12);
 text(`COUNTDOWN: ${((active?s.fang.clock:30)/60).toFixed(2)}s`,151,186,'#b8d1ce',11);
 text(`WITHOUT FROST: ${(b.fang.clock/60).toFixed(2)}s`,151,205,'#8faab0',10);
 text('HEAVY / MOVEMENT ONLY',40,235,'#bdd5cf',11);
 const unit=Math.min(1,110/Math.max(1,f.travel.baseline)),len=active?f.travel.cold*unit:0,base=active?f.travel.baseline*unit:0;
 line([[96,275],[345,275]],'#3b575e',1);c.fillStyle='#536e72';c.fillRect(96+base,265,12,20);
 foe(c,'bastion',102+len,275,18,0,{hp:1,mode:'idle'});if(active&&s.heavy.status)drawFrostStatus(c,{x:102+len,y:275,radius:18,status:s.heavy.status,now,motion:f.motion,labels:false});
 text(slow?'30% SLOWER':!active?'CUT LEAVES ARMOR ALIVE':'NORMAL MOVEMENT',170,251,'#c0dad2',10);
 const ink='#304c51';text('SHOTS ALREADY FIRED',406,139,ink,11);
 const needle=590-(active?Math.min(1,f.needleTravel/360)*174:0);line([[409,165],[594,165]],'#b0bca9',1);line([[needle,165],[needle-9,165]],'#994852',2);text('KEEP MOVING / STILL DANGEROUS',406,190,ink,10);
 text('AFTER THE ICE BREAKS',406,224,ink,11);
 const remaining=s.fang.status?.phase==='immune'?Math.max(0,(s.fang.status.immunityUntil-now)/60):1.5;
 text(immune?`COLD RESIST: ${remaining.toFixed(1)}s`:freeze?'THAW STARTS 1.5s RESIST':'1.5s COLD RESIST AFTER THAW',406,248,ink,11);
 text('WALL / TOO FAR / BOSS',406,278,ink,11);text('NO COLD APPLIED',406,297,ink,10);
 text(freeze?'The Fang stops. Its attack countdown stops with it.':immune?'The collar breaks at thaw. Cold cannot pin it forever.':'One direct contact. Up to one nearby enemy chilled.',24,341,'#e0eada',17);
 text('HEAVY ATTACKS KEEP CHARGING / FROZEN RUSHING BODIES STILL HURT',24,368,'#a4bec2',10);
 text('SLOWED EXAMPLE / NO EXTRA DAMAGE OR AIM DISCOUNT',24,389,'#8baab1',10);
 // Production construction is present without obscuring the evidence lanes.
 drawCubeHero(c,{x:345,y:173,radius:18,equipment,motion:false,time:0,pose:{blink:1}});
 if(active&&now<3)drawFrostLaunch(c,{x:345,y:173,vx:-30,vy:0,age:now,radius:18,motion:f.motion});
 }finally{c.restore();}
}

/** A compact keylined crescent, not a moving black hole or invulnerability
 * bubble. Shared dark/pale construction leaves the equipped hero readable. */
export function drawVoidLaunch(c,{x=0,y=0,vx=0,vy=0,angle=null,age=-1,radius=22,motion=true}={}){
 if(!motion||![x,y,vx,vy,age,radius].every(Number.isFinite)||age<0||age>14||radius<=0||Math.hypot(vx,vy)<4)return;
 const a=Number.isFinite(angle)?angle:Math.atan2(vy,vx),r=Math.min(30,radius),fade=(1-age/14)**2;
 c.save();try{c.translate(x,y);c.rotate(a);c.globalAlpha*=fade*.8;
 seam(c,[[r*.1,-r*.86],[r*.7,-r*.53],[r*.94,0],[r*.7,r*.53],[r*.1,r*.86]],'#191b30',5);
 seam(c,[[r*.1,-r*.86],[r*.7,-r*.53],[r*.94,0],[r*.7,r*.53],[r*.1,r*.86]],'#d2cbeb',1.6);
 for(const side of [-1,1])seam(c,[[-r*.9-age*.8,side*r*.65],[-r*1.25-age*.9,side*r*.46]],'#a79dcc',1.2);
 }finally{c.restore();}
}

/** Exact outer force radius / exact smaller damage radius. No opaque fill,
 * fake victim orbit, continuous spray or post-expiry decorative damage ring. */
export function drawVoidField(c,{field=null,now=0,motion=true,scale=1,labels=true,layer='all'}={}){
 if(!field||!['pull','collapse'].includes(field.phase)||![field.x,field.y,now].every(Number.isFinite))return;
 const r=field.radius,core=field.core,unit=1/Math.max(.15,scale),age=now-field.born,after=now-field.expires;
 if(field.phase==='collapse'&&(after<0||after>=8))return;
 c.save();try{c.translate(field.x,field.y);c.lineCap='butt';
 const ring=(radius,col,width,segments=1)=>{c.strokeStyle=col;c.lineWidth=width*unit;for(let i=0;i<segments;i++){c.beginPath();c.arc(0,0,radius,i*TAU/segments+.08,(i+1)*TAU/segments-(segments>1?.2:.08));c.stroke();}};
 const outer=layer!=='core',inner=layer!=='outer';
 if(field.phase==='pull'){
  // The boundary never shrinks to pretend all of its area deals damage.
  if(outer){c.globalAlpha=.8;ring(r,'#c0b3da',1.5,8);}
  if(inner){c.globalAlpha=.95;ring(core,'#181428',4,1);ring(core,'#eee2f6',1.9,1);
  for(let i=0;i<4;i++){const a=i*TAU/4,cs=Math.cos(a),sn=Math.sin(a);seam(c,[[cs*(core-5)-sn*3,sn*(core-5)+cs*3],[cs*core,sn*core],[cs*(core-5)+sn*3,sn*(core-5)-cs*3]],'#ddd1ed',1.2*unit);}
  // A small timer seam counts actual time to the one pending pulse.
  const progress=clamp(age/Math.max(.01,field.expires-field.born),0,1);c.strokeStyle='#bdb0df';c.lineWidth=2*unit;c.beginPath();c.arc(0,0,core-5,-Math.PI/2,-Math.PI/2+TAU*progress);c.stroke();}
  if(outer)for(const t of (field.targets||[]).slice(0,3))if(t.moved>0){const dx=t.x-field.x,dy=t.y-field.y,d=Math.hypot(dx,dy);if(d<1)continue;const u=motion?clamp((age%4)/4,0,1):.5,px=dx*(.92-.05*u),py=dy*(.92-.05*u),ux=dx/d,uy=dy/d;c.globalAlpha=.6;seam(c,[[px+ux*5-uy*2,py+uy*5+ux*2],[px,py],[px+ux*5+uy*2,py+uy*5-ux*2]],'#b7acd4',1.2*unit);}
  if(labels){c.globalAlpha=.85;c.font=`${8*unit}px sans-serif`;c.textAlign='center';c.fillStyle='#c8bedb';if(outer)c.fillText('PULL',0,-r-5*unit);if(inner){c.textAlign='left';c.fillText('CORE HIT',core+8*unit,core+12*unit);}}
 }else{
  const t=clamp(after/8,0,1);c.globalAlpha=(1-t)*.55;if(outer)ring(r,'#9387b2',1,8);
  // Pulse cannot exceed the actual small core. Reduced motion is static.
  if(inner){c.globalAlpha=(1-t)*.95;ring(core*(motion?.72+.28*Math.min(1,t*2):1),'#f1e7f8',2.2,1);
  seam(c,[[-core*.35,0],[core*.35,0]],'#f1e7f8',1.3*unit);seam(c,[[0,-core*.35],[0,core*.35]],'#f1e7f8',1.3*unit);}
 }
 }finally{c.restore();}
}

/** A large field cutaway, result receipt and timeline. The production well
 * owns selection, movement, clipped displacement and the actual core hit. */
export function drawVoidLesson(c,w,h,{study={},equipment={},sword=null}={}){
 const q=study.dash.void,{sample:s}=q,active=q.started,phase=q.phase,ink='#304653';
 c.save();try{c.fillStyle='#111d2c';c.fillRect(0,0,w,h);c.scale(w/640,h/400);
 const text=(s,x,y,color='#e4e4df',size=12)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.textAlign='left';c.fillText(s,x,y);},line=(pts,col='#9c95b7',width=1.3)=>seam(c,pts,col,width);
 text('VOID / TWO BOUNDARIES, TWO DIFFERENT JOBS',24,25,'#b8accb',11);text(study.title||'Void Dash',24,59,'#eee7e4',26);
 for(let i=0;i<3;i++){c.fillStyle=i===phase?'#d8c9e8':'#354054';c.fillRect(24+i*204,78,188,3);text(['01  HIT / PLACE','02  DRAW IN','03  CORE COLLAPSE'][i],24+i*204,99,i===phase?'#e6d6ec':'#8e9cae',10);}
 c.fillStyle='#1b293e';c.fillRect(24,115,360,224);c.fillStyle='#e1dfd4';c.fillRect(396,115,220,224);
 // Stable field origin and a common unscaled world-to-panel transform.
 c.save();c.translate(201,227);
 if(active)drawVoidField(c,{field:s.field,now:s.now,motion:q.motion,scale:1,labels:false});
 else{c.strokeStyle='#637087';c.setLineDash([3,5]);c.beginPath();c.arc(0,0,q.radius,0,TAU);c.stroke();c.setLineDash([]);}
 for(const wall of s.geometry){c.fillStyle='#80909f';c.fillRect(wall.x,wall.y,wall.w,wall.h);}
 for(const e of s.targets){
  const startX=e.id==='inner'?54:e.id==='outer'?-92:e.x,startY=e.y,x=active?e.x:startX;
  if(e.hp>0){foe(c,e.kind,x,startY,e.kind==='monolith'?8:e.r,0,{hp:e.hp,mode:'idle'});}
  else{line([[x-4,startY-4],[x+4,startY+4]],'#c6bdd4');line([[x+4,startY-4],[x-4,startY+4]],'#c6bdd4');}
 }
 c.restore();
 text('WALL BLOCKS',167,185,'#b8c3d1',9);text('OUTER: PULL ONLY',35,326,'#bab5cd',10);text('CORE: ONE HIT AT COLLAPSE',212,326,'#d4cae3',9);
 text('ONE FIXED HIT LOCATION',412,140,ink,11);text('PULLS UP TO 3 ENEMIES',412,167,ink,12);text('BOUNDED PULL / NO HOMING',412,187,ink,10);
 text('AFTER 0.3s',412,220,ink,12);
 const inner=s.targets.find(e=>e.id==='inner'),outer=s.targets.find(e=>e.id==='outer');
 text(active&&phase===2?'INNER TARGET: 1 HIT':'SMALL CORE: HIT PENDING',412,242,ink,11);text(`OUTER TARGET: ${active&&phase===2?outer.hp:1} HEALTH / NO HIT`,412,264,ink,10);
 text('BOSSES RESIST / WALLS BLOCK',412,293,ink,10);text('READY AGAIN AFTER 0.6s',412,315,ink,10);
 drawCubeHero(c,{x:57,y:149,radius:19,equipment,motion:false,time:0,pose:{blink:1}});if(active&&s.now<4)drawVoidLaunch(c,{x:57,y:149,vx:30,vy:0,age:s.now,radius:19,motion:q.motion});
 text(phase===2?'Only the small core strikes. The outer ring never hurts.':'Draw them inward. The small core is the danger zone.',24,367,'#ded1e8',17);
 text('SLOWED REAL FIELD / NO EXTRA ARMOR SCORE / NO PROTECTION OR PROJECTILE ABSORPTION',24,390,'#9eacc2',9);
 }finally{c.restore();}
}

/** Aim-only source terminal. These three tiny bars are a recharge receipt,
 * not another field, projectile, aura or player protection ring. */
export function drawVoidReadiness(c,{x=0,y=0,radius=22,readyIn=0}={}){
 if(![x,y,radius,readyIn].every(Number.isFinite)||radius<=0)return;
 const amount=1-clamp(readyIn/36,0,1);c.save();try{c.translate(x+radius+6,y+radius*.4);c.fillStyle='#1b192b';c.fillRect(-2,-3,7,19);for(let i=0;i<3;i++){c.fillStyle=amount>=(3-i)/3?'#d8cbe8':'#75658b';c.fillRect(0,i*5,3,3);}}finally{c.restore();}
}
