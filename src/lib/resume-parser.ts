import type { ResumeContent } from '@/types';

const SKILL_DICTIONARY = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Node', 'Python', 'Java', 'Go', 'Rust',
  'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'Dart', 'Perl', 'Shell', 'Bash',
  'HTML', 'CSS', 'Tailwind CSS', 'Tailwind', 'SASS', 'SCSS', 'Bootstrap',
  'Next.js', 'Next', 'Nuxt', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'SvelteKit', 'Ember', 'Backbone',
  'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Rails', 'Ruby on Rails',
  'Laravel', 'Symfony', 'Gin', 'Fiber', 'Phoenix', 'ASP.NET', '.NET', '.NET Core',
  'GraphQL', 'REST', 'gRPC', 'WebSockets', 'tRPC',
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'MariaDB',
  'DynamoDB', 'Cassandra', 'Elasticsearch', 'Neo4j', 'Firebase', 'Supabase', 'Prisma', 'Drizzle', 'TypeORM',
  'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Helm', 'Vagrant',
  'AWS', 'GCP', 'Azure', 'DigitalOcean', 'Heroku', 'Vercel', 'Netlify', 'Cloudflare', 'Linode',
  'Lambda', 'EC2', 'S3', 'RDS', 'CloudFront', 'CloudFormation', 'IAM',
  'CI/CD', 'Jenkins', 'CircleCI', 'GitHub Actions', 'GitLab CI', 'Travis CI', 'ArgoCD',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
  'Webpack', 'Vite', 'Rollup', 'Parcel', 'esbuild', 'Babel', 'SWC',
  'Jest', 'Vitest', 'Cypress', 'Testing Library', 'Playwright', 'Selenium', 'Mocha', 'Chai', 'PyTest', 'JUnit',
  'Kafka', 'RabbitMQ', 'Celery', 'Bull', 'SQS', 'NSQ', 'NATS',
  'Machine Learning', 'ML', 'Deep Learning', 'NLP', 'Natural Language Processing', 'Computer Vision',
  'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy', 'SciPy', 'Matplotlib',
  'JAX', 'Hugging Face', 'OpenAI', 'LangChain', 'Llama', 'Transformers',
  'Spark', 'Hadoop', 'Airflow', 'dbt', 'Snowflake', 'BigQuery', 'Databricks', 'Lakehouse', 'Delta Lake',
  'System Design', 'Microservices', 'REST API', 'Event-Driven', 'CQRS', 'DDD', 'Hexagonal Architecture',
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Trello',
  'Linux', 'Unix', 'macOS', 'Windows',
  'Nginx', 'Apache', 'HAProxy', 'Envoy', 'Linkerd', 'Istio',
  'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Sentry', 'OpenTelemetry', 'Jaeger',
  'OAuth', 'JWT', 'SAML', 'SSO', 'OIDC', 'RBAC', 'Auth0',
  'Figma', 'Sketch', 'Adobe XD', 'Tailwind UI',
  'Solidity', 'Web3', 'Ethereum', 'Smart Contracts',
  'Objective-C', 'Clojure', 'Elixir', 'Haskell', 'OCaml', 'F#', 'Erlang',
];

function normalizeSkillName(raw: string): string {
  const trimmed = raw.trim();
  const known = SKILL_DICTIONARY.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  return known ?? trimmed;
}

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of SKILL_DICTIONARY) {
    const skillLower = skill.toLowerCase();
    const patterns = [
      `\\b${skillLower.replace(/[.+*?^$()|[\]\\]/g, '\\$&')}\\b`,
    ];
    for (const pattern of patterns) {
      if (new RegExp(pattern, 'i').test(lower)) {
        found.add(normalizeSkillName(skill));
        break;
      }
    }
  }

  const fromCommaSeparated = text.match(/(Technical Skills|Skills|Technologies|Tech Stack|Core Competencies)[:\s]*([^\n]+)/i);
  if (fromCommaSeparated) {
    const items = fromCommaSeparated[2].split(/[,;•|]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
    for (const item of items) {
      found.add(normalizeSkillName(item));
    }
  }

  return Array.from(found);
}

function extractSummary(text: string): string {
  const summaryMatch = text.match(/(?:Professional Summary|Summary|Profile|Objective|About Me)[:\s]*([\s\S]*?)(?=\n\s*\n|\n(?:Experience|Work Experience|Employment|Education|Skills|Projects|Certifications))/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().slice(0, 500);
  }
  const firstPara = text.trim().split(/\n\s*\n/)[0];
  return firstPara?.slice(0, 500) ?? '';
}

function extractExperience(text: string): ResumeContent['experience'] {
  const experiences: NonNullable<ResumeContent['experience']>[number][] = [];
  const expSection = text.match(/(?:Work Experience|Experience|Employment History|Professional Experience)[:\s]*([\s\S]*?)(?=\n\s*(Education|Skills|Projects|Certifications|Technical Skills))/i);
  if (!expSection) return experiences;
  const lines = expSection[1].split('\n').map((l) => l.trim()).filter(Boolean);
  let current: NonNullable<ResumeContent['experience']>[number] | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b.+\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|\d{4})\b)/i) ||
                      line.match(/(\d{4}\s*[–\-–]\s*(?:Present|\d{4}))/i);
    if (dateMatch && current) {
      current.end = dateMatch[1].split(/[–\-–]/).pop()?.trim() ?? '';
      current.start = dateMatch[1].split(/[–\-–]/)[0]?.trim() ?? '';
      continue;
    }
    const roleCompanyMatch = line.match(/^(.+?)\s*(?:[,@|–\-–at]+)\s*(.+)$/i) ?? line.match(/^(.+?)\s+at\s+(.+)$/i);
    if (roleCompanyMatch && line.length < 100) {
      if (current) experiences.push(current);
      current = { company: roleCompanyMatch[2].trim(), role: roleCompanyMatch[1].trim(), start: '', end: '', description: '' };
    } else if (current && !dateMatch) {
      current.description = current.description ? `${current.description} ${line}` : line;
    }
  }
  if (current) experiences.push(current);
  return experiences.slice(0, 10);
}

function extractEducation(text: string): ResumeContent['education'] {
  const education: NonNullable<ResumeContent['education']>[number][] = [];
  const eduSection = text.match(/(?:Education|Academic Background)[:\s]*([\s\S]*?)(?=\n\s*(Skills|Projects|Certifications|Technical Skills|$))/i);
  if (!eduSection) return education;
  const lines = eduSection[1].split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length < 5) continue;
    const gradMatch = line.match(/(\d{4})/);
    const parts = line.split(/[,@|–\-–]/).map((s) => s.trim()).filter(Boolean);
    education.push({
      school: parts[0] ?? line,
      degree: parts[1] ?? '',
      field: parts[2] ?? '',
      graduation: gradMatch ? gradMatch[1] : '',
    });
  }
  return education.slice(0, 5);
}

export function parseResumeText(text: string): ResumeContent {
  return {
    summary: extractSummary(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    skills: extractSkillsFromText(text),
    projects: [],
    certifications: [],
  };
}

export async function extractTextFromTxt(file: File): Promise<string> {
  return file.text();
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

export async function parseResumeFile(file: File): Promise<ResumeContent> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isText = file.type.startsWith('text/') || /\.(txt|md|rtf)$/i.test(file.name);
  let text: string;
  if (isPdf) {
    text = await extractTextFromPdf(file);
  } else if (isText) {
    text = await extractTextFromTxt(file);
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or text file.');
  }

  if (text.trim().length < 20) {
    throw new Error('Could not extract enough text from the file. Please try a different file.');
  }

  return parseResumeText(text);
}
