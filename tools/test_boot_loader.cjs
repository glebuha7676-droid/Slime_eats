const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const loader = fs.readFileSync(path.join(root, 'js/core/boot-loader.js'), 'utf8');
async function scenario(broken = false) {
  let active = 0, peak = 0, downloads = 0, announced = 0, decoded = 0;
  const elements = new Map();
  for (const id of ['bootScreen','bootFill','bootPercent','bootStatus','bootRetry']) elements.set(id,{style:{},dataset:{},textContent:'',hidden:false,setAttribute(){},addEventListener(){}});
  const image = {complete:true,naturalWidth:512,getAttribute:()=> 'assets/food.webp',decode:async()=>{decoded++;}};
  const context = {console:{error(){}},setTimeout,clearTimeout,AbortController,
    performance:{now:()=>10},location:{protocol:'https:',reload(){}},
    document:{images:[image],getElementById:id=>elements.get(id),documentElement:{dataset:{},classList:{add(){},remove(){}}}},
    requestAnimationFrame:callback=>setImmediate(callback),
    fetch:async(_url,options)=> {
      assert.equal(options.cache,'default'); downloads++; active++; peak=Math.max(peak,active);
      await new Promise(resolve=>setImmediate(resolve)); active--;
      return {ok:!broken,status:broken?404:200,body:null,arrayBuffer:async()=>new ArrayBuffer(10)};
    },
    window:{SlimeBootManifest:{revision:'test',assets:Array.from({length:9},(_,i)=>({url:`assets/${i}.webp`,bytes:10}))},addEventListener(){},SlimeAvatarRenderer:{whenReady:async()=>{decoded++;}},MenuPetpet:{whenReady:async()=>{decoded++;}}}
  };
  vm.runInNewContext(loader, context);
  if (broken) {
    await assert.rejects(context.window.SlimeBootLoader.finish({ready:()=>announced++}));
    assert.equal(announced,0,'Never report SDK ready after a resource failure');
    assert.equal(elements.get('bootScreen').hidden,false);
    assert.equal(elements.get('bootRetry').hidden,false);
    assert.equal(elements.get('bootScreen').dataset.state,'error');
  } else {
    assert.equal(announced,0);
    await context.window.SlimeBootLoader.finish({ready:()=> { assert.equal(decoded,3); announced++; }});
    assert.equal(peak,4,'Network warm-up is bounded');
    assert.equal(downloads,9);
    assert.equal(elements.get('bootPercent').textContent,'100%');
    assert.equal(elements.get('bootScreen').hidden,true);
    await context.window.SlimeBootLoader.finish({ready:()=>announced++});
    assert.equal(announced,1,'Finishing startup is idempotent');
  }
}
async function platformScenario() {
  let ready=0,start=0,stop=0;
  const callbacks={};
  const context={setTimeout,clearTimeout,document:{documentElement:{dataset:{}}},window:{
    location:{hostname:'localhost'},localStorage:{},
    YaGames:{init:async()=>({environment:{i18n:{lang:'ru'}},getStorage:async()=>({}),getPlayer:async options=>{assert.equal(options.scopes,false);return null;},
      features:{LoadingAPI:{ready:()=>ready++},GameplayAPI:{start:()=>start++,stop:()=>stop++}},on:(name,callback)=>callbacks[name]=callback})}
  }};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/platform/yandex-platform.js'),'utf8'),context);
  const platform=await context.window.SlimeYandexReady;
  platform.ready();platform.ready();platform.gameplay.start();platform.gameplay.start();platform.gameplay.stop();platform.gameplay.stop();
  assert.deepEqual([ready,start,stop],[1,1,1]);
  assert.equal(context.document.documentElement.dataset.platformLanguage,'ru');
  let paused=false;
  platform.subscribe({onPause:()=>paused=true,onResume:()=>paused=false});
  callbacks.game_api_pause();assert.equal(paused,true);callbacks.game_api_resume();assert.equal(paused,false);
}
(async()=>{await scenario();await scenario(true);await platformScenario();console.log('Boot: bounded downloads, decode before ready, retry on failure, SDK readiness, language and lifecycle passed');})().catch(error=>{console.error(error);process.exitCode=1;});
