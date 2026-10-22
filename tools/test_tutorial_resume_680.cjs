const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{hook}=require('./test_tutorial_679.cjs');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[],records=[];
 p.on('pageerror',e=>errors.push(e.stack));const src=fs.readFileSync('game.js','utf8');
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:src.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=680');await p.waitForFunction(()=>window.SlimeGameDebug);
 const defaults={schemaVersion:29,unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],selectedMutation:'fire',researchUnits:0,sound:false,onboarding:{version:6,enabled:true,controlsLearned:true,fireLearned:true}};
 const check=async(name,patch,expected,fed=false)=>{const value={...defaults,...patch,onboarding:{...defaults.onboarding,...patch.onboarding}};await p.evaluate(({value,fed})=>__lesson679.setup(value,fed),{value,fed});await p.waitForTimeout(200);const s=await p.evaluate(()=>__lesson679.state());assert.equal(s.step,expected,name);if(s.target)assert(s.allowed,name);records.push({name,state:s});return s;};
 let s=await check('249 burns do not unlock evolution',{tutorialStep:'post-run',mutationMastery:{fire:249}},'feed');assert.equal(s.mastery,249);assert.equal(s.balance,0);
 await check('250 burns offer evolution',{tutorialStep:'post-run',mutationMastery:{fire:250}},'second-gift');
 s=await check('Gift credited once across reload',{tutorialStep:'second-gift-credit',mutationMastery:{fire:250},researchUnits:50,tutorialSecondGiftClaimed:true},'upgrade-home-mutations');assert.equal(s.balance,50);
 await check('Fed first run resumes at Play',{tutorialStep:'feed'},'play',true);
 await check('Fed second run resumes at Play',{tutorialStep:'second-feed',mutationLevels:{fire:2}},'second-play',true);
 s=await check('Partial Frost investment survives',{tutorialStep:'frost-reactor',mutationLevels:{fire:2},researchUnits:13,mutationProgress:12},'frost-reactor');assert.equal(s.balance,13);assert.equal(s.progress,12);
 for(const step of ['frost-wait','frost-core','frost-prize']){await check('Recover '+step,{tutorialStep:step,mutationLevels:{fire:2},mutationProgress:25},'frost-synthesize');assert(await p.locator('#mutationSynthesizeBtn').isEnabled());}
 await check('Old completed saves stay completed',{tutorialStep:'done',onboarding:{version:3,enabled:false}},'done');
 await check('Old 50-burn task migrates to 250',{tutorialStep:'upgrade-fire',onboarding:{version:4},mutationMastery:{fire:50}},'feed');
 s=await check('Earned stage II is preserved',{tutorialStep:'second-feed',onboarding:{version:4},mutationLevels:{fire:2},mutationMastery:{fire:50}},'second-feed');assert.equal(s.level,2);
 s=await check('Skip keeps resources',{tutorialStep:'feed',researchUnits:9},'feed');s=await p.evaluate(()=>__lesson679.skip());assert.equal(s.step,'done');assert.equal(s.balance,9);assert(s.unlocked.includes('frost'));
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/tutorial-679/resume-checks.json',JSON.stringify({records,errors},null,2));console.log('250-burn gate, once-only gift, food/reload, partial synthesis, old saves and skip passed.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
