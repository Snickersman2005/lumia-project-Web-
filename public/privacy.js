(() => {
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const UOOU = 'Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, <a href="https://uoou.gov.cz" rel="noopener" target="_blank">uoou.gov.cz</a>';

const P = {
  cs: (s) => `
<h1>Zásady ochrany osobních údajů</h1>
<p class="doc__meta">Platné od 1. 10. 2026</p>
<h2>1. Správce</h2>
<p>${s.company}, IČO ${s.ico}, se sídlem ${s.address}. Kontakt: <a href="mailto:${s.email}">${s.email}</a>, ${s.phone}.</p>
<h2>2. Jaké údaje zpracováváme</h2>
<ul><li><b>Rezervace:</b> jméno, telefon, e-mail (nepovinný), zvolená procedura, termín, poznámka a promo kód.</li>
<li><b>Recenze:</b> jméno a text, který sami zveřejníte.</li>
<li><b>Technické údaje:</b> IP adresa k ochraně proti zneužití (omezení počtu požadavků v paměti serveru nejvýše 1 hodinu; záznam neúspěšných přihlášení do administrace). Provozní záznamy jinak osobní údaje neobsahují.</li></ul>
<h2>3. Účel a právní základ</h2>
<ul><li>Vyřízení rezervace a poskytnutí služby — plnění smlouvy, čl. 6 odst. 1 písm. b) GDPR.</li>
<li>Ochrana webu před zneužitím — oprávněný zájem, čl. 6 odst. 1 písm. f) GDPR.</li>
<li>Zobrazení mapy Google Maps (Google Ireland Ltd.) a webových písem Google Fonts — souhlas, čl. 6 odst. 1 písm. a) GDPR; souhlas můžete kdykoli odvolat v „Nastavení cookies“.</li>
<li>Fotografie „před/po“ zveřejňujeme pouze s výslovným písemným souhlasem klientky (čl. 9 odst. 2 písm. a) GDPR).</li></ul>
<h2>4. Příjemci</h2>
<p>Poskytovatel hostingu v EU; pokud je zapnuto, Google Ireland Ltd. (kalendář salonu — pouze jméno, telefon a termín) a Telegram (interní upozornění personálu). Údaje neprodáváme a nepoužíváme k marketingu.</p>
<h2>5. Doba uložení</h2>
<p>Údaje z rezervace uchováváme ${s.months} měsíců od termínu návštěvy, poté jsou automaticky anonymizovány.</p>
<h2>6. Vaše práva</h2>
<p>Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost a vznést námitku. Svou rezervaci můžete sami zrušit a údaje smazat přes osobní odkaz z potvrzení rezervace, nebo nám napište. Máte také právo podat stížnost u dozorového úřadu: ${UOOU}.</p>`,

  en: (s) => `
<h1>Privacy policy</h1>
<p class="doc__meta">Effective from 1 October 2026</p>
<h2>1. Controller</h2>
<p>${s.company}, Company ID (IČO) ${s.ico}, registered at ${s.address}. Contact: <a href="mailto:${s.email}">${s.email}</a>, ${s.phone}.</p>
<h2>2. Data we process</h2>
<ul><li><b>Bookings:</b> name, phone, e-mail (optional), selected treatment, appointment time, comment and promo code.</li>
<li><b>Reviews:</b> the name and text you choose to publish.</li>
<li><b>Technical data:</b> IP address to prevent abuse (request rate limiting kept in server memory for at most 1 hour; failed admin sign-in attempts are logged). Other operational logs contain no personal data.</li></ul>
<h2>3. Purposes and legal basis</h2>
<ul><li>Handling your booking and providing the service — performance of a contract, Art. 6(1)(b) GDPR.</li>
<li>Protecting the website against abuse — legitimate interest, Art. 6(1)(f) GDPR.</li>
<li>Loading Google Maps (Google Ireland Ltd.) and Google Fonts — consent, Art. 6(1)(a) GDPR; you can withdraw it at any time in “Cookie settings”.</li>
<li>Before/after photos are published only with the client’s explicit written consent (Art. 9(2)(a) GDPR).</li></ul>
<h2>4. Recipients</h2>
<p>Our EU hosting provider; if enabled, Google Ireland Ltd. (salon calendar — name, phone and time only) and Telegram (internal staff notifications). We never sell your data or use it for marketing.</p>
<h2>5. Retention</h2>
<p>Booking data is kept for ${s.months} months after the appointment and then automatically anonymised.</p>
<h2>6. Your rights</h2>
<p>You have the right of access, rectification, erasure, restriction, portability and objection. You can cancel your booking and delete your data yourself via the personal link in your booking confirmation, or contact us. You may also lodge a complaint with the supervisory authority: ${UOOU}.</p>`,

  ru: (s) => `
<h1>Политика конфиденциальности</h1>
<p class="doc__meta">Действует с 1 октября 2026 г.</p>
<h2>1. Оператор данных</h2>
<p>${s.company}, IČO ${s.ico}, адрес: ${s.address}. Контакты: <a href="mailto:${s.email}">${s.email}</a>, ${s.phone}.</p>
<h2>2. Какие данные мы обрабатываем</h2>
<ul><li><b>Запись:</b> имя, телефон, e-mail (необязательно), процедура, время визита, комментарий и промокод.</li>
<li><b>Отзывы:</b> имя и текст, который вы публикуете.</li>
<li><b>Технические данные:</b> IP-адрес — для защиты от злоупотреблений (ограничение частоты запросов в памяти сервера не более 1 часа; журнал неудачных входов в админку). Остальные служебные журналы персональных данных не содержат.</li></ul>
<h2>3. Цели и правовые основания</h2>
<ul><li>Оформление записи и оказание услуги — исполнение договора, ст. 6(1)(b) GDPR.</li>
<li>Защита сайта от злоупотреблений — законный интерес, ст. 6(1)(f) GDPR.</li>
<li>Загрузка карты Google Maps (Google Ireland Ltd.) и шрифтов Google Fonts — согласие, ст. 6(1)(a) GDPR; его можно отозвать в «Настройках cookies».</li>
<li>Фото «до/после» публикуются только с письменного согласия клиентки (ст. 9(2)(a) GDPR).</li></ul>
<h2>4. Получатели</h2>
<p>Хостинг-провайдер в ЕС; при включённой интеграции — Google Ireland Ltd. (календарь салона: только имя, телефон и время) и Telegram (внутренние уведомления персонала). Мы не продаём данные и не используем их для рекламы.</p>
<h2>5. Срок хранения</h2>
<p>Данные записи хранятся ${s.months} мес. после визита, затем автоматически обезличиваются.</p>
<h2>6. Ваши права</h2>
<p>Вы вправе получить доступ к данным, исправить, удалить их, ограничить обработку, перенести данные и возразить против обработки. Отменить запись и удалить данные можно самостоятельно по личной ссылке из подтверждения записи или написав нам. Вы также можете подать жалобу в надзорный орган: ${UOOU}.</p>`,

  uk: (s) => `
<h1>Політика конфіденційності</h1>
<p class="doc__meta">Діє з 1 жовтня 2026 р.</p>
<h2>1. Контролер даних</h2>
<p>${s.company}, IČO ${s.ico}, адреса: ${s.address}. Контакти: <a href="mailto:${s.email}">${s.email}</a>, ${s.phone}.</p>
<h2>2. Які дані ми обробляємо</h2>
<ul><li><b>Запис:</b> ім’я, телефон, e-mail (необов’язково), процедура, час візиту, коментар і промокод.</li>
<li><b>Відгуки:</b> ім’я та текст, який ви публікуєте.</li>
<li><b>Технічні дані:</b> IP-адреса — для захисту від зловживань (обмеження частоти запитів у пам’яті сервера не більше 1 години; журнал невдалих входів до адмінки). Інші службові журнали персональних даних не містять.</li></ul>
<h2>3. Мета та правові підстави</h2>
<ul><li>Оформлення запису та надання послуги — виконання договору, ст. 6(1)(b) GDPR.</li>
<li>Захист сайту від зловживань — законний інтерес, ст. 6(1)(f) GDPR.</li>
<li>Завантаження карти Google Maps (Google Ireland Ltd.) і шрифтів Google Fonts — згода, ст. 6(1)(a) GDPR; її можна відкликати в «Налаштуваннях cookies».</li>
<li>Фото «до/після» публікуються лише з письмової згоди клієнтки (ст. 9(2)(a) GDPR).</li></ul>
<h2>4. Одержувачі</h2>
<p>Хостинг-провайдер у ЄС; за увімкненої інтеграції — Google Ireland Ltd. (календар салону: лише ім’я, телефон і час) та Telegram (внутрішні сповіщення персоналу). Ми не продаємо дані й не використовуємо їх для реклами.</p>
<h2>5. Строк зберігання</h2>
<p>Дані запису зберігаються ${s.months} міс. після візиту, потім автоматично знеособлюються.</p>
<h2>6. Ваші права</h2>
<p>Ви маєте право на доступ, виправлення, видалення, обмеження обробки, перенесення даних і заперечення. Скасувати запис і видалити дані можна самостійно за особистим посиланням із підтвердження запису або написавши нам. Ви також можете подати скаргу до наглядового органу: ${UOOU}.</p>`
};

let settings = null;
function draw() {
  if (!settings) return;
  const s = {
    company: esc(settings.companyName || settings.name), ico: esc(settings.ico), address: esc(settings.address),
    email: esc(settings.email), phone: esc(settings.phone), months: Number(settings.retentionMonths) || 24
  };
  document.getElementById('policy').innerHTML = (P[window.I18N.lang] || P.cs)(s);
  document.querySelectorAll('[data-bind="name"]').forEach((e) => (e.textContent = settings.name));
}
fetch('/api/public').then((r) => r.json()).then((d) => { settings = d.settings; draw(); });
window.I18N.onChange(draw);
})();
