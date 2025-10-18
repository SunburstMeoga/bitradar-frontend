/*
 * Geo IP-based language detection (stable, country-only)
 * - Uses public GeoIP APIs that infer IP server-side; no IP is sent explicitly
 * - Primary: ipapi.co (https), Fallback: ip-api.com (https)
 * - Maps country and languages to supported locales
 * - Always logs: IP, country, and selected locale
 * - Applies locale only if user has not manually chosen a language
 */

const SUPPORTED_LOCALES = ['en', 'zh', 'ko', 'vi', 'ja', 'pt', 'es'];

async function fetchFromIpApiCo() {
  try {
    const res = await fetch(
      'https://ipapi.co/json/',
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('ipapi.co response not ok');
    const data = await res.json();
    // Normalize shape
    return {
      source: 'ipapi.co',
      ip: data?.ip || null,
      country_code: data?.country_code || null,
      country_name: data?.country_name || null,
      languages: data?.languages || null,
      region: data?.region || null,
      city: data?.city || null,
    };
  } catch (e) {
    console.warn('[GeoIP] ipapi.co failed:', e);
    return null;
  }
}

async function fetchFromIpApiCom() {
  try {
    const res = await fetch(
      'https://ip-api.com/json',
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('ip-api.com response not ok');
    const data = await res.json();
    if (data?.status !== 'success') throw new Error('ip-api.com status not success');
    return {
      source: 'ip-api.com',
      ip: data?.query || null,
      country_code: data?.countryCode || null,
      country_name: data?.country || null,
      languages: null, // ip-api.com doesn't provide languages
      region: data?.regionName || null,
      city: data?.city || null,
    };
  } catch (e) {
    console.warn('[GeoIP] ip-api.com failed:', e);
    return null;
  }
}

async function fetchGeoInfo() {
  const a = await fetchFromIpApiCo();
  if (a) return a;
  const b = await fetchFromIpApiCom();
  if (b) return b;
  return null;
}

function selectLocaleByLanguages(languages) {
  if (!languages) return null;
  const lower = String(languages).toLowerCase();
  if (lower.includes('zh')) return 'zh';
  if (lower.includes('ko')) return 'ko';
  if (lower.includes('vi')) return 'vi';
  if (lower.includes('ja')) return 'ja';
  if (lower.includes('pt')) return 'pt';
  if (lower.includes('es')) return 'es';
  if (lower.includes('en')) return 'en';
  return null;
}

function selectLocaleByCountryCode(code) {
  const cc = String(code || '').toUpperCase();
  // Chinese
  if (['CN', 'HK', 'MO', 'TW'].includes(cc)) return 'zh';
  // Korean
  if (cc === 'KR') return 'ko';
  // Vietnamese
  if (cc === 'VN') return 'vi';
  // Japanese
  if (cc === 'JP') return 'ja';
  // Portuguese: Brazil, Portugal, Angola, Mozambique, Guinea-Bissau, Cape Verde, Sao Tome & Principe, East Timor
  if (['BR', 'PT', 'AO', 'MZ', 'GW', 'CV', 'ST', 'TL'].includes(cc)) return 'pt';
  // Spanish: Spain and most LATAM countries
  if ([
    'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'DO',
    'BO', 'PY', 'UY', 'SV', 'HN', 'NI', 'CR', 'PA'
  ].includes(cc)) return 'es';
  // Default English for others
  return 'en';
}

function mapGeoToLocale(geo) {
  // Prefer languages from ipapi.co when available
  const byLang = selectLocaleByLanguages(geo?.languages);
  if (byLang && SUPPORTED_LOCALES.includes(byLang)) return byLang;
  // Fallback to country code mapping
  const byCountry = selectLocaleByCountryCode(geo?.country_code);
  return SUPPORTED_LOCALES.includes(byCountry) ? byCountry : 'zh';
}

export async function detectLanguageByIP() {
  try {
    const stored = localStorage.getItem('i18nextLng');
    const manual = localStorage.getItem('i18nextLng_manual') === 'true';

    const geo = await fetchGeoInfo();
    if (!geo) {
      // Final fallback to navigator
      const nav = (navigator.language || '').toLowerCase();
      const navLocale = nav.startsWith('zh') ? 'zh'
        : nav.startsWith('ko') ? 'ko'
        : nav.startsWith('vi') ? 'vi'
        : nav.startsWith('ja') ? 'ja'
        : nav.startsWith('pt') ? 'pt'
        : nav.startsWith('es') ? 'es'
        : 'en';
      console.log('[GeoIP] Fallback to navigator.language:', navigator.language, '->', navLocale);
      if (manual && stored && SUPPORTED_LOCALES.includes(stored)) {
        console.log('[GeoIP] Respect user manual preference:', stored, '(no auto change)');
        return null;
      }
      return navLocale;
    }

    const locale = mapGeoToLocale(geo);
    console.log('[GeoIP] Source:', geo.source, 'IP:', geo.ip, 'Country:', `${geo.country_name || ''}/${geo.country_code || ''}`, 'Languages:', geo.languages || '-', '-> Locale:', locale);

    if (manual && stored && SUPPORTED_LOCALES.includes(stored)) {
      console.log('[GeoIP] Respect user manual preference:', stored, '(no auto change)');
      return null;
    }

    return SUPPORTED_LOCALES.includes(locale) ? locale : 'zh';
  } catch (e) {
    console.warn('[GeoIP] detection error:', e);
    return null;
  }
}

export default detectLanguageByIP;