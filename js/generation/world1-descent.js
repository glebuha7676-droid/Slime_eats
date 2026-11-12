/* Shared natural terrain. Encounters are budgeted and overlaid after rock generation. */
(() => {
  'use strict';
  const ROWS=105,ZONE_ROWS=35;
  const SECTION_ENDS=Object.freeze([.20,.70,1]);
  const ROCK_WEIGHTS=Object.freeze([
    {dense:55,hard:45,reinforced:0},
    {dense:30,hard:52,reinforced:18},
    {dense:30,hard:28,reinforced:42}
  ]);
  const values={dense:1,hard:3,reinforced:5};
  const shuffle=(list,random)=>{
    for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
    return list;
  };
  function hazardTypes(stage,random,worldId=1){
    const counts=stage<=1?[10,0,0]:stage===2?[4,6,0]:stage===3?[3,3,4]:[4,3,3];
    const ordinary=shuffle([...Array(counts[0]).fill('static'),...Array(counts[1]).fill('patrol')],random);
    const home=kind=>worldId===1?{static:'static',patrol:'chaser',chaser:'bramble'}[kind]:kind;
    if(!counts[2])return ordinary.map(home);
    const arrangements=[];
    for(let mask=0;mask<1024;mask++)if(!(mask&(mask<<1))&&mask.toString(2).replace(/0/g,'').length===counts[2])arrangements.push(mask);
    const mask=arrangements[Math.floor(random()*arrangements.length)];
    let at=0;
    return Array.from({length:10},(_,i)=>home(mask&(1<<i)?'chaser':ordinary[at++]));
  }
  function placeBramble(cells,row,side,id,columns,random){
    const mirror=side!==0,col=mirror?columns-1-Math.floor(columns*.5833):Math.floor(columns*.5833);
    // Keep the original rock and its material. The knot is behind one complete armoured row.
    for(let dy=0;dy<3;dy++)for(let x=0;x<columns;x++){
      const b=cells[row+dy][x];
      Object.assign(b,{dead:false,hazard:false,special:null,motion:null,chase:false,flaskTier:0,encounterId:id,
        bramble:{groupId:id,core:dy===1&&x===col,localCol:x,localRow:dy,columns,mirror}});
    }
    return {row:row+1,col,firstRow:row,lastRow:row+2};
  }
  function overlayHazards(cells,guideCols,stage,columns,random,worldId){
    const types=worldId===6?[]:hazardTypes(stage,random,worldId),hazards=[],encounters=[];
    let laserIndex=0;
    for(let i=0;i<types.length;i++){
      const kind=worldId===3?{static:'mine',patrol:'turret',chaser:'slowCore'}[types[i]]:worldId===4?{static:'frostSpike',patrol:'iceMortar',chaser:'iceBlock'}[types[i]]:worldId===5?{static:'spore',patrol:'fungusTurret',chaser:'toadstool'}[types[i]]:types[i],row=8+i*9+Math.floor(random()*2),side=i%2?columns-1:0;
      let col=i%3===2?Math.max(1,Math.min(columns-2,guideCols[row]+(side===0?1:-1))):side;
      if(kind==='laser')col=laserIndex++%2?Math.floor(columns/2):side;
      if(kind==='slowCore')col=Math.floor((columns-1)/2);
      if(kind==='turret')col=Math.floor(random()*columns);
      if(kind==='vortex')col=2+Math.floor(random()*2);
      if(kind==='tentacle')col=side;
      if(kind==='toadstool')col=Math.floor(columns/2)-1;
      if(kind==='bramble'){
        const patch=placeBramble(cells,row,side,i,columns,random);
        hazards.push({row:patch.row,col:patch.col,kind,encounterId:i});
        encounters.push({id:i,...patch,zone:Math.min(2,Math.floor(row/ZONE_ROWS)),kind});
        continue;
      }
      const double=kind==='laser'&&col>0&&col<columns-1;
      const cell=cells[row][col],id=i;
      const tech=['turret','mine','laser','slowCore'].includes(kind);
      const ice=['frostSpike','iceMortar','iceBlock'].includes(kind);
      const fungi=['spore','fungusTurret','toadstool'].includes(kind);
      // The centred source occupies two half-cells; retain the surrounding rock.
      if(kind==='toadstool')Object.assign(cells[row][col+1],{dead:true,flaskTier:0});
      if(kind==='slowCore'&&columns%2===0)Object.assign(cells[row][col+1],{dead:true,flaskTier:0});
      if(kind==='laser')for(const b of cells[row])b.dead=true;
      if(kind==='vortex'||kind==='tentacle')for(let y=row-1;y<=row+1;y++)for(let x=Math.max(0,col-1);x<=Math.min(columns-1,col+1);x++)cells[y][x].dead=true;
      if(kind==='tentacle')for(let y=row;y<=row+2;y++)for(let x=side===0?0:columns-3;x<(side===0?3:columns);x++)cells[y][x].dead=true;
      const motion=kind==='patrol'?{axis:'x',from:Math.max(0,col-1),to:Math.min(columns-1,col+1),period:5600+random()*1400,phase:random()*Math.PI*2}:null;
      if(motion)for(let x=motion.from;x<=motion.to;x++)Object.assign(cells[row][x],{dead:true,flaskTier:0});
      Object.assign(cell,{hazard:kind!=='iceBlock',hazardKind:kind,ice:ice?{kind}:null,fungi:fungi?{kind}:null,tech:tech?{kind,double,direction:col===columns-1?-1:1}:null,water:['vortex','tentacle','seaMine'].includes(kind)?{kind,side:col===columns-1?-1:1}:null,dead:false,motion,chase:kind==='chaser',flaskTier:0,encounterId:id});
      hazards.push({row,col,kind,encounterId:id});
      encounters.push({id,row,firstRow:row,lastRow:row,zone:Math.min(2,Math.floor(row/ZONE_ROWS)),kind});
    }
    return {hazards,encounters};
  }
  function placeVeins(cells,guideCols,random){
    const budgets=[];
    for(let zone=0;zone<3;zone++){
      const target=[57,80,103][zone]+Math.floor(random()*11),first=zone*ZONE_ROWS,end=first+ZONE_ROWS;
      let total=0;
      const candidates=[];
      for(let row=first+2;row<end-1;row++)for(let col=0;col<cells[row].length;col++){
        const b=cells[row][col];
        if(!b.dead&&!b.hazard&&!b.bramble&&!b.ice&&!b.fungi)candidates.push({row,col,rank:random()+Math.abs(col-guideCols[row])*.08});
      }
      candidates.sort((a,b)=>a.rank-b.rank);
      while(total<target){
        const fits=spot=>!cells[spot.row][spot.col].flaskTier&&values[cells[spot.row][spot.col].tier]<=target-total;
        let at=candidates.findIndex(spot=>fits(spot)&&[[spot.row-1,spot.col],[spot.row+1,spot.col],[spot.row,spot.col-1],[spot.row,spot.col+1]].some(([y,x])=>cells[y]?.[x]?.flaskTier));
        if(at<0)at=candidates.findIndex(fits);
        if(at<0)break;
        const {row,col}=candidates.splice(at,1)[0],b=cells[row][col];
        b.flaskTier=b.tier==='reinforced'?3:b.tier==='hard'?2:1;
        total+=values[b.tier];
      }
      budgets.push(total);
    }
    return budgets;
  }
  function build({columns=6,random=Math.random,stage=1,worldId=1}={}){
    if(!Number.isInteger(columns)||columns<6)throw new Error('Descent needs at least six columns');
    const cells=Array.from({length:ROWS},(_,row)=>Array.from({length:columns},(_,col)=>({
      row,col,tier:null,dead:false,path:false,guide:false,branch:false,hazard:false,special:null,flaskTier:0,motion:null,depositId:-1
    })));
    const terrain=typeof module!=='undefined'&&module.exports?require('./biome-terrain.js'):window.SlimeBiomeTerrain;
    const plan=terrain.apply(cells.flat(),{columns,rows:ROWS,random});
    const {hazards,encounters}=overlayHazards(cells,plan.guideCols,stage,columns,random,worldId);
    const rewardBudgets=placeVeins(cells,plan.guideCols,random);
    return {rows:ROWS,zoneRows:ZONE_ROWS,cells,...plan,hazards,encounters,deposits:[],rewardBudgets,stage};
  }
  const api=Object.freeze({ROWS,ZONE_ROWS,SECTION_ENDS,ROCK_WEIGHTS,hazardTypes,build});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.SlimeWorld1Descent=api;
})();
