import type { Meta, StoryObj } from '@storybook/react';
import { NavItem, NavGroup, NavBar, Breadcrumb } from './Navigation';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const meta = {
  title: 'Molecules/Navigation',
  component: NavItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Navigation components for building consistent and accessible navigation systems. Includes navigation items, groups, bars, and breadcrumbs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'active', 'subtle', 'ghost'],
      description: 'Visual style of the navigation item',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the navigation item',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation of the navigation item',
    },
  },
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Dashboard',
    variant: 'default',
    size: 'md',
    orientation: 'horizontal',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Dashboard',
    icon: <HomeIcon />,
  },
};

export const Active: Story = {
  args: {
    label: 'Dashboard',
    active: true,
    icon: <HomeIcon />,
  },
};

export const WithBadge: Story = {
  args: {
    label: 'Messages',
    icon: <UserIcon />,
    badge: 5,
    badgeVariant: 'error',
  },
};

export const DifferentSizes: Story = {
  name: 'Different Sizes',
  render: () => (
    <div className="space-y-6">
      <div>
        <Typography variant="h5" className="mb-4">Small Size</Typography>
        <NavItem size="sm" label="Small Nav Item" icon={<HomeIcon />} />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Medium Size (Default)</Typography>
        <NavItem size="md" label="Medium Nav Item" icon={<HomeIcon />} />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Large Size</Typography>
        <NavItem size="lg" label="Large Nav Item" icon={<HomeIcon />} />
      </div>
    </div>
  ),
};

export const DifferentVariants: Story = {
  name: 'Different Variants',
  render: () => (
    <div className="space-y-6">
      <div>
        <Typography variant="h5" className="mb-4">Default Variant</Typography>
        <NavItem variant="default" label="Default Item" icon={<HomeIcon />} />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Active Variant</Typography>
        <NavItem variant="active" label="Active Item" icon={<HomeIcon />} />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Subtle Variant</Typography>
        <NavItem variant="subtle" label="Subtle Item" icon={<HomeIcon />} />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Ghost Variant</Typography>
        <NavItem variant="ghost" label="Ghost Item" icon={<HomeIcon />} />
      </div>
    </div>
  ),
};

export const VerticalOrientation: Story = {
  name: 'Vertical Orientation',
  render: () => (
    <div className="w-64">
      <NavItem orientation="vertical" label="Dashboard" icon={<HomeIcon />} active />
      <NavItem orientation="vertical" label="Users" icon={<UserIcon />} badge={12} badgeVariant="warning" />
      <NavItem orientation="vertical" label="Analytics" icon={<ChartIcon />} />
      <NavItem orientation="vertical" label="Settings" icon={<SettingsIcon />} />
    </div>
  ),
};

export const NavGroupExample: Story = {
  name: 'Navigation Groups',
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h5" className="mb-4">Default Group</Typography>
        <NavGroup title="Main Menu">
          <NavItem label="Dashboard" icon={<HomeIcon />} active />
          <NavItem label="Users" icon={<UserIcon />} />
          <NavItem label="Analytics" icon={<ChartIcon />} />
        </NavGroup>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Card Variant</Typography>
        <NavGroup variant="card" title="Administration">
          <NavItem label="Dashboard" icon={<HomeIcon />} active />
          <NavItem label="Users" icon={<UserIcon />} badge={5} />
          <NavItem label="Settings" icon={<SettingsIcon />} />
        </NavGroup>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Collapsible Group</Typography>
        <NavGroup variant="subtle" title="Advanced" collapsible defaultOpen={false}>
          <NavItem label="API Settings" icon={<SettingsIcon />} />
          <NavItem label="Integrations" icon={<ChartIcon />} />
          <NavItem label="Advanced Analytics" icon={<ChartIcon />} />
        </NavGroup>
      </div>
    </div>
  ),
};

export const NavBarExample: Story = {
  name: 'Navigation Bar',
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h5" className="mb-4">Default NavBar</Typography>
        <NavBar leftContent={<Typography variant="h6">Brand</Typography>}>
          <NavItem label="Home" variant="subtle" />
          <NavItem label="About" variant="subtle" />
          <NavItem label="Services" variant="subtle" />
          <NavItem label="Contact" variant="subtle" />
        </NavBar>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">NavBar with Sections</Typography>
        <NavBar 
          leftContent={
            <div className="flex items-center space-x-4">
              <Typography variant="h6">Brand</Typography>
              <NavItem label="Dashboard" variant="subtle" />
              <NavItem label="Users" variant="subtle" />
            </div>
          }
          rightContent={
            <div className="flex items-center space-x-4">
              <NavItem label="Settings" icon={<SettingsIcon />} variant="ghost" />
              <Button size="sm" variant="primary">Sign Up</Button>
            </div>
          }
        />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Elevated NavBar</Typography>
        <NavBar variant="elevated" position="sticky">
          <div className="flex items-center justify-between w-full">
            <Typography variant="h6">Admin Dashboard</Typography>
            <div className="flex items-center space-x-2">
              <NavItem label="Home" icon={<HomeIcon />} active />
              <NavItem label="Analytics" icon={<ChartIcon />} />
              <NavItem label="Settings" icon={<SettingsIcon />} />
            </div>
          </div>
        </NavBar>
      </div>
    </div>
  ),
};

export const BreadcrumbExample: Story = {
  name: 'Breadcrumbs',
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h5" className="mb-4">Simple Breadcrumb</Typography>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'Electronics' },
          ]}
        />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Breadcrumb with Icons</Typography>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/', icon: <HomeIcon /> },
            { label: 'Dashboard', href: '/dashboard', icon: <ChartIcon /> },
            { label: 'Settings', icon: <SettingsIcon /> },
          ]}
        />
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Custom Separator</Typography>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: 'Technology' },
          ]}
          separator="›"
        />
      </div>
    </div>
  ),
};

export const CompleteNavigationExample: Story = {
  name: 'Complete Navigation Example',
  render: () => (
    <Card variant="elevated" className="max-w-4xl">
      <Card.Header>
        <Typography variant="h4">Admin Dashboard Navigation</Typography>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-6">
          <NavBar variant="elevated">
            <div className="flex items-center justify-between w-full">
              <Typography variant="h6">Broski's Kitchen</Typography>
              <div className="flex items-center space-x-2">
                <NavItem label="Dashboard" active />
                <NavItem label="Orders" />
                <NavItem label="Menu" />
                <NavItem label="Customers" />
                <NavItem label="Reports" />
                <NavItem label="Settings" icon={<SettingsIcon />} />
              </div>
            </div>
          </NavBar>
          
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Orders', href: '/dashboard/orders' },
              { label: 'Recent Orders' },
            ]}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <NavGroup variant="card" title="Main Menu">
                <NavItem label="Dashboard" icon={<HomeIcon />} active />
                <NavItem label="Orders" icon={<ChartIcon />} badge={12} badgeVariant="warning" />
                <NavItem label="Menu Items" icon={<SettingsIcon />} />
                <NavItem label="Customers" icon={<UserIcon />} />
                <NavItem label="Analytics" icon={<ChartIcon />} />
              </NavGroup>
              
              <NavGroup variant="subtle" title="Settings" className="mt-4" collapsible defaultOpen={false}>
                <NavItem label="General" variant="subtle" />
                <NavItem label="Users & Permissions" variant="subtle" />
                <NavItem label="Integrations" variant="subtle" />
                <NavItem label="Billing" variant="subtle" />
              </NavGroup>
            </div>
            
            <div className="lg:col-span-3">
              <Card variant="elevated">
                <Card.Header>
                  <Typography variant="h5">Dashboard Content</Typography>
                </Card.Header>
                <Card.Content>
                  <Typography variant="body" className="text-[var(--color-text-secondary)]">
                    This is where your main dashboard content would go. The navigation system provides
                    a consistent and accessible way to move between different sections of your application.
                  </Typography>
                </Card.Content>
              </Card>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  ),
};

export const AccessibilityFeatures: Story = {
  name: 'Accessibility Features',
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h5" className="mb-4">Keyboard Navigation</Typography>
        <Typography variant="body" className="mb-4">
          Navigation components support keyboard navigation. Use Tab to move between navigation items,
          Enter to activate links, and Space to toggle collapsible sections.
        </Typography>
        <NavGroup variant="card" title="Keyboard Accessible Navigation">
          <NavItem label="Home" href="#home" icon={<HomeIcon />} />
          <NavItem label="Dashboard" href="#dashboard" icon={<ChartIcon />} active />
          <NavItem label="Settings" href="#settings" icon={<SettingsIcon />} />
        </NavGroup>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Screen Reader Support</Typography>
        <Typography variant="body" className="mb-4">
          Navigation items include proper ARIA labels and roles for screen readers.
          Badges are announced with their context, and collapsible sections indicate their state.
        </Typography>
        <NavGroup variant="card" title="Screen Reader Friendly" collapsible defaultOpen={false}>
          <NavItem label="Messages" icon={<UserIcon />} badge={3} badgeVariant="error" />
          <NavItem label="Notifications" icon={<SettingsIcon />} badge={12} badgeVariant="warning" />
          <NavItem label="Tasks" icon={<ChartIcon />} badge={0} />
        </NavGroup>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Focus Management</Typography>
        <Typography variant="body" className="mb-4">
          Navigation items show clear focus indicators with high contrast borders and
          consistent focus styles across all components.
        </Typography>
        <NavBar variant="elevated">
          <div className="flex items-center space-x-2">
            <NavItem label="Home" variant="subtle" />
            <NavItem label="Products" variant="subtle" />
            <NavItem label="About" variant="subtle" />
            <NavItem label="Contact" variant="subtle" />
          </div>
        </NavBar>
      </div>
    </div>
  ),
};