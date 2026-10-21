'use strict';

const LANGS = ['cs', 'en', 'ru', 'uk'];
const DEFAULT_LANG = 'cs';
const LOCALE = { cs: 'cs_CZ', en: 'en_GB', ru: 'ru_RU', uk: 'uk_UA' };
const META = {
  cs: { title: 'Laserová epilace Praha | {name}', desc: 'Laserová epilace diodovým laserem v centru Prahy. Transparentní ceník, zkušené specialistky a online rezervace během minuty.' },
  en: { title: 'Laser hair removal Prague | {name}', desc: 'Diode laser hair removal in central Prague. Transparent prices, experienced specialists and online booking in a minute.' },
  ru: { title: 'Лазерная эпиляция в Праге | {name}', desc: 'Лазерная эпиляция диодным лазером в центре Праги. Прозрачные цены, опытные мастера и онлайн-запись за минуту.' },
  uk: { title: 'Лазерна епіляція в Празі | {name}', desc: 'Лазерна епіляція діодним лазером у центрі Праги. Прозорі ціни, досвідчені майстри та онлайн-запис за хвилину.' }
};

const PRIVACY = { cs: 'Ochrana osobních údajů | {name}', en: 'Privacy policy | {name}', ru: 'Политика конфиденциальности | {name}', uk: 'Політика конфіденційності | {name}' };

const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SCRIPT_UNSAFE = new RegExp('[<>&' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');
const jsonForScript = (o) => JSON.stringify(o).replace(SCRIPT_UNSAFE, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

function negotiateLang(header) {
  const prefs = String(header || '').split(',').map((part) => {
    const [tag, ...params] = part.trim().toLowerCase().split(';');
    const q = Number((params.find((p) => p.trim().startsWith('q=')) || 'q=1').split('=')[1]);
    return { lang: tag.split('-')[0], q: Number.isFinite(q) ? q : 0 };
  }).filter((p) => p.lang).sort((a, b) => b.q - a.q);
  return (prefs.find((p) => LANGS.includes(p.lang)) || {}).lang || DEFAULT_LANG;
}

function parseAddress(address) {

  const [street, rest = ''] = String(address).split(/,(.+)/);
  const m = /(\d{3}\s?\d{2})\s+(.+)/.exec(rest.trim());
  return { streetAddress: street.trim(), postalCode: m ? m[1] : '', addressLocality: m ? m[2].replace(/\s+\d+$/, '') : rest.trim() };
}

function jsonLd(db, baseUrl, lang, ogImage = false) {
  const s = db.settings;
  const prices = db.services.filter((x) => x.active).map((x) => x.price);
  const hours = /(\d{2}:\d{2})\D+(\d{2}:\d{2})/.exec(s.hours || '');
  const pick = (it, f) => (lang !== 'cs' && it.tr?.[lang]?.[f]) || it[f];
  return {
    '@context': 'https://schema.org', '@type': 'BeautySalon', '@id': baseUrl + '/#salon',
    name: s.name, url: `${baseUrl}/${lang}/`, telephone: s.phone, email: s.email, image: ogImage ? baseUrl + '/og.png' : undefined,
    priceRange: prices.length ? `${Math.min(...prices)}–${Math.max(...prices)} ${s.currency}` : undefined,
    currenciesAccepted: 'CZK', paymentAccepted: 'Cash, Credit Card',
    address: { '@type': 'PostalAddress', ...parseAddress(s.address), addressCountry: 'CZ' },
    geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lon },
    openingHoursSpecification: hours ? [{ '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: hours[1], closes: hours[2] }] : undefined,
    sameAs: [s.instagram, s.telegram].filter((u) => /^https:\/\/.+\..+\/.+/.test(u || '')),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: pick({ name: 'Laserová epilace', tr: { en: { name: 'Laser hair removal' }, ru: { name: 'Лазерная эпиляция' }, uk: { name: 'Лазерна епіляція' } } }, 'name'),
      itemListElement: db.services.filter((x) => x.active).map((x) => ({ '@type': 'Offer', price: x.price, priceCurrency: 'CZK',
        itemOffered: { '@type': 'Service', name: pick(x, 'name'), description: pick(x, 'short') } })) }
  };
}

function renderPage(template, { db, baseUrl, lang, page = '', ogImage = false }) {
  const name = db.settings.name;
  const meta = page ? { ...META[lang], title: PRIVACY[lang] } : META[lang];
  const url = `${baseUrl}/${lang}/${page}`;
  const head = [
    `<title>${escHtml(meta.title.replace('{name}', name))}</title>`,
    `<meta name="description" content="${escHtml(meta.desc)}">`,
    `<link rel="canonical" href="${escHtml(url)}">`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${escHtml(`${baseUrl}/${l}/${page}`)}">`),
    `<link rel="alternate" hreflang="x-default" href="${escHtml(`${baseUrl}/${DEFAULT_LANG}/${page}`)}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="${escHtml(name)}">`,
    `<meta property="og:title" content="${escHtml(meta.title.replace('{name}', name))}">`,
    `<meta property="og:description" content="${escHtml(meta.desc)}">`, `<meta property="og:url" content="${escHtml(url)}">`,
    `<meta property="og:locale" content="${LOCALE[lang]}">`, ogImage ? `<meta property="og:image" content="${escHtml(baseUrl + '/og.png')}">` : '',
    page === '' ? `<script type="application/ld+json">${jsonForScript(jsonLd(db, baseUrl, lang, ogImage))}</script>` : ''
  ].join('\n');
  return template
    .replace(/<html lang="[a-z]{2}"/, `<html lang="${lang}" data-lang="${lang}"`)
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('<!--SEO-->', head);
}

function sitemap(baseUrl) {
  const urls = [];
  for (const page of ['', 'privacy/']) for (const l of LANGS) {
    const alts = LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${escHtml(`${baseUrl}/${a}/${page}`)}"/>`).join('');
    urls.push(`<url><loc>${escHtml(`${baseUrl}/${l}/${page}`)}</loc>${alts}<changefreq>weekly</changefreq><priority>${page ? '0.3' : '1.0'}</priority></url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

const robots = (baseUrl) => `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /manage.html\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;

module.exports = { LANGS, DEFAULT_LANG, negotiateLang, renderPage, sitemap, robots, jsonLd, parseAddress, jsonForScript, escHtml };
