(() => {
  'use strict';

  const PASSIVE_INTERVAL_MS = 1000;
  const BURST_CHARGE_MS = 175;
  const BURST_INTERVAL_MS = 255;
  const BURST_COUNT = 6;
  const RANGE_CELLS = 8;
  const CELL_TRAVEL_MS = 106;
  const SHOT_FADE_MS = 180;
  const MECH_ASSEMBLY_MS = 1330;
  const MECH_ACTIVE_MS = 6000;
  const DRILL_BITE_MS = 62;
  const DRILL_INTERVAL_MS = 105;
  const MECH_GEOMETRY = Object.freeze({
    hullWidth: 2.24, bitX: .55, collarY: .58, bitWidth: .31, bitLength: .76
  });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function startBurst(run, at) {
    run.nanoBurst = { remaining: BURST_COUNT, startedAt: at, nextAt: at + BURST_CHARGE_MS };
  }

  function fire(run, now, drone, services, bursting) {
    const { cellSize: cell, slime, gridOffsetX, columns } = run;
    const x = clamp(drone.x, gridOffsetX + 3, gridOffsetX + columns * cell - 3);
    const col = Math.floor((x - gridOffsetX) / cell);
    const rockY = slime.y + slime.radius * .48;
    const fromY = drone.muzzleY ?? drone.y;
    const toY = fromY + cell * RANGE_CELLS;
    const targets = services.blocksNearY((rockY + toY) / 2, (toY - rockY) / 2)
      .filter(block => !block.dead && block.col === col && block.y + block.h > rockY && block.y < toY)
      .sort((a, b) => a.y - b.y);
    const piercing = !run.anomaly && run.ultimateStage >= 2;
    run.nanoShots.push({
      startedAt: now, x, fromY, rockY, toY,
      speed: cell / CELL_TRAVEL_MS,
      bursting, piercing, targets, nextTarget: 0, impacts: [],
      hitsLeft: piercing ? 2 : 1, stopY: toY, stoppedAt: null,
      rangeEndAt: now + RANGE_CELLS * CELL_TRAVEL_MS
    });
    run.nanoLastShotAt = now;
    services.sound(piercing ? 'technoPierceShot' : 'technoShot');
  }

  function update(run, at, drone, services, { hasPassive = true } = {}) {
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
        const through = shot.hitsLeft > 0;
        const hitAt = shot.startedAt + (hitY - shot.fromY) / shot.speed;
        shot.impacts.push({ y: hitY, at: hitAt, through, exitY: Math.min(block.y + block.h, shot.toY) });
        if (!block.unbreakable) {
          block.nanoLaserStartedAt = at;
          block.nanoLaserUntil = at + (shot.piercing ? 240 : 140);
          block.nanoLaserX = shot.x;
          services.damageBlockByElement(block, 1, 'nano', at);
        }
        if (shot.hitsLeft === 0) {
          shot.stopY = hitY;
          shot.stoppedAt = hitAt;
        }
      }
    }
    run.nanoShots = nanoShots.filter(shot => at < (shot.stoppedAt ?? shot.rangeEndAt) + SHOT_FADE_MS + 70);
    if (run.mechSuit || run.ultimateIntro || run.coreEncounter || run.portalEntry || run.evacuation) return;

    const burst = run.nanoBurst;
    if (burst) {
      if (at < burst.nextAt) return;
      fire(run, at, drone, services, true);
      burst.remaining -= 1;
      burst.nextAt = at + BURST_INTERVAL_MS;
      if (burst.remaining === 0) {
        run.nanoBurst = null;
        run.nanoNextShotAt = at + PASSIVE_INTERVAL_MS;
      }
    } else if (hasPassive && at >= run.nanoNextShotAt) {
      fire(run, at, drone, services, false);
      run.nanoNextShotAt = at + PASSIVE_INTERVAL_MS;
    }
  }

  function shotY(shot, at) {
    return Math.min(shot.stopY, shot.fromY + Math.max(0, at - shot.startedAt) * shot.speed);
  }

  function drill(run, at, damage, previousY = run.slime.y) {
    const { slime, cellSize: cell, blockRowOrigin, blocksByRow, mechSuit } = run;
    const { bitX, collarY, bitWidth, bitLength } = MECH_GEOMETRY;
    const mount = slime.y + collarY * cell;
    const tip = mount + bitLength * cell;
    const firstRow = Math.floor((previousY + collarY * cell - blockRowOrigin) / cell);
    const lastRow = Math.floor((tip - blockRowOrigin) / cell);
    const touched = new Set();
    const sparks = [];
    let stopY = slime.y;
    let hits = 0;
    let broken = 0;
    for (let row = firstRow; row <= lastRow; row += 1) {
      const nearest = [null, null];
      for (const block of blocksByRow.get(row) || []) {
        if (block.dead || block.y + block.h <= mount) continue;
        for (let bit = 0; bit < 2; bit += 1) {
          const axis = slime.x + (bit === 0 ? -1 : 1) * bitX * cell;
          const x = clamp(axis, block.x, block.x + block.w);
          const distance = Math.abs(x - axis) / (bitWidth * cell);
          if (distance >= 1) continue;
          const reach = (collarY + bitLength * (1 - .84 * distance)) * cell;
          if (slime.y + reach < block.y) continue;
          if (!nearest[bit] || distance < nearest[bit].distance) {
            nearest[bit] = { block, reach, x, distance, bit };
          }
        }
      }
      for (const contact of nearest) {
        if (!contact || touched.has(contact.block)) continue;
        const { block, reach, x } = contact;
        touched.add(block);
        const nextAt = mechSuit.contacts.get(block);
        if (nextAt === undefined || at >= nextAt) {
          const first = nextAt === undefined;
          mechSuit.contacts.set(block, at + (first ? DRILL_BITE_MS : DRILL_INTERVAL_MS));
          if (!first && !block.unbreakable) {
            hits += 1;
            if (damage(block, 2, 'mech', at)) broken += 1;
          }
          sparks.push({ x, y: clamp(slime.y + reach, block.y, block.y + block.h),
            bit: contact.bit, broken: Boolean(block.dead) });
        }
        if (!block.dead) {
          // Keep a little pressure on the face, without letting the pilot sink into it.
          stopY = Math.min(stopY, Math.max(previousY, block.y - reach + cell * .07));
        }
      }
    }
    for (const block of mechSuit.contacts.keys()) {
      if (!touched.has(block) || block.dead) mechSuit.contacts.delete(block);
    }
    return { hits, broken, sparks, stopY, loaded: mechSuit.contacts.size > 0 };
  }

  function shiftClock(run, delta) {
    if (run.nanoNextShotAt > 0) run.nanoNextShotAt += delta;
    if (run.nanoLastShotAt > 0) run.nanoLastShotAt += delta;
    if (run.nanoBurst) {
      run.nanoBurst.startedAt += delta;
      run.nanoBurst.nextAt += delta;
    }
    for (const shot of run.nanoShots || []) {
      shot.startedAt += delta;
      shot.rangeEndAt += delta;
      if (shot.stoppedAt !== null) shot.stoppedAt += delta;
      for (const impact of shot.impacts) impact.at += delta;
    }
    const contacts = run.mechSuit?.contacts;
    if (contacts) for (const [block, nextAt] of contacts) contacts.set(block, nextAt + delta);
  }

  window.SlimeTechnoUltimates = Object.freeze({
    PASSIVE_INTERVAL_MS, BURST_CHARGE_MS, SHOT_FADE_MS, MECH_ASSEMBLY_MS, MECH_ACTIVE_MS, MECH_GEOMETRY,
    startBurst, update, shotY, drill, shiftClock
  });
})();
