const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let allocations=0;
function context(owner={}){
  return {globalAlpha:1,log:[],save(){},restore(){},translate(){},rotate(){},
    beginPath(){},arc(){},ellipse(){},moveTo(){},rect(){},clip(){},lineTo(){},stroke(){},fill(){},fillRect(){},
    quadraticCurveTo(){if(owner.width===48)owner.kind='star';},
    createRadialGradient(){return {addColorStop(){}};},
    drawImage(image,...rect){this.log.push({image,rect,alpha:this.globalAlpha});}
  };
}
const env={Math,window:{},Image:function(){throw new Error('Planets must not load an orbit texture');},
  document:{createElement(){allocations++;const c={};c.getContext=()=>context(c);return c;}}};
vm.createContext(env);vm.runInContext(fs.readFileSync('js/rendering/cosmos-orbits.js','utf8'),env);
const model=env.window.SlimeCosmosOrbits;
const state={x:180,y:240,radius:20,cellSize:50,level:2,clock:1300,alpha:1};
let ctx=context();model.draw(ctx,state,false);model.draw(ctx,state,true);
const warm=allocations;
let oldAlpha=null,changed=false;
for(let clock=1400;clock<=8000;clock+=113){
  ctx=context();model.draw(ctx,{...state,clock},false);model.draw(ctx,{...state,clock},true);
  for(const {image,rect,alpha}of ctx.log.filter(e=>e.image.kind==='star')){
    const [x,y,w,h]=rect,distance=Math.hypot(x+w/2-state.x,y+h/2-state.y);
    assert.ok(distance>=state.radius&&distance<state.radius*1.3,'twinkles frame the slime, not the distant planet paths');
    assert.ok(alpha>0&&alpha<=1,'twinkles fade with bounded alpha');
    if(oldAlpha!==null&&Math.abs(alpha-oldAlpha)>.01)changed=true;
    oldAlpha=alpha;
  }
}
assert.ok(changed,'stars softly twinkle');
assert.equal(allocations,warm,'star and planet textures are cached, not allocated every frame');
for(const compact of [false,true]){
  const planets=model.samples({...state,compact});
  assert.ok(planets[0].radius>=state.radius*(compact?.25:.44));
  assert.ok(planets[1].radius>=state.radius*(compact?.18:.28));
}
console.log('Cosmos visuals: larger planets, body stars, no orbit texture requests and stable caches passed.');
