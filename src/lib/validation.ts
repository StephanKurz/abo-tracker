export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "mindestens 8 Zeichen",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "digit",
    label: "mindestens eine Ziffer",
    test: (pw) => /\d/.test(pw),
  },
  {
    id: "special",
    label: "mindestens ein Sonderzeichen",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
  {
    id: "uppercase",
    label: "mindestens ein Großbuchstabe",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "letter",
    label: "mindestens ein Buchstabe",
    test: (pw) => /[A-Za-z]/.test(pw),
  },
];

export function validatePassword(password: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.label,
  );
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
