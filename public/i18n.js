(() => {
const LANGS = [
  { code: 'cs', label: 'Čeština', locale: 'cs-CZ' },
  { code: 'ru', label: 'Русский', locale: 'ru-RU' },
  { code: 'uk', label: 'Українська', locale: 'uk-UA' },
  { code: 'en', label: 'English', locale: 'en-GB' }
];

const FLAGS = {
  cs: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect y="10" width="30" height="10" fill="#D7141A"/><path d="M0 0l15 10L0 20z" fill="#11457E"/></svg>',
  ru: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039A6"/><rect y="13.33" width="30" height="6.67" fill="#D52B1E"/></svg>',
  uk: '<svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#0057B7"/><rect y="10" width="30" height="10" fill="#FFD700"/></svg>',
  en: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3.4"/></svg>'
};

const T = {
cs: {
 'meta.title': 'LUMIA — studio laserové epilace', 'meta.desc': 'Laserová epilace diodovým laserem: pohodlně, bezpečně, s garancí výsledku. Ceník, specialisté a online rezervace za minutu.',
 'nav.services': 'Procedury', 'nav.prices': 'Ceník', 'nav.team': 'Specialisté', 'nav.results': 'Výsledky', 'nav.reviews': 'Recenze', 'nav.faq': 'Dotazy', 'nav.contacts': 'Kontakty', 'cta.book': 'Rezervovat',
 'hero.eyebrow': 'Studio laserové epilace', 'hero.h1': 'Hladká pokožka<br>bez holení a bolesti',
 'hero.lead': 'Diodový laser se safírovým chlazením, specialisté se zdravotnickým vzděláním a online rezervace za minutu – s připomínkou ve vašem Google Kalendáři.',
 'hero.cta1': 'Rezervovat zákrok', 'hero.cta2': 'Prohlédnout procedury', 'hero.f1': 'za oblast', 'hero.f2': 'sezení v kúře', 'hero.f3': 'konzultace', 'hero.c1': '✓ Bez bolesti', 'hero.c2': '✓ Pro každý fototyp', 'from': 'od',
 'ft1.h': 'Safírové chlazení', 'ft1.p': 'Pokožka se chladí v okamžiku impulsu – pohodlně i v citlivých oblastech.',
 'ft2.h': 'Bezpečně', 'ft2.p': 'Konzultace dermatoložky, zkušební záblesk a individuální parametry pro každou oblast.',
 'ft3.h': 'Rychle', 'ft3.p': 'Podpaží – 10 minut, nohy – zhruba hodina. Klouzavá technika bez „fleků“.',
 'ft4.h': 'Férové ceny', 'ft4.p': 'Žádné příplatky za gel, nástavce ani „konzultaci“. Cena v katalogu je cena u pokladny.',
 'svc.eyebrow': 'Katalog', 'svc.h2': 'Procedury a ošetřované oblasti', 'svc.sub': 'Vyberte oblast – řekneme vám, jak zákrok probíhá, kolik sezení je potřeba a jak se připravit.',
 'tab.popular': 'Oblíbené', 'tab.all': 'Vše', 'cat.face': 'Obličej', 'cat.body': 'Tělo', 'cat.bikini': 'Bikiny', 'cat.men': 'Pro muže', 'cat.complex': 'Komplexy',
 'promo': 'Akce', 'hit': 'Hit', 'more': 'Podrobnosti', 'book': 'Rezervovat', 'min': 'min', 'course': 'Kúra', 'sessions': 'sezení', 'prep': 'Příprava', 'contra': 'Kontraindikace', 'book.this': 'Rezervovat tuto proceduru', 'empty.cat': 'V této kategorii zatím nejsou žádné procedury.',
 'promos.eyebrow': 'Speciální nabídky', 'promos.h2': 'Výhodný začátek',
 'prices.eyebrow': 'Ceník', 'prices.h2': 'Ceny za jedno sezení', 'prices.sub': 'Cena je uvedena za jeden zákrok. Kúra 6 a více sezení – se slevou, zeptejte se na recepci.',
 'how.eyebrow': 'Jak to funguje', 'how.h2': 'Od rezervace k hladké pokožce',
 'how1.h': 'Online rezervace', 'how1.p': 'Vyberete oblast, specialistku a vhodný čas. Událost se objeví ve vašem kalendáři.',
 'how2.h': 'Konzultace', 'how2.p': 'Posoudíme typ pleti a chloupků, vyloučíme kontraindikace a nastavíme parametry.',
 'how3.h': 'Zákrok', 'how3.p': 'Chladicí gel, ochranné brýle, krátké impulsy. Bez rekonvalescence.',
 'how4.h': 'Kúra a výsledek', 'how4.p': 'Opakujeme každé 4–8 týdnů. Už po 3 sezeních je chloupků výrazně méně.',
 'team.eyebrow': 'Tým', 'team.h2': 'Naši specialisté', 'team.sub': 'Všechny specialistky procházejí školením na přístroji a každoroční atestací.', 'exp': 'Praxe',
 'year': { one: 'rok', few: 'roky', other: 'let' },
 'ba.eyebrow': 'Před / Po', 'ba.h2': 'Výsledek po sezeních', 'ba.sub': 'Posuňte jezdec a porovnejte. Názorná ilustrace vývoje; skutečné fotografie klientů zveřejňujeme jen s jejich písemným souhlasem.',
 'ba.before': 'Před', 'ba.after': 'Po {n}. sezení', 'ba.c1': 'Podpaží', 'ba.c2': 'Lýtka', 'ba.c3': 'Bikiny', 'ba.aria': 'Porovnání před a po',
 'rev.eyebrow': 'Recenze', 'rev.h2': 'Co říkají klienti', 'rev.avg': 'Průměrné hodnocení {a} z 5 · {n} {w}', 'review': { one: 'recenze', few: 'recenze', other: 'recenzí' }, 'rev.none': 'Buďte první, kdo napíše recenzi.',
 'rev.btn': 'Napsat recenzi', 'rev.name': 'Vaše jméno', 'rev.service': 'Procedura (nepovinné)', 'rev.text': 'Popište svou zkušenost', 'rev.send': 'Odeslat ke schválení', 'rev.ok': 'Děkujeme! Recenze se na webu objeví po kontrole.', 'rev.rating': 'Hodnocení',
 'faq.eyebrow': 'FAQ', 'faq.h2': 'Časté dotazy',
 'book.eyebrow': 'Online rezervace', 'book.h2': 'Vyberte si vhodný čas', 'book.sub': 'Zabere to asi minutu. Potvrzení dostanete hned a událost si můžete přidat do Google Kalendáře.',
 's1': 'Procedura', 's2': 'Specialistka', 's3': 'Datum a čas', 's4': 'Kontakty',
 'b.pick': 'Vyberte proceduru', 'b.next': 'Další', 'b.prev': 'Zpět', 'b.sp': 'Vyberte specialistku', 'b.any': 'Kdokoli volný', 'b.any2': 'Více možností času', 'b.dt': 'Vyberte datum a čas',
 'b.loadDays': 'Načítáme volné dny…', 'b.noDays': 'V nejbližší době nejsou volné termíny. Zavolejte nám – něco najdeme.', 'b.loadTimes': 'Načítáme časy…', 'b.noTimes': 'Na toto datum není volný čas.',
 'b.contacts': 'Vaše kontakty', 'b.name': 'Jméno', 'b.phone': 'Telefon', 'b.email': 'E-mail (pro potvrzení, nepovinné)', 'b.promo': 'Promo kód (nepovinné)', 'b.comment': 'Poznámka (nepovinné)',
 'b.consent': 'Souhlasím se zpracováním osobních údajů pro účely rezervace', 'b.confirm': 'Potvrdit rezervaci', 'b.sending': 'Odesíláme…', 'b.with': 'specialistka', 'b.anySp': 'kdokoli volný',
 'done.h': 'Jste objednáni!', 'done.p': 'Pokud bude potřeba, ozveme se vám s potvrzením.', 'done.svc': 'Procedura', 'done.sp': 'Specialistka', 'done.when': 'Kdy', 'done.where': 'Kde',
 'done.gcal': 'Přidat do Google Kalendáře', 'done.ics': 'Stáhnout .ics', 'done.again': 'Nová rezervace', 'done.details': 'Specialistka: {sp}. Změna či zrušení nejpozději 12 hodin předem: {phone}', 'done.alarm': 'Rezervace za hodinu',
 'err.service': 'Vyberte proceduru', 'err.name': 'Zadejte jméno', 'err.phone': 'Zadejte platné telefonní číslo', 'err.email': 'Neplatný e-mail', 'err.consent': 'Je potřeba souhlas se zpracováním údajů', 'err.time': 'Vyberte čas',
 'err.taken': 'Tento čas už je obsazený. Vyberte prosím jiný.', 'err.toomany': 'Příliš mnoho pokusů, zkuste to později', 'err.review': 'Vyplňte jméno a text recenze (alespoň 10 znaků)', 'err.generic': 'Něco se nepovedlo. Zkuste to znovu.', 'err.load': 'Data se nepodařilo načíst. Obnovte stránku.',
 'ct.eyebrow': 'Kontakty', 'ct.h2': 'Přijďte se seznámit', 'ct.addr': 'Adresa', 'ct.hours': 'Otevírací doba', 'ct.daily': 'Denně', 'ct.phone': 'Telefon', 'ct.email': 'E-mail', 'ct.route': 'Naplánovat trasu', 'ct.map': 'Mapa',
 'footer.text': 'Služby se poskytují při absenci kontraindikací, je nutná konzultace se specialistou.', 'footer.admin': 'Přihlášení pro správce', 'close': 'Zavřít', 'menu': 'Menu', 'lang': 'Jazyk'
},
ru: {
 'meta.title': 'LUMIA — студия лазерной эпиляции', 'meta.desc': 'Лазерная эпиляция диодным лазером: комфортно, безопасно, с гарантией результата. Цены, мастера и онлайн-запись за минуту.',
 'nav.services': 'Процедуры', 'nav.prices': 'Цены', 'nav.team': 'Мастера', 'nav.results': 'Результаты', 'nav.reviews': 'Отзывы', 'nav.faq': 'Вопросы', 'nav.contacts': 'Контакты', 'cta.book': 'Записаться',
 'hero.eyebrow': 'Студия лазерной эпиляции', 'hero.h1': 'Гладкая кожа<br>без бритвы и боли',
 'hero.lead': 'Диодный лазер с сапфировым охлаждением, мастера с медицинским образованием и запись онлайн за минуту — с напоминанием в ваш Google Календарь.',
 'hero.cta1': 'Записаться на процедуру', 'hero.cta2': 'Смотреть процедуры', 'hero.f1': 'за зону', 'hero.f2': 'сеансов в курсе', 'hero.f3': 'консультация', 'hero.c1': '✓ Без боли', 'hero.c2': '✓ Для любого фототипа', 'from': 'от',
 'ft1.h': 'Сапфировое охлаждение', 'ft1.p': 'Кожа охлаждается в момент импульса — комфортно даже в чувствительных зонах.',
 'ft2.h': 'Безопасно', 'ft2.p': 'Консультация дерматолога, тест-вспышка и индивидуальные параметры для каждой зоны.',
 'ft3.h': 'Быстро', 'ft3.p': 'Подмышки — 10 минут, ноги — около часа. Скользящая техника без «пятен».',
 'ft4.h': 'Честные цены', 'ft4.p': 'Без доплат за гель, насадки и «консультацию». Цена в каталоге — цена в кассе.',
 'svc.eyebrow': 'Каталог', 'svc.h2': 'Процедуры и зоны обработки', 'svc.sub': 'Выберите зону — расскажем, как проходит процедура, сколько сеансов нужно и как подготовиться.',
 'tab.popular': 'Популярное', 'tab.all': 'Все', 'cat.face': 'Лицо', 'cat.body': 'Тело', 'cat.bikini': 'Бикини', 'cat.men': 'Мужские', 'cat.complex': 'Комплексы',
 'promo': 'Акция', 'hit': 'Хит', 'more': 'Подробнее', 'book': 'Записаться', 'min': 'мин', 'course': 'Курс', 'sessions': 'сеансов', 'prep': 'Подготовка', 'contra': 'Противопоказания', 'book.this': 'Записаться на эту процедуру', 'empty.cat': 'В этой категории пока нет процедур.',
 'promos.eyebrow': 'Специальные предложения', 'promos.h2': 'Выгодно начать',
 'prices.eyebrow': 'Прайс', 'prices.h2': 'Цены за один сеанс', 'prices.sub': 'Стоимость указана за одну процедуру. Курс из 6 и более сеансов — со скидкой, уточняйте у администратора.',
 'how.eyebrow': 'Как это работает', 'how.h2': 'От записи до гладкой кожи',
 'how1.h': 'Запись онлайн', 'how1.p': 'Выбираете зону, мастера и удобное время. Событие появляется в вашем календаре.',
 'how2.h': 'Консультация', 'how2.p': 'Оцениваем тип кожи и волос, исключаем противопоказания, подбираем параметры.',
 'how3.h': 'Процедура', 'how3.p': 'Охлаждающий гель, защитные очки, короткие импульсы. Без реабилитации.',
 'how4.h': 'Курс и результат', 'how4.p': 'Повторяем каждые 4–8 недель. Уже после 3 сеансов волос становится заметно меньше.',
 'team.eyebrow': 'Команда', 'team.h2': 'Наши специалисты', 'team.sub': 'Все мастера проходят обучение работе с оборудованием и ежегодную аттестацию.', 'exp': 'Опыт',
 'year': { one: 'год', few: 'года', many: 'лет', other: 'лет' },
 'ba.eyebrow': 'До / После', 'ba.h2': 'Результат по сеансам', 'ba.sub': 'Потяните ползунок, чтобы сравнить. Наглядная иллюстрация динамики; реальные фото клиентов публикуются только с их письменного согласия.',
 'ba.before': 'До', 'ba.after': 'После {n}-го сеанса', 'ba.c1': 'Подмышки', 'ba.c2': 'Голени', 'ba.c3': 'Бикини', 'ba.aria': 'Сравнение до и после',
 'rev.eyebrow': 'Отзывы', 'rev.h2': 'Что говорят клиенты', 'rev.avg': 'Средняя оценка {a} из 5 · {n} {w}', 'review': { one: 'отзыв', few: 'отзыва', many: 'отзывов', other: 'отзывов' }, 'rev.none': 'Станьте первым, кто оставит отзыв.',
 'rev.btn': 'Оставить отзыв', 'rev.name': 'Ваше имя', 'rev.service': 'Процедура (необязательно)', 'rev.text': 'Расскажите о своём опыте', 'rev.send': 'Отправить на модерацию', 'rev.ok': 'Спасибо! Отзыв появится на сайте после проверки.', 'rev.rating': 'Оценка',
 'faq.eyebrow': 'FAQ', 'faq.h2': 'Частые вопросы',
 'book.eyebrow': 'Онлайн-запись', 'book.h2': 'Выберите удобное время', 'book.sub': 'Занимает около минуты. Подтверждение придёт сразу, а событие можно добавить в Google Календарь.',
 's1': 'Процедура', 's2': 'Мастер', 's3': 'Дата и время', 's4': 'Контакты',
 'b.pick': 'Выберите процедуру', 'b.next': 'Далее', 'b.prev': 'Назад', 'b.sp': 'Выберите мастера', 'b.any': 'Любой свободный', 'b.any2': 'Больше вариантов времени', 'b.dt': 'Выберите дату и время',
 'b.loadDays': 'Загружаем свободные дни…', 'b.noDays': 'Свободных окон в ближайшее время нет. Позвоните нам — подберём вариант.', 'b.loadTimes': 'Загружаем время…', 'b.noTimes': 'На эту дату свободного времени нет.',
 'b.contacts': 'Ваши контакты', 'b.name': 'Имя', 'b.phone': 'Телефон', 'b.email': 'Email (для подтверждения, необязательно)', 'b.promo': 'Промокод (необязательно)', 'b.comment': 'Комментарий (необязательно)',
 'b.consent': 'Согласен(на) на обработку персональных данных для записи на процедуру', 'b.confirm': 'Подтвердить запись', 'b.sending': 'Отправляем…', 'b.with': 'мастер', 'b.anySp': 'любой свободный',
 'done.h': 'Вы записаны!', 'done.p': 'Мы свяжемся с вами для подтверждения, если потребуется.', 'done.svc': 'Процедура', 'done.sp': 'Мастер', 'done.when': 'Когда', 'done.where': 'Где',
 'done.gcal': 'Добавить в Google Календарь', 'done.ics': 'Скачать .ics', 'done.again': 'Новая запись', 'done.details': 'Мастер: {sp}. Перенос или отмена — не позднее чем за 12 часов: {phone}', 'done.alarm': 'Запись через час',
 'err.service': 'Выберите процедуру', 'err.name': 'Укажите имя', 'err.phone': 'Укажите корректный телефон', 'err.email': 'Некорректный email', 'err.consent': 'Нужно согласие на обработку данных', 'err.time': 'Выберите время',
 'err.taken': 'Это время уже занято. Пожалуйста, выберите другое.', 'err.toomany': 'Слишком много попыток, попробуйте позже', 'err.review': 'Заполните имя и текст отзыва (от 10 символов)', 'err.generic': 'Что-то пошло не так. Попробуйте ещё раз.', 'err.load': 'Не удалось загрузить данные. Обновите страницу.',
 'ct.eyebrow': 'Контакты', 'ct.h2': 'Приходите знакомиться', 'ct.addr': 'Адрес', 'ct.hours': 'Часы работы', 'ct.daily': 'Ежедневно', 'ct.phone': 'Телефон', 'ct.email': 'Email', 'ct.route': 'Построить маршрут', 'ct.map': 'Карта',
 'footer.text': 'Услуги оказываются при отсутствии противопоказаний, необходима консультация специалиста.', 'footer.admin': 'Вход для администратора', 'close': 'Закрыть', 'menu': 'Меню', 'lang': 'Язык'
},
uk: {
 'meta.title': 'LUMIA — студія лазерної епіляції', 'meta.desc': 'Лазерна епіляція діодним лазером: комфортно, безпечно, з гарантією результату. Ціни, майстри та онлайн-запис за хвилину.',
 'nav.services': 'Процедури', 'nav.prices': 'Ціни', 'nav.team': 'Майстри', 'nav.results': 'Результати', 'nav.reviews': 'Відгуки', 'nav.faq': 'Питання', 'nav.contacts': 'Контакти', 'cta.book': 'Записатися',
 'hero.eyebrow': 'Студія лазерної епіляції', 'hero.h1': 'Гладка шкіра<br>без бритви та болю',
 'hero.lead': 'Діодний лазер із сапфіровим охолодженням, майстри з медичною освітою та онлайн-запис за хвилину — з нагадуванням у ваш Google Календар.',
 'hero.cta1': 'Записатися на процедуру', 'hero.cta2': 'Дивитися процедури', 'hero.f1': 'за зону', 'hero.f2': 'сеансів у курсі', 'hero.f3': 'консультація', 'hero.c1': '✓ Без болю', 'hero.c2': '✓ Для будь-якого фототипу', 'from': 'від',
 'ft1.h': 'Сапфірове охолодження', 'ft1.p': 'Шкіра охолоджується в момент імпульсу — комфортно навіть у чутливих зонах.',
 'ft2.h': 'Безпечно', 'ft2.p': 'Консультація дерматолога, тестовий спалах та індивідуальні параметри для кожної зони.',
 'ft3.h': 'Швидко', 'ft3.p': 'Пахви — 10 хвилин, ноги — близько години. Ковзна техніка без «плям».',
 'ft4.h': 'Чесні ціни', 'ft4.p': 'Без доплат за гель, насадки та «консультацію». Ціна в каталозі — ціна в касі.',
 'svc.eyebrow': 'Каталог', 'svc.h2': 'Процедури та зони обробки', 'svc.sub': 'Оберіть зону — розповімо, як проходить процедура, скільки сеансів потрібно та як підготуватися.',
 'tab.popular': 'Популярне', 'tab.all': 'Усі', 'cat.face': 'Обличчя', 'cat.body': 'Тіло', 'cat.bikini': 'Бікіні', 'cat.men': 'Чоловічі', 'cat.complex': 'Комплекси',
 'promo': 'Акція', 'hit': 'Хіт', 'more': 'Докладніше', 'book': 'Записатися', 'min': 'хв', 'course': 'Курс', 'sessions': 'сеансів', 'prep': 'Підготовка', 'contra': 'Протипоказання', 'book.this': 'Записатися на цю процедуру', 'empty.cat': 'У цій категорії поки немає процедур.',
 'promos.eyebrow': 'Спеціальні пропозиції', 'promos.h2': 'Вигідний початок',
 'prices.eyebrow': 'Прайс', 'prices.h2': 'Ціни за один сеанс', 'prices.sub': 'Вартість вказано за одну процедуру. Курс із 6 і більше сеансів — зі знижкою, уточнюйте в адміністратора.',
 'how.eyebrow': 'Як це працює', 'how.h2': 'Від запису до гладкої шкіри',
 'how1.h': 'Запис онлайн', 'how1.p': 'Обираєте зону, майстра та зручний час. Подія з’являється у вашому календарі.',
 'how2.h': 'Консультація', 'how2.p': 'Оцінюємо тип шкіри та волосся, виключаємо протипоказання, підбираємо параметри.',
 'how3.h': 'Процедура', 'how3.p': 'Охолоджувальний гель, захисні окуляри, короткі імпульси. Без реабілітації.',
 'how4.h': 'Курс і результат', 'how4.p': 'Повторюємо кожні 4–8 тижнів. Уже після 3 сеансів волосся стає помітно менше.',
 'team.eyebrow': 'Команда', 'team.h2': 'Наші спеціалісти', 'team.sub': 'Усі майстри проходять навчання роботі з обладнанням та щорічну атестацію.', 'exp': 'Досвід',
 'year': { one: 'рік', few: 'роки', many: 'років', other: 'років' },
 'ba.eyebrow': 'До / Після', 'ba.h2': 'Результат за сеансами', 'ba.sub': 'Потягніть повзунок, щоб порівняти. Наочна ілюстрація динаміки; реальні фото клієнтів публікуються лише з їхньої письмової згоди.',
 'ba.before': 'До', 'ba.after': 'Після {n}-го сеансу', 'ba.c1': 'Пахви', 'ba.c2': 'Гомілки', 'ba.c3': 'Бікіні', 'ba.aria': 'Порівняння до і після',
 'rev.eyebrow': 'Відгуки', 'rev.h2': 'Що кажуть клієнти', 'rev.avg': 'Середня оцінка {a} з 5 · {n} {w}', 'review': { one: 'відгук', few: 'відгуки', many: 'відгуків', other: 'відгуків' }, 'rev.none': 'Станьте першим, хто залишить відгук.',
 'rev.btn': 'Залишити відгук', 'rev.name': 'Ваше ім’я', 'rev.service': 'Процедура (необов’язково)', 'rev.text': 'Розкажіть про свій досвід', 'rev.send': 'Надіслати на модерацію', 'rev.ok': 'Дякуємо! Відгук з’явиться на сайті після перевірки.', 'rev.rating': 'Оцінка',
 'faq.eyebrow': 'FAQ', 'faq.h2': 'Часті питання',
 'book.eyebrow': 'Онлайн-запис', 'book.h2': 'Оберіть зручний час', 'book.sub': 'Займає близько хвилини. Підтвердження прийде одразу, а подію можна додати в Google Календар.',
 's1': 'Процедура', 's2': 'Майстер', 's3': 'Дата й час', 's4': 'Контакти',
 'b.pick': 'Оберіть процедуру', 'b.next': 'Далі', 'b.prev': 'Назад', 'b.sp': 'Оберіть майстра', 'b.any': 'Будь-який вільний', 'b.any2': 'Більше варіантів часу', 'b.dt': 'Оберіть дату й час',
 'b.loadDays': 'Завантажуємо вільні дні…', 'b.noDays': 'Вільних вікон найближчим часом немає. Зателефонуйте нам — підберемо варіант.', 'b.loadTimes': 'Завантажуємо час…', 'b.noTimes': 'На цю дату вільного часу немає.',
 'b.contacts': 'Ваші контакти', 'b.name': 'Ім’я', 'b.phone': 'Телефон', 'b.email': 'Email (для підтвердження, необов’язково)', 'b.promo': 'Промокод (необов’язково)', 'b.comment': 'Коментар (необов’язково)',
 'b.consent': 'Погоджуюся на обробку персональних даних для запису на процедуру', 'b.confirm': 'Підтвердити запис', 'b.sending': 'Надсилаємо…', 'b.with': 'майстер', 'b.anySp': 'будь-який вільний',
 'done.h': 'Ви записані!', 'done.p': 'Ми зв’яжемося з вами для підтвердження, якщо буде потрібно.', 'done.svc': 'Процедура', 'done.sp': 'Майстер', 'done.when': 'Коли', 'done.where': 'Де',
 'done.gcal': 'Додати в Google Календар', 'done.ics': 'Завантажити .ics', 'done.again': 'Новий запис', 'done.details': 'Майстер: {sp}. Перенесення чи скасування — не пізніше ніж за 12 годин: {phone}', 'done.alarm': 'Запис через годину',
 'err.service': 'Оберіть процедуру', 'err.name': 'Вкажіть ім’я', 'err.phone': 'Вкажіть коректний телефон', 'err.email': 'Некоректний email', 'err.consent': 'Потрібна згода на обробку даних', 'err.time': 'Оберіть час',
 'err.taken': 'Цей час уже зайнятий. Будь ласка, оберіть інший.', 'err.toomany': 'Забагато спроб, спробуйте пізніше', 'err.review': 'Заповніть ім’я та текст відгуку (від 10 символів)', 'err.generic': 'Щось пішло не так. Спробуйте ще раз.', 'err.load': 'Не вдалося завантажити дані. Оновіть сторінку.',
 'ct.eyebrow': 'Контакти', 'ct.h2': 'Приходьте знайомитися', 'ct.addr': 'Адреса', 'ct.hours': 'Години роботи', 'ct.daily': 'Щодня', 'ct.phone': 'Телефон', 'ct.email': 'Email', 'ct.route': 'Побудувати маршрут', 'ct.map': 'Карта',
 'footer.text': 'Послуги надаються за відсутності протипоказань, потрібна консультація спеціаліста.', 'footer.admin': 'Вхід для адміністратора', 'close': 'Закрити', 'menu': 'Меню', 'lang': 'Мова'
},
en: {
 'meta.title': 'LUMIA — laser hair removal studio', 'meta.desc': 'Diode laser hair removal: comfortable, safe, with guaranteed results. Prices, specialists and online booking in a minute.',
 'nav.services': 'Treatments', 'nav.prices': 'Prices', 'nav.team': 'Specialists', 'nav.results': 'Results', 'nav.reviews': 'Reviews', 'nav.faq': 'FAQ', 'nav.contacts': 'Contact', 'cta.book': 'Book now',
 'hero.eyebrow': 'Laser hair removal studio', 'hero.h1': 'Smooth skin<br>without razors or pain',
 'hero.lead': 'A diode laser with sapphire cooling, medically trained specialists and online booking in a minute — with a reminder in your Google Calendar.',
 'hero.cta1': 'Book a treatment', 'hero.cta2': 'Browse treatments', 'hero.f1': 'per area', 'hero.f2': 'sessions per course', 'hero.f3': 'consultation', 'hero.c1': '✓ Painless', 'hero.c2': '✓ Any skin phototype', 'from': 'from',
 'ft1.h': 'Sapphire cooling', 'ft1.p': 'Skin is cooled at the moment of the pulse — comfortable even in sensitive areas.',
 'ft2.h': 'Safe', 'ft2.p': 'A dermatologist consultation, test flash and individual settings for every area.',
 'ft3.h': 'Fast', 'ft3.p': 'Underarms in 10 minutes, legs in about an hour. Gliding technique, no missed patches.',
 'ft4.h': 'Honest prices', 'ft4.p': 'No extra charges for gel, tips or “consultation”. The catalogue price is the checkout price.',
 'svc.eyebrow': 'Catalogue', 'svc.h2': 'Treatments and areas', 'svc.sub': 'Pick an area — we will explain how the treatment goes, how many sessions you need and how to prepare.',
 'tab.popular': 'Popular', 'tab.all': 'All', 'cat.face': 'Face', 'cat.body': 'Body', 'cat.bikini': 'Bikini', 'cat.men': 'Men', 'cat.complex': 'Packages',
 'promo': 'Offer', 'hit': 'Hit', 'more': 'Details', 'book': 'Book', 'min': 'min', 'course': 'Course', 'sessions': 'sessions', 'prep': 'Preparation', 'contra': 'Contraindications', 'book.this': 'Book this treatment', 'empty.cat': 'No treatments in this category yet.',
 'promos.eyebrow': 'Special offers', 'promos.h2': 'A great way to start',
 'prices.eyebrow': 'Price list', 'prices.h2': 'Price per session', 'prices.sub': 'Prices are per treatment. Courses of 6 or more sessions come with a discount — ask at reception.',
 'how.eyebrow': 'How it works', 'how.h2': 'From booking to smooth skin',
 'how1.h': 'Book online', 'how1.p': 'Choose an area, a specialist and a time. The event appears in your calendar.',
 'how2.h': 'Consultation', 'how2.p': 'We assess skin and hair type, rule out contraindications and set the parameters.',
 'how3.h': 'Treatment', 'how3.p': 'Cooling gel, protective goggles, short pulses. No downtime.',
 'how4.h': 'Course and result', 'how4.p': 'Repeat every 4–8 weeks. After just 3 sessions there is noticeably less hair.',
 'team.eyebrow': 'The team', 'team.h2': 'Our specialists', 'team.sub': 'All specialists are trained on the equipment and re-certified every year.', 'exp': 'Experience',
 'year': { one: 'year', other: 'years' },
 'ba.eyebrow': 'Before / After', 'ba.h2': 'Results by session', 'ba.sub': 'Drag the slider to compare. An illustration of progress; real client photos are published only with written consent.',
 'ba.before': 'Before', 'ba.after': 'After session {n}', 'ba.c1': 'Underarms', 'ba.c2': 'Lower legs', 'ba.c3': 'Bikini', 'ba.aria': 'Before and after comparison',
 'rev.eyebrow': 'Reviews', 'rev.h2': 'What clients say', 'rev.avg': 'Average rating {a} out of 5 · {n} {w}', 'review': { one: 'review', other: 'reviews' }, 'rev.none': 'Be the first to leave a review.',
 'rev.btn': 'Write a review', 'rev.name': 'Your name', 'rev.service': 'Treatment (optional)', 'rev.text': 'Tell us about your experience', 'rev.send': 'Submit for moderation', 'rev.ok': 'Thank you! Your review will appear after moderation.', 'rev.rating': 'Rating',
 'faq.eyebrow': 'FAQ', 'faq.h2': 'Frequently asked questions',
 'book.eyebrow': 'Online booking', 'book.h2': 'Choose a convenient time', 'book.sub': 'Takes about a minute. You get confirmation instantly and can add the event to Google Calendar.',
 's1': 'Treatment', 's2': 'Specialist', 's3': 'Date & time', 's4': 'Contact',
 'b.pick': 'Choose a treatment', 'b.next': 'Next', 'b.prev': 'Back', 'b.sp': 'Choose a specialist', 'b.any': 'Any available', 'b.any2': 'More time options', 'b.dt': 'Choose date and time',
 'b.loadDays': 'Loading available days…', 'b.noDays': 'No free slots soon. Call us and we will find an option.', 'b.loadTimes': 'Loading times…', 'b.noTimes': 'No free time on this date.',
 'b.contacts': 'Your details', 'b.name': 'Name', 'b.phone': 'Phone', 'b.email': 'Email (for confirmation, optional)', 'b.promo': 'Promo code (optional)', 'b.comment': 'Comment (optional)',
 'b.consent': 'I agree to the processing of my personal data for booking purposes', 'b.confirm': 'Confirm booking', 'b.sending': 'Sending…', 'b.with': 'specialist', 'b.anySp': 'any available',
 'done.h': 'You are booked!', 'done.p': 'We will contact you for confirmation if needed.', 'done.svc': 'Treatment', 'done.sp': 'Specialist', 'done.when': 'When', 'done.where': 'Where',
 'done.gcal': 'Add to Google Calendar', 'done.ics': 'Download .ics', 'done.again': 'New booking', 'done.details': 'Specialist: {sp}. Reschedule or cancel at least 12 hours ahead: {phone}', 'done.alarm': 'Appointment in one hour',
 'err.service': 'Choose a treatment', 'err.name': 'Enter your name', 'err.phone': 'Enter a valid phone number', 'err.email': 'Invalid email', 'err.consent': 'Consent to data processing is required', 'err.time': 'Choose a time',
 'err.taken': 'This time is already taken. Please choose another.', 'err.toomany': 'Too many attempts, please try later', 'err.review': 'Enter your name and a review (at least 10 characters)', 'err.generic': 'Something went wrong. Please try again.', 'err.load': 'Could not load data. Please refresh the page.',
 'ct.eyebrow': 'Contact', 'ct.h2': 'Come and visit us', 'ct.addr': 'Address', 'ct.hours': 'Opening hours', 'ct.daily': 'Daily', 'ct.phone': 'Phone', 'ct.email': 'Email', 'ct.route': 'Get directions', 'ct.map': 'Map',
 'footer.text': 'Services are provided in the absence of contraindications; a specialist consultation is required.', 'footer.admin': 'Admin login', 'close': 'Close', 'menu': 'Menu', 'lang': 'Language'
}
};

const X = {"cs":{"cookie.text":"Používáme jen nezbytné úložiště (volba jazyka). Mapa a písma jsou z externích služeb – načteme je, pokud souhlasíte.","cookie.accept":"Přijmout","cookie.reject":"Odmítnout","map.ph":"Mapa se načte z Google Maps až po vašem souhlasu.","map.show":"Zobrazit mapu","done.manage":"Změnit nebo zrušit rezervaci","done.manageHint":"Odkaz si uložte – je osobní.","mg.title":"Vaše rezervace","mg.loading":"Načítáme…","mg.when":"Kdy","mg.change":"Změnit termín","mg.cancel":"Zrušit rezervaci","mg.confirmCancel":"Opravdu zrušit rezervaci?","mg.cancelled":"Rezervace byla zrušena.","mg.rescheduled":"Termín byl změněn.","mg.pickDate":"Vyberte nový den","mg.save":"Uložit nový termín","mg.late":"Do návštěvy zbývá méně než 12 hodin – zavolejte nám: {phone}","mg.status.cancelled":"Zrušeno","mg.status.done":"Proběhlo","mg.home":"Zpět na web","mg.again":"Nová rezervace","err.late":"Změna online už není možná – zavolejte nám.","err.notfound":"Rezervace nenalezena. Zkontrolujte odkaz."},"ru":{"cookie.text":"Мы используем только необходимое хранилище (выбор языка). Карта и шрифты — внешние сервисы, загружаем их с вашего согласия.","cookie.accept":"Принять","cookie.reject":"Отклонить","map.ph":"Карта Google Maps загрузится только с вашего согласия.","map.show":"Показать карту","done.manage":"Изменить или отменить запись","done.manageHint":"Сохраните ссылку — она личная.","mg.title":"Ваша запись","mg.loading":"Загружаем…","mg.when":"Когда","mg.change":"Перенести","mg.cancel":"Отменить запись","mg.confirmCancel":"Точно отменить запись?","mg.cancelled":"Запись отменена.","mg.rescheduled":"Время записи изменено.","mg.pickDate":"Выберите новый день","mg.save":"Сохранить новое время","mg.late":"До визита меньше 12 часов — позвоните нам: {phone}","mg.status.cancelled":"Отменена","mg.status.done":"Состоялась","mg.home":"Вернуться на сайт","mg.again":"Новая запись","err.late":"Изменить онлайн уже нельзя — позвоните нам.","err.notfound":"Запись не найдена. Проверьте ссылку."},"uk":{"cookie.text":"Ми використовуємо лише необхідне сховище (вибір мови). Карта та шрифти — зовнішні сервіси, завантажуємо їх за вашою згодою.","cookie.accept":"Прийняти","cookie.reject":"Відхилити","map.ph":"Карта Google Maps завантажиться лише з вашої згоди.","map.show":"Показати карту","done.manage":"Змінити або скасувати запис","done.manageHint":"Збережіть посилання — воно особисте.","mg.title":"Ваш запис","mg.loading":"Завантажуємо…","mg.when":"Коли","mg.change":"Перенести","mg.cancel":"Скасувати запис","mg.confirmCancel":"Точно скасувати запис?","mg.cancelled":"Запис скасовано.","mg.rescheduled":"Час запису змінено.","mg.pickDate":"Оберіть новий день","mg.save":"Зберегти новий час","mg.late":"До візиту менше 12 годин — зателефонуйте нам: {phone}","mg.status.cancelled":"Скасовано","mg.status.done":"Відбувся","mg.home":"Повернутися на сайт","mg.again":"Новий запис","err.late":"Змінити онлайн уже не можна — зателефонуйте нам.","err.notfound":"Запис не знайдено. Перевірте посилання."},"en":{"cookie.text":"We only use essential storage (your language choice). The map and fonts come from external services — we load them with your consent.","cookie.accept":"Accept","cookie.reject":"Decline","map.ph":"The Google Maps map loads only with your consent.","map.show":"Show map","done.manage":"Change or cancel booking","done.manageHint":"Save this link — it is personal.","mg.title":"Your booking","mg.loading":"Loading…","mg.when":"When","mg.change":"Reschedule","mg.cancel":"Cancel booking","mg.confirmCancel":"Cancel this booking?","mg.cancelled":"Your booking has been cancelled.","mg.rescheduled":"Your booking has been moved.","mg.pickDate":"Pick a new day","mg.save":"Save new time","mg.late":"Less than 12 hours to your visit — please call us: {phone}","mg.status.cancelled":"Cancelled","mg.status.done":"Completed","mg.home":"Back to the site","mg.again":"New booking","err.late":"Online changes are no longer possible — please call us.","err.notfound":"Booking not found. Check your link."}};
for (const l in X) Object.assign(T[l], X[l]);

const Y = {"cs":{"skip":"Přeskočit na obsah","footer.privacy":"Ochrana osobních údajů","footer.cookies":"Nastavení cookies","footer.vat":"Ceny jsou uvedeny včetně DPH.","footer.novat":"Nejsme plátci DPH.","ba.illustration":"Ilustrační snímek průběhu kúry.","ba.client":"Fotografie klientky, zveřejněno s jejím písemným souhlasem.","ba.photoAfter":"Po {n}. sezení","b.consentPre":"Souhlasím se zpracováním osobních údajů pro účely rezervace podle","b.consentLink":"zásad ochrany osobních údajů","b.phoneHint":"např. 777 123 456 nebo +49 …","mg.erase":"Smazat moje údaje","mg.confirmErase":"Rezervace bude zrušena a vaše jméno, telefon a e-mail trvale smazány. Pokračovat?","mg.erased":"Vaše osobní údaje byly smazány.","err.date":"Vyberte platné datum","b.holiday":"Státní svátek – zavřeno ({name})"},"ru":{"skip":"Перейти к содержимому","footer.privacy":"Защита персональных данных","footer.cookies":"Настройки cookies","footer.vat":"Цены указаны с учётом НДС (DPH).","footer.novat":"Мы не являемся плательщиками НДС (DPH).","ba.illustration":"Иллюстрация динамики курса.","ba.client":"Фото клиентки, опубликовано с её письменного согласия.","ba.photoAfter":"После {n}-го сеанса","b.consentPre":"Согласен(на) на обработку персональных данных для записи в соответствии с","b.consentLink":"политикой конфиденциальности","b.phoneHint":"напр. 777 123 456 или +49 …","mg.erase":"Удалить мои данные","mg.confirmErase":"Запись будет отменена, а ваши имя, телефон и e-mail — удалены навсегда. Продолжить?","mg.erased":"Ваши персональные данные удалены.","err.date":"Выберите корректную дату","b.holiday":"Государственный праздник — выходной ({name})"},"uk":{"skip":"Перейти до вмісту","footer.privacy":"Захист персональних даних","footer.cookies":"Налаштування cookies","footer.vat":"Ціни вказано з ПДВ (DPH).","footer.novat":"Ми не є платниками ПДВ (DPH).","ba.illustration":"Ілюстрація динаміки курсу.","ba.client":"Фото клієнтки, опубліковано з її письмової згоди.","ba.photoAfter":"Після {n}-го сеансу","b.consentPre":"Погоджуюся на обробку персональних даних для запису відповідно до","b.consentLink":"політики конфіденційності","b.phoneHint":"напр. 777 123 456 або +49 …","mg.erase":"Видалити мої дані","mg.confirmErase":"Запис буде скасовано, а ваші ім’я, телефон і e-mail — видалено назавжди. Продовжити?","mg.erased":"Ваші персональні дані видалено.","err.date":"Оберіть коректну дату","b.holiday":"Державне свято — вихідний ({name})"},"en":{"skip":"Skip to content","footer.privacy":"Privacy policy","footer.cookies":"Cookie settings","footer.vat":"Prices include VAT.","footer.novat":"We are not VAT registered.","ba.illustration":"Illustrative image of course progress.","ba.client":"Client photo, published with her written consent.","ba.photoAfter":"After session {n}","b.consentPre":"I agree to the processing of my personal data for booking purposes under the","b.consentLink":"privacy policy","b.phoneHint":"e.g. 777 123 456 or +49 …","mg.erase":"Delete my data","mg.confirmErase":"Your booking will be cancelled and your name, phone and e-mail permanently deleted. Continue?","mg.erased":"Your personal data has been deleted.","err.date":"Choose a valid date","b.holiday":"Public holiday — closed ({name})"}};
for (const l in Y) Object.assign(T[l], Y[l]);

const HERO = {"cs":{"hero.h1":"Hladká pokožka.<br><em>Bez kompromisů.</em>","hero.next":"Nejbližší volný termín","hero.rating":"hodnocení klientek","hero.tech1":"Diodový laser 808 nm","hero.tech2":"se safírovým chlazením","today":"Dnes","tomorrow":"Zítra"},"ru":{"hero.h1":"Гладкая кожа.<br><em>Без компромиссов.</em>","hero.next":"Ближайшее свободное окно","hero.rating":"оценка клиенток","hero.tech1":"Диодный лазер 808 нм","hero.tech2":"с сапфировым охлаждением","today":"Сегодня","tomorrow":"Завтра"},"uk":{"hero.h1":"Гладка шкіра.<br><em>Без компромісів.</em>","hero.next":"Найближче вільне вікно","hero.rating":"оцінка клієнток","hero.tech1":"Діодний лазер 808 нм","hero.tech2":"із сапфіровим охолодженням","today":"Сьогодні","tomorrow":"Завтра"},"en":{"hero.h1":"Smooth skin.<br><em>No compromises.</em>","hero.next":"Next available slot","hero.rating":"client rating","hero.tech1":"Diode laser 808 nm","hero.tech2":"with sapphire cooling","today":"Today","tomorrow":"Tomorrow"}};
for (const l in HERO) Object.assign(T[l], HERO[l]);

let lang = 'cs';
const fromUrl = document.documentElement.dataset.lang || new URLSearchParams(location.search).get('lang');
if (T[fromUrl]) lang = fromUrl;
else try { const s = localStorage.getItem('lang'); if (T[s]) lang = s; else { const n = (navigator.language || '').slice(0, 2); if (T[n]) lang = n; } } catch {}
const listeners = [];
const t = (k, vars) => {
  let v = T[lang][k] ?? T.cs[k] ?? k;
  if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? '');
  return v;
};
const plural = (n, key) => { const f = t(key); return f[new Intl.PluralRules(LANGS.find((l) => l.code === lang).locale).select(n)] || f.other; };
const locale = () => LANGS.find((l) => l.code === lang).locale;

const serverMeta = { title: document.title, desc: document.querySelector('meta[name=description]')?.content || '' };

function apply() {
  document.documentElement.lang = lang;

  const md = document.querySelector('meta[name=description]');
  if (lang === document.documentElement.dataset.lang) {
    document.title = serverMeta.title;
    if (md) md.content = serverMeta.desc;
  } else {
    document.title = t('meta.title');
    if (md) md.content = t('meta.desc');
  }
  document.querySelectorAll('[data-i18n]').forEach((e) => (e.textContent = t(e.dataset.i18n)));
  document.querySelectorAll('[data-i18n-html]').forEach((e) => (e.innerHTML = t(e.dataset.i18nHtml)));
  document.querySelectorAll('[data-i18n-ph]').forEach((e) => (e.placeholder = t(e.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-aria]').forEach((e) => e.setAttribute('aria-label', t(e.dataset.i18nAria)));
  const cur = document.getElementById('langCur');
  if (cur) { cur.innerHTML = FLAGS[lang] + '<b>' + lang.toUpperCase() + '</b>'; }
  document.querySelectorAll('.lang__opt').forEach((o) => o.setAttribute('aria-current', o.dataset.l === lang));
}
function setLang(l) {
  if (!T[l]) return;
  lang = l; try { localStorage.setItem('lang', l); } catch {}
  const m = /^\/(cs|en|ru|uk)(\/.*)$/.exec(location.pathname);
  if (m) history.replaceState(null, '', '/' + l + m[2] + location.search + location.hash);
  apply(); listeners.forEach((f) => f());
}
function mountSwitcher() {
  const box = document.getElementById('lang'); if (!box) return;
  box.innerHTML = `<button class="lang__btn" id="langCur" aria-haspopup="true" aria-expanded="false"></button>
    <ul class="lang__menu" id="langMenu" hidden>${LANGS.map((l) => `<li><button class="lang__opt" data-l="${l.code}">${FLAGS[l.code]}<span>${l.label}</span></button></li>`).join('')}</ul>`;
  const btn = box.querySelector('#langCur'), menu = box.querySelector('#langMenu');
  const toggle = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
  btn.onclick = (e) => { e.stopPropagation(); toggle(menu.hidden); };
  menu.onclick = (e) => { const b = e.target.closest('.lang__opt'); if (b) { setLang(b.dataset.l); toggle(false); } };
  document.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
}
window.I18N = { t, plural, locale, setLang, onChange: (f) => listeners.push(f), get lang() { return lang; }, LANGS, FLAGS };
mountSwitcher(); apply();
})();
