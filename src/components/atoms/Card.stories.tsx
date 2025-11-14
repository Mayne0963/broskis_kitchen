import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'Design System/Atoms/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The Card component provides a flexible container for grouping related content with consistent styling, shadows, and hover effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'elevated', 'minimal'],
      description: 'Visual style variant of the card',
      defaultValue: 'default',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Internal padding of the card',
      defaultValue: 'md',
    },
    glow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Glow effect on hover',
      defaultValue: 'none',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card. It can contain any type of content.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm">Action</Button>
        </CardFooter>
      </>
    ),
    variant: 'default',
    padding: 'md',
  },
};

export const Glass: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Glass Card</CardTitle>
          <CardDescription>With backdrop blur effect</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card features a glass morphism effect with backdrop blur.</p>
        </CardContent>
      </>
    ),
    variant: 'glass',
    padding: 'md',
  },
};

export const Elevated: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
          <CardDescription>With enhanced shadow and glow</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has enhanced elevation with glow effects.</p>
        </CardContent>
      </>
    ),
    variant: 'elevated',
    padding: 'md',
    glow: 'sm',
  },
};

export const Minimal: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Minimal Card</CardTitle>
          <CardDescription>Clean and simple</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A minimal card with subtle styling.</p>
        </CardContent>
      </>
    ),
    variant: 'minimal',
    padding: 'md',
  },
};

export const PaddingVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card padding="sm">
        <CardHeader>
          <CardTitle>Small Padding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">This card has small padding (16px).</p>
        </CardContent>
      </Card>
      <Card padding="md">
        <CardHeader>
          <CardTitle>Medium Padding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">This card has medium padding (24px).</p>
        </CardContent>
      </Card>
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Large Padding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">This card has large padding (32px).</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const GlowEffects: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card glow="sm">
        <CardHeader>
          <CardTitle>Small Glow</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Hover to see small glow effect.</p>
        </CardContent>
      </Card>
      <Card glow="md">
        <CardHeader>
          <CardTitle>Medium Glow</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Hover to see medium glow effect.</p>
        </CardContent>
      </Card>
      <Card glow="lg">
        <CardHeader>
          <CardTitle>Large Glow</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Hover to see large glow effect.</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ComplexContent: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order #12345</CardTitle>
              <CardDescription>Placed 2 hours ago</CardDescription>
            </div>
            <span className="bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] px-2 py-1 rounded-full text-xs font-semibold">
              Processing
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Customer:</span>
              <span className="text-[var(--color-text-primary)]">John Doe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Total:</span>
              <span className="text-[var(--color-text-primary)] font-semibold">$45.99</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Items:</span>
              <span className="text-[var(--color-text-primary)]">3 items</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">View Details</Button>
          <Button variant="primary" size="sm">Process Order</Button>
        </CardFooter>
      </>
    ),
    variant: 'elevated',
    padding: 'md',
  },
};

export const Accessibility: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Accessible Card</CardTitle>
          <CardDescription>This card demonstrates proper accessibility</CardDescription>
        </CardHeader>
        <CardContent>
          <p>All interactive elements have proper ARIA labels and keyboard navigation.</p>
        </CardContent>
      </>
    ),
    variant: 'default',
    padding: 'md',
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};