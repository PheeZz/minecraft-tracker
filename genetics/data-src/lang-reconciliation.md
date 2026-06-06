# Сверка локализации генетики — i18n ↔ официальные .lang

> Источник офиц.: ru_RU/en_US.lang из JAR (forestry 4.2.16.64, binnie 2.0.22.7, gendustry 1.6.4.135, magicbees 2.4.4).
> Файл `bees/i18n/genetics-i18n.json` НЕ изменялся — это только отчёт расхождений.

**Итоги по видам:** EN-расхождений: 53 · RU-расхождений (где есть офиц. RU): 52 · видов i18n без сопоставления: 0

Главное наблюдение: для **MagicBees** в i18n многие `en` — это плейсхолдеры из enum (`TcAir`, `AmEssence`, `TeBronze`, `Earthy`, `Bigbad`, `Chicken`…), а не реальные in-game названия (`Aer`, `Essence`, `Bronzed`, `Earthen`, `Big Bad`, `Poultry`…). См. таблицу «расхождение EN».

## Признаки (traits)  ·  forestry for.gui.*

| i18n EN-ключ | наше RU | офиц. ru_RU | офиц. en_US | RU совпадает? |
|---|---|---|---|---|
| Species | Вид | — | — | — |
| Speed | Скорость | Скорость производства | Production | ❌ |
| Lifespan | Продолжительность жизни | Срок жизни | Lifespan | ❌ |
| Fertility | Плодовитость | Плодовитость | Fertility | ✅ |
| Temperature Tolerance | Адаптация к температуре | Температура | Temperature | ❌ |
| Humidity Tolerance | Адаптация к влажности | Влажность | Humidity | ❌ |
| Nocturnal | Ночная активность | Ночная | Nocturnal | ❌ |
| Tolerant Flyer | Полёт в дождь | устойчивый летун | Tolerant Flyer | ❌ |
| Cave Dwelling | Пещерная активность | Пещерная | Cave Dwelling | ❌ |
| Flowering | Опыление | Скорость опыления | Pollination | ❌ |
| Territory | Территория | Территория | Territory | ✅ |
| Effect | Эффект | Эффект | Effect | ✅ |
| Flower Provider | Опыляемые цветы | Вид цветка | Flower Type | ❌ |

## Аллели · speed · forestry.allele.*

| EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Slowest | Очень медленная | Самый медленный | Slowest | ❌ |
| Slower | Медленная | Очень медленный | Slower | ❌ |
| Slow | Неторопливая | Медленный | Slow | ❌ |
| Normal | Обычная | Обычный | Normal | ❌ |
| Fast | Быстрая | Быстрый | Fast | ❌ |
| Faster | Очень быстрая | Очень быстрый | Faster | ❌ |
| Fastest | Наибыстрейшая | Быстрейший | Fastest | ❌ |

## Аллели · lifespan · forestry.allele.*

| EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Shortest | Наикратчайший | Наикратчайший | Shortest | ✅ |
| Shorter | Кратчайший | Кратчайший | Shorter | ✅ |
| Short | Краткий | Краткий | Short | ✅ |
| Shortened | Короткий | Короткий | Shortened | ✅ |
| Normal | Обычный | Обычный | Normal | ✅ |
| Elongated | Продлённый | Продлённый | Elongated | ✅ |
| Long | Длинный | Длинный | Long | ✅ |
| Longer | Очень длинный | Очень длинный | Longer | ✅ |
| Longest | Длиннейший | Длиннейший | Longest | ✅ |

## Аллели · flowering · forestry.allele.*

| EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Slowest | Очень медленная | Самый медленный | Slowest | ❌ |
| Slower | Медленная | Очень медленный | Slower | ❌ |
| Slow | Неторопливая | Медленный | Slow | ❌ |
| Average | Средняя | Средний | Average | ❌ |
| Fast | Быстрая | Быстрый | Fast | ❌ |
| Faster | Очень быстрая | Очень быстрый | Faster | ❌ |
| Fastest | Наибыстрейшая | Быстрейший | Fastest | ❌ |

## Аллели · tolerance (tempTol/humidTol) · forestry.allele.tolerance.*

| EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| None | (нет в i18n) | Нет | None | — |
| Up 1 | (нет в i18n) | Вверх 1 | Up 1 | — |
| Up 2 | (нет в i18n) | Вверх 2 | Up 2 | — |
| Up 3 | (нет в i18n) | Вверх 3 | Up 3 | — |
| Down 1 | (нет в i18n) | Вниз 1 | Down 1 | — |
| Down 2 | (нет в i18n) | Вниз 2 | Down 2 | — |
| Down 3 | (нет в i18n) | Вниз 3 | Down 3 | — |
| Both 1 | (нет в i18n) | Обе 1 | Both 1 | — |
| Both 2 | (нет в i18n) | Обе 2 | Both 2 | — |
| Both 3 | (нет в i18n) | Обе 3 | Both 3 | — |
| Both 5 | (нет в i18n) | Обе 5 | Both 5 | — |

## Аллели · territory · forestry.allele.*

| EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Average | Средняя | Средний | Average | ❌ |
| Large | Большая | Большой | Large | ❌ |
| Larger | Очень большая | Очень большой | Larger | ❌ |
| Largest | Наибольшая | Крупнейший | Largest | ❌ |

## Аллели · effect · forestry.allele.effect.*  (наш EN-ключ → офиц. allele)

| i18n EN | наше RU | офиц. ru_RU | офиц. en_US (display) | RU? |
|---|---|---|---|---|
| None | Нет | Нет | None | ✅ |
| Aggressive | Агрессивный | Агрессивность | Aggress. | ❌ |
| Beatific | Благостный | Блаженность | Beatific | ❌ |
| Creeper | Крипер | Крипер | Creeper | ✅ |
| Explorer | Исследователь | Исследовательность | Explorer | ❌ |
| Freezing | Замораживающий | Замораживание | Freezing | ❌ |
| Heroic | Героический | Геройство | Heroic | ❌ |
| Flammable | Воспламеняющий | Воспламенение | Flammable | ❌ |
| Poison | Ядовитый | Отравление | Poison | ❌ |
| Ends | Иссушающий | Окончание | Ends | ❌ |
| Radioactive | Радиоактивный | Радиоактивность | Radioact. | ❌ |
| Drunkard | Опьяняющий | Опьянение | Drunkard | ❌ |
| Repulsion | Отталкивающий | Отвращение | Repulsion | ❌ |
| Reanimation | Реанимирующий | Реанимация | Reanimation | ❌ |

## Аллели · flowers (опыляемые цветы) · for.flowers.*

| i18n EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Flowers | Цветы | Цветы | Flowers | ✅ |
| Nether | Адские | Нарост Нижнего мира | Nether | ❌ |
| Cacti | Кактусы | Кактусы | Cacti | ✅ |
| Jungle | Джунгли | Лианы и папоротники | Jungle | ❌ |
| End | Энд | Край | End | ❌ |
| Wheat | Пшеница | Пшеница | Wheat | ✅ |
| Mushrooms | Грибы | Грибы | Mushroom | ✅ |
| Gourds | Тыквы | Бахчевые | Gourds | ❌ |

## Машины · Binnie (genetics) · genetics.machine.machine.*

| i18n EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Incubator | Инкубатор | — | (ключ не найден — иное имя/процедурно) | — |
| Genepool | Сборщик ДНК | — | (ключ не найден — иное имя/процедурно) | — |
| Isolator | Изолятор | Изолятор | Isolator | ✅ |
| Analyser | Анализатор | — | (ключ не найден — иное имя/процедурно) | — |
| Polymerizer | Полимеризатор | Полимеризатор | Polymeriser | ✅ |
| Sequencer | Секвенсор | Секвенсор | Sequencer | ✅ |
| Inoculator | Инокулятор | Инокулятор | Inoculator | ✅ |
| Splicer | Сплайсер | — | (ключ не найден — иное имя/процедурно) | — |
| Acclimatiser | Акклиматизатор | — | (ключ не найден — иное имя/процедурно) | — |
| Lab Stand | Лабораторная стойка | — | (ключ не найден — иное имя/процедурно) | — |

## Ресурсы/предметы · Binnie (best-effort ключи)

| i18n EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Gene Database | база данных генов | — | — | — |
| Blank Sequence | Бланк секвенсора | Сыворотка ДНК | DNA Sequence | — |
| Serum | Серум / Генетическая посуда | — | — | — |

## Машины/предметы · Gendustry · tile/item.gendustry.*

| i18n EN | наше RU | офиц. ru_RU | офиц. en_US | RU? |
|---|---|---|---|---|
| Genetic Sampler | Генетический пробоотборник | Генетический пробоотборник | Genetic Sampler | ✅ |
| Genetic Imprinter | Генетический импринтер | Генетический импринтер | Genetic Imprinter | ✅ |
| Genetic Transposer | Генетический транспозер | Генетический транспозер | Genetic Transposer | ✅ |
| Genetic Replicator | Генетический репликатор | Генетический репликатор | Genetic Replicator | ✅ |
| Genetic Template | Генетический шаблон | Генетический шаблон | Genetic Template | ✅ |
| Genetic Sample | Образец гена | Образец гена | Gene Sample | ✅ |
| Mutatron | Мутатрон | Мутатрон | Mutatron | ✅ |
| Mutagen Producer | Мутагенный производитель | Мутагенный производитель | Mutagen Producer | ✅ |
| Industrial Apiary | Промышленная пасека | Промышленная пасека | Industrial Apiary | ✅ |
| Protein | Протеин | Протеин | Protein | ✅ |

## Виды — сводка (i18n EN-ключ ↔ официальный in-game EN ↔ RU)

| mod | i18n EN | офиц. en_US | EN? | наше RU | офиц. ru_RU | RU? |
|---|---|---|---|---|---|---|
| ExtraBees | Abnormal | Abnormal | ✅ | Аномальная | Аномальная | ✅ |
| ExtraBees | Absolute | Absolute | ✅ | (нет в i18n) | Самовластная | ❌ |
| ExtraBees | Abyssal | Abyssal | ✅ | Глубинная | Глубинная | ✅ |
| ExtraBees | Acidic | Acidic | ✅ | Едко-кислотная | Едко-кислотная | ✅ |
| ExtraBees | Amber | Amber | ✅ | Оранжевая | Оранжевая | ✅ |
| ExtraBees | Ancient | Ancient | ✅ | Древняя | Древняя | ✅ |
| ExtraBees | Arid | Arid | ✅ | Засушливая | Засушливая | ✅ |
| ExtraBees | Ashen | Ashen | ✅ | Светло-серая | Светло-серая | ✅ |
| ExtraBees | Azure | Azure | ✅ | Голубая | Голубая | ✅ |
| ExtraBees | Barren | Barren | ✅ | Бесплодная | Бесплодная | ✅ |
| ExtraBees | Bleached | Bleached | ✅ | Отбелённая | Отбелённая | ✅ |
| ExtraBees | Blooming | Blooming | ✅ | (нет в i18n) | Цветущая | ❌ |
| ExtraBees | Blutonium | Blutonium | ✅ | Блутониевая | Блутониевая | ✅ |
| ExtraBees | Bovine | Bovine | ✅ | Коровья | Коровья | ✅ |
| ExtraBees | Caffeinated | Caffeinated | ✅ | Кофейная | Кофейная | ✅ |
| ExtraBees | Caustic | Caustic | ✅ | Едко-щелочная | Едко-щелочная | ✅ |
| ExtraBees | Celebratory | Celebratory | ✅ | (нет в i18n) | Праздничная | ❌ |
| ExtraBees | Corroded | Corroded | ✅ | Коррозийная | Коррозийная | ✅ |
| ExtraBees | Corrosive | Corrosive | ✅ | Едкая | Едкая | ✅ |
| ExtraBees | Creepy | Creepy | ✅ | Криперная | Криперная | ✅ |
| ExtraBees | Cyanite | Cyanite | ✅ | Цианитовая | Цианитовая | ✅ |
| ExtraBees | Damp | Damp | ✅ | (нет в i18n) | Влажная | ❌ |
| ExtraBees | Darkened | Darkened | ✅ | Потемневшая | Потемневшая | ✅ |
| ExtraBees | Decaying | Decaying | ✅ | Гнилая | Гнилая | ✅ |
| ExtraBees | Decomposing | Decomposing | ✅ | Разлагающаяся | Разлагающаяся | ✅ |
| ExtraBees | Desolate | Desolate | ✅ | Заброшенная | Заброшенная | ✅ |
| ExtraBees | Diamond | Diamond | ✅ | Алмазная | Алмазная | ✅ |
| ExtraBees | Distilled | Distilled | ✅ | Дистиллированная | Дистиллированная | ✅ |
| ExtraBees | Ebony | Ebony | ✅ | Черномазая | Черномазая | ✅ |
| ExtraBees | Ecstatic | Ecstatic | ✅ | Исступлённая | Исступлённая | ✅ |
| ExtraBees | Elastic | Elastic | ✅ | Эластичная | Эластичная | ✅ |
| ExtraBees | Embittered | Embittered | ✅ | Озлобленная | Озлобленная | ✅ |
| ExtraBees | Emerald | Emerald | ✅ | Изумрудная | Изумрудная | ✅ |
| ExtraBees | Energetic | Energetic | ✅ | Энергетическая | Энергетическая | ✅ |
| ExtraBees | Excited | Excited | ✅ | Возбуждённая | Возбуждённая | ✅ |
| ExtraBees | Farmed | Farmed | ✅ | (нет в i18n) | Фермерская | ❌ |
| ExtraBees | Fermented | Fermented | ✅ | Ферментная | Ферментная | ✅ |
| ExtraBees | Fossilised | Fossilised | ✅ | Окаменелая | Окаменелая | ✅ |
| ExtraBees | Frigid | Frigid | ✅ | (нет в i18n) | Бесстрастная | ❌ |
| ExtraBees | Fruity | Fruity | ✅ | Фруктовая | Фруктовая | ✅ |
| ExtraBees | Fuchsia | Fuchsia | ✅ | Пурпурная | Пурпурная | ✅ |
| ExtraBees | Fungal | Fungal | ✅ | (нет в i18n) | Грибная | ❌ |
| ExtraBees | Furious | Furious | ✅ | Яростная | Яростная | ✅ |
| ExtraBees | Galvanized | Galvanized | ✅ | Оцинкованная | Оцинкованная | ✅ |
| ExtraBees | Glittering | Glittering | ✅ | Сверкающая | Сверкающая | ✅ |
| ExtraBees | Glowering | Glowering | ✅ | Сердитая | Сердитая | ✅ |
| ExtraBees | Glutinous | Glutinous | ✅ | Клейкая | Клейкая | ✅ |
| ExtraBees | Gnawing | Gnawing | ✅ | Мучительная | Мучительная | ✅ |
| ExtraBees | Growing | Growing | ✅ | (нет в i18n) | Прорастающая | ❌ |
| ExtraBees | Hazardous | Hazardous | ✅ | (нет в i18n) | Опасная | ❌ |
| ExtraBees | Impregnable | Impregnable | ✅ | Неприступная | Неприступная | ✅ |
| ExtraBees | Indigo | Indigo | ✅ | Фиолетовая | Фиолетовая | ✅ |
| ExtraBees | Infectious | Infectious | ✅ | Заразная | Заразная | ✅ |
| ExtraBees | Invincible | Invincible | ✅ | Непобедимая | Непобедимая | ✅ |
| ExtraBees | Jaded | Jaded | ✅ | Изнурённая | Изнурённая | ✅ |
| ExtraBees | Lapis | Lapis | ✅ | Лазуритовая | Лазуритовая | ✅ |
| ExtraBees | Lavender | Lavender | ✅ | Розовая | Розовая | ✅ |
| ExtraBees | Leaden | Leaden | ✅ | Свинцовая | Свинцовая | ✅ |
| ExtraBees | Lime | Lime | ✅ | Лаймовая | Лаймовая | ✅ |
| ExtraBees | Lustered | Lustered | ✅ | Взволнованная | Взволнованная | ✅ |
| ExtraBees | Malicious | Malicious | ✅ | Вредоносная | Вредоносная | ✅ |
| ExtraBees | Maroon | Maroon | ✅ | Тёмно-бордовая | Тёмно-бордовая | ✅ |
| ExtraBees | Mystical | Mystical | ✅ | Мистическая ✦ | Мистическая | ❌ |
| ExtraBees | Natural | Natural | ✅ | Зелёная | Зелёная | ✅ |
| ExtraBees | Nuclear | Nuclear | ✅ | Ядерная | Ядерная | ✅ |
| ExtraBees | Ocean | Ocean | ✅ | Океаническая | Океаническая | ✅ |
| ExtraBees | Oily | Oily | ✅ | Нефтяная | Нефтяная | ✅ |
| ExtraBees | Prehistoric | Prehistoric | ✅ | Доисторическая | Доисторическая | ✅ |
| ExtraBees | Primeval | Primeval | ✅ | Первобытная | Первобытная | ✅ |
| ExtraBees | Prussian | Prussian | ✅ | Прусская | Прусская | ✅ |
| ExtraBees | Quantum | Quantum | ✅ | Квантовая | Квантовая | ✅ |
| ExtraBees | Radioactive | Radioactive | ✅ | Радиоактивная | Радиоактивная | ✅ |
| ExtraBees | Refined | Refined | ✅ | Изысканная | Изысканная | ✅ |
| ExtraBees | Relic | Relic | ✅ | Реликтовая | Реликтовая | ✅ |
| ExtraBees | Resilient | Resilient | ✅ | Устойчивая | Устойчивая | ✅ |
| ExtraBees | Resinous | Resinous | ✅ | Смолистая | Смолистая | ✅ |
| ExtraBees | Ripening | Ripening | ✅ | Созревающая | Созревающая | ✅ |
| ExtraBees | River | River | ✅ | Речная | Речная | ✅ |
| ExtraBees | Robust | Robust | ✅ | Выносливая | Выносливая | ✅ |
| ExtraBees | Rocky | Rocky | ✅ | Каменная | Каменная | ✅ |
| ExtraBees | Ruby | Ruby | ✅ | Рубиновая | Рубиновая | ✅ |
| ExtraBees | Rusty | Rusty | ✅ | Ржавая | Ржавая | ✅ |
| ExtraBees | Saffron | Saffron | ✅ | Шафрановая | Шафрановая | ✅ |
| ExtraBees | Sapphire | Sapphire | ✅ | Сапфировая | Сапфировая | ✅ |
| ExtraBees | Sepia | Sepia | ✅ | Коричневая | Коричневая | ✅ |
| ExtraBees | Shadowed | Shadowed | ✅ | Омрачённая | Омрачённая | ✅ |
| ExtraBees | Shining | Shining | ✅ | Сияющая | Сияющая | ✅ |
| ExtraBees | Skeletal | Skeletal | ✅ | Скелетная | Скелетная | ✅ |
| ExtraBees | Slate | Slate | ✅ | Серая | Серая | ✅ |
| ExtraBees | Sodden | Sodden | ✅ | (нет в i18n) | Мшистая | ❌ |
| ExtraBees | Spatial | Spatial | ✅ | Пространственная | Пространственная | ✅ |
| ExtraBees | Stained | Stained | ✅ | Испачканная | Испачканная | ✅ |
| ExtraBees | Sticky | Sticky | ✅ | Липкая | Липкая | ✅ |
| ExtraBees | Sugary | Sugary | ✅ | Сахарная | Сахарная | ✅ |
| ExtraBees | Sweetened | Sweetened | ✅ | Сладкая | Сладкая | ✅ |
| ExtraBees | Tarnished | Tarnished | ✅ | Потускневшая | Потускневшая | ✅ |
| ExtraBees | Tarry | Tarry | ✅ | Медлительная | Медлительная | ✅ |
| ExtraBees | Thriving | Thriving | ✅ | (нет в i18n) | Процветающая | ❌ |
| ExtraBees | Tolerant | Tolerant | ✅ | Толерантная | Толерантная | ✅ |
| ExtraBees | Turquoise | Turquoise | ✅ | Бирюзовая | Бирюзовая | ✅ |
| ExtraBees | Unstable | Unstable | ✅ | Нестабильная | Нестабильная | ✅ |
| ExtraBees | Valuable | Valuable | ✅ | Ценная | Ценная | ✅ |
| ExtraBees | Virulent | Virulent | ✅ | Ядовитая | Ядовитая | ✅ |
| ExtraBees | Viscous | Viscous | ✅ | Вязкая | Вязкая | ✅ |
| ExtraBees | Volcanic | Volcanic | ✅ | Огнедышащая | Огнедышащая | ✅ |
| ExtraBees | Water | Water | ✅ | Водная | Водная | ✅ |
| ExtraBees | Yellorium | Yellorium | ✅ | Йеллориумовая | Йеллориумовая | ✅ |
| Forestry | Agrarian | Agrarian | ✅ | Земельная | Земельная | ✅ |
| Forestry | Austere | Austere | ✅ | Суровая | Суровая | ✅ |
| Forestry | Avenging | Avenging | ✅ | Мстящая | Мстящая | ✅ |
| Forestry | Boggy | Boggy | ✅ | Болотистая | Болотистая | ✅ |
| Forestry | Common | Common | ✅ | Обычная | Обычная | ✅ |
| Forestry | Cultivated | Cultivated | ✅ | Развитая | Развитая | ✅ |
| Forestry | Demonic | Demonic | ✅ | Одержимая | Одержимая | ✅ |
| Forestry | Diligent | Diligent | ✅ | Прилежная | Прилежная | ✅ |
| Forestry | Edenic | Edenic | ✅ | Райская | Райская | ✅ |
| Forestry | Ender | Ender | ✅ | Драконья | Драконья | ✅ |
| Forestry | Exotic | Exotic | ✅ | Редкая | Редкая | ✅ |
| Forestry | Farmerly | Farmerly | ✅ | Прошлая | Прошлая | ✅ |
| Forestry | Fiendish | Fiendish | ✅ | Жестокая | Жестокая | ✅ |
| Forestry | Forest | Forest | ✅ | Лесная | Лесная | ✅ |
| Forestry | Frugal | Frugal | ✅ | Бережливая | Бережливая | ✅ |
| Forestry | Glacial | Glacial | ✅ | Ледниковая | Ледниковая | ✅ |
| Forestry | Hermitic | Hermitic | ✅ | Уединённая | Уединённая | ✅ |
| Forestry | Heroic | Heroic | ✅ | Героическая | Героическая | ✅ |
| Forestry | Icy | Icy | ✅ | Ледяная | Ледяная | ✅ |
| Forestry | Imperial | Imperial | ✅ | Имперская | Имперская | ✅ |
| Forestry | Industrious | Industrious | ✅ | Трудолюбивая | Трудолюбивая | ✅ |
| Forestry | Leporine | Leporine | ✅ | Заячья | Заячья | ✅ |
| Forestry | Majestic | Majestic | ✅ | Величавая | Величавая | ✅ |
| Forestry | Marshy | Marshy | ✅ | Болотная | Болотная | ✅ |
| Forestry | Meadows | Meadows | ✅ | Луговая | Луговая | ✅ |
| Forestry | Merry | Merry | ✅ | Весёлая | Весёлая | ✅ |
| Forestry | Miry | Miry | ✅ | Топкая | Топкая | ✅ |
| Forestry | Modest | Modest | ✅ | Скромная | Скромная | ✅ |
| Forestry | Monastic | Monastic | ✅ | Монашья | Монашья | ✅ |
| Forestry | Noble | Noble | ✅ | Знатная | Знатная | ✅ |
| Forestry | Phantasmal | Phantasmal | ✅ | Воображаемая | Воображаемая | ✅ |
| Forestry | Rural | Rural | ✅ | Сельская | Сельская | ✅ |
| Forestry | Secluded | Secluded | ✅ | Укромная | Укромная | ✅ |
| Forestry | Sinister | Sinister | ✅ | Зловещая | Зловещая | ✅ |
| Forestry | Spectral | Spectral | ✅ | Призрачная | Призрачная | ✅ |
| Forestry | Steadfast | Steadfast | ✅ | Стойкая | Стойкая | ✅ |
| Forestry | Tipsy | Tipsy | ✅ | Пьяная | Пьяная | ✅ |
| Forestry | Tricky | Tricky | ✅ | Хитрая | Хитрая | ✅ |
| Forestry | Tropical | Tropical | ✅ | Тропическая | Тропическая | ✅ |
| Forestry | Unweary | Unweary | ✅ | Неутомимая | Неутомимая | ✅ |
| Forestry | Valiant | Valiant | ✅ | Доблестная | Доблестная | ✅ |
| Forestry | Vengeful | Vengeful | ✅ | Мстительная | Мстительная | ✅ |
| Forestry | Vindictive | Vindictive | ✅ | Карательная | Карательная | ✅ |
| Forestry | Wintry | Wintry | ✅ | Зимняя | Зимняя | ✅ |
| MagicBees | Abandoned | Abandoned | ✅ | Брошенная | Брошенная | ✅ |
| MagicBees | TcAir | Aer | ❌ | TcAir | Аура | ❌ |
| MagicBees | AmAir | Aiolic | ❌ | AmAir | Luft | ❌ |
| MagicBees | Alfheim | Alfheim | ✅ | Alfheim | — | — |
| MagicBees | Aluminum | Aluminum | ✅ | Алюминиевая | Алюминиевая | ✅ |
| MagicBees | TeAmped | Amped | ❌ | TeAmped | — | — |
| MagicBees | Apatine | Apatine | ✅ | Апатитовая | Апатитовая | ✅ |
| MagicBees | TcWater | Aqua | ❌ | TcWater | Аква | ❌ |
| MagicBees | AmWater | Aqueous | ❌ | AmWater | Wasser | ❌ |
| MagicBees | Arcane | Arcane | ✅ | Магическая | Arkanen | ❌ |
| MagicBees | AmArcane | Arcane | ❌ | AmArcane | Arkanen | ❌ |
| MagicBees | Ardite | Ardite | ✅ | Ардитовая | Ардитовая | ✅ |
| MagicBees | Argentum | Argentum | ✅ | Серебряная | Серебряная | ✅ |
| MagicBees | Attuned | Attuned | ✅ | Приученная | Приученная | ✅ |
| MagicBees | Auric | Auric | ✅ | (нет в i18n) | Золотоносная | ❌ |
| MagicBees | Aware | Aware | ✅ | Памятная | Памятная | ✅ |
| MagicBees | Batty | Batty | ✅ | Batty | Сумасшедшие | ❌ |
| MagicBees | Beef | Beefy | ❌ | Beef | Мясистые | ❌ |
| MagicBees | Bigbad | Big Bad | ❌ | Bigbad | — | — |
| MagicBees | TeBlizzy | Blizzy | ❌ | TeBlizzy | Blizzy | ❌ |
| MagicBees | Blossom | Blossom | ✅ | Blossom | — | — |
| MagicBees | Botanic | Botanic | ✅ | Botanic | — | — |
| MagicBees | Brainy | Brainy | ✅ | Brainy | Умные | ❌ |
| MagicBees | TeBronze | Bronzed | ❌ | TeBronze | Tinker | ❌ |
| MagicBees | TeCoal | Carbon | ❌ | TeCoal | Carbon | ❌ |
| MagicBees | Catty | Catty | ✅ | Catty | — | — |
| MagicBees | Certus | Certus | ✅ | (нет в i18n) | — | — |
| MagicBees | TcChaos | Chaotic | ❌ | TcChaos | Абсолютные | ❌ |
| MagicBees | Charmed | Charmed | ✅ | Заколдованная | Заколдованная | ✅ |
| MagicBees | Cobalt | Cobalt | ✅ | Кобальтовая | Кобальтовая | ✅ |
| MagicBees | Crumbling | Crumbling | ✅ | Разрушающая | Разрушающая | ✅ |
| MagicBees | Cuprum | Cuprum | ✅ | Медная | Медная | ✅ |
| MagicBees | TeDante | Dante | ❌ | TeDante | Dante | ❌ |
| MagicBees | TeDestabilized | Destabilized | ❌ | TeDestabilized | Destabilized | ❌ |
| MagicBees | Diamandi | Diamandi | ✅ | Алмазная ✦ | Алмазная | ❌ |
| MagicBees | Doctoral | Doctoral | ✅ | Докторская | Докторская | ✅ |
| MagicBees | Draconic | Draconic | ✅ | Драконья ✦ | Драконья | ❌ |
| MagicBees | Dreaming | Dreaming | ✅ | Dreaming | — | — |
| MagicBees | Earthy | Earthen | ❌ | Earthy | Земляная | ❌ |
| MagicBees | Eldritch | Eldritch | ✅ | Древняя ✦ | Древняя | ❌ |
| MagicBees | TeElectrum | Electrum | ❌ | TeElectrum | Electrum | ❌ |
| MagicBees | TcEmpowering | Empowering | ❌ | TcEmpowering | — | — |
| MagicBees | Enchanted | Enchanted | ✅ | Зачарованная | Зачарованная | ✅ |
| MagicBees | TeEndearing | Endearing | ❌ | TeEndearing | Endearing | ❌ |
| MagicBees | Esmeraldi | Esmeraldi | ✅ | (нет в i18n) | Изумрудная | ❌ |
| MagicBees | Esoteric | Esoteric | ✅ | Тайная | Тайная | ✅ |
| MagicBees | AmEssence | Essence | ❌ | AmEssence | Essence | ❌ |
| MagicBees | Ethereal | Ethereal | ✅ | Эфирная | Эфирная | ✅ |
| MagicBees | Ferrous | Ferrous | ✅ | Железистая | Железистая | ✅ |
| MagicBees | Firey | Firey | ✅ | Огненная | Огненная | ✅ |
| MagicBees | Floral | Floral | ✅ | Floral | — | — |
| MagicBees | Fluix | Fluix | ✅ | (нет в i18n) | — | — |
| MagicBees | TcTaint | Flux | ❌ | TcTaint | Льняные | ❌ |
| MagicBees | RsaFluxed | Fluxed | ❌ | RsaFluxed | Fluxed | ❌ |
| MagicBees | Forlorn | Forlorn | ✅ | Одинокая | Одинокая | ✅ |
| MagicBees | AmPlant | Fruticic | ❌ | AmPlant | Staude | ❌ |
| MagicBees | AmLightning | Fulguric | ❌ | AmLightning | Blitz | ❌ |
| MagicBees | TeGelid | Gelid | ❌ | TeGelid | Gelid | ❌ |
| MagicBees | Ghastly | Ghastly | ✅ | Ужасная | Ужасная | ✅ |
| MagicBees | AmIce | Glacic | ❌ | AmIce | Eis | ❌ |
| MagicBees | TeGrounded | Grounded | ❌ | TeGrounded | — | — |
| MagicBees | Hateful | Hateful | ✅ | Ненавистная | Ненавистная | ✅ |
| MagicBees | AmFire | Igneous | ❌ | AmFire | Feuer | ❌ |
| MagicBees | TcFire | Ignis | ❌ | TcFire | Игнис | ❌ |
| MagicBees | Infernal | Infernal | ✅ | Адская | Адская | ✅ |
| MagicBees | TeInvar | Invar | ❌ | TeInvar | Invar | ❌ |
| MagicBees | Invisible | Invisible | ✅ | Невидимая | Невидимая | ✅ |
| MagicBees | Lordly | Lordly | ✅ | Роскошная | Роскошная | ✅ |
| MagicBees | TeLux | Lux | ❌ | TeLux | Lux | ❌ |
| MagicBees | Manyullyn | Manyullyn | ✅ | Мануллиновая | Мануллиновая | ✅ |
| MagicBees | EeMinium | Minium | ❌ | EeMinium | Алхимические | ❌ |
| MagicBees | Mutable | Mutable | ✅ | Изменчивая | Изменчивая | ✅ |
| MagicBees | Mysterious | Mysterious | ✅ | Таинственная | Таинственная | ✅ |
| MagicBees | Mystical | Mystical | ✅ | Мистическая ✦ | Мистическая | ❌ |
| MagicBees | Nameless | Nameless | ✅ | Безымянная | Безымянная | ✅ |
| MagicBees | Neighsayer | Neighsayer | ✅ | Neighsayer | — | — |
| MagicBees | TcNexus | Nexus | ❌ | TcNexus | — | — |
| MagicBees | TeNickel | Nickel | ❌ | TeNickel | Nickel | ❌ |
| MagicBees | Oblivion | Oblivion | ✅ | Забвенная | Забвенная | ✅ |
| MagicBees | TcOrder | Ordered | ❌ | TcOrder | Праекантатио | ❌ |
| MagicBees | Osmium | Osmium | ✅ | (нет в i18n) | — | — |
| MagicBees | TePlatinum | Platinum | ❌ | TePlatinum | Platinum | ❌ |
| MagicBees | Plumbum | Plumbum | ✅ | (нет в i18n) | Свинцовая | ❌ |
| MagicBees | Pork | Porcine | ❌ | Pork | Свиные | ❌ |
| MagicBees | Chicken | Poultry | ❌ | Chicken | Куриные | ❌ |
| MagicBees | Pupil | Pupil | ✅ | Подопечная | Подопечная | ✅ |
| MagicBees | TcPure | Pure | ❌ | TcPure | Чистые | ❌ |
| MagicBees | TePyro | Pyro | ❌ | TePyro | Pyro | ❌ |
| MagicBees | AmQuintessence | Quintessential | ❌ | AmQuintessence | Quintessential | ❌ |
| MagicBees | TcHungry | Ravening | ❌ | TcHungry | — | — |
| MagicBees | TcRejuvenating | Rejuvenating | ❌ | TcRejuvenating | Rejuvenating | ❌ |
| MagicBees | TeRocking | Rockin' | ❌ | TeRocking | — | — |
| MagicBees | Rooted | Rooted | ✅ | Rooted | — | — |
| MagicBees | Savant | Savant | ✅ | Сведущая | Сведущая | ✅ |
| MagicBees | Scholarly | Scholarly | ✅ | Учёная | Учёная | ✅ |
| MagicBees | Sheepish | Sheepish | ✅ | Sheepish | — | — |
| MagicBees | TeShocking | Shocking | ❌ | TeShocking | — | — |
| MagicBees | Silicon | Silicon | ✅ | (нет в i18n) | — | — |
| MagicBees | Skulking | Skulking | ✅ | Прячущиеся | Прячущиеся | ✅ |
| MagicBees | AeSkystone | Skystone | ❌ | AeSkystone | — | — |
| MagicBees | Smouldering | Smouldering | ✅ | Тлеющая | Тлеющая | ✅ |
| MagicBees | TcEarth | Solum | ❌ | TcEarth | Солим | ❌ |
| MagicBees | Somnolent | Somnolent | ✅ | Somnolent | — | — |
| MagicBees | Sorcerous | Sorcerous | ✅ | Волшебная | Волшебная | ✅ |
| MagicBees | Soul | Soul | ✅ | Душевная | Душевная | ✅ |
| MagicBees | Spidery | Spidery | ✅ | Паучая | Паучая | ✅ |
| MagicBees | Spirit | Spirit | ✅ | Духовная | Духовная | ✅ |
| MagicBees | Spiteful | Spiteful | ✅ | Злопамятная | Злопамятная | ✅ |
| MagicBees | Stannum | Stannum | ✅ | Оловянная | Оловянная | ✅ |
| MagicBees | Supernatural | Supernatural | ✅ | Сверхъестественная | Сверхъестественная | ✅ |
| MagicBees | AmEarth | Terrestric | ❌ | AmEarth | Erde | ❌ |
| MagicBees | Timely | Timely | ✅ | Временная | Временная | ✅ |
| MagicBees | Transmuting | Transmuting | ✅ | Трансмутирующая | Трансмутирующая | ✅ |
| MagicBees | Unusual | Unusual | ✅ | Необычная | Необычная | ✅ |
| MagicBees | Vazbee | Vazbee | ✅ | Vazbee | — | — |
| MagicBees | TcVis | Vis | ❌ | TcVis | Вис | ❌ |
| MagicBees | TcVoid | Void | ❌ | TcVoid | — | — |
| MagicBees | AmVortex | Vortex | ❌ | AmVortex | Вихревые | ❌ |
| MagicBees | Watery | Watery | ✅ | Водная ✦ | Водная | ❌ |
| MagicBees | AmWight | Wight | ❌ | AmWight | Wight | ❌ |
| MagicBees | Windy | Windy | ✅ | Ветряная | Ветряная | ✅ |
| MagicBees | TeWinsome | Winsome | ❌ | TeWinsome | Winsome | ❌ |
| MagicBees | TcWispy | Wispy | ❌ | TcWispy | Виспи | ❌ |
| MagicBees | Withering | Withering | ✅ | Иссушающая | Иссушающая | ✅ |

## ⚠️ Виды: расхождение EN (i18n использует имя ≠ официальному in-game)

| mod | i18n EN (наш ключ) | официальный en_US | официальный ru_RU |
|---|---|---|---|
| MagicBees | TcAir | Aer | Аура |
| MagicBees | AmAir | Aiolic | Luft |
| MagicBees | TeAmped | Amped | — |
| MagicBees | TcWater | Aqua | Аква |
| MagicBees | AmWater | Aqueous | Wasser |
| MagicBees | AmArcane | Arcane | Arkanen |
| MagicBees | Beef | Beefy | Мясистые |
| MagicBees | Bigbad | Big Bad | — |
| MagicBees | TeBlizzy | Blizzy | Blizzy |
| MagicBees | TeBronze | Bronzed | Tinker |
| MagicBees | TeCoal | Carbon | Carbon |
| MagicBees | TcChaos | Chaotic | Абсолютные |
| MagicBees | TeDante | Dante | Dante |
| MagicBees | TeDestabilized | Destabilized | Destabilized |
| MagicBees | Earthy | Earthen | Земляная |
| MagicBees | TeElectrum | Electrum | Electrum |
| MagicBees | TcEmpowering | Empowering | — |
| MagicBees | TeEndearing | Endearing | Endearing |
| MagicBees | AmEssence | Essence | Essence |
| MagicBees | TcTaint | Flux | Льняные |
| MagicBees | RsaFluxed | Fluxed | Fluxed |
| MagicBees | AmPlant | Fruticic | Staude |
| MagicBees | AmLightning | Fulguric | Blitz |
| MagicBees | TeGelid | Gelid | Gelid |
| MagicBees | AmIce | Glacic | Eis |
| MagicBees | TeGrounded | Grounded | — |
| MagicBees | AmFire | Igneous | Feuer |
| MagicBees | TcFire | Ignis | Игнис |
| MagicBees | TeInvar | Invar | Invar |
| MagicBees | TeLux | Lux | Lux |
| MagicBees | EeMinium | Minium | Алхимические |
| MagicBees | TcNexus | Nexus | — |
| MagicBees | TeNickel | Nickel | Nickel |
| MagicBees | TcOrder | Ordered | Праекантатио |
| MagicBees | TePlatinum | Platinum | Platinum |
| MagicBees | Pork | Porcine | Свиные |
| MagicBees | Chicken | Poultry | Куриные |
| MagicBees | TcPure | Pure | Чистые |
| MagicBees | TePyro | Pyro | Pyro |
| MagicBees | AmQuintessence | Quintessential | Quintessential |
| MagicBees | TcHungry | Ravening | — |
| MagicBees | TcRejuvenating | Rejuvenating | Rejuvenating |
| MagicBees | TeRocking | Rockin' | — |
| MagicBees | TeShocking | Shocking | — |
| MagicBees | AeSkystone | Skystone | — |
| MagicBees | TcEarth | Solum | Солим |
| MagicBees | AmEarth | Terrestric | Erde |
| MagicBees | TcVis | Vis | Вис |
| MagicBees | TcVoid | Void | — |
| MagicBees | AmVortex | Vortex | Вихревые |
| MagicBees | AmWight | Wight | Wight |
| MagicBees | TeWinsome | Winsome | Winsome |
| MagicBees | TcWispy | Wispy | Виспи |

## ⚠️ Виды: расхождение RU (наш перевод ≠ официальному ru_RU)

| mod | офиц. en_US | наше RU | офиц. ru_RU |
|---|---|---|---|
| ExtraBees | Mystical | Мистическая ✦ | Мистическая |
| MagicBees | Aer | TcAir | Аура |
| MagicBees | Aiolic | AmAir | Luft |
| MagicBees | Aqua | TcWater | Аква |
| MagicBees | Aqueous | AmWater | Wasser |
| MagicBees | Arcane | Магическая | Arkanen |
| MagicBees | Arcane | AmArcane | Arkanen |
| MagicBees | Batty | Batty | Сумасшедшие |
| MagicBees | Beefy | Beef | Мясистые |
| MagicBees | Blizzy | TeBlizzy | Blizzy |
| MagicBees | Brainy | Brainy | Умные |
| MagicBees | Bronzed | TeBronze | Tinker |
| MagicBees | Carbon | TeCoal | Carbon |
| MagicBees | Chaotic | TcChaos | Абсолютные |
| MagicBees | Dante | TeDante | Dante |
| MagicBees | Destabilized | TeDestabilized | Destabilized |
| MagicBees | Diamandi | Алмазная ✦ | Алмазная |
| MagicBees | Draconic | Драконья ✦ | Драконья |
| MagicBees | Earthen | Earthy | Земляная |
| MagicBees | Eldritch | Древняя ✦ | Древняя |
| MagicBees | Electrum | TeElectrum | Electrum |
| MagicBees | Endearing | TeEndearing | Endearing |
| MagicBees | Essence | AmEssence | Essence |
| MagicBees | Flux | TcTaint | Льняные |
| MagicBees | Fluxed | RsaFluxed | Fluxed |
| MagicBees | Fruticic | AmPlant | Staude |
| MagicBees | Fulguric | AmLightning | Blitz |
| MagicBees | Gelid | TeGelid | Gelid |
| MagicBees | Glacic | AmIce | Eis |
| MagicBees | Igneous | AmFire | Feuer |
| MagicBees | Ignis | TcFire | Игнис |
| MagicBees | Invar | TeInvar | Invar |
| MagicBees | Lux | TeLux | Lux |
| MagicBees | Minium | EeMinium | Алхимические |
| MagicBees | Mystical | Мистическая ✦ | Мистическая |
| MagicBees | Nickel | TeNickel | Nickel |
| MagicBees | Ordered | TcOrder | Праекантатио |
| MagicBees | Platinum | TePlatinum | Platinum |
| MagicBees | Porcine | Pork | Свиные |
| MagicBees | Poultry | Chicken | Куриные |
| MagicBees | Pure | TcPure | Чистые |
| MagicBees | Pyro | TePyro | Pyro |
| MagicBees | Quintessential | AmQuintessence | Quintessential |
| MagicBees | Rejuvenating | TcRejuvenating | Rejuvenating |
| MagicBees | Solum | TcEarth | Солим |
| MagicBees | Terrestric | AmEarth | Erde |
| MagicBees | Vis | TcVis | Вис |
| MagicBees | Vortex | AmVortex | Вихревые |
| MagicBees | Watery | Водная ✦ | Водная |
| MagicBees | Wight | AmWight | Wight |
| MagicBees | Winsome | TeWinsome | Winsome |
| MagicBees | Wispy | TcWispy | Виспи |
