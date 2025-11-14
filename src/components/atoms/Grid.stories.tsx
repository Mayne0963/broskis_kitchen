import type { Meta, StoryObj } from '@storybook/react';
import { Grid, GridItem, Container, Stack } from './Grid';
import { Card } from './Card';
import { Typography } from './Typography';
import { Button } from './Button';

const meta = {
  title: 'Atoms/Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Responsive grid system with atomic design patterns. Supports responsive breakpoints, flexible layouts, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cols: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6, 12],
      description: 'Number of columns in the grid',
    },
    gap: {
      control: { type: 'select' },
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
      description: 'Spacing between grid items',
    },
    alignment: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Vertical alignment of grid items',
    },
    justify: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
      description: 'Horizontal justification of grid items',
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const GridDemoCard = ({ title, content }: { title: string; content: string }) => (
  <Card variant="elevated" className="h-32">
    <Card.Content className="flex flex-col justify-center items-center h-full">
      <Typography variant="h6" className="text-center mb-2">{title}</Typography>
      <Typography variant="body-sm" className="text-center text-[var(--color-text-secondary)]">
        {content}
      </Typography>
    </Card.Content>
  </Card>
);

export const Default: Story = {
  args: {
    cols: 3,
    gap: 'md',
  },
  render: (args) => (
    <Grid {...args}>
      <GridDemoCard title="Card 1" content="Grid item content" />
      <GridDemoCard title="Card 2" content="Grid item content" />
      <GridDemoCard title="Card 3" content="Grid item content" />
      <GridDemoCard title="Card 4" content="Grid item content" />
      <GridDemoCard title="Card 5" content="Grid item content" />
      <GridDemoCard title="Card 6" content="Grid item content" />
    </Grid>
  ),
};

export const ResponsiveColumns: Story = {
  name: 'Responsive Columns',
  render: () => (
    <Stack direction="column" gap="xl">
      <div>
        <Typography variant="h5" className="mb-4">2 Columns (Mobile → Desktop)</Typography>
        <Grid cols={2} gap="md">
          <GridDemoCard title="Responsive 1" content="Stacks on mobile, side-by-side on desktop" />
          <GridDemoCard title="Responsive 2" content="Stacks on mobile, side-by-side on desktop" />
        </Grid>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">3 Columns (Mobile → Tablet → Desktop)</Typography>
        <Grid cols={3} gap="md">
          <GridDemoCard title="Responsive 1" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols" />
          <GridDemoCard title="Responsive 2" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols" />
          <GridDemoCard title="Responsive 3" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols" />
        </Grid>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">4 Columns (Mobile → Tablet → Desktop)</Typography>
        <Grid cols={4} gap="md">
          <GridDemoCard title="Responsive 1" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols" />
          <GridDemoCard title="Responsive 2" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols" />
          <GridDemoCard title="Responsive 3" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols" />
          <GridDemoCard title="Responsive 4" content="Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols" />
        </Grid>
      </div>
    </Stack>
  ),
};

export const GapSizes: Story = {
  name: 'Gap Sizes',
  render: () => (
    <Stack direction="column" gap="xl">
      {['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((gapSize) => (
        <div key={gapSize}>
          <Typography variant="h5" className="mb-4">Gap: {gapSize.toUpperCase()}</Typography>
          <Grid cols={3} gap={gapSize as any}>
            <GridDemoCard title="Card A" content={`Gap: ${gapSize}`} />
            <GridDemoCard title="Card B" content={`Gap: ${gapSize}`} />
            <GridDemoCard title="Card C" content={`Gap: ${gapSize}`} />
          </Grid>
        </div>
      ))}
    </Stack>
  ),
};

export const GridItemSpanning: Story = {
  name: 'Grid Item Spanning',
  render: () => (
    <Grid cols={4} gap="md">
      <GridItem span={2}>
        <GridDemoCard title="Span 2" content="This item spans 2 columns" />
      </GridItem>
      <GridItem>
        <GridDemoCard title="Span 1" content="Normal span" />
      </GridItem>
      <GridItem>
        <GridDemoCard title="Span 1" content="Normal span" />
      </GridItem>
      <GridItem span={3}>
        <GridDemoCard title="Span 3" content="This item spans 3 columns" />
      </GridItem>
      <GridItem>
        <GridDemoCard title="Span 1" content="Normal span" />
      </GridItem>
      <GridItem span={4}>
        <GridDemoCard title="Span 4" content="This item spans all 4 columns" />
      </GridItem>
    </Grid>
  ),
};

export const AlignmentAndJustify: Story = {
  name: 'Alignment & Justify',
  render: () => (
    <Stack direction="column" gap="xl">
      <div>
        <Typography variant="h5" className="mb-4">Items Center</Typography>
        <Grid cols={3} gap="md" alignment="center" className="min-h-[200px] bg-[var(--color-background-subtle)] rounded-lg p-4">
          <Card variant="elevated" className="h-16"><Card.Content>Short</Card.Content></Card>
          <Card variant="elevated" className="h-24"><Card.Content>Tall</Card.Content></Card>
          <Card variant="elevated" className="h-20"><Card.Content>Medium</Card.Content></Card>
        </Grid>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Justify Center</Typography>
        <Grid cols={6} gap="md" justify="center" className="bg-[var(--color-background-subtle)] rounded-lg p-4">
          <GridDemoCard title="Centered" content="Centered content" />
          <GridDemoCard title="Centered" content="Centered content" />
        </Grid>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Justify Between</Typography>
        <Grid cols={3} gap="md" justify="between" className="bg-[var(--color-background-subtle)] rounded-lg p-4">
          <GridDemoCard title="Start" content="At start" />
          <GridDemoCard title="Middle" content="In middle" />
          <GridDemoCard title="End" content="At end" />
        </Grid>
      </div>
    </Stack>
  ),
};

export const ContainerSizes: Story = {
  name: 'Container Sizes',
  render: () => (
    <Stack direction="column" gap="xl">
      {['sm', 'md', 'lg', 'xl'].map((size) => (
        <div key={size}>
          <Typography variant="h5" className="mb-4">Container: {size.toUpperCase()}</Typography>
          <Container size={size as any}>
            <Card variant="elevated">
              <Card.Content className="text-center">
                <Typography variant="body">Container with {size} size</Typography>
              </Card.Content>
            </Card>
          </Container>
        </div>
      ))}
    </Stack>
  ),
};

export const StackLayouts: Story = {
  name: 'Stack Layouts',
  render: () => (
    <Stack direction="column" gap="xl">
      <div>
        <Typography variant="h5" className="mb-4">Vertical Stack</Typography>
        <Stack direction="column" gap="md">
          <Button variant="primary">Button 1</Button>
          <Button variant="secondary">Button 2</Button>
          <Button variant="outline">Button 3</Button>
        </Stack>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Horizontal Stack</Typography>
        <Stack direction="row" gap="md" alignment="center">
          <Button size="sm" variant="primary">Save</Button>
          <Button size="sm" variant="outline">Cancel</Button>
          <Button size="sm" variant="ghost">Delete</Button>
        </Stack>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Stack with Wrap</Typography>
        <Stack direction="row" gap="md" wrap={true}>
          {Array.from({ length: 8 }, (_, i) => (
            <Button key={i} size="sm" variant="outline">Item {i + 1}</Button>
          ))}
        </Stack>
      </div>
    </Stack>
  ),
};

export const ComplexLayout: Story = {
  name: 'Complex Layout Example',
  render: () => (
    <Container size="lg">
      <Stack direction="column" gap="xl">
        <Typography variant="h4">Dashboard Layout</Typography>
        
        <Grid cols={12} gap="lg">
          <GridItem span={12}>
            <Card variant="elevated">
              <Card.Header>
                <Typography variant="h5">Header Section</Typography>
              </Card.Header>
              <Card.Content>
                <Typography variant="body">Full-width header content</Typography>
              </Card.Content>
            </Card>
          </GridItem>
          
          <GridItem span={8}>
            <Card variant="elevated">
              <Card.Header>
                <Typography variant="h5">Main Content</Typography>
              </Card.Header>
              <Card.Content>
                <Typography variant="body">Main content area (8 columns)</Typography>
              </Card.Content>
            </Card>
          </GridItem>
          
          <GridItem span={4}>
            <Card variant="elevated">
              <Card.Header>
                <Typography variant="h5">Sidebar</Typography>
              </Card.Header>
              <Card.Content>
                <Typography variant="body">Sidebar content (4 columns)</Typography>
              </Card.Content>
            </Card>
          </GridItem>
          
          <GridItem span={6}>
            <Card variant="elevated">
              <Card.Header>
                <Typography variant="h5">Left Panel</Typography>
              </Card.Header>
              <Card.Content>
                <Typography variant="body">Left panel content</Typography>
              </Card.Content>
            </Card>
          </GridItem>
          
          <GridItem span={6}>
            <Card variant="elevated">
              <Card.Header>
                <Typography variant="h5">Right Panel</Typography>
              </Card.Header>
              <Card.Content>
                <Typography variant="body">Right panel content</Typography>
              </Card.Content>
            </Card>
          </GridItem>
        </Grid>
      </Stack>
    </Container>
  ),
};

export const Accessibility: Story = {
  name: 'Accessibility Features',
  render: () => (
    <Stack direction="column" gap="xl">
      <div>
        <Typography variant="h5" className="mb-4">Semantic HTML Structure</Typography>
        <Grid cols={3} gap="md" role="grid" aria-label="Product grid">
          <GridItem role="gridcell">
            <GridDemoCard title="Product 1" content="Accessible grid cell" />
          </GridItem>
          <GridItem role="gridcell">
            <GridDemoCard title="Product 2" content="Accessible grid cell" />
          </GridItem>
          <GridItem role="gridcell">
            <GridDemoCard title="Product 3" content="Accessible grid cell" />
          </GridItem>
        </Grid>
      </div>
      
      <div>
        <Typography variant="h5" className="mb-4">Keyboard Navigation</Typography>
        <Typography variant="body" className="mb-4">
          Grid components support keyboard navigation and screen readers. Use Tab to navigate between interactive elements.
        </Typography>
        <Grid cols={2} gap="md">
          <Button variant="primary">Focusable Element 1</Button>
          <Button variant="secondary">Focusable Element 2</Button>
          <Button variant="outline">Focusable Element 3</Button>
          <Button variant="ghost">Focusable Element 4</Button>
        </Grid>
      </div>
    </Stack>
  ),
};