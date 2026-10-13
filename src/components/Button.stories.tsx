import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { onClick: fn() },
  parameters: {
    a11y: { test: 'error' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { label: 'Primary button', variant: 'primary' },
};

export const Secondary: Story = {
  args: { label: 'Secondary button', variant: 'secondary' },
};

export const Danger: Story = {
  args: { label: 'Delete', variant: 'danger' },
};

export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button label="Primary" variant="primary" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Danger" variant="danger" />
      <Button label="Disabled" disabled />
    </div>
  ),
};
