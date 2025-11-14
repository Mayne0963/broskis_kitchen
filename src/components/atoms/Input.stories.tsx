import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile input component with multiple variants, sizes, and accessibility features. Built with WCAG 2.1 AA compliance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'gold', 'burgundy', 'error'],
      description: 'Visual style variant of the input',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input field',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input is in an error state',
    },
    label: {
      control: 'text',
      description: 'Label text for the input field',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below the input',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'HTML input type',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'John Doe',
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'john@example.com',
    helperText: 'We\'ll never share your email with anyone else.',
  },
}

export const Required: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    required: true,
    type: 'password',
  },
}

export const Error: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'john@example.com',
    error: true,
    helperText: 'Please enter a valid email address.',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
}

export const GoldVariant: Story = {
  args: {
    label: 'Gold Variant',
    placeholder: 'This input uses gold styling',
    variant: 'gold',
  },
}

export const BurgundyVariant: Story = {
  args: {
    label: 'Burgundy Variant',
    placeholder: 'This input uses burgundy styling',
    variant: 'burgundy',
  },
}

export const SmallSize: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size input',
    size: 'sm',
  },
}

export const LargeSize: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size input',
    size: 'lg',
  },
}

export const EmailType: Story = {
  args: {
    label: 'Email',
    placeholder: 'john@example.com',
    type: 'email',
  },
}

export const PasswordType: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
  },
}

export const NumberType: Story = {
  args: {
    label: 'Age',
    placeholder: '25',
    type: 'number',
  },
}

export const SearchType: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    type: 'search',
  },
}

export const ComplexForm: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <Input
        label="Full Name"
        placeholder="Enter your full name"
        required
      />
      <Input
        label="Email Address"
        placeholder="john@example.com"
        type="email"
        required
      />
      <Input
        label="Phone Number"
        placeholder="(555) 123-4567"
        type="tel"
      />
      <Input
        label="Website"
        placeholder="https://example.com"
        type="url"
        helperText="Include https:// in your URL"
      />
      <Input
        label="Message"
        placeholder="Enter your message here..."
        helperText="Maximum 500 characters"
      />
    </div>
  ),
}

export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
        <p className="text-sm text-gray-600 mb-6">
          This component includes comprehensive accessibility features:
        </p>
      </div>
      
      <Input
        label="Screen Reader Label"
        placeholder="This input has proper ARIA labeling"
        helperText="Screen readers will announce the label and helper text"
      />
      
      <Input
        label="Required Field"
        placeholder="This field is required"
        required
        helperText="Required fields are marked with an asterisk and proper ARIA attributes"
      />
      
      <Input
        label="Error State"
        placeholder="This input has an error"
        error
        helperText="Error states are communicated through ARIA attributes"
      />
      
      <Input
        label="Keyboard Navigation"
        placeholder="Tab navigation works properly"
        helperText="Use Tab to navigate between inputs"
      />
      
      <Input
        label="Focus Management"
        placeholder="Focus is clearly visible"
        helperText="Focus indicators meet WCAG 2.1 AA standards"
      />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-2xl">
      <div>
        <h3 className="text-xl font-semibold mb-6">All Input Variants</h3>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Default Variants</h4>
          <Input placeholder="Default variant" />
          <Input variant="gold" placeholder="Gold variant" />
          <Input variant="burgundy" placeholder="Burgundy variant" />
          <Input error placeholder="Error variant" />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Size Variants</h4>
          <Input size="sm" placeholder="Small size" />
          <Input size="md" placeholder="Medium size (default)" />
          <Input size="lg" placeholder="Large size" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Type Variants</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <Input type="text" placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input type="password" placeholder="Password input" />
          <Input type="number" placeholder="Number input" />
          <Input type="tel" placeholder="Phone input" />
          <Input type="url" placeholder="URL input" />
        </div>
      </div>
    </div>
  ),
}