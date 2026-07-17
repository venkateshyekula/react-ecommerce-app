import type { LegalLanguageCode, LegalLanguageOption } from "../../types/legal";

interface LegalLanguageDropdownProps {
  selectedLanguage: LegalLanguageCode;
  onLanguageChange: (language: LegalLanguageCode) => void;
}

const legalLanguageOptions: LegalLanguageOption[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English"
  },
  {
    code: "te",
    label: "Telugu",
    nativeLabel: "తెలుగు"
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी"
  },
  {
    code: "ta",
    label: "Tamil",
    nativeLabel: "தமிழ்"
  },
  {
    code: "ml",
    label: "Malayalam",
    nativeLabel: "മലയാളം"
  },
  {
    code: "kn",
    label: "Kannada",
    nativeLabel: "ಕನ್ನಡ"
  }
];

const LegalLanguageDropdown = ({
  selectedLanguage,
  onLanguageChange
}: LegalLanguageDropdownProps) => {
  const selectedOption =
    legalLanguageOptions.find((option) => option.code === selectedLanguage) ??
    legalLanguageOptions[0];

  return (
    <div className="dropdown legal-language-dropdown">
      <button
        type="button"
        className="btn legal-language-toggle dropdown-toggle"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-globe2 legal-language-globe" />
        <span>{selectedOption.label}</span>
      </button>

      <ul className="dropdown-menu dropdown-menu-end legal-language-menu">
        {legalLanguageOptions.map((option) => {
          const isSelected = option.code === selectedLanguage;

          return (
            <li key={option.code}>
              <a
                className={`dropdown-item d-flex align-items-center justify-content-between ${
                  isSelected ? "active" : ""
                }`}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  onLanguageChange(option.code);
                }}
              >
                <span>{option.label} <small className="text-muted">({option.nativeLabel})</small></span>

                {isSelected ? (
                  <i className="bi bi-check-lg legal-language-check ms-2" />
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LegalLanguageDropdown;