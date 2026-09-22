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
      { id: 'freezeZone', name: 'Ледяная вода', sprite: 'ice-light', kind: 'ЗАМОРОЗКА' },
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

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function blockDescription(worldId, id, balance) {
    const heal = Math.max(1, Math.round(balance?.special?.heal?.amount || 25));
    const descriptions = {
      1: {
        bomb: 'Ломается при первом касании и взрывает квадрат 3×3 вместе с соседними блоками.',
        spring: 'Мощно отталкивает слайма от стороны удара и не прерывает комбо.',
        heal: `Восстанавливает до ${heal} здоровья.`
      },
      2: {
        cryo: 'Превращает обычные блоки в области 4×4 в непрочные.',
        freezeZone: 'Через секунду замораживает слайма на 3 секунды.',
        heal: `Восстанавливает до ${heal} здоровья.`
      },
      3: {
        jelly: 'Не разрушается, прогибается от удара и сильно отталкивает слайма.',
        heal: `Восстанавливает до ${heal} здоровья.`
      },
      4: {
        geyser: 'Затягивает слайма и выстреливает в выбранном направлении.',
        meteor: 'Вызывает несколько метеоритов ниже слайма.',
        heal: `Восстанавливает до ${heal} здоровья.`
      }
    };
    return descriptions[worldId]?.[id] || '';
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

  function render(options) {
    const blocks = SPECIAL_BLOCKS[options.activeWorld] || [];
    return `${worldTabsMarkup(options.worlds, options.activeWorld, options.unlockedWorldIds, options.versionedAsset)}
      <section class="encyclopedia-page encyclopedia-block-page" data-world="${options.activeWorld}">
        <div class="encyclopedia-page-head">
          <span><small>БЛОКИ МИРА</small><b>${blocks.length}</b></span>
          <p>Особые блоки меняют маршрут, здоровье или окружение.</p>
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

  window.SlimeEncyclopedia = Object.freeze({ render, SPECIAL_BLOCKS });
})();
