import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'de', label: 'DE', title: 'Deutsch' },
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'fr', label: 'FR', title: 'Français' },
  { code: 'it', label: 'IT', title: 'Italiano' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="lang-switcher" data-testid="lang-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.title}
          data-testid={`lang-btn-${lang.code}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
