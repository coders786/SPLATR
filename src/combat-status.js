/** Explain protection and harmless overlaps from real run state only. */
export function combatStatus(s) {
  if (!s || s.opening || !['ready','playing'].includes(s.phase)) return null;
  if (s.phase === 'ready') return {title:'ENEMIES WAITING',detail:'Launch to start the fight.'};
  if (s.wave?.phase === 'combat' && s.wave.entry > 0)
    return {title:'WAVE START',detail:s.invul > 0 ? 'Briefly protected while enemies enter.' : 'Enemies are entering.'};
  if (s.lastDefense && s.elapsed - s.lastDefense.tick <= 90) {
    const detail = {ward:'Your ward blocked the hit.',iron:'Iron blocked this Fang rush.',parry:'Your blade parried the attack.', 'cut-grace':'Brief protection from this enemy after a cut.'}[s.lastDefense.kind];
    if (detail) return {title:'HIT BLOCKED',detail};
  }
  if (s.invul > 0) return {title:'TEMPORARILY PROTECTED',detail:'Health cannot drop during recovery.'};
  if (s.parry > 0) return {title:'EARLY PARRY ACTIVE',detail:'Your launch can block an attack.'};
  if (s.safeContact && s.elapsed - s.safeContact.tick <= 90)
    return {title:'SAFE TOUCH',detail:'Only a rushing Fang hurts by contact.'};
  if (s.wave?.number === 1 && s.wave.phase === 'combat' && s.elapsed < 240)
    return {title:'WATCH THE ATTACK',detail:'Idle touch is safe. Attacks hurt.'};
  return null;
}
