const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),requests=[];
class Image {set src(value){this.value=value;requests.push(value);}get src(){return this.value;}}
const c={window:{},Image,URLSearchParams};
for(const file of ['js/config/image-paths.js','food-catalog.js','world-catalog.js','js/config/game-config.js','js/core/game-assets.js','js/core/boot-manifest.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),c);
for(let id=1;id<=4;id++){
  c.window.SlimeGameAssets.ensureWorldSprites(id);
  c.window.SlimeGameAssets.ensureWorldBackground(id);
}
const source=fs.readFileSync(path.join(root,'js/core/game-assets.js'),'utf8');
const vfxList=source.slice(source.indexOf('  const vfxNames ='),source.indexOf('  const vfxSprites ='));
const vfx={Set};vm.runInNewContext(vfxList+';this.names=[...vfxNames];',vfx);
for(const name of vfx.names)c.window.SlimeGameAssets.VFX_SPRITES[name];
for(const food of c.window.SlimeGameAssets.FOODS)requests.push(c.window.SlimeGameAssets.foodImageSource(food));
const files=new Set(c.window.SlimeBootManifest.assets.map(a=>a.url));
for(const request of requests)assert.ok(files.has(request.split('?')[0]),`Dynamic runtime request missing from manifest: ${request}`);
console.log(`Runtime closure: ${requests.length} dynamically constructed world, VFX and food requests are present`);
