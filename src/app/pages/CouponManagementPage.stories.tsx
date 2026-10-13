import type { Meta, StoryObj } from '@storybook/react';
import { withCourses, withRouter } from '../../../.storybook/decorators';
import CouponManagementPage from './CouponManagementPage';

const meta = {
  title: 'Pages/Coupon Management',
  component: CouponManagementPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withCourses, withRouter('/coupons')],
} satisfies Meta<typeof CouponManagementPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
