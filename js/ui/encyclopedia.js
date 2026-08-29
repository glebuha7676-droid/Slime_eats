(() => {
  'use strict';

  const SPECIAL_BLOCKS = Object.freeze({
    1: [
      { id: 'bomb', name: 'Динамит', sprite: 'dynamite', kind: 'ВЗРЫВ' },
      { id: 'spring', name: 'Пружинка', sprite: 'spring', kind: 'ТОЛЧОК' },
      { id: 'heal', name: 'Лечебный блок', sprite: 'heal', kind: 'ЛЕЧЕНИЕ' }
    ],
    2: [
      { id: 'cryo', name: 'Крио-блок', sprite: 'cryo', kind: 'ОСЛАБЛЕНИЕ' },
      { id: 'snowflake', name: 'Блок снежинки', sprite: 'snowflake', kind: 'ЗАМОРОЗКА' },
      { id: 'heal', name: 'Ледяная аптечка', sprite: 'heal', kind: 'ЛЕЧЕНИЕ' }
    ],
    3: [
      { id: 'jelly', name: 'Пружинящая желейка', sprite: 'jelly-bounce', kind: 'ОТСКОК' },
      { id: 'heal', name: 'Сладкая аптечка', sprite: 'heal', kind: 'ЛЕЧЕНИЕ' }
    ],
    4: [
      { id: 'geyser', name: 'Вулканический гейзер', sprite: 'geyser', kind: 'ЗАПУСК' },
      { id: 'meteor', name: 'Метеоритный дождь', sprite: 'meteor', kind: 'МЕТЕОРИТ' },
      { id: 'heal', name: 'Вулканическая аптечка', sprite: 'heal', kind: 'ЛЕЧЕНИЕ' }
    ]
  });

  const RARITY_ORDER = ['common', 'rare', 'epic', 'special', 'secret'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function blockDescription(worldId, id, balance) {
    const special = balance?.special || {};
    const heal = Math.max(1, Math.round(special.heal?.amount || 25));
    const descriptions = {
      1: {
        bomb: 'Ломается при первом касании и взрывает квадрат 3×3 вместе с соседними блоками. Может запустить цепную реакцию другого динамита.',
        spring: 'Ломается при первом касании и мощно отталкивает слайма от стороны удара. Не прерывает текущее комбо.',
        heal: `Ломается при первом касании и восстанавливает до ${heal} здоровья. Лишнее лечение не переносится.`
      },
      2: {
        cryo: 'Ломается при первом касании и превращает блоки в области 4×4 в непрочные. Особые блоки внутри области не меняются.',
        snowflake: `Замораживает слайма на ${Math.max(1, Math.round(special.snowflake?.duration || 3))} сек. Он тяжело скользит вниз, не растягивается и временно не получает урон.`,
        heal: `Ломается при первом касании и восстанавливает до ${heal} здоровья. Лишнее лечение не переносится.`
      },
      3: {
        jelly: 'Не разрушается и не наносит урон. Сочно прогибается от удара и мягко, но сильно отталкивает слайма обратно.',
        heal: `Ломается при первом касании и восстанавливает до ${heal} здоровья. Лишнее лечение не переносится.`
      },
      4: {
        geyser: 'Затягивает слайма в центр. Нажми в любую сторону, чтобы выстрелить; первые 5 блоков на пути гарантированно ломаются. Через 3 сек направление выберется само.',
        meteor: `Вызывает от ${Math.max(3, Math.round(special.meteor?.minCount || 3))} до ${Math.max(3, Math.round(special.meteor?.maxCount || 4))} последовательных метеоритов ниже слайма. Каждый удар уничтожает квадрат блоков 3×3.`,
        heal: `Ломается при первом касании и восстанавливает до ${heal} здоровья. Лишнее лечение не переносится.`
      }
    };
    return descriptions[worldId]?.[id] || '';
  }

  function mainTabsMarkup(activeTab, versionedAsset) {
    return `<div class="encyclopedia-tabs" role="tablist" aria-label="Разделы энциклопедии">
      <span class="encyclopedia-tab-slider ${activeTab === 'blocks' ? 'to-blocks' : ''}" aria-hidden="true"></span>
      <button class="encyclopedia-tab ${activeTab === 'foods' ? 'active' : ''}" data-encyclopedia-tab="foods" role="tab" aria-selected="${activeTab === 'foods'}"><img src="${versionedAsset('assets/ui/encyclopedia-cards.png')}" alt="" aria-hidden="true"><b>КАРТОЧКИ</b></button>
      <button class="encyclopedia-tab ${activeTab === 'blocks' ? 'active' : ''}" data-encyclopedia-tab="blocks" role="tab" aria-selected="${activeTab === 'blocks'}"><img src="${versionedAsset('assets/ui/encyclopedia-blocks.png')}" alt="" aria-hidden="true"><b>БЛОКИ</b></button>
    </div>`;
  }

  function worldTabsMarkup(worlds, activeWorld, unlockedWorldIds, versionedAsset) {
    const unlocked = new Set(unlockedWorldIds);
    return `<div class="encyclopedia-world-tabs" role="tablist" aria-label="Миры">
      ${worlds.map(world => {
        const isUnlocked = unlocked.has(world.id);
        const active = world.id === activeWorld;
        return `<button class="encyclopedia-world-tab ${active ? 'active' : ''} ${isUnlocked ? '' : 'locked'}" data-encyclopedia-world="${world.id}" role="tab" aria-selected="${active}" ${isUnlocked ? '' : 'disabled'} aria-label="${isUnlocked ? escapeHtml(world.name) : `Мир ${world.id} закрыт`}">
          ${isUnlocked ? `<img src="${versionedAsset(`assets/ui/world-icons/world-${world.id}.webp`)}" alt="" aria-hidden="true">` : '<span aria-hidden="true">🔒</span>'}
        </button>`;
      }).join('')}
    </div>`;
  }

  function rarityTabsMarkup(activeRarity, foods, discoveredFoods, rarityLabels) {
    return `<div class="encyclopedia-rarity-tabs" role="tablist" aria-label="Редкость карточек">
      ${RARITY_ORDER.map(rarity => {
        return `<button class="encyclopedia-rarity-tab food-card ${rarity} ${activeRarity === rarity ? 'active' : ''}" data-encyclopedia-rarity="${rarity}" role="tab" aria-selected="${activeRarity === rarity}" aria-label="${escapeHtml(rarityLabels[rarity])}">
          <span class="rarity-name"><i aria-hidden="true"><b></b></i></span>
        </button>`;
      }).join('')}
    </div>`;
  }

  function foodCardMarkup(food, helpers) {
    const cardType = 'stats';
    const cardBody = helpers.foodCardBodyMarkup
      ? helpers.foodCardBodyMarkup(food)
      : '<span class="food-card-description empty"><em aria-hidden="true">—</em></span>';
    const foodName = helpers.foodNameMarkup
      ? helpers.foodNameMarkup(food)
      : `<span class="food-name">${escapeHtml(food.name)}</span>`;
    const summary = [
      helpers.foodStatItems(food).slice(0, 4).map(item => item.label).join(', '),
      food.description || food.effectText || ''
    ].filter(Boolean).join('. ');
    return `<article class="food-card encyclopedia-food-card ${escapeHtml(food.rarity)} food-type-${cardType}" data-encyclopedia-food="${escapeHtml(food.id)}" tabindex="0" role="button" aria-label="${escapeHtml(`${food.name}. ${summary}. Открыть крупную карточку`)}">
      ${helpers.foodCardDecorMarkup ? helpers.foodCardDecorMarkup(food) : ''}
      <span class="rarity"><span class="rarity-name"><i aria-hidden="true"><b></b></i><span>${escapeHtml(helpers.rarityLabels[food.rarity])}</span></span></span>
      <span class="food-model-wrap">${helpers.foodArtMarkup(food)}</span>
      ${foodName}
      ${cardBody}
    </article>`;
  }

  function unknownFoodCardMarkup(rarity, helpers) {
    const secret = rarity === 'secret';
    return `<article class="food-card encyclopedia-food-card encyclopedia-food-unknown ${escapeHtml(rarity)} food-type-stats" aria-label="Неизвестная карточка. ${escapeHtml(helpers.rarityLabels[rarity])}">
      ${helpers.foodCardDecorMarkup ? helpers.foodCardDecorMarkup({ rarity }) : ''}
      <span class="rarity"><span class="rarity-name"><i aria-hidden="true"><b></b></i><span>${escapeHtml(helpers.rarityLabels[rarity])}</span></span></span>
      <span class="encyclopedia-unknown-mark" aria-hidden="true">${secret ? '???' : '?'}</span>
      <span class="encyclopedia-unknown-label">НЕ ОТКРЫТО</span>
    </article>`;
  }

  function foodsMarkup(options) {
    const discovered = new Set(options.discoveredFoods);
    const revealedSecrets = new Set(options.revealedSecretFoods || []);
    const isKnown = food => food.rarity === 'secret' ? revealedSecrets.has(food.id) : discovered.has(food.id);
    const available = options.foods;
    const known = available.filter(isKnown);
    const rarity = RARITY_ORDER.includes(options.activeRarity) ? options.activeRarity : RARITY_ORDER[0];
    const rarityFoods = available.filter(food => food.rarity === rarity);
    const rarityKnown = rarityFoods.filter(isKnown);
    const overallPercent = available.length ? Math.round(known.length / available.length * 100) : 0;
    const rarityPercent = rarityFoods.length ? Math.round(rarityKnown.length / rarityFoods.length * 100) : 0;
    return `${rarityTabsMarkup(rarity, available, options.discoveredFoods, options.rarityLabels)}<section class="encyclopedia-page encyclopedia-food-page" data-rarity="${rarity}">
      <div class="encyclopedia-page-head">
        <div class="encyclopedia-collection-progress" style="--collection-progress:${overallPercent}%">
          <span><small>КОЛЛЕКЦИЯ</small><b>${known.length}/${available.length}</b></span>
          <div class="encyclopedia-progress-track" role="progressbar" aria-label="Общий прогресс коллекции" aria-valuemin="0" aria-valuemax="${available.length}" aria-valuenow="${known.length}"><i></i></div>
          <img src="${options.versionedAsset('assets/ui/encyclopedia-progress-book.png')}" alt="" aria-hidden="true">
        </div>
        <p>Карточка открывается после встречи на конвейере. Нажми на найденную карточку, чтобы рассмотреть её.</p>
      </div>
      <section class="encyclopedia-rarity-group ${rarity}">
        <div class="encyclopedia-rarity-head"><i aria-hidden="true"><b></b></i><b>${escapeHtml(options.rarityLabels[rarity])}</b><div class="encyclopedia-rarity-progress" style="--rarity-progress:${rarityPercent}%"><u></u></div><span>${rarityKnown.length} из ${rarityFoods.length}</span></div>
        <div class="encyclopedia-food-viewport"><div class="encyclopedia-food-row">${rarityFoods.map(food => isKnown(food) ? foodCardMarkup(food, options) : unknownFoodCardMarkup(rarity, options)).join('')}</div></div>
      </section>
    </section>`;
  }

  function blocksMarkup(options) {
    const blocks = SPECIAL_BLOCKS[options.activeWorld] || [];
    return `<section class="encyclopedia-page encyclopedia-block-page" data-world="${options.activeWorld}">
      <div class="encyclopedia-page-head">
        <span><small>БЛОКИ МИРА</small><b>${blocks.length}</b></span>
        <p>Они не дают монеты, зато меняют падение, здоровье или блоки вокруг.</p>
      </div>
      <div class="encyclopedia-block-list">
        ${blocks.map(block => {
          const source = window.SlimeWorldCatalog?.assetSource?.(options.activeWorld, block.sprite) || `assets/world${options.activeWorld}/${block.sprite}.webp`;
          return `<article class="encyclopedia-block-card" data-world="${options.activeWorld}">
            <div class="encyclopedia-block-art"><img src="${options.versionedAsset(source)}" alt="${escapeHtml(block.name)}" loading="lazy" decoding="async"></div>
            <div class="encyclopedia-block-copy"><small>${escapeHtml(block.kind)}</small><h3>${escapeHtml(block.name)}</h3><p>${escapeHtml(blockDescription(options.activeWorld, block.id, options.balance))}</p></div>
          </article>`;
        }).join('')}
      </div>
    </section>`;
  }

  function render(options) {
    const activeTab = options.activeTab === 'blocks' ? 'blocks' : 'foods';
    const sectionTabs = activeTab === 'blocks'
      ? worldTabsMarkup(options.worlds, options.activeWorld, options.unlockedWorldIds, options.versionedAsset)
      : '';
    return `${mainTabsMarkup(activeTab, options.versionedAsset)}${sectionTabs}${activeTab === 'blocks' ? blocksMarkup(options) : foodsMarkup(options)}`;
  }

  window.SlimeEncyclopedia = Object.freeze({ render, foodCardMarkup, SPECIAL_BLOCKS });
})();
