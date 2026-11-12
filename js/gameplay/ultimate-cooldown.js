(() => {
  'use strict';
  const CONFIG = Object.freeze({ strengthCost: 20, durationMs: 10000 });

  function remaining(run, timestamp) {
    return Math.max(0, (run.ultimateReadyAt || 0) - timestamp);
  }

  function start(run, timestamp) {
    run.ultimateReadyAt = timestamp + CONFIG.durationMs;
  }

  const api = Object.freeze({ CONFIG, remaining, start });
  if (typeof window !== 'undefined') window.SlimeUltimateCooldown = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
