/** Bounded interaction feedback. No particles, timers, audio or gameplay hooks.
 * Animations own only transforms/opacity on UI nodes and are cancelled on close.
 */
export function createShopFeedback(root, motion = () => true) {
  const active = new Map();
  let disposed = false;
  function stop() {
    for (const animation of active.values()) animation.cancel();
    active.clear();
  }
  function pulse(node, style = 'press') {
    if (disposed || !node || !motion() || typeof node.animate !== 'function') return;
    active.get(node)?.cancel(); active.delete(node);
    while (active.size >= 3) {
      const [oldest, animation] = active.entries().next().value;
      animation.cancel(); active.delete(oldest);
    }
    const frames = style === 'reveal'
      ? [{opacity: .6, transform: 'translateY(3px)'}, {opacity: 1, transform: 'translateY(0)'}]
      : [{transform: 'scale(1)'}, {transform: 'scale(.975)', offset: .3}, {transform: 'scale(1)'}];
    const animation = node.animate(frames, {duration: style === 'reveal' ? 220 : 160, easing: 'cubic-bezier(.2,.8,.2,1)'});
    active.set(node, animation);
    animation.finished.then(() => {if (active.get(node) === animation) active.delete(node);},
      () => {if (active.get(node) === animation) active.delete(node);});
  }
  function click(event) {
    // The button's handler may already have closed the dialog. Do not start
    // another press animation while that close event is waiting to dispatch.
    if (root.open === false) {stop(); return;}
    const button = event.target.closest?.('button');
    if (!button || button.disabled) return;
    // Selection/purchase can replace the original button in its own handler.
    const live = button.dataset.item ? root.querySelector(`[data-item="${button.dataset.item}"]`)
      : button.classList.contains('equip-part') ? root.querySelector('.equip-part') : button;
    pulse(live);
  }
  root.addEventListener('click', click);
  root.addEventListener('close', stop);
  return Object.freeze({pulse, stop, dispose() {
    if (disposed) return;
    disposed = true; stop(); root.removeEventListener('click', click); root.removeEventListener('close', stop);
  }});
}
