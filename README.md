# Job Buddy AI

**Your AI job application agent — land your next job on autopilot.**

Job Buddy AI discovers jobs, matches them to your profile and resume, tailors your applications, and tracks everything through a drag-and-drop pipeline — all in one place. Upload your resume, get matched to jobs based on the skills it contains, and close skill gaps with personalized recommendations.

---

## Features

### Resume Upload & Parsing
- Drag-and-drop upload for **PDF** and **text** files
- Automatic extraction of skills, experience, education, and summary from uploaded resumes
- Built-in skill dictionary recognizes 150+ technologies (languages, frameworks, cloud, databases, ML, and more)
- Keep multiple resume versions and designate a **primary** resume for matching

### AI-Powered Job Matching
- Every job is scored **0–100** against your profile using a hybrid semantic + rule-based matching algorithm
- Toggle between matching by your **resume skills** or your **profile skills** on the jobs page
- Transparent gap analysis shows which required and preferred skills you already have (green) and which are missing (amber)
- Filter jobs by work mode, experience level, and minimum match score

### Skill Gap Advisor
- On each job detail page, the advisor compares the job's required and preferred skills against your primary resume
- See exactly which skills are missing from your resume
- Add individual missing skills to your resume with one click, or add all at once
- If your resume already covers everything, a confirmation is shown instead

### Application Pipeline
- Drag-and-drop **Kanban board** with seven stages: discovered, matched, applied, viewed, interview, offer, rejected
- Track every application from first discovery to final offer
- List view and board view with search and stage filtering
- Recent activity feed on the dashboard

### Resume Builder
- Create and edit resume versions with summary, experience entries, education, and skills
- Set a primary resume for job matching
- Export any resume as a text file
- ATS score display per resume

### Job Detail Tools
- Full job description, requirements, benefits, and salary information
- **AI cover letter generator** — produces a tailored cover letter based on your profile and the job description
- **Interview prep** — generates role-specific practice questions across technical, behavioral, and system-design categories
- Direct apply link when available

### Skill Developer
- Analyzes your current skills against all available job postings to identify skill gaps
- Shows how frequently each missing skill appears as required vs. preferred across jobs
- Generates personalized learning plans with priority levels (high/medium/low) based on market demand
- Each plan includes a 4-step learning path (course, project, deep dive, practice) with estimated time and resource types
- Check off steps as you complete them with per-plan and overall progress tracking
- Search skill gaps and generate plans for any custom skill you want to learn
- **Course link icons** on every learning step — a YouTube icon linking to a tutorial and a graduation-cap icon linking to an external course (Coursera, Udemy, edX, etc.), each opening in a new tab with tooltips. When real URLs are not provided, demo search links are generated automatically from the step title so every card always has working resource links.

### Analytics Dashboard
- Application funnel: applied → viewed → interview → offer with conversion rates at each stage
- Pipeline breakdown showing distribution across all stages
- Top companies you've applied to
- Key metrics: total applications, interview rate, offer rate, average match score, rejection rate

### Multi-Currency Salary Display
- Salaries displayed in your preferred currency with live conversion rates
- Powered by a Supabase Edge Function that fetches current exchange rates

### Authentication & Security
- **Sign up / sign in** with email and password
- **Google OAuth** — one-click sign in with your Google account
- **GitHub OAuth** — one-click sign in with your GitHub account
- **Password reset by email** — receive a secure reset link in your inbox
- **Password reset by SMS** — receive a reset code on your phone
- **Strong password validation** — requires at least 8 characters with uppercase, lowercase, number, and special character, with a live checklist during sign-up
- **Email validation** — checks for proper email format including college/organization email IDs (e.g. name@college.edu)
- Guided onboarding wizard to set up your profile, target roles, and skills

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend framework | React 18 |
| Language | TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 7 |
| Backend & database | Supabase (PostgreSQL, Auth, Edge Functions) |
| PDF parsing | pdfjs-dist 4 |
| Icons | lucide-react |
| Linting | ESLint 9 |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 10 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/SatishReddy2804/Job-Buddy-AI.git
cd Job-Buddy-AI

# Install dependencies
npm install
```

### Running the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for production

```bash
npm run build
```

The production build is output to the `dist/` directory. Preview it with:

```bash
npm run preview
```

### Deploying to Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as **Vite**. The default build command (`npm run build`) and output directory (`dist`) are already configured by the project.
3. Add these environment variables in the Vercel project settings for the **Production**, **Preview**, and **Development** environments:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
4. Deploy the project. The included `vercel.json` keeps client-side React Router routes working when a URL is opened or refreshed directly.

Do not commit `.env` or expose Supabase service-role keys in the frontend. The browser app only needs the public anon key, and Supabase Row Level Security must remain enabled.

### Type checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

---

## Environment Variables

Create a local `.env` file for development, or add the same variables in Vercel's project settings:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | The Supabase project URL (used by the client SDK to connect to the database and auth) |
| `VITE_SUPABASE_ANON_KEY` | The Supabase anonymous public key (used for client-side authentication and database access with Row Level Security) |

Both variables are required for the app to function. If you set up your own Supabase project, replace these values with your own project's URL and anon key from the Supabase dashboard (**Settings → API**).

---

## Project Structure

```
Job-Buddy-AI/
├── public/                      # Static assets
├── src/
│   ├── components/              # Reusable UI components (Logo, buttons, cards, CourseCardIcons, etc.)
│   ├── context/                 # React context providers (AuthContext)
│   ├── hooks/                   # Custom hooks (useApplications, useCurrencyRates)
│   ├── layouts/                 # Layout wrappers (AppLayout with sidebar navigation)
│   ├── lib/                     # Core libraries
│   │   ├── api.ts               # Supabase data-access functions
│   │   ├── resume-parser.ts     # PDF/text resume parsing and skill extraction
│   │   ├── supabase.ts          # Supabase client initialization
│   │   ├── utils.ts             # Shared utilities (match scoring, formatting, helpers)
│   │   └── validation.ts        # Email, password, and phone validation rules
│   ├── pages/                   # Application pages
│   │   ├── LandingPage.tsx      # Marketing landing page
│   │   ├── AuthPage.tsx         # Sign in / sign up, OAuth, password reset
│   │   ├── OnboardingPage.tsx   # Profile setup wizard
│   │   ├── DashboardPage.tsx    # Overview with Kanban pipeline and job matches
│   │   ├── JobsPage.tsx         # Job feed with matching and filters
│   │   ├── JobDetailPage.tsx    # Job details, skill gap advisor, cover letter, interview prep
│   │   ├── ApplicationsPage.tsx # Application pipeline (list + board views)
│   │   ├── ResumesPage.tsx      # Resume upload, builder, and management
│   │   ├── AnalyticsPage.tsx    # Funnel metrics and conversion analytics
│   │   ├── SkillDeveloperPage.tsx # Skill gap analysis and learning plan generator
│   │   └── SettingsPage.tsx     # Profile and preferences settings
│   ├── types/                   # TypeScript type definitions
│   ├── App.tsx                  # Root component with routing
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles and Tailwind directives
├── supabase/
│   ├── migrations/              # Database schema migrations
│   └── functions/               # Edge functions (currency-rates)
├── .env                         # Environment variables (included)
├── .gitignore                   # Git ignore rules
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.app.json            # TypeScript app-specific config
├── tsconfig.node.json           # TypeScript Node-specific config
└── vite.config.ts               # Vite configuration
```

---

## Database

The app uses Supabase (PostgreSQL) with the following tables:

| Table | Purpose |
|---|---|
| `profiles` | User profile data (name, role, experience, currency preference, onboarding state) |
| `jobs` | Job listings with required/preferred skills, salary, location, and metadata |
| `applications` | Tracked applications with stage, match score, and application method |
| `resumes` | Stored resumes with structured content (summary, experience, education, skills) |
| `skills` | Master skill catalog with categories |
| `profile_skills` | Junction table linking profiles to skills with proficiency levels |
| `activity_log` | Audit trail of user actions (job added, stage changed, applied, etc.) |

All tables have **Row Level Security (RLS)** enabled with policies scoped to the authenticated user.

### Edge Functions

- **`currency-rates`** — Fetches live exchange rates to power multi-currency salary display.

---

## License

This project is licensed under the **MIT License** — a permissive license that allows anyone to use, copy, modify, merge, publish, distribute, and sublicense the software with minimal restrictions. The only requirement is that the original copyright notice and license text be included in all copies.

---

Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.
