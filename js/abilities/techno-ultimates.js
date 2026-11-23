(() => {
  'use strict';

  const PASSIVE_INTERVAL_MS = 1000;
  const BURST_INTERVAL_MS = 105;
  const BURST_COUNT = 6;
  const RANGE_CELLS = 5.6;
  const TRAVEL_MS = 180;
  const SHOT_LIFE_MS = 350;
  const MECH_ASSEMBLY_MS = 920;
  const MECH_ACTIVE_MS = 5000;
  const DRILL_BITE_MS = 62;
  const DRILL_INTERVAL_MS = 105;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function startBurst(run, at) {
    run.nanoBurst = { remaining: BURST_COUNT, nextAt: at };
  }

  function fire(run, now, drone, services, bursting) {
    const { cellSize: cell, slime, gridOffsetX, columns } = run;
    const col = clamp(Math.floor((slime.x - gridOffsetX) / cell), 0, columns - 1);
    const rockY = slime.y + slime.radius * .45;
    const fromY = drone.muzzleY ?? drone.y;
    const toY = rockY + cell * RANGE_CELLS;
    const left = gridOffsetX + col * cell;
    const x = clamp(drone.x, left + cell * .09, left + cell * .91);
    const targets = services.blocksNearY((rockY + toY) / 2, (toY - rockY) / 2)
      .filter(block => !block.dead && block.col === col && block.y + block.h > rockY && block.y < toY)
      .sort((a, b) => a.y - b.y);
    const piercing = run.ultimateStage >= 2;
    run.nanoShots.push({
      startedAt: now, x, fromX: drone.x, fromY, rockY, toY,
      bursting, piercing, targets, nextTarget: 0, impacts: [],
      hitsLeft: piercing ? 2 : 1, stopY: toY, stoppedAt: null
    });
    run.nanoLastShotAt = now;
    if (bursting && run.nanoBurst.remaining % 2 === 0) services.sound('tap');
  }

  function update(run, at, drone, services) {
    const { nanoShots } = run;
    for (const shot of nanoShots) {
      const front = shotY(shot, at);
      while (shot.hitsLeft > 0 && shot.nextTarget < shot.targets.length) {
        const block = shot.targets[shot.nextTarget];
        const hitY = clamp(block.y, shot.rockY, shot.toY);
        if (hitY > front) break;
        shot.nextTarget += 1;
        if (block.dead) continue;
        if (!block.unbreakable && !services.elementalDamageable(block)) continue;
        shot.hitsLeft = block.unbreakable ? 0 : shot.hitsLeft - 1;
        shot.impacts.push({ y: hitY, at, through: shot.hitsLeft > 0 });
        if (!block.unbreakable) {
          block.nanoLaserStartedAt = at;
          block.nanoLaserUntil = at + (shot.piercing ? 128 : 72);
          services.damageBlockByElement(block, 1, 'nano', at);
        }
        if (shot.hitsLeft === 0) {
          shot.stopY = hitY;
          shot.stoppedAt = at;
        }
      }
    }
    run.nanoShots = nanoShots.filter(shot => at - shot.startedAt < SHOT_LIFE_MS);
    if (run.mechSuit || run.ultimateIntro || run.coreEncounter || run.portalEntry || run.evacuation) return;

    const burst = run.nanoBurst;
    if (burst) {
      if (at < burst.nextAt) return;
      fire(run, at, drone, services, true);
      burst.remaining -= 1;
      burst.nextAt += BURST_INTERVAL_MS;
      if (burst.remaining === 0) {
        run.nanoBurst = null;
        run.nanoNextShotAt = at + PASSIVE_INTERVAL_MS;
      }
    } else if (at >= run.nanoNextShotAt) {
      fire(run, at, drone, services, false);
      run.nanoNextShotAt = at + PASSIVE_INTERVAL_MS;
    }
  }

  function shotY(shot, at) {
    const progress = clamp((at - shot.startedAt) / TRAVEL_MS, 0, 1);
    return Math.min(shot.stopY, shot.fromY + (shot.toY - shot.fromY) * progress);
  }

  function drill(run, at, damage) {
    const { slime, cellSize, gridOffsetX, blockRowOrigin, blocksByRow, columns } = run;
    const contacts = run.mechSuit.contacts;
    // Follow the nearest pair of columns to the chassis center.
    const left = clamp(Math.round((slime.x - gridOffsetX) / cellSize) - 1, 0, columns - 2);
    const top = Math.floor((slime.y - blockRowOrigin) / cellSize);
    let hits = 0;
    let broken = 0;
    for (const block of contacts.keys()) {
      if (block.dead || block.row < top || block.row > top + 1 || block.col < left || block.col > left + 1) {
        contacts.delete(block);
      }
    }
    for (let row = top; row <= top + 1; row += 1) {
      for (const block of blocksByRow.get(row) || []) {
        if (block.dead || block.unbreakable || block.col < left || block.col > left + 1) continue;
        const nextAt = contacts.get(block);
        if (nextAt === undefined) {
          contacts.set(block, at + DRILL_BITE_MS);
          continue;
        }
        if (at < nextAt) continue;
        contacts.set(block, at + DRILL_INTERVAL_MS);
        hits += 1;
        if (damage(block, 2, 'mech', at)) broken += 1;
      }
    }
    return { hits, broken };
  }

  function shiftClock(run, delta) {
    if (run.nanoNextShotAt > 0) run.nanoNextShotAt += delta;
    if (run.nanoLastShotAt > 0) run.nanoLastShotAt += delta;
    if (run.nanoBurst) run.nanoBurst.nextAt += delta;
    for (const shot of run.nanoShots || []) {
      shot.startedAt += delta;
      if (shot.stoppedAt !== null) shot.stoppedAt += delta;
      for (const impact of shot.impacts) impact.at += delta;
    }
    const contacts = run.mechSuit?.contacts;
    if (contacts) for (const [block, nextAt] of contacts) contacts.set(block, nextAt + delta);
  }

  window.SlimeTechnoUltimates = Object.freeze({
    PASSIVE_INTERVAL_MS, SHOT_LIFE_MS, MECH_ASSEMBLY_MS, MECH_ACTIVE_MS,
    startBurst, update, shotY, drill, shiftClock
  });
})();
