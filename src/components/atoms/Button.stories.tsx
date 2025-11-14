import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The Button component is the primary interactive element in the Broski\'s Kitchen design system. It supports multiple variants, sizes, and glow effects while maintaining accessibility standards.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'gold'],
      description: 'Visual style variant of the button',
      defaultValue: 'primary',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the button',
      defaultValue: 'md',
    },
    glow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Glow effect intensity',
      defaultValue: 'none',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
      defaultValue: false,
    },
    disabled: {
      control: 'boolean',
      description: 'Disables button interaction',
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Order Now',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'View Menu',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    children: 'Learn More',
    variant: 'outline',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Contact Us',
    variant: 'ghost',
    size: 'md',
  },
};

export const Gold: Story = {
  args: {
    children: 'Gold Button',
    variant: 'gold',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <Button variant="primary" size="sm">Small Button</Button>
      <Button variant="primary" size="md">Medium Button</Button>
      <Button variant="primary" size="lg">Large Button</Button>
      <Button variant="primary" size="xl">Extra Large Button</Button>
    </div>
  ),
};

export const GlowEffects: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <Button variant="primary" glow="sm">Small Glow</Button>
      <Button variant="primary" glow="md">Medium Glow</Button>
      <Button variant="primary" glow="lg">Large Glow</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: 'Processing...',
    variant: 'primary',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Primary</h3>
        <Button variant="primary">Primary Button</Button>
        <Button variant="primary" loading>Loading...</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Secondary</h3>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="secondary" loading>Loading...</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Outline</h3>
        <Button variant="outline">Outline Button</Button>
        <Button variant="outline" loading>Loading...</Button>
        <Button variant="outline" disabled>Disabled</Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Ghost</h3>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="ghost" loading>Loading...</Button>
        <Button variant="ghost" disabled>Disabled</Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Gold</h3>
        <Button variant="gold">Gold Button</Button>
        <Button variant="gold" loading>Loading...</Button>
        <Button variant="gold" disabled>Disabled</Button>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  args: {
    children: 'Accessible Button',
    variant: 'primary',
    'aria-label': 'Primary action button',
    'aria-pressed': false,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'button-name',
            enabled: true,
          },
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};