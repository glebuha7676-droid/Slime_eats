const fs=require('node:fs');
const version=fs.readFileSync('index.html','utf8').match(/game\.js\?v=(\d+)/)[1];
require('./prepare_phantom_review.cjs');
const html=fs.readFileSync(`tmp/phantom-review-${version}.html`,'utf8')
  .replaceAll(`qa_phantom_${version}`,`qa_phantom_mixed_${version}`)
  .replace("unlockedMutations:['phantom','nano']","unlockedMutations:['phantom','nano','cosmos']")
  .replace('mutationLevels:{phantom:3,nano:3}','mutationLevels:{phantom:3,nano:3,cosmos:3}')
  .replace("activeMutationPool:['phantom']","activeMutationPool:['nano','phantom','cosmos']");
fs.writeFileSync(`tmp/phantom-mixed-${version}.html`,html);
const restricted=html.replace('<head>','<head><script>CanvasRenderingContext2D.prototype.getImageData=function(){throw new DOMException("Canvas pixel access denied", "SecurityError")};</script>')
  .replaceAll(`qa_phantom_mixed_${version}`,`qa_phantom_restricted_${version}`);
fs.writeFileSync(`tmp/phantom-restricted-${version}.html`,restricted);
const bundle=fs.readFileSync('dist/yandex/game-runtime.js','utf8');
const previous=bundle.match(/\(\(\) => \{\r?\n  'use strict';\r?\n  const cache=new WeakMap\(\),size=384,pad=64;[\s\S]*?window.SlimeSpectralGlow=Object.freeze\(\{draw,layers\}\);\r?\n\}\)\(\);/);
if(previous){
  fs.writeFileSync('tmp/old-spectral-glow.js',previous[0]);
  fs.writeFileSync('tmp/phantom-bug-before.html',restricted.replace(/js\/rendering\/spectral-glow.js\?v=\d+/,'tmp/old-spectral-glow.js').replaceAll(`qa_phantom_restricted_${version}`,`qa_phantom_before_${version}`));
}
console.log(`http://127.0.0.1:8765/tmp/phantom-mixed-${version}.html`);
