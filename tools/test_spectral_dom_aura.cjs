const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/rendering/spectral-dom-aura.js','utf8');
const start=source.indexOf('  function geometry(entry)'),end=source.indexOf('  function wake()',start);
const env={Math,devicePixelRatio:2};vm.createContext(env);vm.runInContext(source.slice(start,end)+';this.geometry=geometry;',env);
for(const scale of [1,.85,1.3]){
  const fx={offsetWidth:88,offsetHeight:88,getBoundingClientRect:()=>({left:104,top:202,width:88*scale,height:88*scale})};
  const image={getBoundingClientRect:()=>({left:104+scale,top:202+scale,width:86*scale,height:86*scale})};
  const canvas={style:{},width:0,height:0};const entry={fx,image,canvas,dirty:true};env.geometry(entry);
  const left=Number(canvas.style.cssText.match(/left:([^p]+)px/)[1]),top=Number(canvas.style.cssText.match(/top:([^p]+)px/)[1]);
  assert.ok(Math.abs(left+entry.rect[0]-1)<1e-8,'aura image origin is relative to its own effect container');
  assert.ok(Math.abs(top+entry.rect[1]-1)<1e-8,'border and inset offsets are compensated');
  assert.ok(Math.abs(entry.rect[2]-86)<1e-8,'scaled modal preserves local emblem size');
  assert.equal(entry.dirty,false);
}
console.log('Spectral DOM aura: emblem origin, inset compensation and transformed layout passed');
