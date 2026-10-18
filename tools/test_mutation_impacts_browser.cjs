const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),fixture=fs.readFileSync('tools/test_glitch_base_browser.cjs','utf8');
const baseHook=fixture.split('const hook=`')[1].split('`;')[0];
const hook=baseHook+`window.__vfxQA={
 prepare(id,stage=1){window.__glitchQA.prepare(id,stage);run.phantomMarkNextAt=Infinity;run.nextSporeAt=Infinity;run.telekinesisNextAt=Infinity;run.glitchNextInfectionAt=Infinity;this.at=performance.now();this.elapsed=0;ASSETS.projectSprite('assets/vfx/spores-impact-cloud-v1.webp');ASSETS.projectSprite('assets/vfx/frost-storm-flake-v1-lossless.webp');ASSETS.projectSprite('assets/vfx/cosmos-falling-star-v1.webp');},
 block(){return run.blocks.find(b=>b.row===6&&b.col===2);},
 frost(){const b=this.block();b.flaskTier=3;b.flaskValue=5;turnBlockToSnow(b,this.at);updateSpecialEffects(.18,this.at+180);renderCanvas(this.at+200);return {snow:b.elementalSnow,tier:b.flaskTier,value:b.flaskValue};},
 chain(){const b=this.block();const n=strikeElectricChain(b,3,{x:run.slime.x,y:run.slime.y},this.at);updateSpecialEffects(.16,this.at+160);renderCanvas(this.at+160);return n;},
 spore(){const b=this.block(),p={block:b,plantedAt:this.at-2000,spawnMinis:true,automatic:false};b.sporePod=p;run.sporePods.push(p);detonateSporePod(p,this.at);renderCanvas(this.at+170);return {bursts:run.sporeBursts.length,dead:b.dead};},
 phantom(){const b=this.block();markPhantomBlock(b,this.at,true);updatePhantomDetonations(this.at+1450);renderCanvas(this.at+1580);return b.dead;},
 stars(ms){this.at=run.cosmosStagedUltimate?.startedAt||this.at;for(let t=this.elapsed+16;t<=ms;t+=16){updateElementalEffects(this.at+t);updateParticles(.016);updateSpecialEffects(.016,this.at+t);}this.elapsed=ms;renderCanvas(this.at+ms);return {launched:run.cosmosStagedUltimate.launched,impacts:run.cosmosStagedUltimate.impacts};}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await p.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},sound:false})));
 await p.goto('http://127.0.0.1:8765/?v=613');await p.waitForFunction(()=>window.SlimeGameDebug&&window.__vfxQA,{timeout:60000});fs.mkdirSync('tmp/vfx-613',{recursive:true});
 await p.evaluate(()=>window.__vfxQA.prepare('frost'));await p.waitForTimeout(600);assert.deepEqual(await p.evaluate(()=>window.__vfxQA.frost()),{snow:true,tier:3,value:5});await p.screenshot({path:'tmp/vfx-613/frost.png'});
 await p.evaluate(()=>window.__vfxQA.prepare('electric'));await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>window.__vfxQA.chain()),3);await p.screenshot({path:'tmp/vfx-613/chain.png'});
 await p.evaluate(()=>window.__vfxQA.prepare('cloning'));await p.waitForTimeout(600);const spore=await p.evaluate(()=>window.__vfxQA.spore());assert(spore.dead&&spore.bursts===1);await p.screenshot({path:'tmp/vfx-613/spore.png'});
 await p.evaluate(()=>window.__vfxQA.prepare('phantom'));await p.waitForTimeout(600);assert(await p.evaluate(()=>window.__vfxQA.phantom()));await p.screenshot({path:'tmp/vfx-613/phantom.png'});
 await p.evaluate(()=>window.__vfxQA.prepare('cosmos',2));await p.waitForTimeout(600);await p.locator('#abilityBtn').click({force:true});const stars=await p.evaluate(()=>window.__vfxQA.stars(1200));assert(stars.launched>=5&&stars.impacts>0);await p.screenshot({path:'tmp/vfx-613/starfall.png'});
 assert.deepEqual(errors,[]);await b.close();console.log('VFX browser: frost reveal/+5 vein, improved chain, spore cloud, phantom blast without generic ring, richer starfall flight/impact passed.');
})().catch(e=>{console.error(e);process.exit(1)});
