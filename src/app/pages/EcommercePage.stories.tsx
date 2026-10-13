import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import EcommercePage from './EcommercePage';

const meta = {
  title: 'Pages/E-commerce',
  component: EcommercePage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/ecommerce')],
} satisfies Meta<typeof EcommercePage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
