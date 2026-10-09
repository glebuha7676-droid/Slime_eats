const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),version='566';
let source=fs.readFileSync(path.join(root,'game.js'),'utf8');
const qa=`
  let qaPhantomFrozen=false,qaPhantomStillAt=0;
  function qaPhantomPrepare(level=2){
    if(run?.animationId)cancelAnimationFrame(run.animationId);
    session.foods=FOODS.filter(f=>foodRecipeFamily(f)==='phantom').slice(0,level);
    recalcStats();startDrop();cancelAnimationFrame(run.animationId);
    qaPhantomFrozen=true;qaPhantomStillAt=0;
    run.categoryVisuals={phantom:level};
    run.slime.x=run.gridOffsetX+run.cellSize*3;run.slime.y=run.blockRowOrigin+run.cellSize*10.5;
    run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-210;
    run.phantomMarkNextAt=performance.now()+5000;run.phantomPortalNextAt=performance.now()+10000;
    for(const b of run.blocks){
      if(b.row>=8&&b.row<=11&&b.col>=1&&b.col<=4)b.dead=true;
      if(b.row>=12&&b.row<=23){b.dead=false;b.hazard=b.unbreakable=false;b.special=null;b.motion=null;b.visualId='';b.hp=b.maxHp=3;b.tier='reinforced';b.flaskTier=b.flaskValue=0;}
    }
    const rich=run.blocks.find(b=>b.row===15&&b.col===2);rich.flaskTier=3;rich.flaskValue=5;
    const spike=run.blocks.find(b=>b.row===17&&b.col===3);spike.hazard=spike.unbreakable=true;spike.hp=Infinity;spike.flaskTier=0;
    renderCanvas(performance.now());updateRunUI();run.animationId=requestAnimationFrame(gameFrame);
  }
  function qaPhantomMark(){qaPhantomPrepare(1);const now=performance.now();run.phantomMarkNextAt=now;updatePhantomCompanions(now);updatePhantomCompanions(now+650);qaPhantomStillAt=now+850;}
  function qaPhantomPortal(){qaPhantomPrepare(2);const now=performance.now();run.phantomPortalNextAt=now;updatePhantomCompanions(now);const arrival=now+(run.phantomFlights[1]?.duration||3000)/2+1;updatePhantomCompanions(arrival);updateParticles(.8);qaPhantomStillAt=arrival+600;}
  function qaPhantomEnter(){if(!run.phantomPortals.length)return;const p=run.phantomPortals[0],now=performance.now();p.expiresAt=now+7000;run.slime.x=p.x;run.slime.y=p.y;updatePhantomCycle(now);qaPhantomStillAt=now+1200;}
  function qaPhantomTrain(still=false,stillAge=1400){qaPhantomPrepare(3);const now=performance.now();commitElementalAbility('phantom',now,run.slime.x,run.slime.y);if(still){for(let age=16;age<=stillAge;age+=16){updatePhantomCompanions(now+age);updateParticles(.016);}qaPhantomStillAt=now+stillAge;}}
  function qaPhantomBurst(){qaPhantomPrepare(2);const now=performance.now();materializePhantom(now);qaPhantomStillAt=now+150;}
  function qaPhantomStatus(){document.getElementById('qaPhantomStatus').textContent='Метки: '+run.phantomMarkedBlocks.size+' · Порталы: '+run.phantomPortals.filter(p=>!p.used).length+' · '+(phantomActive(qaPhantomStillAt||performance.now())?'Мир духов':'Порода')+' · Сломано: '+run.blocksDestroyed+' · Плазма: '+run.researchData;}
  const panel=document.createElement('aside');panel.style.cssText='position:fixed;left:8px;bottom:8px;z-index:9999;max-width:96vw;padding:8px;border-radius:10px;background:#08232f;color:white;font:12px system-ui';
  panel.innerHTML='<div id="qaPhantomStatus">Изолированная проверка фантома</div><button id="qaMark">Трещины</button><button id="qaPortal">Портал</button><button id="qaEnter">Войти</button><button id="qaTrain">Экспресс</button><button id="qaTrainStill">Поезд (кадр)</button><button id="qaTrainStart">Выезд (кадр)</button><button id="qaLive">Играть III</button><button id="qaHide">Скрыть проверку</button>';
  document.body.appendChild(panel);
  const burstButton=document.createElement('button');burstButton.textContent='Всплеск';burstButton.onclick=qaPhantomBurst;panel.appendChild(burstButton);
  panel.querySelector('#qaMark').onclick=qaPhantomMark;
  panel.querySelector('#qaPortal').onclick=qaPhantomPortal;
  panel.querySelector('#qaEnter').onclick=qaPhantomEnter;
  panel.querySelector('#qaTrain').onclick=()=>qaPhantomTrain();
  panel.querySelector('#qaTrainStill').onclick=()=>qaPhantomTrain(true);
  panel.querySelector('#qaTrainStart').onclick=()=>qaPhantomTrain(true,760);
  panel.querySelector('#qaLive').onclick=()=>{qaPhantomPrepare(3);qaPhantomFrozen=false;run.elementalAbilityType='phantom';run.elementalAbilityCharges=1;run.launchEntryUntil=0;run.lastTime=performance.now();};
  panel.querySelector('#qaHide').onclick=()=>panel.style.visibility='hidden';
`;
source=source.replace('  function gameFrame(timestamp) {',`  function gameFrame(timestamp){
    if(qaPhantomFrozen&&run&&!run.ended&&!run.paused){
      const time=qaPhantomStillAt||timestamp;
      if(!qaPhantomStillAt){updatePhantomCompanions(timestamp);updatePhantomCycle(timestamp);updateParticles(.016);}
      renderCanvas(time);qaPhantomStatus();updateRunUI();
      run.animationId=requestAnimationFrame(gameFrame);return;
    }`);
const split=qa.indexOf('  const panel=');source=source.replace('  let run = null;',qa.slice(0,split)+'\n  let run = null;');
source=source.replace('    window.SlimeGameDebug = {',qa.slice(split)+'\n    window.SlimeGameDebug = {');
fs.writeFileSync(path.join(root,'tmp',`phantom-review-runtime-${version}.js`),source);
const seed=`<script>window.SlimeGameConfig=Object.freeze({...window.SlimeGameConfig,SAVE_KEY:'qa_phantom_${version}',CLOUD_SAVE_KEY:'qa_phantom_${version}',LEGACY_SAVE_KEYS:[],DEFAULT_SAVE:{...window.SlimeGameConfig.DEFAULT_SAVE,tutorialStep:'done',researchUnits:1000,unlockedMutations:['phantom','nano'],mutationLevels:{phantom:3,nano:3},discoveredForms:['phantom','nano'],activeMutationPool:['phantom'],onboarding:{version:2,enabled:false,firstRunFinished:true,secondRunFinished:true,abilityLearned:true}}});</script>`;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">').replace(/<script src="game.js\?v=[^"]+"><\/script>/,seed+`<script src="tmp/phantom-review-runtime-${version}.js"></script>`);
fs.writeFileSync(path.join(root,'tmp',`phantom-review-${version}.html`),html);
console.log(`http://127.0.0.1:8765/tmp/phantom-review-${version}.html`);
