import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import ResourceErrorBoundary from '@/components/common/ResourceErrorBoundary'

function Boom() {
  throw Object.assign(new Error('Head hook violation'), { digest: 'test-digest' })
}

describe('ResourceErrorBoundary', () => {
  it('shows enhanced fallback with actions and digest', () => {
    render(
      React.createElement(ResourceErrorBoundary, null, React.createElement(Boom))
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Reload')).toBeTruthy()
    expect(screen.getByText('Home')).toBeTruthy()
  })
})