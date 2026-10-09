const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8');
const start = source.indexOf('  function startDrop(options');
const end = source.indexOf('    const baseWorld = currentWorld();', start);
const prefix = source.slice(start,end);
let busy=true;
const context={window:{SlimeBalance:{load:()=>({})}},GAME_BALANCE:{},
  stomachCanLaunch:()=>true,menuSlimeIsBusy:()=>busy,showToast:()=>{},feedback:()=>{},sound:()=>{},
  save:{gameCompleted:true},beginRoomLaunch:()=>{},};
vm.createContext(context);
vm.runInContext(prefix+'this.accepted=true; } this.startDrop=startDrop;',context);
context.startDrop(); assert.equal(context.accepted,undefined,'Meals still block manual launch');
context.startDrop({fromPortal:true}); assert.equal(context.accepted,true,'Portal animation must not block its own launch');
console.log('Room launch: feeding remains guarded and portal entry proceeds');
