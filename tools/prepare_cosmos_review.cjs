// Isolated browser checks: a separate save and explicit test controls.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const version = fs.readFileSync(path.join(root,'index.html'),'utf8').match(/game\.js\?v=(\d+)/)[1];
let source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const qa = `
  let qaCosmosFrozen = false;
  let qaCosmosLastTime = 0;
  let qaCosmosHidden = false;
  let qaCosmosReturned = false;
  function qaCosmosPrepare(level) {
    if (run?.animationId) cancelAnimationFrame(run.animationId);
    session.foods = FOODS.filter(f=>foodRecipeFamily(f)==='cosmos').slice(0,level);
    recalcStats(); startDrop(); cancelAnimationFrame(run.animationId);
    qaCosmosFrozen = true; qaCosmosLastTime = 0;
    qaCosmosHidden = qaCosmosReturned = false;
    run.categoryVisuals = {cosmos:level};
    run.elementalAbilityType = level >= 3 ? 'cosmos' : '';
    run.slime.x = run.cellSize * 3;
    run.slime.y = run.blockRowOrigin + run.cellSize * 10.5;
    run.slime.vx = run.slime.vy = 0;
    run.cameraY = run.slime.y - 250;
    for (const block of run.blocks) {
      if (block.row >= 8 && block.row <= 12 && block.col >= 1 && block.col <= 4) block.dead = true;
    }
    // A regular block near the outer ring demonstrates a one-point contact.
    const target = run.blocks.find(b=>b.row===9&&b.col===4);
    Object.assign(target,{dead:false,hazard:false,unbreakable:false,special:null,visualId:'',hp:5,maxHp:5,tier:'reinforced',flaskTier:0,flaskValue:0,motion:null});
    updateRunUI(); renderCanvas(performance.now());
    run.animationId = requestAnimationFrame(gameFrame);
  }
  function qaCosmosStatus(timestamp) {
    const visible = cosmosOrbitsEnabled(timestamp);
    if (!visible && (run.ultimateIntro || run.cosmosUltimate || run.elementalAbilityActive)) qaCosmosHidden = true;
    if (visible && qaCosmosHidden) qaCosmosReturned = true;
    document.getElementById('qaCosmosStatus').textContent =
      'Планеты: '+(visible?(elementalLevel('cosmos')>=2?2:1):0)+
      ' · Разрушено: '+run.blocksDestroyed+' · Сердца: '+run.health+
      ' · Блок: '+run.blocks.find(b=>b.row===9&&b.col===4)?.hp+
      ' · Скрывались: '+qaCosmosHidden+' · Вернулись: '+qaCosmosReturned;
  }
  const qaPanel = document.createElement('aside');
  qaPanel.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;max-width:96vw;padding:8px;border-radius:10px;background:#08232f;color:white;font:12px system-ui';
  qaPanel.innerHTML = '<div id="qaCosmosStatus">Изолированная проверка космоса</div><button id="qaCosmosOne">Орбита I</button><button id="qaCosmosTwo">Орбиты II</button><button id="qaCosmosUltimate">Ульта</button><button id="qaCosmosHide">Скрыть проверку</button>';
  document.body.appendChild(qaPanel);
  qaPanel.querySelector('#qaCosmosHide').onclick=()=>qaPanel.style.opacity='0';
  qaPanel.querySelector('#qaCosmosOne').onclick = ()=>qaCosmosPrepare(1);
  qaPanel.querySelector('#qaCosmosTwo').onclick = ()=>qaCosmosPrepare(2);
  qaPanel.querySelector('#qaCosmosUltimate').onclick = ()=>{
    run.categoryVisuals = {cosmos:3}; run.elementalAbilityType='cosmos';
    run.elementalAbilityCharges = 1;
    activateElementalAbility(performance.now());
  };
`;
source = source.replace('  function gameFrame(timestamp) {', `  function gameFrame(timestamp) {
    if (qaCosmosFrozen && run && !run.ended && !run.paused) {
      qaCosmosStatus(timestamp);
      if (!run.ultimateIntro && !run.cosmosUltimate && !run.elementalAbilityActive) {
        const dt=qaCosmosLastTime?Math.min(.034,(timestamp-qaCosmosLastTime)/1000):.016;
        qaCosmosLastTime=timestamp;
        updateElementalEffects(timestamp); updateCosmosOrbits(dt,timestamp);
        updateParticles(dt); updateSpecialEffects(dt); renderCanvas(timestamp); updateRunUI();
        run.animationId=requestAnimationFrame(gameFrame); return;
      }
      qaCosmosLastTime=0;
    }`);
const split = qa.indexOf('  const qaPanel =');
source = source.replace('  let run = null;', qa.slice(0,split)+'\n  let run = null;');
source = source.replace('    window.SlimeGameDebug = {', qa.slice(split)+'\n    window.SlimeGameDebug = {');
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp',`cosmos-review-runtime-${version}.js`),source);
const seed = `<script>window.SlimeGameConfig=Object.freeze({...window.SlimeGameConfig,
SAVE_KEY:'qa_cosmos_${version}',CLOUD_SAVE_KEY:'qa_cosmos_${version}',LEGACY_SAVE_KEYS:[],DEFAULT_SAVE:{
...window.SlimeGameConfig.DEFAULT_SAVE,tutorialStep:'done',researchUnits:1000,
unlockedMutations:['cosmos'],mutationLevels:{cosmos:3},activeMutationPool:['cosmos'],
onboarding:{version:2,enabled:false,firstRunFinished:true,secondRunFinished:true,abilityLearned:true}}});</script>`;
const html = fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace('<head>','<head><base href="/">')
  .replace(/<script src="game.js\?v=[^"]+"><\/script>/,seed+`<script src="tmp/cosmos-review-runtime-${version}.js"></script>`);
fs.writeFileSync(path.join(root,'tmp',`cosmos-review-${version}.html`),html);
console.log(`http://127.0.0.1:8765/tmp/cosmos-review-${version}.html`);
