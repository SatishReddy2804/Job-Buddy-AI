/*
# Validate profile data and store preferred currency

1. New Columns
- `profiles.preferred_currency` — the user's ISO 4217 three-letter display currency, defaulting to USD.

2. Modified Tables
- `profiles` — adds validation checks for years of experience, salary ranges, and currency format.

3. Security
- Existing owner-scoped profile RLS policies remain unchanged.
- The new column is protected by the existing profile SELECT and UPDATE policies.

4. Important Notes
- Validation is intentionally limited to values that can be checked reliably at the database boundary.
- Existing rows receive USD and are not deleted or rewritten.
- Phone and URL format validation is handled in the frontend forms to avoid rejecting existing bare-domain entries.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_currency_format') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_preferred_currency_format
      CHECK (preferred_currency ~ '^[A-Z]{3}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_years_experience_range') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_years_experience_range
      CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 50));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_salary_range') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_salary_range
      CHECK (
        (salary_min IS NULL OR salary_min >= 0)
        AND (salary_max IS NULL OR salary_max >= 0)
        AND (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_currency ON jobs(salary_currency);
