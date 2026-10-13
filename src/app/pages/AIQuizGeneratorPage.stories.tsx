import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import AIQuizGeneratorPage from './AIQuizGeneratorPage';

const meta = {
  title: 'Pages/AI Quiz Generator',
  component: AIQuizGeneratorPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/ai-quiz')],
} satisfies Meta<typeof AIQuizGeneratorPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
