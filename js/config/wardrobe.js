/* Cosmetics are independent of mutation bodies and never change run statistics. */
(() => {
  'use strict';
  const accessories = Object.freeze([
    {id:'round',name:'Очки ботаника',image:'assets/ui/wardrobe/accessories/round-v2.webp'},
    {id:'moustache',name:'Усы',image:'assets/ui/wardrobe/accessories/moustache-v1.webp'},
    {id:'visor',name:'Киберочки',image:'assets/ui/wardrobe/accessories/visor-v1.webp'},
    {id:'blindfold',name:'Повязка',image:'assets/ui/wardrobe/accessories/blindfold-v1.webp'},
    {id:'aviator',name:'Очки пилота',image:'assets/ui/wardrobe/accessories/aviator-v2.webp'},
    {id:'pixel',name:'Пиксельные очки',image:'assets/ui/wardrobe/accessories/pixel-v1.webp'},
    {id:'pirate',name:'Повязка пирата',image:'assets/ui/wardrobe/accessories/pirate-v3.webp'},
    {id:'lashes',name:'Ресницы',image:'assets/ui/wardrobe/accessories/lashes-code-v694.png'}
  ]);
  const emotions = Object.freeze([
    {id:'laugh',name:'Тык-тык',description:'Палец тыкает с разных сторон. Слайм удивляется!',image:'assets/ui/tutorial-pointer-v3-lossless.webp'},
    {id:'love',name:'Сердечки',description:'Слайму нравится! Радуется и выпускает сердечки.',image:'assets/ui/heart-jelly.webp'},
    {id:'petpet',name:'Тап-тап',description:'Ласковое поглаживание. Слайм довольно жмурится.',image:'assets/ui/wardrobe/emotions/petpet-icon-v698.webp'},
    {id:'proud',comingSoon:true,name:'Маленькая победа',description:'Гордо выпрямляется и празднует.'},
    {id:'shy',comingSoon:true,name:'Смущение',description:'Робко прячется и улыбается.'},
    {id:'surprise',comingSoon:true,name:'Вот это да!',description:'Удивляется и отскакивает назад.'},
    {id:'grumpy',comingSoon:true,name:'Ворчун',description:'Надувается, а потом снова улыбается.'}
  ]);
  const catalogs = {accessories,emotions};
  const costs = Object.freeze({accessories:30,emotions:20});
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    const alias=id=>id==='explorer'?'stars':id==='pilot'?'blindfold':id;
    const owned = (key, fallback) => [...new Set([...(fallback || []),...(Array.isArray(source[key]) ? source[key] : [])])]
      .map(id=>key==='accessories'?alias(id):id).filter((id,index,list)=>list.indexOf(id)===index)
      .filter(id => catalogs[key].some(item => item.id === id)||(key==='accessories'&&['mask','stars','beard'].includes(id)));
    const result = {version:1,accessories:owned('accessories'),emotions:owned('emotions',['laugh']),
      accessory:alias(source.accessory) || 'none',emotion:source.emotion || 'laugh',lastPrize:null};
    if (!result.accessories.includes(result.accessory)||!accessories.some(item=>item.id===result.accessory)) result.accessory = 'none';
    if (!result.emotions.includes(result.emotion)||emotions.find(item=>item.id===result.emotion)?.comingSoon) result.emotion = 'laugh';
    const prize=source.lastPrize && {category:source.lastPrize.category,id:source.lastPrize.category==='accessories'?alias(source.lastPrize.id):source.lastPrize.id};
    if (prize && catalogs[prize.category]?.some(item => item.id === prize.id&&!item.comingSoon)
      && result[prize.category].includes(prize.id)) {
      result.lastPrize = prize;
    }
    return result;
  }
  function remaining(value, category) {
    const state = normalize(value);
    return (catalogs[category] || []).filter(item => !item.comingSoon&&!state[category].includes(item.id));
  }
  function purchase(save, category, random = Math.random) {
    if (!catalogs[category]) return {ok:false,reason:'category'};
    const state = normalize(save.wardrobe), pool = remaining(state,category),cost = costs[category];
    if (!pool.length) return {ok:false,reason:'complete'};
    if (!Number.isFinite(save.researchUnits) || save.researchUnits < cost) return {ok:false,reason:'balance'};
    const roll = Number(random());
    const item = pool[Math.min(pool.length-1,Math.floor(Math.max(0,Number.isFinite(roll)?roll:0)*pool.length))];
    state[category].push(item.id);
    state.lastPrize = {category,id:item.id};
    save.researchUnits -= cost;
    save.wardrobe = state;
    return {ok:true,item,category,cost};
  }
  window.SlimeWardrobe = Object.freeze({catalogs,costs,normalize,remaining,purchase});
})();
