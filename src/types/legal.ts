export type LegalLanguageCode = "en" | "te" | "hi" | "ta" | "ml" | "kn";

export interface LegalLanguageOption {
  code: LegalLanguageCode;
  label: string;
  nativeLabel: string;
}