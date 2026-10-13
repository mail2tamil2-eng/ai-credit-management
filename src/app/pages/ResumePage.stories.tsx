import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import ResumePage from './ResumePage';

const meta = {
  title: 'Pages/Resume',
  component: ResumePage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/resume')],
} satisfies Meta<typeof ResumePage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
