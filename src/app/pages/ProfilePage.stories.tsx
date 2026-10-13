import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import ProfilePage from './ProfilePage';

const meta = {
  title: 'Pages/Profile',
  component: ProfilePage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/profile')],
} satisfies Meta<typeof ProfilePage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
