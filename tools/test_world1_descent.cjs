const assert = require('node:assert/strict');
const descent = require('../js/generation/world1-descent.js');
const values = { dense: 1, hard: 3, reinforced: 5 };
const proportions = [{dense:.68,hard:.32,reinforced:0},{dense:.28,hard:.60,reinforced:.12},{dense:.08,hard:.46,reinforced:.46}];
let minFlasks = Infinity, maxFlasks = 0;
const patterns = new Set();
for (let seed = 1; seed <= 250; seed += 1) {
  let state = seed;
  const random = () => ((state = (Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  const map = descent.build({random});
  assert.equal(map.rows,105);
  assert.equal(map.zoneRows,35);
  assert.equal(map.encounters.length,15);
  assert.equal(map.deposits.length,9);
  map.encounters.forEach(e=>patterns.add(`${e.kind}:${e.variant}`));
  const sides = map.encounters.filter(e=>e.side>=0);
  assert.equal(sides.length,8);
  assert.ok(Math.abs(sides.filter(e=>e.side===0).length-sides.filter(e=>e.side===5).length)<=1);
  sides.forEach((e,i)=>{if(i)assert.notEqual(e.side,sides[i-1].side);});
  assert.equal(map.hazards.filter(h=>h.kind==='vertical').length,1);
  assert.ok(map.hazards.filter(h=>h.kind==='horizontal').length>=6);
  const centeredPatrols = map.encounters.filter(e=>e.variant==='center-patrol');
  const fastPatrols = map.encounters.filter(e=>e.variant.startsWith('fast-'));
  assert.equal(centeredPatrols.length,1);
  assert.equal(fastPatrols.length,1);
  assert.equal(fastPatrols[0].zone,2,'Fast patrols belong to the final section');
  assert.ok(map.deposits.some(d=>d.guardId===fastPatrols[0].id),'A fast patrol must guard a reward');
  for(const encounter of [...centeredPatrols,...fastPatrols]) {
    const members=map.hazards.filter(h=>h.encounterId===encounter.id);
    const motions=members.map(h=>map.cells[h.row][h.col].motion);
    assert.equal(motions[0].period,motions[1].period);
    assert.ok(Math.abs(motions[1].phase-motions[0].phase-Math.PI)<1e-9);
    assert.ok(motions.every(m=>encounter.zone===2?m.period>=2800&&m.period<=3400:m.period>=4200&&m.period<=4800));
    if(encounter.variant==='center-patrol') {
      assert.equal(encounter.side,-1);
      assert.ok(motions.every(m=>m.from===2&&m.to===3));
    }
  }
  const motionSpace = new Set();
  for (const hazard of map.hazards) {
    const cell = map.cells[hazard.row][hazard.col];
    assert.equal(cell.hazard,true);
    assert.equal(cell.dead,false);
    assert.equal(cell.flaskTier,0);
    assert.equal(cell.encounterId,hazard.encounterId);
    if (!cell.motion) continue;
    assert.ok(cell.motion.from < cell.motion.to);
    for (let coordinate=cell.motion.from;coordinate<=cell.motion.to;coordinate++) {
      const row = cell.motion.axis==='x'?hazard.row:coordinate;
      const col = cell.motion.axis==='x'?coordinate:hazard.col;
      motionSpace.add(`${row}:${col}`);
      const swept = map.cells[row][col];
      assert.equal(swept.path,false,'A moving spike may not sweep the permanent bypass');
      assert.equal(swept.flaskTier,0);
      if(row!==hazard.row||col!==hazard.col)assert.equal(swept.dead,true);
    }
  }
  for (const encounter of map.encounters) {
    const members = map.hazards.filter(h=>h.encounterId===encounter.id);
    const expected = encounter.kind==='center-four'?4:encounter.kind==='side-three'?3:encounter.kind==='horizontal-pair'?2:encounter.kind==='quiet-deposit'?0:1;
    assert.equal(members.length,expected);
    const next = map.encounters.find(item=>item.id>encounter.id&&item.kind!=='quiet-deposit');
    if(next&&encounter.kind!=='quiet-deposit')assert.ok(next.firstRow-encounter.lastRow>=5,'Separate dangers with recovery and steering space');
    if(encounter.kind==='center-four'&&encounter.variant!=='side-gates') {
      for(let row=encounter.row;row<=encounter.lastRow;row++) {
        for(const col of [0,1,4,5]) {
          assert.equal(map.cells[row][col].hazard,false,'The central square must leave both forks open');
          assert.equal(map.cells[row][col].dead,false);
        }
      }
    } else if(encounter.variant==='side-gates') {
      for(let row=encounter.firstRow;row<=encounter.lastRow;row++)for(const col of [2,3])assert.equal(map.cells[row][col].hazard,false);
    }
  }
  const zoneStats = [];
  let totalFlasks=0, empty=0;
  for(let zone=0;zone<3;zone++) {
    const stats={dense:0,hard:0,reinforced:0,heal:0,flasks:0,guides:0,weakGuides:0};
    for(let row=zone*35;row<(zone+1)*35;row++) {
      const start=map.pathStarts[row];
      assert.ok(start>=0&&start<=4);
      if(row)assert.ok(Math.abs(start-map.pathStarts[row-1])<=1,'The bypass must not jump across the shaft');
      for(const col of [start,start+1]) {
        assert.equal(map.cells[row][col].hazard,false);
        assert.equal(map.cells[row][col].dead,false);
        for(let near=Math.max(0,row-1);near<=Math.min(104,row+1);near++) {
          assert.equal(map.cells[near][col].hazard,false,'Keep body clearance when changing lane beside a spike');
          assert.equal(map.cells[near][col].dead,false,'Keep body clearance beside a moving corridor');
        }
      }
      if(row>0)assert.ok(Math.abs(map.guideCols[row]-map.guideCols[row-1])<=1,'Guide lanes must connect');
      for(const [col,cell] of map.cells[row].entries()) {
        assert.ok(['soft','dense','hard','reinforced','special'].includes(cell.tier));
        assert.ok(!['bomb','jelly','slime'].includes(cell.special));
        if(cell.dead){empty++;assert.ok(motionSpace.has(`${row}:${col}`));}
        if(cell.special==='gel')stats.heal++;
        if(!cell.dead&&!cell.hazard&&stats[cell.tier]!==undefined)stats[cell.tier]++;
        if(cell.guide&&!cell.special&&row!==0){stats.guides++;if(cell.tier==='dense')stats.weakGuides++;}
        if(cell.flaskTier) {
          assert.equal(cell.dead,false);assert.equal(cell.hazard,false);assert.equal(cell.special,null);
          assert.equal(cell.flaskTier,{dense:1,hard:2,reinforced:3}[cell.tier]);
          stats.flasks+=values[cell.tier];
        }
      }
    }
    assert.equal(stats.heal,1);
    assert.equal(map.hazards.filter(h=>map.encounters[h.encounterId].zone===zone).length,[12,10,12][zone]);
    assert.equal(map.encounters.filter(e=>e.zone===zone&&e.kind==='quiet-deposit').length,1);
    assert.equal(map.deposits.filter(d=>d.zone===zone&&d.guarded).length,2);
    assert.equal(map.deposits.filter(d=>d.zone===zone&&!d.guarded).length,1);
    const rocks=stats.dense+stats.hard+stats.reinforced;
    for(const tier of ['dense','hard','reinforced'])assert.ok(Math.abs(stats[tier]-rocks*proportions[zone][tier])<=1,`seed ${seed}, zone ${zone}: ${tier} quota`);
    assert.equal(stats.flasks,map.rewardBudgets[zone]);
    if(zone===0){assert.equal(stats.reinforced,0);assert.ok(stats.weakGuides>=25,'The entrance needs a mostly continuous fragile guide');}
    if(zone===1)assert.ok(stats.weakGuides>=12,'The middle needs fragile guiding streaks');
    totalFlasks+=stats.flasks;zoneStats.push(stats);
  }
  assert.ok(empty<=20,'Air is reserved for motion, not random caverns');
  assert.ok(totalFlasks>=150&&totalFlasks<=250,`seed ${seed}: ${totalFlasks} flasks`);
  assert.ok(zoneStats[0].flasks<zoneStats[1].flasks&&zoneStats[1].flasks<zoneStats[2].flasks);
  minFlasks=Math.min(minFlasks,totalFlasks);maxFlasks=Math.max(maxFlasks,totalFlasks);
  assert.ok(map.hardBand.to-map.hardBand.from+1>=3&&map.hardBand.to-map.hardBand.from+1<=4);
  for(let row=map.hardBand.from;row<=map.hardBand.to;row++)for(const cell of map.cells[row]) {
    assert.equal(cell.tier,'reinforced');assert.equal(cell.dead,false);assert.equal(cell.hazard,false);
  }
  for(const deposit of map.deposits) {
    assert.ok(deposit.cells.length>=4,`seed ${seed}: deposit ${deposit.id} is not a proper cluster`);
    const encounter=map.encounters[deposit.encounterId];
    assert.equal(encounter.zone,deposit.zone);
    if(deposit.guarded)assert.ok(map.hazards.some(h=>h.encounterId===deposit.guardId));
    else assert.equal(encounter.kind,'quiet-deposit');
    const locations=new Set(deposit.cells.map(c=>`${c.row}:${c.col}`));
    const visited=new Set(),queue=[deposit.cells[0]];
    for(let i=0;i<queue.length;i++) {
      const {row,col}=queue[i],key=`${row}:${col}`;
      if(visited.has(key))continue;visited.add(key);
      const cell=map.cells[row][col];
      assert.equal(cell.depositId,deposit.id);assert.ok(cell.flaskTier);
      assert.ok(row>=deposit.zone*35&&row<(deposit.zone+1)*35);
      for(const [y,x] of [[row-1,col],[row+1,col],[row,col-1],[row,col+1]])if(locations.has(`${y}:${x}`)&&!visited.has(`${y}:${x}`))queue.push({row:y,col:x});
    }
    assert.equal(visited.size,locations.size,'Currency deposits must grow as connected veins');
  }
}
assert.ok(patterns.size>=17,'The generator must use varied encounter geometry, not just reordered copies');
console.log(`World 1: 250 layouts pass ${patterns.size} encounter patterns, pressure budgets, quiet mines, steering routes, strata and connected deposits; ${minFlasks}–${maxFlasks} flasks per mine.`);
