import { MemoryRouter } from 'react-router';
import { CourseProvider } from '../src/app/context/CourseContext';
import { Toaster } from 'sonner';

export const withRouter =
  (initialPath = '/') =>
  (Story) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Story />
    </MemoryRouter>
  );

export const withCourses = (Story) => (
  <CourseProvider>
    <Story />
    <Toaster position="top-right" richColors />
  </CourseProvider>
);
