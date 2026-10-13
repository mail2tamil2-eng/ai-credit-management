import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import AICreateCoursePage from './AICreateCoursePage';

const meta = {
  title: 'Pages/AI Create Course',
  component: AICreateCoursePage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/ai-create-course')],
} satisfies Meta<typeof AICreateCoursePage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
