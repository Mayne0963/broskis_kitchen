import type { Meta, StoryObj } from '@storybook/react';
import { FormField, Label, HelperText, FormFieldGroup, InputGroup, FormSection } from './FormField';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';

const meta = {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form field components for building accessible and consistent forms. Includes labels, helper text, and grouping utilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the form field spacing',
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
  },
  render: (args) => (
    <FormField {...args}>
      <Label htmlFor="name">Full Name</Label>
      <Input id="name" placeholder="Enter your full name" />
      <HelperText>Please enter your first and last name</HelperText>
    </FormField>
  ),
};

export const RequiredField: Story = {
  render: () => (
    <FormField>
      <Label htmlFor="email" required>Email Address</Label>
      <Input id="email" type="email" placeholder="Enter your email" required />
      <HelperText>We'll never share your email with anyone else</HelperText>
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField>
      <Label htmlFor="password" error>Password</Label>
      <Input id="password" type="password" error placeholder="Enter your password" />
      <HelperText variant="error">Password must be at least 8 characters long</HelperText>
    </FormField>
  ),
};

export const WithSuccess: Story = {
  render: () => (
    <FormField>
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="Choose a username" />
      <HelperText variant="success">Username is available!</HelperText>
    </FormField>
  ),
};

export const DifferentSizes: Story = {
  name: 'Different Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h5" className="mb-4">Small Size</Typography>
        <FormField size="sm">
          <Label htmlFor="small-input" size="sm">Small Input</Label>
          <Input id="small-input" size="sm" placeholder="Small input" />
          <HelperText>Helper text for small input</HelperText>
        </FormField>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Medium Size (Default)</Typography>
        <FormField size="md">
          <Label htmlFor="medium-input" size="md">Medium Input</Label>
          <Input id="medium-input" size="md" placeholder="Medium input" />
          <HelperText>Helper text for medium input</HelperText>
        </FormField>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Large Size</Typography>
        <FormField size="lg">
          <Label htmlFor="large-input" size="lg">Large Input</Label>
          <Input id="large-input" size="lg" placeholder="Large input" />
          <HelperText>Helper text for large input</HelperText>
        </FormField>
      </div>
    </div>
  ),
};

export const DisabledField: Story = {
  render: () => (
    <FormField>
      <Label htmlFor="disabled-input" disabled>Disabled Field</Label>
      <Input id="disabled-input" disabled placeholder="This field is disabled" />
      <HelperText>This field is currently disabled</HelperText>
    </FormField>
  ),
};

export const FormFieldGroupHorizontal: Story = {
  name: 'Form Field Group (Horizontal)',
  render: () => (
    <FormFieldGroup orientation="horizontal" gap="md">
      <FormField>
        <Label htmlFor="first-name">First Name</Label>
        <Input id="first-name" placeholder="First" />
      </FormField>
      
      <FormField>
        <Label htmlFor="last-name">Last Name</Label>
        <Input id="last-name" placeholder="Last" />
      </FormField>
      
      <FormField>
        <Label htmlFor="middle-initial">Middle Initial</Label>
        <Input id="middle-initial" placeholder="M" maxLength={1} />
      </FormField>
    </FormFieldGroup>
  ),
};

export const FormFieldGroupVertical: Story = {
  name: 'Form Field Group (Vertical)',
  render: () => (
    <FormFieldGroup orientation="vertical">
      <FormField>
        <Label htmlFor="street">Street Address</Label>
        <Input id="street" placeholder="123 Main St" />
      </FormField>
      
      <FormField>
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="City" />
      </FormField>
      
      <FormFieldGroup orientation="horizontal" gap="md">
        <FormField>
          <Label htmlFor="state">State</Label>
          <Input id="state" placeholder="State" />
        </FormField>
        
        <FormField>
          <Label htmlFor="zip">ZIP Code</Label>
          <Input id="zip" placeholder="12345" />
        </FormField>
      </FormFieldGroup>
    </FormFieldGroup>
  ),
};

export const InputGroupWithIcon: Story = {
  name: 'Input Group with Icon',
  render: () => (
    <div className="space-y-6">
      <InputGroup>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <Input className="pl-10" placeholder="Email with icon" />
      </InputGroup>
      
      <InputGroup error>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-[var(--color-status-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <Input error placeholder="Password with error icon" />
      </InputGroup>
    </div>
  ),
};

export const FormSectionExample: Story = {
  name: 'Form Section',
  render: () => (
    <FormSection 
      title="Personal Information"
      description="Please provide your personal details below."
    >
      <FormFieldGroup orientation="horizontal" gap="md">
        <FormField>
          <Label htmlFor="first-name-2" required>First Name</Label>
          <Input id="first-name-2" placeholder="Enter first name" required />
        </FormField>
        
        <FormField>
          <Label htmlFor="last-name-2" required>Last Name</Label>
          <Input id="last-name-2" placeholder="Enter last name" required />
        </FormField>
      </FormFieldGroup>
      
      <FormField>
        <Label htmlFor="email-2" required>Email Address</Label>
        <Input id="email-2" type="email" placeholder="Enter email address" required />
        <HelperText>We'll use this for account notifications</HelperText>
      </FormField>
      
      <FormField>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="Enter phone number (optional)" />
        <HelperText>Used for account recovery</HelperText>
      </FormField>
    </FormSection>
  ),
};

export const CompleteFormExample: Story = {
  name: 'Complete Form Example',
  render: () => (
    <Card variant="elevated" className="max-w-2xl">
      <Card.Header>
        <Typography variant="h4">User Registration</Typography>
        <Typography variant="body" className="text-[var(--color-text-secondary)]">
          Create your account to get started
        </Typography>
      </Card.Header>
      
      <Card.Content>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormSection 
            title="Account Information"
            description="Choose your login credentials"
          >
            <FormField>
              <Label htmlFor="username" required>Username</Label>
              <Input id="username" placeholder="Choose a username" required />
              <HelperText>Must be unique and contain only letters and numbers</HelperText>
            </FormField>
            
            <FormField>
              <Label htmlFor="email-3" required>Email Address</Label>
              <Input id="email-3" type="email" placeholder="Enter your email" required />
              <HelperText>We'll send you a confirmation email</HelperText>
            </FormField>
            
            <FormFieldGroup orientation="horizontal" gap="md">
              <FormField>
                <Label htmlFor="password-2" required>Password</Label>
                <Input id="password-2" type="password" placeholder="Create password" required />
              </FormField>
              
              <FormField>
                <Label htmlFor="confirm-password" required>Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="Confirm password" required />
              </FormField>
            </FormFieldGroup>
          </FormSection>
          
          <FormSection 
            title="Personal Details"
            description="Tell us a bit about yourself"
          >
            <FormFieldGroup orientation="horizontal" gap="md">
              <FormField>
                <Label htmlFor="first-name-3" required>First Name</Label>
                <Input id="first-name-3" placeholder="First name" required />
              </FormField>
              
              <FormField>
                <Label htmlFor="last-name-3" required>Last Name</Label>
                <Input id="last-name-3" placeholder="Last name" required />
              </FormField>
            </FormFieldGroup>
            
            <FormField>
              <Label htmlFor="country" required>Country</Label>
              <Select
                id="country"
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'ca', label: 'Canada' },
                  { value: 'uk', label: 'United Kingdom' },
                  { value: 'au', label: 'Australia' },
                ]}
                placeholder="Select your country"
              />
            </FormField>
          </FormSection>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit" variant="primary">Create Account</Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  ),
};

export const AccessibilityFeatures: Story = {
  name: 'Accessibility Features',
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h5" className="mb-4">Screen Reader Support</Typography>
        <FormField>
          <Label htmlFor="screen-reader-input">Label with proper HTMLFor</Label>
          <Input 
            id="screen-reader-input" 
            placeholder="This input has proper labeling"
            aria-describedby="screen-reader-help"
          />
          <HelperText id="screen-reader-help">This helper text is connected via aria-describedby</HelperText>
        </FormField>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Required Field Indicators</Typography>
        <FormField>
          <Label htmlFor="required-input" required>Email Address *</Label>
          <Input 
            id="required-input" 
            type="email" 
            required 
            placeholder="Required field"
            aria-required="true"
          />
          <HelperText>Required fields are marked with an asterisk</HelperText>
        </FormField>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Error States</Typography>
        <FormField>
          <Label htmlFor="error-input" error>Phone Number</Label>
          <Input 
            id="error-input" 
            type="tel" 
            error 
            placeholder="Enter valid phone number"
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <HelperText id="error-message" variant="error">Please enter a valid phone number</HelperText>
        </FormField>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Disabled States</Typography>
        <FormField>
          <Label htmlFor="disabled-input-2" disabled>Disabled Field</Label>
          <Input 
            id="disabled-input-2" 
            disabled 
            placeholder="This field is disabled"
            aria-disabled="true"
          />
          <HelperText>This field is currently disabled and cannot be interacted with</HelperText>
        </FormField>
      </div>
    </div>
  ),
};