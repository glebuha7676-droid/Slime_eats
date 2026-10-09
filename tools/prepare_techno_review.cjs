const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),version='561';
let source=fs.readFileSync(path.join(root,'game.js'),'utf8');
const qa=`
  let qaTechnoFrozen=false,qaTechnoStillAt=0,qaTechnoLast=0;
  function qaTechnoPrepare(level=2){
    if(run?.animationId)cancelAnimationFrame(run.animationId);
    session.foods=FOODS.filter(f=>foodRecipeFamily(f)==='nano').slice(0,level);
    recalcStats();startDrop();cancelAnimationFrame(run.animationId);
    qaTechnoFrozen=true;qaTechnoStillAt=qaTechnoLast=0;
    run.categoryVisuals={nano:level};run.nanoNextShotAt=[Infinity];run.nanoNextMineAt=Infinity;
    run.slime.x=run.cellSize*3;run.slime.y=run.blockRowOrigin+run.cellSize*10.5;
    run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-210;
    for(const b of run.blocks){
      if(b.row>=8&&b.row<=12&&b.col>=1&&b.col<=4)b.dead=true;
      if(b.row>=13&&b.row<=16){b.dead=false;b.hazard=b.unbreakable=false;b.special=null;b.motion=null;b.visualId='';b.hp=b.maxHp=5;b.tier='reinforced';b.flaskTier=b.flaskValue=0;}
    }
    const target=run.blocks.find(b=>b.row===13&&b.col===2);target.flaskTier=3;target.flaskValue=5;
    renderCanvas(performance.now());updateRunUI();run.animationId=requestAnimationFrame(gameFrame);
  }
  function qaTechnoShot(still=false){
    qaTechnoPrepare(1);const now=performance.now(),target=run.blocks.find(b=>b.row===13&&b.col===2);
    const origin=nanoDronePosition(0,now),center=blockCenter(target);
    target.nanoLaserStartedAt=now;target.nanoLaserUntil=now+135;
    run.nanoShots.push({target,fromX:origin.x,fromY:origin.y+11,toX:center.x,toY:center.y,startedAt:now,hit:false});
    if(still){updateNanoDrones(now+135);qaTechnoStillAt=now+210;}
  }
  function qaTechnoSalvo(still=false){
    qaTechnoPrepare(2);const now=performance.now();queueNanoMines(now);
    if(still){updateNanoMines(now+420);updateNanoMines(now+720);qaTechnoStillAt=now+850;}
  }
  function qaTechnoBlasters(tint=false){
    qaTechnoPrepare(3);const now=performance.now();
    commitElementalAbility('nano',now,run.slime.x,run.slime.y);
    run.mechSuit.phase='active';run.mechSuit.nextShotAt=now;
    updateNanoDrones(now);
    if(tint)qaTechnoStillAt=now+65;
    else{updateNanoDrones(now+90);qaTechnoStillAt=now+190;}
  }
  function qaTechnoStatus(){
    document.getElementById('qaTechnoStatus').textContent='Мины: '+run.nanoMines.length+
      ' · Разрушено: '+run.blocksDestroyed+' · Плазма: '+run.researchData+
      ' · Луч: '+(run.blocks.find(b=>b.row===13&&b.col===2)?.dead?'разрушил блок':'цель цела');
  }
  const panel=document.createElement('aside');panel.style.cssText='position:fixed;left:8px;bottom:8px;z-index:9999;max-width:96vw;padding:8px;border-radius:10px;background:#08232f;color:white;font:12px system-ui';
  panel.innerHTML='<div id="qaTechnoStatus">Изолированная проверка техно</div><button id="qaTechnoLaser">Луч</button><button id="qaTechnoSalvo">Залп</button><button id="qaTechnoLaserStill">Распад (кадр)</button><button id="qaTechnoMinesStill">Мины (кадр)</button><button id="qaMechTint">Бластеры (луч)</button><button id="qaMechBreak">Бластеры (распад)</button>';
  document.body.appendChild(panel);
  panel.querySelector('#qaTechnoLaser').onclick=()=>qaTechnoShot();
  panel.querySelector('#qaTechnoSalvo').onclick=()=>qaTechnoSalvo();
  panel.querySelector('#qaTechnoLaserStill').onclick=()=>qaTechnoShot(true);
  panel.querySelector('#qaTechnoMinesStill').onclick=()=>qaTechnoSalvo(true);
  panel.querySelector('#qaMechTint').onclick=()=>qaTechnoBlasters(true);
  panel.querySelector('#qaMechBreak').onclick=()=>qaTechnoBlasters(false);
`;
source=source.replace('  function gameFrame(timestamp) {',`  function gameFrame(timestamp){
    if(qaTechnoFrozen&&run&&!run.ended&&!run.paused){
      if(qaTechnoStillAt){renderCanvas(qaTechnoStillAt);qaTechnoStatus();updateRunUI();}
      else {const dt=qaTechnoLast?Math.min(.034,(timestamp-qaTechnoLast)/1000):.016;qaTechnoLast=timestamp;
        updateNanoDrones(timestamp);updateParticles(dt);updateSpecialEffects(dt);renderCanvas(timestamp);qaTechnoStatus();updateRunUI();}
      run.animationId=requestAnimationFrame(gameFrame);return;
    }`);
const split=qa.indexOf('  const panel=');source=source.replace('  let run = null;',qa.slice(0,split)+'\n  let run = null;');
source=source.replace('    window.SlimeGameDebug = {',qa.slice(split)+'\n    window.SlimeGameDebug = {');
fs.writeFileSync(path.join(root,'tmp',`techno-review-runtime-${version}.js`),source);
const seed=`<script>window.SlimeGameConfig=Object.freeze({...window.SlimeGameConfig,SAVE_KEY:'qa_techno_${version}',CLOUD_SAVE_KEY:'qa_techno_${version}',LEGACY_SAVE_KEYS:[],DEFAULT_SAVE:{...window.SlimeGameConfig.DEFAULT_SAVE,tutorialStep:'done',researchUnits:1000,unlockedMutations:['nano'],mutationLevels:{nano:3},activeMutationPool:['nano'],onboarding:{version:2,enabled:false,firstRunFinished:true,secondRunFinished:true,abilityLearned:true}}});</script>`;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">').replace(/<script src="game.js\?v=[^"]+"><\/script>/,seed+`<script src="tmp/techno-review-runtime-${version}.js"></script>`);
fs.writeFileSync(path.join(root,'tmp',`techno-review-${version}.html`),html);
console.log(`http://127.0.0.1:8765/tmp/techno-review-${version}.html`);
