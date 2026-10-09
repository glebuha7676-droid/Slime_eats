// Creates an isolated local browser fixture. It never reads or writes the player's save.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const version = '556';
let source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const qa = `
  let qaGlitchFrozen = false;
  function qaGlitchPrepare() {
    if (run?.animationId) cancelAnimationFrame(run.animationId);
    session.foods = FOODS.slice(0, 3);
    recalcStats();
    startDrop();
    cancelAnimationFrame(run.animationId);
    qaGlitchFrozen = true;
    run.categoryVisuals = {glitch:3};
    run.elementalAbilityType = 'glitch';
    run.glitchNextInfectionAt = run.glitchNextNeutralizeAt = Infinity;
    const origin = run.blockRowOrigin;
    run.slime.x = run.cellSize * 2.5;
    run.slime.y = origin + run.cellSize * 10.2;
    run.slime.vx = run.slime.vy = 0;
    run.cameraY = run.slime.y - 210;
    for (const block of run.blocks) {
      if (block.row >= 8 && block.row <= 11 && block.col >= 1 && block.col <= 3) block.dead = true;
      if (block.row >= 12 && block.row <= 17 && block.col === (block.row % 6)) {
        block.dead = false; block.hazard = block.unbreakable = true;
        block.hp = block.maxHp = Infinity; block.special = null;
        block.visualId = 'stone-hazard'; block.motion = null;
        block.flaskTier = block.flaskValue = 0;
      }
    }
    const richVein = run.blocks.find(b => b.row === 12 && b.col === 2);
    Object.assign(richVein, { dead:false, hazard:false, unbreakable:false, special:null, visualId:'', tier:'reinforced', hp:5, maxHp:5, flaskTier:3, flaskValue:5 });
    updateRunUI(); renderCanvas(performance.now());
    document.getElementById('qaGlitchStatus').textContent = 'Глитч III · тестовое поле · 3 сердца';
    run.animationId = requestAnimationFrame(gameFrame);
  }
  function qaGlitchStatus() {
    const marked = run.blocks.filter(b => !b.dead && b.glitchNeutralized).length;
    document.getElementById('qaGlitchStatus').textContent =
      'Отмечено: ' + marked + ' · Заражено: ' + run.glitchInfectedBlocks.size +
      ' · Разрушено: ' + run.blocksDestroyed + ' · Плазма: ' + run.researchData + ' · Сердца: ' + run.health +
      ' · Жила: +' + (run.blocks.find(b=>b.row===12&&b.col===2)?.flaskValue || 0) +
      ' · Прочность жилы: ' + run.blocks.find(b=>b.row===12&&b.col===2)?.hp;
  }
  const qaPanel = document.createElement('aside');
  qaPanel.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;max-width:96vw;padding:8px;border-radius:10px;background:#08232f;color:white;font:12px system-ui;box-shadow:0 2px 10px #0008';
  qaPanel.innerHTML = '<div id="qaGlitchStatus">Изолированная проверка глитча</div><button id="qaGlitchStart">Тестовое поле</button><button id="qaGlitchChoice">Выбор ульты</button><button id="qaGlitchMark">Галочка II</button><button id="qaGlitchTouch">Коснуться отметки</button><button id="qaGlitchVein">Разбить жилу</button>';
  document.body.appendChild(qaPanel);
  qaPanel.querySelector('#qaGlitchStart').onclick = qaGlitchPrepare;
  qaPanel.querySelector('#qaGlitchChoice').onclick = () => startGlitchChoice(performance.now());
  qaPanel.querySelector('#qaGlitchMark').onclick = () => {
    const b = run.blocks.find(b=>!b.dead&&b.hazard&&b.row>=12&&b.row<=16);
    markGlitchHazard(b,performance.now()); renderCanvas(performance.now()); qaGlitchStatus();
  };
  qaPanel.querySelector('#qaGlitchTouch').onclick = () => {
    const b = run.blocks.find(b=>!b.dead&&b.glitchNeutralized);
    if(b) transformGlitchHazard(b,null,performance.now()); qaGlitchStatus();
  };
  qaPanel.querySelector('#qaGlitchVein').onclick = () => {
    destroyBlock(run.blocks.find(b=>b.row===12&&b.col===2),'impact',performance.now()); qaGlitchStatus();
  };
`;
source = source.replace('  function gameFrame(timestamp) {', `  function gameFrame(timestamp) {
    if (qaGlitchFrozen && !run.glitchChoice) {
      updateGlitchEffects(timestamp); renderCanvas(timestamp); qaGlitchStatus();
      run.animationId = requestAnimationFrame(gameFrame); return;
    }`);
const split = qa.indexOf('  const qaPanel =');
source = source.replace('  let run = null;', qa.slice(0, split) + '\n  let run = null;');
source = source.replace('    window.SlimeGameDebug = {', qa.slice(split) + '\n    window.SlimeGameDebug = {');
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', `glitch-review-runtime-${version}.js`), source);
const seed = `<script>window.SlimeGameConfig=Object.freeze({...window.SlimeGameConfig,
SAVE_KEY:'qa_glitch_${version}',CLOUD_SAVE_KEY:'qa_glitch_${version}',LEGACY_SAVE_KEYS:[],DEFAULT_SAVE:{
...window.SlimeGameConfig.DEFAULT_SAVE,tutorialStep:'done',researchUnits:1000,
unlockedMutations:['glitch'],mutationLevels:{glitch:3},activeMutationPool:['glitch'],
onboarding:{version:2,enabled:false,firstRunFinished:true,secondRunFinished:true,abilityLearned:true}}});</script>`;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('<head>', '<head><base href="/">')
  .replace(/<script src="game.js\?v=[^"]+"><\/script>/, seed + `<script src="tmp/glitch-review-runtime-${version}.js"></script>`);
fs.writeFileSync(path.join(root, 'tmp', `glitch-review-${version}.html`), html);
console.log(`http://127.0.0.1:8765/tmp/glitch-review-${version}.html`);
