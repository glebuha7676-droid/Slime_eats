(() => {
  'use strict';
  const paths = {
  "assets/ui/planets/sky-v3/sky-healthy.webp": "assets/ui/planets/sky-v4/sky-0.webp",
  "assets/Мир 1/Колючий враг-v3.webp": "assets/hazards/thorns-red-v2/static-v3.webp",
  "assets/hazards/thorns-red-v2/static.webp": "assets/hazards/thorns-red-v2/static-v3.webp",
  "assets/hazards/thorns-v1/chaser.webp": "assets/hazards/thorns-red-v2/chaser.webp",
  "assets/ui/planets/runtime-v1/home-100.webp": "assets/ui/planets/home-v2/home-100.webp",
  "assets/ui/planets/runtime-v1/home-75.webp": "assets/ui/planets/home-v2/home-75.webp",
  "assets/ui/planets/runtime-v1/home-50.webp": "assets/ui/planets/home-v2/home-50.webp",
  "assets/ui/planets/runtime-v1/home-25.webp": "assets/ui/planets/home-v2/home-25.webp",
  "assets/ui/planets/runtime-v1/home-0.webp": "assets/ui/planets/home-v2/home-0.webp",

  "assets/ui/planets/sky-v2/sky-healthy.webp": "assets/ui/planets/sky-v4/sky-0.webp",
  "assets/world5/desert-blocks-v1/sand-fragile.webp": "assets/world5/sky-v1/cloud-fragile.webp",
  "assets/world5/desert-blocks-v1/sandstone-normal.webp": "assets/world5/sky-v1/sky-stone-normal.webp",
  "assets/world5/desert-blocks-v1/bedrock-strong.webp": "assets/world5/sky-v1/goldstone-strong.webp",
  "assets/backgrounds/parallax-v4/desert-far.webp": "assets/backgrounds/parallax-v4/sky-far.webp",
  "assets/backgrounds/parallax-v4/desert-near.webp": "assets/backgrounds/parallax-v4/sky-near.webp",
  "assets/ui/planets/runtime-v1/desert-0.webp": "assets/ui/planets/sky-v4/sky-0.webp",
  "assets/ui/planets/runtime-v1/desert-25.webp": "assets/ui/planets/sky-v4/sky-25.webp",
  "assets/ui/planets/runtime-v1/desert-50.webp": "assets/ui/planets/sky-v4/sky-50.webp",
  "assets/ui/planets/runtime-v1/desert-75.webp": "assets/ui/planets/sky-v4/sky-75.webp",
  "assets/ui/planets/runtime-v1/desert-100.webp": "assets/ui/planets/sky-v4/sky-100.webp",

  "assets/Мир 1/Колючий враг-v2.webp": "assets/hazards/thorns-red-v2/static-v3.webp",
  "assets/backgrounds/parallax-v3/stone-far.webp": "assets/backgrounds/parallax-v4/stone-far.webp",
  "assets/backgrounds/parallax-v3/stone-near.webp": "assets/backgrounds/parallax-v4/stone-near.webp",
  "assets/backgrounds/parallax-v3/candy-far.webp": "assets/backgrounds/parallax-v4/candy-far.webp",
  "assets/backgrounds/parallax-v3/candy-near.webp": "assets/backgrounds/parallax-v4/candy-near.webp",
  "assets/backgrounds/parallax-v3/magma-far.webp": "assets/backgrounds/parallax-v4/magma-far.webp",
  "assets/backgrounds/parallax-v3/magma-near.webp": "assets/backgrounds/parallax-v4/magma-near.webp",
  "assets/ui/portal-window-v1/laboratory.webp": "assets/ui/portal-window-v2/laboratory-return.webp",
  "assets/Мир 4/Непрочный блок.webp": "assets/world4/magma-blocks-v2/ash-fragile.webp",
  "assets/Мир 4/Непрочный блок.png": "assets/world4/magma-blocks-v2/ash-fragile.webp",
  "assets/Мир 4/Обычный блок.webp": "assets/world4/magma-blocks-v2/cooled-lava-normal.webp",
  "assets/Мир 4/Обычный блок.png": "assets/world4/magma-blocks-v2/cooled-lava-normal.webp",
  "assets/Мир 4/Прочный блок.webp": "assets/world4/magma-blocks-v2/columnar-basalt-strong.webp",
  "assets/Мир 4/Прочный блок.png": "assets/world4/magma-blocks-v2/columnar-basalt-strong.webp",
  "assets/Мир 3/Непрочный блок.webp": "assets/world3/candy-blocks-v1/wafer-fragile.webp",
  "assets/Мир 3/Непрочный блок.png": "assets/world3/candy-blocks-v1/wafer-fragile.webp",
  "assets/Мир 3/обычный блок.webp": "assets/world3/candy-blocks-v1/chocolate-normal.webp",
  "assets/Мир 3/обычный блок.png": "assets/world3/candy-blocks-v1/chocolate-normal.webp",
  "assets/Мир 3/Прочный блок.webp": "assets/world3/candy-blocks-v1/berry-candy-strong-v2.webp",
  "assets/Мир 3/Прочный блок.png": "assets/world3/candy-blocks-v1/berry-candy-strong-v2.webp",
  "assets/ui/currency/anomaly-jar-v1.webp": "assets/ui/anomaly-fluid-v2/jar.webp",
  "assets/ui/research-flask-blue-v1.webp": "assets/ui/anomaly-fluid-v2/jar.webp",
  "assets/Мир 1/Аптечка.webp": "assets/ui/blocks/heart-stone-v1.webp",
  "assets/Мир 3/Хилка.webp": "assets/ui/blocks/heart-stone-v1.webp",
  "assets/Мир 4/Аптечка.webp": "assets/ui/blocks/heart-stone-v1.webp",
  "assets/Мир 2/Непрочный блок.webp": "assets/ui/blocks/frost-snow-front-v1.webp",
  "assets/world2/snow-soft-v2.webp": "assets/ui/blocks/frost-snow-front-v1.webp",
  "assets/Мир 2/Обычный блок.webp": "assets/world2/ice-normal-v2.webp",
  "assets/Мир 2/Прочный блок.webp": "assets/world2/glacier-strong-v2.webp",
  "assets/backgrounds/world-2-ice.webp": "assets/backgrounds/world-2-ice-v2.webp",
  "assets/ui/launch-card-worlds/world-2-cave.webp": "assets/ui/launch-card-worlds/world-2-cave-v2.webp",
  "assets/ui/ability-shield-v1.png": "assets/ui/ability-shield-v1-lossless.webp",
  "assets/ui/mutation-reveal/cloning-scene-v2.png": "assets/ui/mutation-reveal/cloning-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/cosmos-scene-v2.png": "assets/ui/mutation-reveal/cosmos-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/electric-scene-v2.png": "assets/ui/mutation-reveal/electric-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/fire-scene-v2.png": "assets/ui/mutation-reveal/fire-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/frost-scene-v2.png": "assets/ui/mutation-reveal/frost-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/glitch-scene-v2.png": "assets/ui/mutation-reveal/glitch-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/nano-scene-v4.png": "assets/ui/mutation-reveal/nano-scene-v4-lossless.webp",
  "assets/ui/mutation-reveal/phantom-scene-v2.png": "assets/ui/mutation-reveal/phantom-scene-v2-lossless.webp",
  "assets/ui/mutation-reveal/telekinesis-scene-v2.png": "assets/ui/mutation-reveal/telekinesis-scene-v2-lossless.webp",
  "assets/ui/quick-mutation-panel-v1.png": "assets/ui/quick-mutation-panel-v1-lossless.webp",
  "assets/ui/recipe-categories/emblem-v5-phantom.png": "assets/ui/recipe-categories/emblem-v7-phantom-lossless.webp",
  "assets/ui/synth-terminal-base-v1.png": "assets/ui/synth-terminal-base-v1-lossless.webp",
  "assets/ui/synthesis-triple-v2.png": "assets/ui/synthesis-triple-v2-lossless.webp",
  "assets/ui/tutorial-pointer-v1.png": "assets/ui/tutorial-pointer-v1-lossless.webp",
  "assets/ui/tutorial-pointer-v2.png": "assets/ui/tutorial-pointer-v2-lossless.webp",
  "assets/ui/tutorial-pointer-v3.png": "assets/ui/tutorial-pointer-v3-lossless.webp",
  "assets/ui/world-terminal/base-clean-v1.png": "assets/ui/world-terminal/base-clean-v1-lossless.webp",
  "assets/ui/world-terminal/base-clean-v2.png": "assets/ui/world-terminal/base-clean-v2-lossless.webp",
  "assets/ui/world-terminal/base-clean-v3.png": "assets/ui/world-terminal/base-clean-v3-lossless.webp",
  "assets/ui/world-terminal/base-clean-v4.png": "assets/ui/world-terminal/base-clean-v4-lossless.webp",
  "assets/ui/world-terminal/base-clean-v5.png": "assets/ui/world-terminal/base-clean-v5-lossless.webp",
  "assets/vfx/electric-storm-cloud-v1.png": "assets/vfx/electric-storm-cloud-v1-lossless.webp",
  "assets/vfx/electric-storm-cloud-v2.png": "assets/vfx/electric-storm-cloud-v2-lossless.webp",
  "assets/vfx/fire-phoenix-ultimate-v1.png": "assets/vfx/fire-phoenix-ultimate-v1-lossless.webp",
  "assets/vfx/frost-storm-flake-v1.png": "assets/vfx/frost-storm-flake-v1-lossless.webp",
  "assets/vfx/spores-mini-mushroom-v1.png": "assets/vfx/spores-mini-mushroom-v1-lossless.webp",
  "assets/ЕДА/Новая/Глитч/01-glitch-burger.png": "assets/food/01-glitch-burger.webp",
  "assets/ЕДА/Новая/Глитч/02-glitch-sushi.png": "assets/food/02-glitch-sushi.webp",
  "assets/ЕДА/Новая/Глитч/03-glitch-carrot.png": "assets/food/03-glitch-carrot.webp",
  "assets/ЕДА/Новая/Космос/01-planet-candy.png": "assets/food/01-planet-candy.webp",
  "assets/ЕДА/Новая/Космос/02-star-candy.png": "assets/food/02-star-candy.webp",
  "assets/ЕДА/Новая/Космос/03-galaxy-jelly.png": "assets/food/03-galaxy-jelly.webp",
  "assets/ЕДА/Новая/Морозная/01-popsicle.png": "assets/food/01-popsicle.webp",
  "assets/ЕДА/Новая/Морозная/02-shaved-ice.png": "assets/food/02-shaved-ice.webp",
  "assets/ЕДА/Новая/Морозная/03-berries.png": "assets/food/03-berries.webp",
  "assets/ЕДА/Новая/Огненная/01-berries.png": "assets/food/01-berries.webp",
  "assets/ЕДА/Новая/Огненная/02-pepper.png": "assets/food/02-pepper.webp",
  "assets/ЕДА/Новая/Огненная/03-ramen.png": "assets/food/03-ramen.webp",
  "assets/ЕДА/Новая/Псионика/01-crystal-sweets.png": "assets/food/01-crystal-sweets.webp",
  "assets/ЕДА/Новая/Псионика/02-psionic-donut.png": "assets/food/02-psionic-donut.webp",
  "assets/ЕДА/Новая/Псионика/03-psionic-potion.png": "assets/food/03-psionic-potion.webp",
  "assets/ЕДА/Новая/Споры/01-mushrooms.png": "assets/food/01-mushrooms.webp",
  "assets/ЕДА/Новая/Споры/02-mushroom-cake.png": "assets/food/02-mushroom-cake.webp",
  "assets/ЕДА/Новая/Споры/03-spore-drink.png": "assets/food/03-spore-drink.webp",
  "assets/ЕДА/Новая/Техно/01-mechanical-snack.png": "assets/food/01-mechanical-snack.webp",
  "assets/ЕДА/Новая/Техно/02-circuit-soup.png": "assets/food/02-circuit-soup.webp",
  "assets/ЕДА/Новая/Техно/03-tech-dessert.png": "assets/food/03-tech-dessert.webp",
  "assets/ЕДА/Новая/Фантом/01-ghost-essence.png": "assets/food/01-ghost-essence.webp",
  "assets/ЕДА/Новая/Фантом/02-ghost-soup.png": "assets/food/02-ghost-soup.webp",
  "assets/ЕДА/Новая/Фантом/03-ghost-fruit.png": "assets/food/03-ghost-fruit.webp",
  "assets/ЕДА/Новая/Электро/01-energy-can.png": "assets/food/01-energy-can.webp",
  "assets/ЕДА/Новая/Электро/02-candy.png": "assets/food/02-candy.webp",
  "assets/ЕДА/Новая/Электро/03-noodles.png": "assets/food/03-noodles.webp",
  "assets/Мир 1/Колючий враг-v1.png": "assets/hazards/thorns-red-v2/static-v3.webp",
  "assets/Мир 1/Колючий враг-v1-lossless.webp": "assets/hazards/thorns-red-v2/static-v3.webp",
  "effects-lab/assets/cloning-bud-left-v1.png": "effects-lab/assets/cloning-bud-left-v1-lossless.webp",
  "effects-lab/assets/cloning-bud-left-v2.png": "effects-lab/assets/cloning-bud-left-v2-lossless.webp",
  "effects-lab/assets/cloning-bud-left-v3.png": "effects-lab/assets/cloning-bud-left-v3-lossless.webp",
  "effects-lab/assets/cloning-bud-left-v4.png": "effects-lab/assets/cloning-bud-left-v4-lossless.webp",
  "effects-lab/assets/cloning-bud-v2.png": "effects-lab/assets/cloning-bud-v2-lossless.webp",
  "effects-lab/assets/cosmos-eye-base-v1.png": "effects-lab/assets/cosmos-eye-base-v1-lossless.webp",
  "effects-lab/assets/cosmos-pupil-v1.png": "effects-lab/assets/cosmos-pupil-v1-lossless.webp",
  "effects-lab/assets/cosmos-ultra-body-v2.png": "effects-lab/assets/cosmos-ultra-body-v2-lossless.webp",
  "effects-lab/assets/division-bud-left-v1.png": "effects-lab/assets/division-bud-left-v1-lossless.webp",
  "effects-lab/assets/division-nucleus-v1.png": "effects-lab/assets/division-nucleus-v1-lossless.webp",
  "effects-lab/assets/division-nucleus-v2.png": "effects-lab/assets/division-nucleus-v2-lossless.webp",
  "effects-lab/assets/electric-eye-base-v1.png": "effects-lab/assets/electric-eye-base-v1-lossless.webp",
  "effects-lab/assets/electric-pupil-v1.png": "effects-lab/assets/electric-pupil-v1-lossless.webp",
  "effects-lab/assets/electric-ultra-body-v6.png": "effects-lab/assets/electric-ultra-body-v6-lossless.webp",
  "effects-lab/assets/electric-ultra-body-v7.png": "effects-lab/assets/electric-ultra-body-v7-lossless.webp",
  "effects-lab/assets/fire-eye-base-v1.png": "effects-lab/assets/fire-eye-base-v1-lossless.webp",
  "effects-lab/assets/fire-pupil-v1.png": "effects-lab/assets/fire-pupil-v1-lossless.webp",
  "effects-lab/assets/fire-ultra-body-v1.png": "effects-lab/assets/fire-ultra-body-v1-lossless.webp",
  "effects-lab/assets/fire-ultra-body-v2.png": "effects-lab/assets/fire-ultra-body-v2-lossless.webp",
  "effects-lab/assets/fire-ultra-phoenix-body-v3.png": "effects-lab/assets/fire-ultra-phoenix-body-v3-lossless.webp",
  "effects-lab/assets/fire-ultra-phoenix-body-v4.png": "effects-lab/assets/fire-ultra-phoenix-body-v4-lossless.webp",
  "effects-lab/assets/frost-eye-base-v1.png": "effects-lab/assets/frost-eye-base-v1-lossless.webp",
  "effects-lab/assets/frost-pupil-v1.png": "effects-lab/assets/frost-pupil-v1-lossless.webp",
  "effects-lab/assets/glitch-eye-base-v1.png": "effects-lab/assets/glitch-eye-base-v1-lossless.webp",
  "effects-lab/assets/glitch-eye-base-v2.png": "effects-lab/assets/glitch-eye-base-v2-lossless.webp",
  "effects-lab/assets/glitch-eye-base-v3.png": "effects-lab/assets/glitch-eye-base-v3-lossless.webp",
  "effects-lab/assets/glitch-eye-base-v4.png": "effects-lab/assets/glitch-eye-base-v4-lossless.webp",
  "effects-lab/assets/glitch-mouth-v1.png": "effects-lab/assets/glitch-mouth-v1-lossless.webp",
  "effects-lab/assets/glitch-pupil-v1.png": "effects-lab/assets/glitch-pupil-v1-lossless.webp",
  "effects-lab/assets/glitch-pupil-v2.png": "effects-lab/assets/glitch-pupil-v2-lossless.webp",
  "effects-lab/assets/glitch-pupil-v3.png": "effects-lab/assets/glitch-pupil-v3-lossless.webp",
  "effects-lab/assets/glitch-symbol-o-v1.png": "effects-lab/assets/glitch-symbol-o-v1-lossless.webp",
  "effects-lab/assets/glitch-symbol-x-v1.png": "effects-lab/assets/glitch-symbol-x-v1-lossless.webp",
  "effects-lab/assets/glitch-ultra-body-v1.png": "effects-lab/assets/glitch-ultra-body-v1-lossless.webp",
  "effects-lab/assets/glitch-ultra-body-v2.png": "effects-lab/assets/glitch-ultra-body-v2-lossless.webp",
  "effects-lab/assets/glitch-ultra-body-v3.png": "effects-lab/assets/glitch-ultra-body-v3-lossless.webp",
  "effects-lab/assets/nano-cyborg-eye-closed-v1.png": "effects-lab/assets/nano-cyborg-eye-closed-v1-lossless.webp",
  "effects-lab/assets/nano-cyborg-eye-closed-v2.png": "effects-lab/assets/nano-cyborg-eye-closed-v2-lossless.webp",
  "effects-lab/assets/nano-cyborg-eye-open-v1.png": "effects-lab/assets/nano-cyborg-eye-open-v1-lossless.webp",
  "effects-lab/assets/nano-cyborg-eye-open-v2.png": "effects-lab/assets/nano-cyborg-eye-open-v2-lossless.webp",
  "effects-lab/assets/nano-cyborg-pupil-v1.png": "effects-lab/assets/nano-cyborg-pupil-v1-lossless.webp",
  "effects-lab/assets/nano-eye-base-v3.png": "effects-lab/assets/nano-eye-base-v3-lossless.webp",
  "effects-lab/assets/nano-eye-base-v4.png": "effects-lab/assets/nano-eye-base-v4-lossless.webp",
  "effects-lab/assets/nano-eye-open-v3.png": "effects-lab/assets/nano-eye-open-v3-lossless.webp",
  "effects-lab/assets/nano-eye-open-v4.png": "effects-lab/assets/nano-eye-open-v4-lossless.webp",
  "effects-lab/assets/nano-eye-reticle-v3.png": "effects-lab/assets/nano-eye-reticle-v3-lossless.webp",
  "effects-lab/assets/nano-eye-reticle-v4.png": "effects-lab/assets/nano-eye-reticle-v4-lossless.webp",
  "effects-lab/assets/phantom-emblem-v2.png": "effects-lab/assets/phantom-emblem-v2-lossless.webp",
  "effects-lab/assets/phantom-eye-v2.png": "effects-lab/assets/phantom-eye-v2-lossless.webp",
  "effects-lab/assets/phantom-pupils-v3.png": "effects-lab/assets/phantom-pupils-v3-lossless.webp",
  "effects-lab/assets/phantom-ultra-body-v3.png": "effects-lab/assets/phantom-ultra-body-v3-lossless.webp",
  "effects-lab/assets/phantom-ultra-body-v4.png": "effects-lab/assets/phantom-ultra-body-v4-lossless.webp",
  "effects-lab/assets/phantom-ultra-body-v5.png": "effects-lab/assets/phantom-ultra-body-v5-lossless.webp",
  "effects-lab/assets/phantom-ultra-body-v6.png": "effects-lab/assets/phantom-ultra-body-v6-lossless.webp",
  "effects-lab/assets/psionics-antennae-ultra-v1.png": "effects-lab/assets/psionics-antennae-ultra-v1-lossless.webp",
  "effects-lab/assets/psionics-antennae-v1.png": "effects-lab/assets/psionics-antennae-v1-lossless.webp",
  "effects-lab/assets/psionics-eye-base-v1.png": "effects-lab/assets/psionics-eye-base-v1-lossless.webp",
  "effects-lab/assets/psionics-eye-base-v2.png": "effects-lab/assets/psionics-eye-base-v2-lossless.webp",
  "effects-lab/assets/psionics-pupil-v1.png": "effects-lab/assets/psionics-pupil-v1-lossless.webp",
  "effects-lab/assets/psionics-pupil-v2.png": "effects-lab/assets/psionics-pupil-v2-lossless.webp",
  "effects-lab/assets/psionics-ultra-body-v1.png": "effects-lab/assets/psionics-ultra-body-v1-lossless.webp",
  "effects-lab/assets/spores-eye-base-v1.png": "effects-lab/assets/spores-eye-base-v1-lossless.webp",
  "effects-lab/assets/spores-pupil-v1.png": "effects-lab/assets/spores-pupil-v1-lossless.webp",
  "effects-lab/assets/spores-pupil-v2.png": "effects-lab/assets/spores-pupil-v2-lossless.webp",
  "effects-lab/assets/spores-stage1-body-v1.png": "effects-lab/assets/spores-stage1-body-v1-lossless.webp",
  "effects-lab/assets/spores-ultra-body-v2.png": "effects-lab/assets/spores-ultra-body-v2-lossless.webp",
  "effects-lab/assets/spores-ultra-body-v4.png": "effects-lab/assets/spores-ultra-body-v4-lossless.webp",
  "effects-lab/assets/spores-ultra-body-v5.png": "effects-lab/assets/spores-ultra-body-v5-lossless.webp",
  "effects-lab/assets/techno-mini-drone-red-v1.png": "effects-lab/assets/techno-mini-drone-red-v1-lossless.webp",
  "effects-lab/assets/techno-mini-drone-red-v2.png": "effects-lab/assets/techno-mini-drone-red-v2-lossless.webp",
  "effects-lab/assets/techno-ultra-body-v2.png": "effects-lab/assets/techno-ultra-body-v2-lossless.webp",
  "effects-lab/assets/telekinesis-rock-left-v1.png": "effects-lab/assets/telekinesis-rock-left-v1-lossless.webp",
  "effects-lab/assets/telekinesis-rock-right-v1.png": "effects-lab/assets/telekinesis-rock-right-v1-lossless.webp",
  "assets/ЕДА/Новая/Глитч/01-glitch-burger-lossless.webp": "assets/food/01-glitch-burger.webp",
  "assets/ЕДА/Новая/Глитч/02-glitch-sushi-lossless.webp": "assets/food/02-glitch-sushi.webp",
  "assets/ЕДА/Новая/Глитч/03-glitch-carrot-lossless.webp": "assets/food/03-glitch-carrot.webp",
  "assets/ЕДА/Новая/Космос/01-planet-candy-lossless.webp": "assets/food/01-planet-candy.webp",
  "assets/ЕДА/Новая/Космос/02-star-candy-lossless.webp": "assets/food/02-star-candy.webp",
  "assets/ЕДА/Новая/Космос/03-galaxy-jelly-lossless.webp": "assets/food/03-galaxy-jelly.webp",
  "assets/ЕДА/Новая/Морозная/01-popsicle-lossless.webp": "assets/food/01-popsicle.webp",
  "assets/ЕДА/Новая/Морозная/02-shaved-ice-lossless.webp": "assets/food/02-shaved-ice.webp",
  "assets/ЕДА/Новая/Морозная/03-berries-lossless.webp": "assets/food/03-berries.webp",
  "assets/ЕДА/Новая/Огненная/01-berries-lossless.webp": "assets/food/01-berries.webp",
  "assets/ЕДА/Новая/Огненная/02-pepper-lossless.webp": "assets/food/02-pepper.webp",
  "assets/ЕДА/Новая/Огненная/03-ramen-lossless.webp": "assets/food/03-ramen.webp",
  "assets/ЕДА/Новая/Псионика/01-crystal-sweets-lossless.webp": "assets/food/01-crystal-sweets.webp",
  "assets/ЕДА/Новая/Псионика/02-psionic-donut-lossless.webp": "assets/food/02-psionic-donut.webp",
  "assets/ЕДА/Новая/Псионика/03-psionic-potion-lossless.webp": "assets/food/03-psionic-potion.webp",
  "assets/ЕДА/Новая/Споры/01-mushrooms-lossless.webp": "assets/food/01-mushrooms.webp",
  "assets/ЕДА/Новая/Споры/02-mushroom-cake-lossless.webp": "assets/food/02-mushroom-cake.webp",
  "assets/ЕДА/Новая/Споры/03-spore-drink-lossless.webp": "assets/food/03-spore-drink.webp",
  "assets/ЕДА/Новая/Техно/01-mechanical-snack-lossless.webp": "assets/food/01-mechanical-snack.webp",
  "assets/ЕДА/Новая/Техно/02-circuit-soup-lossless.webp": "assets/food/02-circuit-soup.webp",
  "assets/ЕДА/Новая/Техно/03-tech-dessert-lossless.webp": "assets/food/03-tech-dessert.webp",
  "assets/ЕДА/Новая/Фантом/01-ghost-essence-lossless.webp": "assets/food/01-ghost-essence.webp",
  "assets/ЕДА/Новая/Фантом/02-ghost-soup-lossless.webp": "assets/food/02-ghost-soup.webp",
  "assets/ЕДА/Новая/Фантом/03-ghost-fruit-lossless.webp": "assets/food/03-ghost-fruit.webp",
  "assets/ЕДА/Новая/Электро/01-energy-can-lossless.webp": "assets/food/01-energy-can.webp",
  "assets/ЕДА/Новая/Электро/02-candy-lossless.webp": "assets/food/02-candy.webp",
  "assets/ЕДА/Новая/Электро/03-noodles-lossless.webp": "assets/food/03-noodles.webp"
};
  // Old editor saves may contain direct image paths, bypassing the catalog.
  // Redirect those to the same current artwork as newly generated runs.
  const terrainRefresh = {
    'assets/Мир 1/Трава (непрочный блок).webp':'assets/world1/slime-blocks-v2/block-fragile.webp',
    'assets/Мир 1/непрочный блок.webp':'assets/world1/slime-blocks-v2/block-fragile.webp',
    'assets/Мир 1/Обычный блок.webp':'assets/world1/slime-blocks-v2/block-normal.webp',
    'assets/Мир 1/Прочный блок.webp':'assets/world1/slime-blocks-v2/block-strong.webp',
    'assets/world4/magma-blocks-v2/ash-fragile.webp':'assets/world4/rounded-blocks-v4/magma-fragile.webp',
    'assets/world4/magma-blocks-v2/cooled-lava-normal.webp':'assets/world4/rounded-blocks-v4/magma-normal.webp',
    'assets/world4/magma-blocks-v2/columnar-basalt-strong.webp':'assets/world4/rounded-blocks-v4/magma-strong.webp',
    'assets/world5/sky-v1/cloud-fragile.webp':'assets/world5/rounded-blocks-v4/sky-fragile.webp',
    'assets/world5/sky-v1/sky-stone-normal.webp':'assets/world5/rounded-blocks-v4/sky-normal.webp',
    'assets/world5/sky-v1/goldstone-strong.webp':'assets/world5/rounded-blocks-v4/sky-strong.webp'
  };
  terrainRefresh['assets/vfx/core-encounter-v1/core.webp']='assets/vfx/hostile-cores-v27/shell-100.webp';
  terrainRefresh['assets/vfx/anomaly-source-v3/living-core.webp']='assets/vfx/hostile-cores-v27/heart-100.webp';
  for(const name of ['block-fragile','block-normal','block-strong'])terrainRefresh[`assets/world6/anomaly-blocks-v3/${name}.webp`]=`assets/world6/asteroid-blocks-v26/${name}.webp`;
  const anomalyArt = 'assets/ui/anomaly-core-v56';
  const anomalyVeins = 'assets/ui/anomaly-veins-v4';
  const anomalyCurrency = `${anomalyVeins}/currency.webp`;
  terrainRefresh[`${anomalyArt}/currency.webp`] = anomalyCurrency;
  for(const value of [1,3,5]) {
    const destination=`${anomalyVeins}/ore-plus-${value}-v3.webp`;
    terrainRefresh[`${anomalyVeins}/ore-plus-${value}.webp`]=destination;
    terrainRefresh[`${anomalyVeins}/ore-plus-${value}-v2.webp`]=destination;
    terrainRefresh[`${anomalyArt}/ore-plus-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-organic-v29/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-center-v28/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-growth-v24/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-readable-v22/infection-${value}.webp`]=destination;
    if(value!==5)terrainRefresh[`assets/ui/mutation-contour-v23/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-wrap-v21/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-flowers-v19/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-blooms-v16/infection-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/mutation-essence-v1/essence-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/anomaly-veins-v3/vein-${value}.webp`]=destination;
    terrainRefresh[`assets/ui/anomaly-fluid-v2/block-plus-${value}.webp`]=destination;
  }
  for (const folder of ['mutation-wrap-v21', 'mutation-flowers-v19', 'anomaly-fluid-v2', 'mutation-blooms-v16', 'mutation-readable-v22']) {
    terrainRefresh[`assets/ui/${folder}/jar.webp`] = anomalyCurrency;
  }
  const infectedMotherAsteroid = `${anomalyArt}/planet-compact-v57.webp`;
  terrainRefresh['assets/ui/planets/mutation-flora-v1/source-100.webp'] = infectedMotherAsteroid;
  terrainRefresh['assets/ui/planets/mother-substrate-v33/source-100.webp'] = infectedMotherAsteroid;
  for(const stage of [100,75,50,25,0]) {
    const destination=id=>`assets/ui/planets/mutation-flora-v1/${id}-${stage===0?0:100}.webp`;
    for(const id of ['home','candy','magma'])terrainRefresh[`assets/ui/planets/runtime-v1/${id}-${stage}.webp`]=destination(id);
    terrainRefresh[`assets/ui/planets/home-v2/home-${stage}.webp`]=destination('home');
    terrainRefresh[`assets/ui/planets/sky-v4/sky-${stage}.webp`]=destination('sky');
    terrainRefresh[`assets/ui/planets/runtime-v1/desert-${stage}.webp`]=destination('sky');
    terrainRefresh[`assets/ui/planets/source-v3/planet-${stage}.webp`]=stage===0?destination('source'):infectedMotherAsteroid;
  }
  for(const tier of ['fragile','normal','strong']) {
    const old=`assets/world1/slime-blocks-v2/block-${tier}.webp`;
    const current=`assets/world1/slime-blocks-v6/block-${tier==='fragile'?'fragile-porous-v10':tier}.webp`;
    for(const key of Object.keys(terrainRefresh))if(terrainRefresh[key]===old)terrainRefresh[key]=current;
    terrainRefresh[old]=current;
    terrainRefresh[`assets/world1/slime-blocks-v4/block-${tier}.webp`]=current;
    terrainRefresh[`assets/world1/slime-blocks-v5/block-${tier}.webp`]=current;
  }
  for(const filename of ['block-fragile','block-fragile-soft-v7','block-fragile-soft-v8','block-fragile-bubbles-v9'])terrainRefresh[`assets/world1/slime-blocks-v6/${filename}.webp`]='assets/world1/slime-blocks-v6/block-fragile-porous-v10.webp';
  for(const tier of ['fragile','normal','strong'])terrainRefresh[`assets/world5/planet-blocks-v3/sky-${tier}.webp`]=`assets/world5/rounded-blocks-v4/sky-${tier}.webp`;
  for(const tier of ['fragile','normal','strong'])terrainRefresh[`assets/world4/planet-blocks-v3/magma-${tier}.webp`]=`assets/world4/rounded-blocks-v4/magma-${tier}.webp`;
  terrainRefresh['assets/world3/candy-blocks-v1/wafer-fragile.webp']='assets/world3/candy-blocks-v2/cracker-fragile.webp';
  terrainRefresh['assets/world3/candy-blocks-v1/berry-candy-strong-v2.webp']='assets/world3/candy-blocks-v2/caramel-strong.webp';
  for(const key of Object.keys(paths))if(terrainRefresh[paths[key]])paths[key]=terrainRefresh[paths[key]];
  Object.assign(paths,terrainRefresh);
  window.SlimeAssetPaths = Object.freeze({ entries: () => Object.entries(paths), resolve(source) {
    const match = String(source).match(/^([^?#]+)(.*)$/);
    return match ? (paths[match[1]] || match[1]) + match[2] : source;
  } });
})();
