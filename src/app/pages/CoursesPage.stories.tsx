import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import CoursesPage from './CoursesPage';

const meta = {
  title: 'Pages/Courses',
  component: CoursesPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/courses')],
} satisfies Meta<typeof CoursesPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
