import { LANGS, setLang, t, useLang } from '../i18n/index.js';

const NAMES = { es: 'Español', en: 'English' };

/** Cambia entre castellano e inglés. Muestra el idioma al que se pasa, escrito en ese idioma. */
export function LangToggle() {
  const lang = useLang();
  const target = LANGS.find((l) => l !== lang);
  return (
    <button type="button" className="theme-toggle lang-toggle" lang={target} title={t('Cambiar el idioma de la web')}
      aria-label={`${NAMES[target]} — ${t('Cambiar el idioma de la web')}`} onClick={() => setLang(target)}>
      {NAMES[target]}
    </button>
  );
}
