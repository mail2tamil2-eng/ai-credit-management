import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import TranslationsPage from './TranslationsPage';

const meta = {
  title: 'Pages/Translations',
  component: TranslationsPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/courses/1/translations')],
} satisfies Meta<typeof TranslationsPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
