const fs=require('node:fs');
const dir='outputs/damage-crash-672';fs.mkdirSync(dir,{recursive:true});
const qa=fs.readFileSync('tools/test_psionic_damage_666.cjs','utf8');
const hook=qa.split('const hook=`')[1].split('`;')[0].replace('await SlimeDamageFeedback.preload();','')+`
window.__spikeHarness={async hit(){
 try{
  await __psiQA.setup(1,'fire');__psiQA.base=performance.now();
  const hit=__psiQA.hit();run.paused=false;run.lastTime=performance.now();run.nextFrameAt=0;
  run.animationId=requestAnimationFrame(gameFrame);
  document.getElementById('qaStatus').textContent='Удар выполнен: '+hit.health+' сердца';
 }catch(error){document.getElementById('qaStatus').textContent=error.stack;throw error;}
}};
`;
const source=fs.readFileSync('game.js','utf8').replace('  init().catch(error => {',()=>hook+'  init().catch(error => {');
fs.writeFileSync(dir+'/harness-game.js',source);
let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
html=html.replace(/src="game.js\?v=\d+"/,'src="outputs/damage-crash-672/harness-game.js?v=1"');
html=html.replace('</body>',`<aside style="position:fixed;z-index:999999;left:8px;top:8px;background:#fff;color:#123;padding:10px;max-width:450px">
<button id="qaSpike">Проверить удар о колючку</button><pre id="qaStatus">Ожидание</pre></aside>
<script>document.getElementById('qaSpike').onclick=()=>window.__spikeHarness.hit();window.addEventListener('error',event=>{document.getElementById('qaStatus').textContent=event.error?.stack||event.message;});</script></body>`);
fs.writeFileSync(dir+'/harness.html',html);
