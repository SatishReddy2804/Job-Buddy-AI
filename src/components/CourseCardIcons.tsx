import { GraduationCap, Youtube } from 'lucide-react';

export interface CourseCardResourceLinks {
  youtubeUrl?: string;
  courseUrl?: string;
  platform?: string;
}

interface CourseCardIconsProps extends CourseCardResourceLinks {
  courseTitle: string;
}

function demoYoutubeUrl(courseTitle: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${courseTitle} tutorial`)}`;
}

function demoCourseUrl(courseTitle: string): string {
  return `https://www.coursera.org/search?query=${encodeURIComponent(courseTitle)}`;
}

export function CourseCardIcons({ courseTitle, youtubeUrl, courseUrl, platform }: CourseCardIconsProps) {
  const resolvedYoutubeUrl = youtubeUrl || demoYoutubeUrl(courseTitle);
  const resolvedCourseUrl = courseUrl || demoCourseUrl(courseTitle);
  const courseLabel = platform ? `View course on ${platform}` : 'View course';

  return (
    <div className="flex items-center gap-1.5 sm:ml-auto" aria-label="Course resources">
      {resolvedYoutubeUrl && (
        <a
          href={resolvedYoutubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch tutorial"
          aria-label={`Watch ${courseTitle} tutorial`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary-400 transition-all hover:scale-105 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <Youtube className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      {resolvedCourseUrl && (
        <a
          href={resolvedCourseUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={courseLabel}
          aria-label={`${courseLabel} for ${courseTitle}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary-400 transition-all hover:scale-105 hover:bg-primary-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
