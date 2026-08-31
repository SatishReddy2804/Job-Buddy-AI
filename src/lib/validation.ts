export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter (A–Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a–z)', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number (0–9)', test: (pw: string) => /\d/.test(pw) },
  { label: 'One special character (!@#$%^&*…)', test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]/.test(pw) },
];

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address (e.g. you@example.com or name@college.edu).';
  }
  const domain = trimmed.split('@')[1]?.toLowerCase() ?? '';
  if (domain.length < 4 || !domain.includes('.')) {
    return 'The email domain looks incomplete. Please double-check your email.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return rule.label;
    }
  }
  return null;
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return 'Phone number is required.';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Please enter a valid phone number with country code (e.g. +1 555 123 4567).';
  }
  return null;
}
