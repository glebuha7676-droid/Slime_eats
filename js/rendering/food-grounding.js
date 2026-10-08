(() => {
  'use strict';
  let frame = 0;
  function fit() {
    frame = 0;
    const art = document.querySelector('#homeScreen .synth-terminal-art');
    if (!art || document.body.dataset.screen !== 'home') return;
    const base = art.getBoundingClientRect();
    if (!base.width || !base.height) return;
    for (const button of document.querySelectorAll('#foodChoices .conveyor-food-pick')) {
      const image = button.querySelector('.food-model'), wrap = button.querySelector('.food-model-wrap');
      if (!image || !wrap) continue;
      const bounds = window.SlimeFoodGroundBounds[button.dataset.foodId];
      if (!bounds) continue;
      const [width, height, left, top, right, bottom] = bounds;
      // The visual animates during synthesis; measure its stationary button instead.
      const rect = button.getBoundingClientRect();
      const sx = rect.width / button.offsetWidth, sy = rect.height / button.offsetHeight;
      if (!sx || !sy) continue;
      const index = Number(button.dataset.offerIndex);
      const x = (base.left + base.width * [186, 462, 738][index] / 925 - rect.left) / sx;
      const contactY = 359 + (button.dataset.foodId === 'nanoChip' ? 6 : 0);
      const y = (base.top + base.height * contactY / 1110 - rect.top) / sy;
      const scale = Math.min(Math.min(wrap.offsetWidth * .82, 78) / (right - left),
        wrap.offsetHeight * .93 / (bottom - top));
      const values = {width:width*scale,height:height*scale,left:x-(left+right)*.5*scale,top:y-bottom*scale};
      for (const [key, value] of Object.entries(values)) image.style.setProperty(`--ground-${key}`, `${value.toFixed(3)}px`);
      const visual = button.querySelector('.synthesis-food-visual');
      visual.style.setProperty('--ground-x', `${x.toFixed(3)}px`);
      visual.style.setProperty('--ground-y', `${y.toFixed(3)}px`);
      visual.style.setProperty('--ground-shadow-width', `${Math.min(56,(right-left)*scale*.75).toFixed(3)}px`);
      visual.style.setProperty('--ground-bottom', `${(wrap.offsetHeight-y).toFixed(3)}px`);
      image.classList.add('is-grounded');
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(fit); }
  window.SlimeFoodGrounding = Object.freeze({ fit, schedule });
})();
