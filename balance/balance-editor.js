(() => {
  'use strict';

  const api = window.SlimeBalance;
  const $ = id => document.getElementById(id);
  const labels = {
    start:'НАЧАЛО', middle:'СЕРЕДИНА', end:'КОНЕЦ',
    weak:'Непрочные', normal:'Обычные', strong:'Прочные', ore:'Рудные / монетные', secondary:'Второстепенные',
    coal:'Уголь', iron:'Железо', gold:'Золото', diamond:'Алмаз',
    heal:'Аптечка', bomb:'Динамит', spring:'Отбрасыватель',
    cryo:'Крио-блок', snowflake:'Блок снежинки',
    appleMint:'Мятное яблоко', appleRed:'Красное яблоко',
    geyser:'Вулканический гейзер', meteor:'Метеоритный дождь'
  };
  let data = api.load();
  let worldIndex = 0;
  let levelIndex = 0;
  let dirty = false;

  const currentLevel = () => data.worlds[worldIndex].levels[levelIndex];
  const input = (value, path, min=0, max=100, step=1) => `<input type="number" min="${min}" max="${max}" step="${step}" value="${value}" data-path="${path}">`;
  const rows = (distribution, ids, basePath) => ids.map(id => `<div class="percent-row"><label>${labels[id]}</label>${input(distribution[id],`${basePath}.${id}`)}<span>%</span></div>`).join('');
  const sumMessage = distribution => {
    const total = api.sum(distribution);
    const delta = +(100 - total).toFixed(2);
    if (Math.abs(delta) < .001) return { text:'Распределено 100%', valid:true };
    return delta > 0 ? { text:`Осталось ${delta}%`, valid:false } : { text:`Перебор на ${Math.abs(delta)}%`, valid:false };
  };

  function distribution(title, kind, values, ids, zoneId) {
    const state = sumMessage(values);
    return `<section class="distribution" data-distribution="${zoneId}.${kind}"><div class="distribution-title"><h3>${title}</h3><span class="sum-state ${state.valid?'':'invalid'}">${state.text}</span></div>${rows(values,ids,`zones.${zoneId}.${kind}`)}</section>`;
  }

  function renderZones() {
    const level = currentLevel();
    $('zoneEditor').innerHTML = api.ZONE_IDS.map((zoneId,index) => {
      const zone = level.zones[zoneId];
      const description = index === 0
        ? ([2,4].includes(currentWorld().id) ? 'Верхний ряд использует тот же непрочный блок мира.' : 'Первый ряд всегда декоративный. Проценты применяются ниже него.')
        : index === 1 ? 'Основная глубина уровня.' : 'Финальная треть перед порталом.';
      const specialIds = api.specialIdsForWorld(currentWorld().id);
      return `<article class="zone-card"><header><small>ЗОНА ${index+1}</small><h2>${labels[zoneId]}</h2><p>${description}</p></header>${distribution('Типы блоков','blocks',zone.blocks,api.BLOCK_IDS,zoneId)}${distribution('Разновидности руды','ores',zone.ores,api.ORE_IDS,zoneId)}${distribution('Второстепенные блоки','secondary',zone.secondary,specialIds,zoneId)}</article>`;
    }).join('');
  }

  function numberField(label, value, path, min, max, step=1) {
    return `<div class="number-field"><label>${label}</label>${input(value,path,min,max,step)}</div>`;
  }

  function renderProperties() {
    const d = data.durability, r = data.rewards, o = data.ores, s = data.special;
    const healProperties = `<section class="property-group" data-property-group><h3>Аптечка</h3>${numberField('Восстановление здоровья',s.heal.amount,'special.heal.amount',1,500)}<p class="field-error">Значение вышло за допустимый диапазон.</p></section>`;
    const worldSpecialProperties = currentWorld().id === 2
      ? `${healProperties}<section class="property-group" data-property-group><h3>Крио-блок</h3>${numberField('Размер области, блоков',s.cryo.area,'special.cryo.area',2,8)}<p class="property-note">Превращает блоки в выбранной области в непрочные.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section><section class="property-group" data-property-group><h3>Блок снежинки</h3>${numberField('Заморозка, секунд',s.snowflake.duration,'special.snowflake.duration',1,10,.5)}<p class="property-note">Слайм теряет прыгучесть и не получает урон.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section>`
      : currentWorld().id === 3
        ? `${healProperties}<section class="property-group" data-property-group><h3>Мятное яблоко</h3>${numberField('Изменение размера, %',s.appleMint.size,'special.appleMint.size',-50,0)}${numberField('Защита',s.appleMint.defense,'special.appleMint.defense',0,999)}${numberField('Прыгучесть, %',s.appleMint.bounce,'special.appleMint.bounce',0,100)}<p class="property-note">Уменьшает слайма, повышает защиту и отскок.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section><section class="property-group" data-property-group><h3>Красное яблоко</h3>${numberField('Увеличение размера, %',s.appleRed.size,'special.appleRed.size',0,100)}${numberField('Урон',s.appleRed.power,'special.appleRed.power',0,999)}${numberField('Защита',s.appleRed.defense,'special.appleRed.defense',0,999)}<p class="property-note">Увеличивает слайма и усиливает его удар и защиту.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section>`
        : currentWorld().id === 4
          ? `${healProperties}<section class="property-group" data-property-group><h3>Вулканический гейзер</h3>${numberField('Сила выстрела',s.geyser.launch,'special.geyser.launch',.6,2,.05)}<p class="property-note">Даёт 3 секунды на выбор направления и гарантированно пробивает следующие 5 блоков. Затем обычный урон возвращается.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section><section class="property-group" data-property-group><h3>Метеоритный дождь</h3>${numberField('Минимум метеоритов',s.meteor.minCount,'special.meteor.minCount',3,4)}${numberField('Максимум метеоритов',s.meteor.maxCount,'special.meteor.maxCount',3,4)}${numberField('Интервал, секунд',s.meteor.delay,'special.meteor.delay',.28,.7,.01)}<p class="property-note">Вызывает 3–4 последовательных удара ниже слайма. Каждый уничтожает квадрат блоков 3×3.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section>`
          : `<section class="property-group" data-property-group><h3>Динамит</h3>${numberField('Радиус взрыва',s.bomb.radius,'special.bomb.radius',30,400)}${numberField('Урон блокам',s.bomb.damage,'special.bomb.damage',1,500)}<p class="property-note">В Мире 1 динамит всегда уничтожает квадрат 3×3.</p><p class="field-error">Значение вышло за допустимый диапазон.</p></section>${healProperties}<section class="property-group" data-property-group><h3>Отбрасыватель</h3>${numberField('Сила отталкивания',s.spring.push,'special.spring.push',.4,4,.05)}<p class="field-error">Значение вышло за допустимый диапазон.</p></section>`;
    $('propertyEditor').innerHTML = `
      <section class="property-group" data-property-group><h3>Стоимость основных блоков</h3>
        ${numberField('Монет за непрочный блок',r.weak,'rewards.weak',0,10000)}
        ${numberField('Монет за обычный блок',r.normal,'rewards.normal',0,10000)}
        ${numberField('Монет за прочный блок',r.strong,'rewards.strong',0,10000)}
        <p class="property-note">Трава использует цену непрочного блока. Все второстепенные блоки не дают монет.</p>
        <p class="field-error">Значение вышло за допустимый диапазон.</p>
      </section>
      <section class="property-group" data-property-group><h3>Прочность основных блоков</h3>
        ${numberField('Непрочный · минимум',d.weak.min,'durability.weak.min',1,500)}${numberField('Непрочный · максимум',d.weak.max,'durability.weak.max',1,500)}
        ${numberField('Обычный · минимум',d.normal.min,'durability.normal.min',1,500)}${numberField('Обычный · максимум',d.normal.max,'durability.normal.max',1,500)}
        ${numberField('Прочный · минимум',d.strong.min,'durability.strong.min',1,500)}${numberField('Прочный · максимум',d.strong.max,'durability.strong.max',1,500)}
        <p class="field-error">Минимум не может быть больше максимума.</p>
      </section>
      ${api.ORE_IDS.map(id => `<section class="property-group" data-property-group><h3>${labels[id]}</h3>${numberField('Прочность · минимум',o[id].min,`ores.${id}.min`,1,500)}${numberField('Прочность · максимум',o[id].max,`ores.${id}.max`,1,500)}${numberField('Монет за блок',o[id].coins,`ores.${id}.coins`,0,10000)}<p class="field-error">Проверь диапазон значений.</p></section>`).join('')}
      ${worldSpecialProperties}`;
  }

  function renderTabs() {
    $('worldTabs').innerHTML = data.worlds.map((world,index)=>`<button type="button" data-world="${index}" class="${index===worldIndex?'active':''}">МИР ${world.id}</button>`).join('');
    $('levelTabs').innerHTML = currentWorld().levels.map((level,index)=>`<button type="button" data-level="${index}" class="${index===levelIndex?'active':''}">${level.level}</button>`).join('');
  }
  const currentWorld = () => data.worlds[worldIndex];

  function getByPath(path) {
    return path.split('.').reduce((value,key)=>value[key], currentLevelPath(path) ? currentLevel() : data);
  }
  function currentLevelPath(path) { return path.startsWith('zones.'); }
  function setByPath(path, value) {
    const root = currentLevelPath(path) ? currentLevel() : data;
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((object,key)=>object[key],root);
    target[last] = value;
  }

  function allInputsValid() {
    let valid = true;
    document.querySelectorAll('[data-property-group]').forEach(group => group.classList.remove('invalid'));
    document.querySelectorAll('input[data-path]').forEach(field => {
      const value = +field.value;
      const okay = Number.isFinite(value) && value >= +field.min && value <= +field.max;
      field.setAttribute('aria-invalid',String(!okay));
      if (!okay) field.closest('[data-property-group]')?.classList.add('invalid');
      valid &&= okay;
    });
    document.querySelectorAll('[data-property-group]').forEach(group => {
      const fields = [...group.querySelectorAll('input')];
      fields.filter(field => field.dataset.path?.endsWith('.min')).forEach(minField => {
        const maxPath = minField.dataset.path.replace(/\.min$/,'.max');
        const maxField = fields.find(field => field.dataset.path === maxPath);
        if (maxField && +minField.value > +maxField.value) {
          group.classList.add('invalid');
          valid = false;
        }
      });
    });
    valid &&= api.isValid(data);
    return valid;
  }

  function updateValidation() {
    document.querySelectorAll('[data-distribution]').forEach(section => {
      const [zoneId,kind] = section.dataset.distribution.split('.');
      const state = sumMessage(currentLevel().zones[zoneId][kind]);
      const badge = section.querySelector('.sum-state');
      badge.textContent = state.text;
      badge.classList.toggle('invalid',!state.valid);
    });
    const valid = allInputsValid();
    $('saveBalance').disabled = !dirty || !valid;
    $('saveState').textContent = valid ? (dirty ? 'Есть несохранённые изменения' : 'Изменений нет') : 'Исправь красные значения';
  }

  function render() {
    renderTabs();
    renderZones();
    renderProperties();
    updateValidation();
  }

  document.addEventListener('click', event => {
    const worldButton = event.target.closest('[data-world]');
    const levelButton = event.target.closest('[data-level]');
    if (worldButton) { worldIndex=+worldButton.dataset.world; levelIndex=0; render(); }
    if (levelButton) { levelIndex=+levelButton.dataset.level; render(); }
  });
  document.addEventListener('input', event => {
    const path = event.target.dataset.path;
    if (!path) return;
    setByPath(path,+event.target.value);
    dirty = true;
    updateValidation();
  });
  $('saveBalance').onclick = () => {
    if (!allInputsValid()) return;
    data = api.save(data);
    dirty = false;
    render();
    $('toast').textContent = 'Баланс сохранён. Перезапусти забег.';
    $('toast').classList.add('show');
    setTimeout(()=>$('toast').classList.remove('show'),1600);
  };
  $('resetBalance').onclick = () => {
    if (!confirm('Вернуть исходный баланс всех миров и уровней?')) return;
    data = api.defaults();
    dirty = true;
    render();
  };
  render();
})();
