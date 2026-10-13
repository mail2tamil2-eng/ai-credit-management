import type { Meta, StoryObj } from '@storybook/react';
import { withRouter } from '../../../.storybook/decorators';
import LoginPage from './LoginPage';

const meta = {
  title: 'Pages/Login',
  component: LoginPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/login')],
} satisfies Meta<typeof LoginPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
