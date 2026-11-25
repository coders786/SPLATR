/**
 * CHUNK 4 — THE POST: a run that grows without asking you to stop.
 *
 * ── WHAT THIS IS, AND WHAT IT IS NOT ──────────────────────────────────────
 *
 * This game ships with a 40-card upgrade catalogue (`src/upgrades.js`), a
 * three-card deal, and a TACTICAL FIT recommender. None of it was reachable:
 * the shipped configuration is `continuous: true, catalogRewards: false`, and
 * the continuous director returns before it ever opens the deck. Measured on a
 * real run — two sectors cleared, the full 30-tick rest beat each — `waveRest`
 * fired 0 times, `offers` stayed `[]`, and `state.upgrades` was empty from the
 * first frame to the last. The chooser was removed from continuous play
 * deliberately (see the note in `waves.js:229`), so this file does NOT put it
 * back.
 *
 * What it does instead: **the post**. Clearing a sector mails you one
 * run-length upgrade, picked by fit, with no UI, no pause and no decision. The
 * run still grows; the player still never stops flying.
 *
 * Why auto-pick rather than a deal: the whole complaint list in the launch doc
 * is about flow being interrupted. A card draft at every sector boundary is
 * exactly the interruption, and the recommender that was already written
 * (`recommendWaveOffer`) scores each card against the sector you just fought
 * and the sector that is next — so the interesting decision is already made,
 * deterministically, from your own play. The player's job is to read what
 * arrived and use it.
 *
 * Pure: no canvas, no DOM, no clock. The director owns the timing.
 */
import { recommendWaveOffer } from './encounters.js';

/**
 * When a post arrives: on every sector clear, from sector 1 on.
 *
 * There is no "every other sector" rule here because there is no decision to
 * ration — the grant is one of the rewards for a clear, beside the score
 * bonus, the flawless card and the goal. Withholding it would make the first
 * two sectors feel unlooted for no gain.
 */
export const POST = Object.freeze({
  /** Sectors after which a post is mailed. All of them. */
  first: 1,
  every: 1,
  /** Cards offered to the fit ranker. The catalogue it ranks is 40 deep. */
  cards: 3,
  /**
   * How long the receipt stays on screen: 8 seconds. A receipt that outlives
   * its beat becomes clutter, and this one lands on the busiest frame in the
   * game (a clear). Long enough to read a card name and one clause, short
   * enough to be gone before the next fight is underway.
   */
  showTicks: 480,
});

/**
 * Is the receipt still worth painting, `elapsed` ticks after it landed?
 *
 * @param {{at?:number}|null} post
 * @param {number} elapsed run clock
 */
export function postVisible(post, elapsed) {
  if (!post) return false;
  const at = Number(post.at);
  if (!Number.isFinite(at)) return true; // an un-stamped post is shown, not swallowed
  const age = Number(elapsed) - at;
  return !(age > POST.showTicks);
}

/** Does sector `number` get a post? */
export function postDue(number) {
  const n = Math.floor(Number(number) || 0);
  if (n < POST.first) return false;
  return (n - POST.first) % POST.every === 0;
}

/**
 * Which card arrives, and why.
 *
 * `recommendWaveOffer` already scores a hand against the sector just fought
 * (`previous`: hits taken, shots per cut) and the sector next up (`next`:
 * how many armored bodies are in it), and returns a one-line reason in plain
 * language. That reason is the point: an auto-grant with no explanation reads
 * as a random buff, and a player who cannot see why they got CLEAVER will not
 * change how they play.
 *
 * Returns null when the hand is empty — a run that already owns every card
 * gets no post, and that is not an error.
 *
 * @param {object[]} offers hand from `upgradeOffers`
 * @param {{next?:object,sword?:object,hp?:number,previous?:object}} context
 * @returns {{id:string,reason:string}|null}
 */
export function choosePost(offers = [], context = {}) {
  if (!Array.isArray(offers) || offers.length === 0) return null;
  const pick = recommendWaveOffer(offers, context);
  if (!pick) return null;
  const card = offers.find((x) => x && x.id === pick.id);
  if (!card) return null;
  return Object.freeze({
    id: card.id,
    reason: pick.reason,
    name: card.title || card.name || card.id.toUpperCase(),
  });
}

/**
 * The one line the HUD prints when a post lands: the card and its reason, as a
 * receipt rather than a dialogue box. Kept short because it fires on the same
 * frame as a sector clear, which is already busy.
 *
 * @param {{name?:string,reason?:string}|null} post
 */
export function postLine(post) {
  if (!post) return '';
  const name = String(post.name || post.id || '').toUpperCase();
  const reason = String(post.reason || '').trim();
  return reason ? `${name} — ${reason}` : name;
}
