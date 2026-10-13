import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import Dashboard from './Dashboard';

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/dashboard')],
} satisfies Meta<typeof Dashboard>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
