import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import CompetencyManagementPage from './CompetencyManagementPage';

const meta = {
  title: 'Pages/Competency Management',
  component: CompetencyManagementPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/competency')],
} satisfies Meta<typeof CompetencyManagementPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
