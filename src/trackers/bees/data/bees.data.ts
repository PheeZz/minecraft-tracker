// АВТОГЕНЕРАЦИЯ (scripts/gen-bees.mjs) из bees/mockups/bees-data.js. Не редактировать вручную.
import type { Bee } from '../domain/types'

export const BEES: Bee[] = [
  {
    id: 'Обычная',
    en: 'Common',
    source: 'F',
    parents: [
      {
        p1: 'дикая пчела (из улья)',
        p2: 'дикая пчела (из улья)',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 35,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Развитая',
    en: 'Cultivated',
    source: 'F',
    parents: [
      {
        p1: 'Обычная',
        p2: 'дикая пчела (из улья)',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Знатная',
    en: 'Noble',
    source: 'F',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Развитая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Капающие соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Величавая',
    en: 'Majestic',
    source: 'F',
    parents: [
      {
        p1: 'Знатная',
        p2: 'Развитая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Капающие соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Имперская',
    en: 'Imperial',
    source: 'F',
    parents: [
      {
        p1: 'Знатная',
        p2: 'Величавая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Капающие соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Маточное молочко',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Прилежная',
    en: 'Diligent',
    source: 'F',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Развитая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Вязкие соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Неутомимая',
    en: 'Unweary',
    source: 'F',
    parents: [
      {
        p1: 'Прилежная',
        p2: 'Развитая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Вязкие соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Трудолюбивая',
    en: 'Industrious',
    source: 'F',
    parents: [
      {
        p1: 'Прилежная',
        p2: 'Неутомимая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Вязкие соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Комок пыльцы',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Героическая',
    en: 'Heroic',
    source: 'F',
    parents: [
      {
        p1: 'Стойкая',
        p2: 'Доблестная',
        chance: 6,
      },
    ],
    products: [
      {
        name: 'Какао-соты',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Зловещая',
    en: 'Sinister',
    source: 'F',
    parents: [
      {
        p1: 'Развитая',
        p2: 'особый вид (задаётся конфигом)',
        chance: 60,
      },
    ],
    products: [
      {
        name: 'Кипящие соты',
        pct: 45,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Жестокая',
    en: 'Fiendish',
    source: 'F',
    parents: [
      {
        p1: 'Зловещая',
        p2: 'особый вид (задаётся конфигом)',
        chance: 40,
      },
    ],
    products: [
      {
        name: 'Кипящие соты',
        pct: 55,
        kind: 'product',
      },
      {
        name: 'Зола',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Одержимая',
    en: 'Demonic',
    source: 'F',
    parents: [
      {
        p1: 'Зловещая',
        p2: 'Жестокая',
        chance: 25,
      },
    ],
    products: [
      {
        name: 'Кипящие соты',
        pct: 45,
        kind: 'product',
      },
      {
        name: 'Светящаяся пыль',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Бережливая',
    en: 'Frugal',
    source: 'F',
    parents: [
      {
        p1: 'Скромная',
        p2: 'Зловещая',
        chance: 16,
      },
      {
        p1: 'Скромная',
        p2: 'Жестокая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Пересохшие соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Суровая',
    en: 'Austere',
    source: 'F',
    parents: [
      {
        p1: 'Скромная',
        p2: 'Бережливая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Пересохшие соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Рыхлые соты',
        pct: 50,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Редкая',
    en: 'Exotic',
    source: 'F',
    parents: [
      {
        p1: 'Суровая',
        p2: 'Тропическая',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Райская',
    en: 'Edenic',
    source: 'F',
    parents: [
      {
        p1: 'Редкая',
        p2: 'Тропическая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Призрачная',
    en: 'Spectral',
    source: 'F',
    parents: [
      {
        p1: 'Уединённая',
        p2: 'Драконья',
        chance: 4,
      },
    ],
    products: [
      {
        name: 'Таинственные соты',
        pct: 50,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Воображаемая',
    en: 'Phantasmal',
    source: 'F',
    parents: [
      {
        p1: 'Призрачная',
        p2: 'Драконья',
        chance: 2,
      },
    ],
    products: [
      {
        name: 'Таинственные соты',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ледяная',
    en: 'Icy',
    source: 'F',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Зимняя',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Морозные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Осколок льда',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ледниковая',
    en: 'Glacial',
    source: 'F',
    parents: [
      {
        p1: 'Ледяная',
        p2: 'Зимняя',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Морозные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Осколок льда',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Карательная',
    en: 'Vindictive',
    source: 'F',
    parents: [
      {
        p1: 'Монашья',
        p2: 'Одержимая',
        chance: 4,
      },
    ],
    products: [
      {
        name: 'Облучённые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Мстительная',
    en: 'Vengeful',
    source: 'F',
    parents: [
      {
        p1: 'Одержимая',
        p2: 'Карательная',
        chance: 8,
      },
      {
        p1: 'Монашья',
        p2: 'Карательная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Облучённые соты',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Мстящая',
    en: 'Avenging',
    source: 'F',
    parents: [
      {
        p1: 'Мстительная',
        p2: 'Карательная',
        chance: 4,
      },
    ],
    products: [
      {
        name: 'Облучённые соты',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Заячья',
    en: 'Leporine',
    source: 'F',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Лесная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Яйцо',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Весёлая',
    en: 'Merry',
    source: 'F',
    parents: [
      {
        p1: 'Зимняя',
        p2: 'Лесная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Морозные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Осколок льда',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Пьяная',
    en: 'Tipsy',
    source: 'F',
    parents: [
      {
        p1: 'Зимняя',
        p2: 'Луговая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Морозные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Осколок льда',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Хитрая',
    en: 'Tricky',
    source: 'F',
    parents: [
      {
        p1: 'Зловещая',
        p2: 'Обычная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 40,
        kind: 'product',
      },
      {
        name: 'Печенье',
        pct: 15,
        kind: 'product',
      },
      {
        name: 'Череп скелета',
        pct: 2,
        kind: 'specialty',
      },
      {
        name: 'Голова зомби',
        pct: 2,
        kind: 'specialty',
      },
      {
        name: 'Голова игрока',
        pct: 2,
        kind: 'specialty',
      },
      {
        name: 'Голова крипера',
        pct: 2,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Сельская',
    en: 'Rural',
    source: 'F',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Прилежная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Прошлая',
    en: 'Farmerly',
    source: 'F',
    parents: [
      {
        p1: 'Сельская',
        p2: 'Неутомимая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 27,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Земельная',
    en: 'Agrarian',
    source: 'F',
    parents: [
      {
        p1: 'Прошлая',
        p2: 'Трудолюбивая',
        chance: 6,
      },
    ],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 35,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Топкая',
    en: 'Miry',
    source: 'F',
    parents: [
      {
        p1: 'Болотная',
        p2: 'Знатная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Замшелые соты',
        pct: 36,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Болотистая',
    en: 'Boggy',
    source: 'F',
    parents: [
      {
        p1: 'Болотная',
        p2: 'Топкая',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Замшелые соты',
        pct: 39,
        kind: 'product',
      },
      {
        name: 'Торф',
        pct: 8,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Укромная',
    en: 'Secluded',
    source: 'F',
    parents: [
      {
        p1: 'Монашья',
        p2: 'Суровая',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Спелые соты',
        pct: 20,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Уединённая',
    en: 'Hermitic',
    source: 'F',
    parents: [
      {
        p1: 'Монашья',
        p2: 'Укромная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Спелые соты',
        pct: 20,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Засушливая',
    en: 'Arid',
    source: 'E',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Бережливая',
        chance: 10,
      },
      {
        p1: 'Лесная',
        p2: 'Бережливая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Бесплодная',
    en: 'Barren',
    source: 'E',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Засушливая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Заброшенная',
    en: 'Desolate',
    source: 'E',
    parents: [
      {
        p1: 'Засушливая',
        p2: 'Бесплодная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Разлагающаяся',
    en: 'Decomposing',
    source: 'E',
    parents: [
      {
        p1: 'Болотная',
        p2: 'Бесплодная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Разлагающиеся соты',
        pct: 8,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Мучительная',
    en: 'Gnawing',
    source: 'E',
    parents: [
      {
        p1: 'Лесная',
        p2: 'Бесплодная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Пыльные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Гнилая',
    en: 'Decaying',
    source: 'E',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Заброшенная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Гнилые соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Скелетная',
    en: 'Skeletal',
    source: 'E',
    parents: [
      {
        p1: 'Лесная',
        p2: 'Заброшенная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Костяные соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Криперная',
    en: 'Creepy',
    source: 'E',
    parents: [
      {
        p1: 'Скромная',
        p2: 'Заброшенная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Рыхлые соты',
        pct: 8,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Толерантная',
    en: 'Tolerant',
    source: 'E',
    parents: [
      {
        p1: 'Прилежная',
        p2: 'Каменная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Выносливая',
    en: 'Robust',
    source: 'E',
    parents: [
      {
        p1: 'Неутомимая',
        p2: 'Толерантная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Устойчивая',
    en: 'Resilient',
    source: 'E',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Выносливая',
        chance: 6,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Коррозийная',
    en: 'Corroded',
    source: 'E',
    parents: [
      {
        p1: 'Зимняя',
        p2: 'Устойчивая',
        chance: 5,
      },
      {
        p1: 'Скромная',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Медные соты',
        pct: 6,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Потускневшая',
    en: 'Tarnished',
    source: 'E',
    parents: [
      {
        p1: 'Болотная',
        p2: 'Устойчивая',
        chance: 5,
      },
      {
        p1: 'Тропическая',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Оловянные соты',
        pct: 6,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Ржавая',
    en: 'Rusty',
    source: 'E',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Устойчивая',
        chance: 5,
      },
      {
        p1: 'Лесная',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Железные соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Свинцовая',
    en: 'Leaden',
    source: 'E',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Устойчивая',
        chance: 5,
      },
      {
        p1: 'Скромная',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Свинцовые соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Оцинкованная',
    en: 'Galvanized',
    source: 'E',
    parents: [
      {
        p1: 'Зимняя',
        p2: 'Устойчивая',
        chance: 5,
      },
      {
        p1: 'Тропическая',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Цинковые соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Неприступная',
    en: 'Impregnable',
    source: 'E',
    parents: [
      {
        p1: 'Развитая',
        p2: 'Устойчивая',
        chance: 3,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Титановые соты',
        pct: 2,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Непобедимая',
    en: 'Invincible',
    source: 'E',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Устойчивая',
        chance: 3,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Вольфрамовые соты',
        pct: 1,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Взволнованная',
    en: 'Lustered',
    source: 'E',
    parents: [
      {
        p1: 'Лесная',
        p2: 'Устойчивая',
        chance: 5,
      },
      {
        p1: 'Болотная',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Никелевые соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Сверкающая',
    en: 'Glittering',
    source: 'E',
    parents: [
      {
        p1: 'Величавая',
        p2: 'Ржавая',
        chance: 2,
      },
      {
        p1: 'Величавая',
        p2: 'Коррозийная',
        chance: 2,
      },
      {
        p1: 'Величавая',
        p2: 'Взволнованная',
        chance: 2,
      },
      {
        p1: 'Величавая',
        p2: 'Непобедимая',
        chance: 2,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Золотые соты',
        pct: 2,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Сияющая',
    en: 'Shining',
    source: 'E',
    parents: [
      {
        p1: 'Величавая',
        p2: 'Оцинкованная',
        chance: 2,
      },
      {
        p1: 'Величавая',
        p2: 'Потускневшая',
        chance: 2,
      },
      {
        p1: 'Величавая',
        p2: 'Свинцовая',
        chance: 2,
      },
      {
        p1: 'Величавая',
        p2: 'Неприступная',
        chance: 2,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Серебряные соты',
        pct: 2,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Ценная',
    en: 'Valuable',
    source: 'E',
    parents: [
      {
        p1: 'Сверкающая',
        p2: 'Сияющая',
        chance: 2,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Платиновые соты',
        pct: 1,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Лазуритовая',
    en: 'Lapis',
    source: 'E',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Лазуритовые соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Изумрудная',
    en: 'Emerald',
    source: 'E',
    parents: [
      {
        p1: 'Лесная',
        p2: 'Лазуритовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Изумрудные соты',
        pct: 4,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Рубиновая',
    en: 'Ruby',
    source: 'E',
    parents: [
      {
        p1: 'Скромная',
        p2: 'Лазуритовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Рубиновые соты',
        pct: 3,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Сапфировая',
    en: 'Sapphire',
    source: 'E',
    parents: [
      {
        p1: 'Водная',
        p2: 'Лазуритовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Сапфировые соты',
        pct: 3,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Алмазная',
    en: 'Diamond',
    source: 'E',
    parents: [
      {
        p1: 'Развитая',
        p2: 'Лазуритовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Каменистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Алмазные соты',
        pct: 1,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Нестабильная',
    en: 'Unstable',
    source: 'E',
    parents: [
      {
        p1: 'Доисторическая',
        p2: 'Устойчивая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ядерная',
    en: 'Nuclear',
    source: 'E',
    parents: [
      {
        p1: 'Нестабильная',
        p2: 'Ржавая',
        chance: 5,
      },
      {
        p1: 'Нестабильная',
        p2: 'Коррозийная',
        chance: 5,
      },
      {
        p1: 'Нестабильная',
        p2: 'Потускневшая',
        chance: 5,
      },
      {
        p1: 'Нестабильная',
        p2: 'Оцинкованная',
        chance: 5,
      },
      {
        p1: 'Нестабильная',
        p2: 'Взволнованная',
        chance: 5,
      },
      {
        p1: 'Нестабильная',
        p2: 'Свинцовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Радиоактивная',
    en: 'Radioactive',
    source: 'E',
    parents: [
      {
        p1: 'Ядерная',
        p2: 'Сверкающая',
        chance: 5,
      },
      {
        p1: 'Ядерная',
        p2: 'Сияющая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Урановые соты',
        pct: 2,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Йеллориумовая',
    en: 'Yellorium',
    source: 'E',
    parents: [
      {
        p1: 'Бережливая',
        p2: 'Ядерная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Йеллориумовые соты',
        pct: 2,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Цианитовая',
    en: 'Cyanite',
    source: 'E',
    parents: [
      {
        p1: 'Ядерная',
        p2: 'Йеллориумовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Кианитовые соты',
        pct: 1,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Блутониевая',
    en: 'Blutonium',
    source: 'E',
    parents: [
      {
        p1: 'Цианитовая',
        p2: 'Йеллориумовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Бесплодные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Блутониевые соты',
        pct: 1,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Древняя',
    en: 'Ancient',
    source: 'E',
    parents: [
      {
        p1: 'Знатная',
        p2: 'Прилежная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Первобытная',
    en: 'Primeval',
    source: 'E',
    parents: [
      {
        p1: 'Укромная',
        p2: 'Древняя',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Доисторическая',
    en: 'Prehistoric',
    source: 'E',
    parents: [
      {
        p1: 'Первобытная',
        p2: 'Древняя',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Реликтовая',
    en: 'Relic',
    source: 'E',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Доисторическая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Окаменелая',
    en: 'Fossilised',
    source: 'E',
    parents: [
      {
        p1: 'Первобытная',
        p2: 'Прорастающая',
        chance: 8,
      },
      {
        p1: 'Сельская',
        p2: 'Первобытная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Окаменевшие соты',
        pct: 8,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Смолистая',
    en: 'Resinous',
    source: 'E',
    parents: [
      {
        p1: 'Топкая',
        p2: 'Первобытная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Янтарные соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Нефтяная',
    en: 'Oily',
    source: 'E',
    parents: [
      {
        p1: 'Океаническая',
        p2: 'Первобытная',
        chance: 8,
      },
      {
        p1: 'Бережливая',
        p2: 'Первобытная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Масляные соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Дистиллированная',
    en: 'Distilled',
    source: 'E',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Нефтяная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Древние соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Изысканная',
    en: 'Refined',
    source: 'E',
    parents: [
      {
        p1: 'Дистиллированная',
        p2: 'Нефтяная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Масляные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Нефтяные соты',
        pct: 4,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Медлительная',
    en: 'Tarry',
    source: 'E',
    parents: [
      {
        p1: 'Дистиллированная',
        p2: 'Окаменелая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Окаменевшие соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Смолистые соты',
        pct: 30,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Эластичная',
    en: 'Elastic',
    source: 'E',
    parents: [
      {
        p1: 'Дистиллированная',
        p2: 'Смолистая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Янтарные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Каучуковые соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Речная',
    en: 'River',
    source: 'E',
    parents: [
      {
        p1: 'Прилежная',
        p2: 'Водная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Влажные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Глиняные соты',
        pct: 20,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Океаническая',
    en: 'Ocean',
    source: 'E',
    parents: [
      {
        p1: 'Прилежная',
        p2: 'Водная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Влажные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Испачканная',
    en: 'Stained',
    source: 'E',
    parents: [
      {
        p1: 'Черномазая',
        p2: 'Океаническая',
        chance: 8,
      },
      {
        p1: 'Лесная',
        p2: 'Прилежная',
        chance: 10,
      },
      {
        p1: 'Прошлая',
        p2: 'Луговая',
        chance: 10,
      },
      {
        p1: 'Неутомимая',
        p2: 'Прорастающая',
        chance: 10,
      },
      {
        p1: 'Трудолюбивая',
        p2: 'Процветающая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Влажные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Краситель',
        pct: 10,
        kind: 'specialty',
      },
      {
        name: 'Медовые соты',
        pct: 35,
        kind: 'product',
      },
      {
        name: 'Пшеничные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Семянные соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Сладкая',
    en: 'Sweetened',
    source: 'E',
    parents: [
      {
        p1: 'Доблестная',
        p2: 'Прилежная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 40,
        kind: 'product',
      },
      {
        name: 'Сахар',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Сахарная',
    en: 'Sugary',
    source: 'E',
    parents: [
      {
        p1: 'Сельская',
        p2: 'Сладкая',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 40,
        kind: 'product',
      },
      {
        name: 'Сахар',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Созревающая',
    en: 'Ripening',
    source: 'E',
    parents: [
      {
        p1: 'Сладкая',
        p2: 'Прорастающая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Сахар',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Фруктовые соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Фруктовая',
    en: 'Fruity',
    source: 'E',
    parents: [
      {
        p1: 'Сладкая',
        p2: 'Процветающая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Сахар',
        pct: 15,
        kind: 'product',
      },
      {
        name: 'Фруктовые соты',
        pct: 20,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Ферментная',
    en: 'Fermented',
    source: 'E',
    parents: [
      {
        p1: 'Прошлая',
        p2: 'Луговая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Спиртовые соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Коровья',
    en: 'Bovine',
    source: 'E',
    parents: [
      {
        p1: 'Прошлая',
        p2: 'Водная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Молочные соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Кофейная',
    en: 'Caffeinated',
    source: 'E',
    parents: [
      {
        p1: 'Прошлая',
        p2: 'Тропическая',
        chance: 10,
      },
      {
        p1: 'Топкая',
        p2: 'Водная',
        chance: 10,
      },
      {
        p1: 'Болотистая',
        p2: 'Влажная',
        chance: 8,
      },
      {
        p1: 'Болотистая',
        p2: 'Топкая',
        chance: 8,
      },
      {
        p1: 'Болотистая',
        p2: 'Грибная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Кофейные соты',
        pct: 8,
        kind: 'specialty',
      },
      {
        name: 'Замшелые соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Грибные соты',
        pct: 15,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Яростная',
    en: 'Furious',
    source: 'E',
    parents: [
      {
        p1: 'Жестокая',
        p2: 'Озлобленная',
        chance: 30,
      },
    ],
    products: [
      {
        name: 'Кипящие соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Огнедышащая',
    en: 'Volcanic',
    source: 'E',
    parents: [
      {
        p1: 'Одержимая',
        p2: 'Яростная',
        chance: 20,
      },
    ],
    products: [
      {
        name: 'Кипящие соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Горящие соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Сердитая',
    en: 'Glowering',
    source: 'E',
    parents: [
      {
        p1: 'Яростная',
        p2: 'Возбуждённая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Пылающие соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Вредоносная',
    en: 'Malicious',
    source: 'E',
    parents: [
      {
        p1: 'Зловещая',
        p2: 'Тропическая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Заразная',
    en: 'Infectious',
    source: 'E',
    parents: [
      {
        p1: 'Тропическая',
        p2: 'Вредоносная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ядовитая',
    en: 'Virulent',
    source: 'E',
    parents: [
      {
        p1: 'Вредоносная',
        p2: 'Заразная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Ядовитые соты',
        pct: 12,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Вязкая',
    en: 'Viscous',
    source: 'E',
    parents: [
      {
        p1: 'Редкая',
        p2: 'Водная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Клейкая',
    en: 'Glutinous',
    source: 'E',
    parents: [
      {
        p1: 'Редкая',
        p2: 'Вязкая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Липкая',
    en: 'Sticky',
    source: 'E',
    parents: [
      {
        p1: 'Вязкая',
        p2: 'Клейкая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Слизистые соты',
        pct: 12,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Едкая',
    en: 'Corrosive',
    source: 'E',
    parents: [
      {
        p1: 'Вредоносная',
        p2: 'Вязкая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Едко-щелочная',
    en: 'Caustic',
    source: 'E',
    parents: [
      {
        p1: 'Жестокая',
        p2: 'Едкая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Серные соты',
        pct: 3,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Едко-кислотная',
    en: 'Acidic',
    source: 'E',
    parents: [
      {
        p1: 'Едкая',
        p2: 'Едко-щелочная',
        chance: 4,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Серные соты',
        pct: 16,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Возбуждённая',
    en: 'Excited',
    source: 'E',
    parents: [
      {
        p1: 'Доблестная',
        p2: 'Развитая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Энергетические соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Энергетическая',
    en: 'Energetic',
    source: 'E',
    parents: [
      {
        p1: 'Прилежная',
        p2: 'Возбуждённая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Энергетические соты',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Исступлённая',
    en: 'Ecstatic',
    source: 'E',
    parents: [
      {
        p1: 'Возбуждённая',
        p2: 'Энергетическая',
        chance: 8,
      },
      {
        p1: 'Зимняя',
        p2: 'Прилежная',
        chance: 10,
      },
      {
        p1: 'Океаническая',
        p2: 'Бесстрастная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Энергетические соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Статические соты',
        pct: 8,
        kind: 'specialty',
      },
      {
        name: 'Морозные соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Морозные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Ледяные соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Омрачённая',
    en: 'Shadowed',
    source: 'E',
    parents: [
      {
        p1: 'Зловещая',
        p2: 'Каменная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Теневые соты',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Потемневшая',
    en: 'Darkened',
    source: 'E',
    parents: [
      {
        p1: 'Омрачённая',
        p2: 'Каменная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Теневые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Глубинная',
    en: 'Abyssal',
    source: 'E',
    parents: [
      {
        p1: 'Омрачённая',
        p2: 'Потемневшая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Теневые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Тёмно-бордовая',
    en: 'Maroon',
    source: 'E',
    parents: [
      {
        p1: 'Лесная',
        p2: 'Доблестная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Красные окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Шафрановая',
    en: 'Saffron',
    source: 'E',
    parents: [
      {
        p1: 'Луговая',
        p2: 'Доблестная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Жёлтые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Прусская',
    en: 'Prussian',
    source: 'E',
    parents: [
      {
        p1: 'Доблестная',
        p2: 'Водная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Синие окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Зелёная',
    en: 'Natural',
    source: 'E',
    parents: [
      {
        p1: 'Тропическая',
        p2: 'Доблестная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Зелёные окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Черномазая',
    en: 'Ebony',
    source: 'E',
    parents: [
      {
        p1: 'Доблестная',
        p2: 'Каменная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Чёрные окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Отбелённая',
    en: 'Bleached',
    source: 'E',
    parents: [
      {
        p1: 'Зимняя',
        p2: 'Доблестная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Белые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Коричневая',
    en: 'Sepia',
    source: 'E',
    parents: [
      {
        p1: 'Болотная',
        p2: 'Доблестная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Коричневые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Оранжевая',
    en: 'Amber',
    source: 'E',
    parents: [
      {
        p1: 'Тёмно-бордовая',
        p2: 'Шафрановая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Оранжевые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Бирюзовая',
    en: 'Turquoise',
    source: 'E',
    parents: [
      {
        p1: 'Зелёная',
        p2: 'Прусская',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Бирюзовые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Фиолетовая',
    en: 'Indigo',
    source: 'E',
    parents: [
      {
        p1: 'Тёмно-бордовая',
        p2: 'Прусская',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Фиолетовые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Серая',
    en: 'Slate',
    source: 'E',
    parents: [
      {
        p1: 'Черномазая',
        p2: 'Отбелённая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Серые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Голубая',
    en: 'Azure',
    source: 'E',
    parents: [
      {
        p1: 'Прусская',
        p2: 'Отбелённая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Светло-голубые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Розовая',
    en: 'Lavender',
    source: 'E',
    parents: [
      {
        p1: 'Тёмно-бордовая',
        p2: 'Отбелённая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Розовые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Лаймовая',
    en: 'Lime',
    source: 'E',
    parents: [
      {
        p1: 'Зелёная',
        p2: 'Отбелённая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Лаймовые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Пурпурная',
    en: 'Fuchsia',
    source: 'E',
    parents: [
      {
        p1: 'Фиолетовая',
        p2: 'Розовая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Пурпурные окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Светло-серая',
    en: 'Ashen',
    source: 'E',
    parents: [
      {
        p1: 'Серая',
        p2: 'Отбелённая',
        chance: 5,
      },
      {
        p1: 'Суровая',
        p2: 'Возбуждённая',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 75,
        kind: 'product',
      },
      {
        name: 'Светло-серые окрашенные соты',
        pct: 25,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Изнурённая',
    en: 'Jaded',
    source: 'E',
    parents: [
      {
        p1: 'Драконья',
        p2: 'Реликтовая',
        chance: 2,
      },
      {
        p1: 'Суровая',
        p2: 'Заброшенная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Пыльца',
        pct: 20,
        kind: 'specialty',
      },
      {
        name: 'Фиолетовые окрашенные соты',
        pct: 15,
        kind: 'specialty',
      },
      {
        name: 'Нестабильные соты',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Квантовая',
    en: 'Quantum',
    source: 'E',
    parents: [
      {
        p1: 'Призрачная',
        p2: 'Пространственная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Кварцевые соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Уверенные соты',
        pct: 15,
        kind: 'specialty',
      },
      {
        name: 'Мерцающие соты',
        pct: 15,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Аномальная',
    en: 'Abnormal',
    source: 'E',
    parents: [
      {
        p1: 'Укромная',
        p2: 'Драконья',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Кварцевые соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Пространственная',
    en: 'Spatial',
    source: 'E',
    parents: [
      {
        p1: 'Уединённая',
        p2: 'Аномальная',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Кварцевые соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Уверенные соты',
        pct: 5,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Мистическая',
    en: 'Mystical',
    source: 'E',
    parents: [
      {
        p1: 'Знатная',
        p2: 'Монашья',
        chance: 5,
      },
    ],
    products: [],
  },
  {
    id: 'Лесная',
    en: 'Forest',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Медовые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Луговая',
    en: 'Meadows',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Медовые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Стойкая',
    en: 'Steadfast',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Какао-соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Доблестная',
    en: 'Valiant',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Какао-соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Сахар',
        pct: 15,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Скромная',
    en: 'Modest',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Пересохшие соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Тропическая',
    en: 'Tropical',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Драконья',
    en: 'Ender',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Таинственные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Зимняя',
    en: 'Wintry',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Морозные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Болотная',
    en: 'Marshy',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Замшелые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Монашья',
    en: 'Monastic',
    source: 'F',
    parents: [],
    products: [
      {
        name: 'Пшеничные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Спелые соты',
        pct: 10,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Каменная',
    en: 'Rocky',
    source: 'E',
    parents: [],
    products: [
      {
        name: 'Каменистые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Водная',
    en: 'Water',
    source: 'E',
    parents: [],
    products: [
      {
        name: 'Влажные соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Озлобленная',
    en: 'Embittered',
    source: 'E',
    parents: [],
    products: [
      {
        name: 'Кипящие соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Тайная',
    en: 'Esoteric',
    source: 'M',
    parents: [
      {
        p1: 'Развитая',
        p2: 'Древняя ✦',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Оккультные соты',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Таинственная',
    en: 'Mysterious',
    source: 'M',
    parents: [
      {
        p1: 'Древняя ✦',
        p2: 'Тайная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Оккультные соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Магическая',
    en: 'Arcane',
    source: 'M',
    parents: [
      {
        p1: 'Тайная',
        p2: 'Таинственная',
        chance: 8,
      },
    ],
    products: [],
  },
  {
    id: 'Заколдованная',
    en: 'Charmed',
    source: 'M',
    parents: [
      {
        p1: 'Развитая',
        p2: 'Древняя ✦',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Потусторонние соты',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Зачарованная',
    en: 'Enchanted',
    source: 'M',
    parents: [
      {
        p1: 'Древняя ✦',
        p2: 'Заколдованная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Потусторонние соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Сверхъестественная',
    en: 'Supernatural',
    source: 'M',
    parents: [
      {
        p1: 'Заколдованная',
        p2: 'Зачарованная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Потусторонние соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Эфирная',
    en: 'Ethereal',
    source: 'M',
    parents: [
      {
        p1: 'Магическая',
        p2: 'Сверхъестественная',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Оккультные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Потусторонние соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ветряная',
    en: 'Windy',
    source: 'M',
    parents: [
      {
        p1: 'Сверхъестественная',
        p2: 'Эфирная',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Воздушные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Водная ✦',
    en: 'Watery',
    source: 'M',
    parents: [
      {
        p1: 'Сверхъестественная',
        p2: 'Эфирная',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Водяные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Земляная',
    en: 'Earthen',
    source: 'M',
    parents: [
      {
        p1: 'Сверхъестественная',
        p2: 'Эфирная',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Земляные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Огненная',
    en: 'Firey',
    source: 'M',
    parents: [
      {
        p1: 'Сверхъестественная',
        p2: 'Эфирная',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Огненные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Памятная',
    en: 'Aware',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Приученная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Духовная',
    en: 'Spirit',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Памятная',
        chance: 8,
      },
      {
        p1: 'Приученная',
        p2: 'Памятная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 22,
        kind: 'product',
      },
      {
        name: 'Соты душ',
        pct: 16,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Душевная',
    en: 'Soul',
    source: 'M',
    parents: [
      {
        p1: 'Памятная',
        p2: 'Духовная',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 28,
        kind: 'product',
      },
      {
        name: 'Соты душ',
        pct: 20,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Подопечная',
    en: 'Pupil',
    source: 'M',
    parents: [
      {
        p1: 'Монашья',
        p2: 'Магическая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Бумажные соты',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Учёная',
    en: 'Scholarly',
    source: 'M',
    parents: [
      {
        p1: 'Магическая',
        p2: 'Подопечная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Бумажные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Сведущая',
    en: 'Savant',
    source: 'M',
    parents: [
      {
        p1: 'Подопечная',
        p2: 'Учёная',
        chance: 6,
      },
    ],
    products: [
      {
        name: 'Бумажные соты',
        pct: 40,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Временная',
    en: 'Timely',
    source: 'M',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Эфирная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Временные соты',
        pct: 16,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Роскошная',
    en: 'Lordly',
    source: 'M',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Временная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Временные соты',
        pct: 19,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Докторская',
    en: 'Doctoral',
    source: 'M',
    parents: [
      {
        p1: 'Временная',
        p2: 'Роскошная',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Временные соты',
        pct: 24,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ненавистная',
    en: 'Hateful',
    source: 'M',
    parents: [
      {
        p1: 'Адская',
        p2: 'Древняя ✦',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Расплавленные соты',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Злопамятная',
    en: 'Spiteful',
    source: 'M',
    parents: [
      {
        p1: 'Адская',
        p2: 'Ненавистная',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Расплавленные соты',
        pct: 24,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Иссушающая',
    en: 'Withering',
    source: 'M',
    parents: [
      {
        p1: 'Одержимая',
        p2: 'Злопамятная',
        chance: 6,
      },
    ],
    products: [],
  },
  {
    id: 'Прячущиеся',
    en: 'Skulking',
    source: 'M',
    parents: [
      {
        p1: 'Скромная',
        p2: 'Древняя ✦',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Паучая',
    en: 'Spidery',
    source: 'M',
    parents: [
      {
        p1: 'Тропическая',
        p2: 'Прячущиеся',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 13,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ужасная',
    en: 'Ghastly',
    source: 'M',
    parents: [
      {
        p1: 'Сумасшедшие',
        p2: 'Эфирная',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 8,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Тлеющая',
    en: 'Smouldering',
    source: 'M',
    parents: [
      {
        p1: 'Ужасная',
        p2: 'Ненавистная',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Расплавленные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Злющая',
    en: 'Big Bad',
    source: 'M',
    parents: [
      {
        p1: 'Прячущиеся',
        p2: 'Таинственная',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Куриные',
    en: 'Poultry',
    source: 'M',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Прячущиеся',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Мясистые',
    en: 'Beefy',
    source: 'M',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Прячущиеся',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Свиные',
    en: 'Porcine',
    source: 'M',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Прячущиеся',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Овечья',
    en: 'Sheepish',
    source: 'M',
    parents: [
      {
        p1: 'Свиные',
        p2: 'Прячущиеся',
        chance: 13,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Лошадиная',
    en: 'Neighsayer',
    source: 'M',
    parents: [
      {
        p1: 'Мясистые',
        p2: 'Овечья',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Кошачья',
    en: 'Catty',
    source: 'M',
    parents: [
      {
        p1: 'Куриные',
        p2: 'Паучая',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 25,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Сумасшедшие',
    en: 'Batty',
    source: 'M',
    parents: [
      {
        p1: 'Прячущиеся',
        p2: 'Ветряная',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Скрытные соты',
        pct: 23,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Умные',
    en: 'Brainy',
    source: 'M',
    parents: [
      {
        p1: 'Прячущиеся',
        p2: 'Подопечная',
        chance: 9,
      },
      {
        p1: 'Прячущиеся',
        p2: 'Изменчивая',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Безымянная',
    en: 'Nameless',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Забвенная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Забытые соты',
        pct: 19,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Брошенная',
    en: 'Abandoned',
    source: 'M',
    parents: [
      {
        p1: 'Забвенная',
        p2: 'Безымянная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Забытые соты',
        pct: 24,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Одинокая',
    en: 'Forlorn',
    source: 'M',
    parents: [
      {
        p1: 'Безымянная',
        p2: 'Брошенная',
        chance: 6,
      },
    ],
    products: [
      {
        name: 'Забытые соты',
        pct: 30,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Драконья ✦',
    en: 'Draconic',
    source: 'M',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Брошенная',
        chance: 6,
      },
    ],
    products: [],
  },
  {
    id: 'Изменчивая',
    en: 'Mutable',
    source: 'M',
    parents: [
      {
        p1: 'Необычная',
        p2: 'Древняя ✦',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Пересохшие соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Трансмутирующая',
    en: 'Transmuting',
    source: 'M',
    parents: [
      {
        p1: 'Необычная',
        p2: 'Изменчивая',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Пересохшие соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Шелковистые соты',
        pct: 5,
        kind: 'product',
      },
      {
        name: 'Кипящие соты',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Разрушающая',
    en: 'Crumbling',
    source: 'M',
    parents: [
      {
        p1: 'Необычная',
        p2: 'Изменчивая',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Пересохшие соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Рыхлые соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Какао-соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Невидимая',
    en: 'Invisible',
    source: 'M',
    parents: [
      {
        p1: 'Мистическая ✦',
        p2: 'Изменчивая',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Обыденные соты',
        pct: 35,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Медная',
    en: 'Cuprum',
    source: 'M',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Луговая',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Оловянная',
    en: 'Stannum',
    source: 'M',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Лесная',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Железистая',
    en: 'Ferrous',
    source: 'M',
    parents: [
      {
        p1: 'Обычная',
        p2: 'Трудолюбивая',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Серебряная',
    en: 'Argentum',
    source: 'M',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Скромная',
        chance: 8,
      },
    ],
    products: [],
  },
  {
    id: 'Алюминиевая',
    en: 'Aluminum',
    source: 'M',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Развитая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ардитовая',
    en: 'Ardite',
    source: 'M',
    parents: [
      {
        p1: 'Трудолюбивая',
        p2: 'Адская',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Кобальтовая',
    en: 'Cobalt',
    source: 'M',
    parents: [
      {
        p1: 'Имперская',
        p2: 'Адская',
        chance: 11,
      },
      {
        p1: 'Имперская',
        p2: 'Адская',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Мануллиновая',
    en: 'Manyullyn',
    source: 'M',
    parents: [
      {
        p1: 'Ардитовая',
        p2: 'Кобальтовая',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Алмазная ✦',
    en: 'Diamandi',
    source: 'M',
    parents: [
      {
        p1: 'Суровая',
        p2: 'Золотоносная',
        chance: 7,
      },
    ],
    products: [],
  },
  {
    id: 'Апатитовая',
    en: 'Apatine',
    source: 'M',
    parents: [
      {
        p1: 'Сельская',
        p2: 'Медная',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Аура',
    en: 'Aer',
    source: 'M',
    parents: [
      {
        p1: 'Ветряная',
        p2: 'Ветряная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты Воздуха (TC)',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Игнис',
    en: 'Ignis',
    source: 'M',
    parents: [
      {
        p1: 'Огненная',
        p2: 'Огненная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты Огня (TC)',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Аква',
    en: 'Aqua',
    source: 'M',
    parents: [
      {
        p1: 'Водная ✦',
        p2: 'Водная ✦',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты Воды (TC)',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Солим',
    en: 'Solum',
    source: 'M',
    parents: [
      {
        p1: 'Земляная',
        p2: 'Земляная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты Земли (TC)',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Праекантатио',
    en: 'Ordered',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Магическая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты Порядка (TC)',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Абсолютные',
    en: 'Chaotic',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Сверхъестественная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты Хаоса (TC)',
        pct: 20,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Вис',
    en: 'Vis',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Адская',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Омолаживающая',
    en: 'Rejuvenating',
    source: 'M',
    parents: [
      {
        p1: 'Приученная',
        p2: 'Вис',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Усиливающая',
    en: 'Empowering',
    source: 'M',
    parents: [
      {
        p1: 'Вис',
        p2: 'Омолаживающая',
        chance: 6,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 14,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Нексус',
    en: 'Nexus',
    source: 'M',
    parents: [
      {
        p1: 'Омолаживающая',
        p2: 'Усиливающая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Временные соты',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Льняные',
    en: 'Flux',
    source: 'M',
    parents: [
      {
        p1: 'Трансмутирующая',
        p2: 'Усиливающая',
        chance: 11,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 18,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Чистые',
    en: 'Pure',
    source: 'M',
    parents: [
      {
        p1: 'Трансмутирующая',
        p2: 'Омолаживающая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 16,
        kind: 'product',
      },
      {
        name: 'Соты душ',
        pct: 19,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Алчная',
    en: 'Ravening',
    source: 'M',
    parents: [
      {
        p1: 'Злющая',
        p2: 'Вис',
        chance: 20,
      },
    ],
    products: [
      {
        name: 'Соты разума',
        pct: 28,
        kind: 'product',
      },
      {
        name: 'Временные соты',
        pct: 20,
        kind: 'specialty',
      },
    ],
  },
  {
    id: 'Виспи',
    en: 'Wispy',
    source: 'M',
    parents: [
      {
        p1: 'Эфирная',
        p2: 'Ужасная',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Шелковистые соты',
        pct: 22,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Пустотная',
    en: 'Void',
    source: 'M',
    parents: [
      {
        p1: 'Железистая',
        p2: 'Льняные',
        chance: 5,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Эссенция',
    en: 'Essence',
    source: 'M',
    parents: [
      {
        p1: 'Магическая',
        p2: 'Эфирная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Соты эссенции (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Квинтэссенция',
    en: 'Quintessential',
    source: 'M',
    parents: [
      {
        p1: 'Магическая',
        p2: 'Эссенция',
        chance: 7,
      },
    ],
    products: [
      {
        name: 'Соты эссенции (AM)',
        pct: 23,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Эолова',
    en: 'Aiolic',
    source: 'M',
    parents: [
      {
        p1: 'Эссенция',
        p2: 'Ветряная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Земная',
    en: 'Terrestric',
    source: 'M',
    parents: [
      {
        p1: 'Эссенция',
        p2: 'Земляная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Магматическая',
    en: 'Igneous',
    source: 'M',
    parents: [
      {
        p1: 'Эссенция',
        p2: 'Огненная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Водянистая',
    en: 'Aqueous',
    source: 'M',
    parents: [
      {
        p1: 'Эссенция',
        p2: 'Водная ✦',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Арканная',
    en: 'Arcane',
    source: 'M',
    parents: [
      {
        p1: 'Эссенция',
        p2: 'Эфирная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 19,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Молниевая',
    en: 'Fulguric',
    source: 'M',
    parents: [
      {
        p1: 'Ветряная',
        p2: 'Эолова',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Кустарниковая',
    en: 'Fruticic',
    source: 'M',
    parents: [
      {
        p1: 'Земляная',
        p2: 'Земная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Гляциальная',
    en: 'Glacic',
    source: 'M',
    parents: [
      {
        p1: 'Водная ✦',
        p2: 'Водянистая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Могучие соты (AM)',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Вихревые',
    en: 'Vortex',
    source: 'M',
    parents: [
      {
        p1: 'Прячущиеся',
        p2: 'Эссенция',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты эссенции (AM)',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Умертвие',
    en: 'Wight',
    source: 'M',
    parents: [
      {
        p1: 'Прячущиеся',
        p2: 'Ужасная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Соты душ',
        pct: 30,
        kind: 'product',
      },
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'specialty',
      },
      {
        name: 'Расплавленные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Алхимические',
    en: 'Minium',
    source: 'M',
    parents: [
      {
        p1: 'Бережливая',
        p2: 'Изменчивая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Оккультные соты',
        pct: 16,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Флюксовая',
    en: 'Fluxed',
    source: 'M',
    parents: [
      {
        p1: 'Электрумовая',
        p2: 'Дестабилизированная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Бронзовая',
    en: 'Bronzed',
    source: 'M',
    parents: [
      {
        p1: 'Оловянная',
        p2: 'Медная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Электрумовая',
    en: 'Electrum',
    source: 'M',
    parents: [
      {
        p1: 'Золотоносная',
        p2: 'Серебряная',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Никелевая',
    en: 'Nickel',
    source: 'M',
    parents: [
      {
        p1: 'Железистая',
        p2: 'Тайная',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Инваровая',
    en: 'Invar',
    source: 'M',
    parents: [
      {
        p1: 'Железистая',
        p2: 'Никелевая',
        chance: 14,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Платиновая',
    en: 'Platinum',
    source: 'M',
    parents: [
      {
        p1: 'Никелевая',
        p2: 'Инваровая',
        chance: 10,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Углеродная',
    en: 'Carbon',
    source: 'M',
    parents: [
      {
        p1: 'Злопамятная',
        p2: 'Оловянная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Медовые соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Угольные соты (TE)',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Дестабилизированная',
    en: 'Destabilized',
    source: 'M',
    parents: [
      {
        p1: 'Злопамятная',
        p2: 'Трудолюбивая',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Дестабилизированные соты (TE)',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Оккультные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Световая',
    en: 'Lux',
    source: 'M',
    parents: [
      {
        p1: 'Тлеющая',
        p2: 'Адская',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Светящиеся соты (TE)',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Оккультные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Дантова',
    en: 'Dante',
    source: 'M',
    parents: [
      {
        p1: 'Тлеющая',
        p2: 'Суровая',
        chance: 12,
      },
    ],
    products: [],
  },
  {
    id: 'Пирокластическая',
    en: 'Pyro',
    source: 'M',
    parents: [
      {
        p1: 'Дантова',
        p2: 'Углеродная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Расплавленные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Метельная',
    en: 'Blizzy',
    source: 'M',
    parents: [
      {
        p1: 'Прячущиеся',
        p2: 'Зимняя',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Морозные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Стылая',
    en: 'Gelid',
    source: 'M',
    parents: [
      {
        p1: 'Метельная',
        p2: 'Ледяная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Морозные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Шокирующая',
    en: 'Shocking',
    source: 'M',
    parents: [
      {
        p1: 'Тлеющая',
        p2: 'Ветряная',
        chance: 13,
      },
    ],
    products: [
      {
        name: 'Воздушные соты',
        pct: 16,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Заряженная',
    en: 'Amped',
    source: 'M',
    parents: [
      {
        p1: 'Шокирующая',
        p2: 'Ветряная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Воздушные соты',
        pct: 29,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Заземлённая',
    en: 'Grounded',
    source: 'M',
    parents: [
      {
        p1: 'Тлеющая',
        p2: 'Земляная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Земляные соты',
        pct: 16,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Рокерская',
    en: "Rockin'",
    source: 'M',
    parents: [
      {
        p1: 'Заземлённая',
        p2: 'Земляная',
        chance: 9,
      },
    ],
    products: [
      {
        name: 'Земляные соты',
        pct: 29,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Обаятельная',
    en: 'Winsome',
    source: 'M',
    parents: [
      {
        p1: 'Платиновая',
        p2: 'Забвенная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Скрытные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Чарующие соты (TE)',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Милая',
    en: 'Endearing',
    source: 'M',
    parents: [
      {
        p1: 'Обаятельная',
        p2: 'Углеродная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Таинственные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Чарующие соты (TE)',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Укоренённая',
    en: 'Rooted',
    source: 'M',
    parents: [
      {
        p1: 'Древняя ✦',
        p2: 'Лесная',
        chance: 15,
      },
    ],
    products: [
      {
        name: 'Обыденные соты',
        pct: 10,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Дремотная',
    en: 'Somnolent',
    source: 'M',
    parents: [
      {
        p1: 'Укоренённая',
        p2: 'Водная ✦',
        chance: 16,
      },
    ],
    products: [
      {
        name: 'Водяные соты',
        pct: 8,
        kind: 'product',
      },
      {
        name: 'Соты душ',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Сновидческая',
    en: 'Dreaming',
    source: 'M',
    parents: [
      {
        p1: 'Ветряная',
        p2: 'Дремотная',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Водяные соты',
        pct: 16,
        kind: 'product',
      },
      {
        name: 'Соты душ',
        pct: 33,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Цветущая',
    en: 'Blossom',
    source: 'M',
    parents: [
      {
        p1: 'Ботаническая',
        p2: 'Земляная',
        chance: 12,
      },
    ],
    products: [
      {
        name: 'Обыденные соты',
        pct: 20,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Цветочная',
    en: 'Floral',
    source: 'M',
    parents: [
      {
        p1: 'Ботаническая',
        p2: 'Цветущая',
        chance: 8,
      },
    ],
    products: [
      {
        name: 'Обыденные соты',
        pct: 25,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Небокаменная',
    en: 'Skystone',
    source: 'M',
    parents: [
      {
        p1: 'Земляная',
        p2: 'Ветряная',
        chance: 20,
      },
    ],
    products: [
      {
        name: 'Земляные соты',
        pct: 19,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Мистическая ✦',
    en: 'Mystical',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Обыденные соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Волшебная',
    en: 'Sorcerous',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Обыденные соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Необычная',
    en: 'Unusual',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Обыденные соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Приученная',
    en: 'Attuned',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Обыденные соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Древняя ✦',
    en: 'Eldritch',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Обыденные соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Адская',
    en: 'Infernal',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Расплавленные соты',
        pct: 12,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Забвенная',
    en: 'Oblivion',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Забытые соты',
        pct: 14,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Ботаническая',
    en: 'Botanic',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Обыденные соты',
        pct: 10,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 5,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Вазби',
    en: 'Vazbee',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Соты душ',
        pct: 5,
        kind: 'product',
      },
      {
        name: 'Трансмутированные соты',
        pct: 15,
        kind: 'product',
      },
    ],
  },
  {
    id: 'Альвхеймская',
    en: 'Alfheim',
    source: 'M',
    parents: [],
    products: [
      {
        name: 'Потусторонние соты',
        pct: 28,
        kind: 'product',
      },
    ],
  },
]

export const BEE_BY_ID: Readonly<Record<string, Bee>> = Object.fromEntries(
  BEES.map((b) => [b.id, b]),
)
