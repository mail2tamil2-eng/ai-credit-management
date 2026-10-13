import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import SiteAdminPage from './SiteAdminPage';

const meta = {
  title: 'Pages/Site Admin',
  component: SiteAdminPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/admin')],
} satisfies Meta<typeof SiteAdminPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
