/* Keep the ordinary mine and its fragile route; author only the lesson objects. */
(() => {
  'use strict';
  const ROWS=Object.freeze({1:74,2:74});
  const HAZARD=Object.freeze({row:16,col:3});
  const HEAL=Object.freeze({row:34,col:3});
  const VEIN=Object.freeze({row:50,col:3});
  function build({phase,normal,columns=6}){
    if(!ROWS[phase]||columns!==6||!normal?.cells)throw new Error('Tutorial needs the ordinary six-column mine');
    const rows=ROWS[phase],guideCols=normal.guideCols.slice(0,rows),pathStarts=normal.pathStarts.slice(0,rows);
    const cells=normal.cells.slice(0,rows).map(row=>row.map(c=>({...c,motion:c.motion?{...c.motion}:null})));
    const rock=(row,col,tier)=>{
      const source=cells[row][col];
      const ordinaryTier=['soft','dense','hard','reinforced'].includes(source.tier)?source.tier:'dense';
      cells[row][col]={...source,tier:tier||ordinaryTier,dead:false,hazard:false,special:null,motion:null,flaskTier:0,depositId:-1};
    };
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const c=cells[row][col];
      if(c.hazard||c.special||c.motion)rock(row,col);
      cells[row][col].flaskTier=0;
    }
    // Removed moving encounters leave air channels; refill only those channels,
    // retaining the ordinary generator's guiding seam and surrounding rock tiers.
    for(let row=1;row<rows;row++)for(let col=0;col<columns;col++)if(cells[row][col].dead){
      const neighbor=normal.cells[row].find(c=>!c.dead&&!c.hazard&&!c.special&&['dense','hard','reinforced'].includes(c.tier));
      rock(row,col,cells[row][col].path||col===guideCols[row]?'dense':neighbor?.tier||'hard');
    }
    for(let row=1;row<rows;row++){
      // No strength upgrades on the continuous fragile route.
      if(!cells[row][guideCols[row]].hazard)rock(row,guideCols[row],'dense');
    }
    let firstHazard=null,heal=null,firstVein=null;
    if(phase===2){
      firstHazard={row:HAZARD.row,col:guideCols[HAZARD.row]};
      const {row,col}=firstHazard;
      cells[row][col]={...cells[row][col],tier:'dense',dead:false,hazard:true,path:false};
      // The other lane remains a connected fragile bypass.
      const other=pathStarts[row]===col?col+1:pathStarts[row];
      for(let y=row-1;y<=row+1;y++)rock(y,other,'dense');
      heal={row:HEAL.row,col:guideCols[HEAL.row]};
      rock(heal.row,heal.col,'special');cells[heal.row][heal.col].special='gel';
      // Four separated seams: 60 flasks along the guiding route, 20 beside it.
      // The target is 50, with enough spare resources for a missed branch.
      for(const [row,tier]of [[50,'reinforced'],[51,'hard'],[52,'reinforced'],[53,'reinforced'],[57,'reinforced'],[58,'hard'],[59,'reinforced'],[60,'hard'],[64,'reinforced'],[65,'hard'],[66,'reinforced'],[69,'reinforced'],[70,'hard'],[71,'reinforced']]){
        const col=guideCols[row];rock(row,col,tier);cells[row][col].flaskTier=tier==='reinforced'?3:2;
        if(!firstVein)firstVein={row,col};
      }
      for(const row of [51,58,65,70]){
        const tier='reinforced';
        const col=guideCols[row]>2?guideCols[row]-1:guideCols[row]+1;
        rock(row,col,tier);cells[row][col].flaskTier=3;
      }
    }
    return {rows,cells,guideCols,pathStarts,firstHazard,heal,firstVein,firstVeinRow:firstVein?.row??null};
  }
  const api=Object.freeze({ROWS,HAZARD,HEAL,VEIN,build});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.SlimeTutorialDescent=api;
})();
