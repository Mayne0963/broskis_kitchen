import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import StructuredDataHead, { OrganizationStructuredDataHead } from '@/components/seo/StructuredDataHead'

describe('StructuredDataHead', () => {
  it('renders website JSON-LD script', () => {
    const { container } = render(React.createElement(StructuredDataHead, { type: 'website' }))
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    const json = JSON.parse(script!.textContent || '{}')
    expect(json['@type']).toBe('WebSite')
    expect(json.url).toMatch('https://')
  })

  it('renders organization JSON-LD script', () => {
    const { container } = render(React.createElement(OrganizationStructuredDataHead))
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    const json = JSON.parse(script!.textContent || '{}')
    expect(json['@type']).toBe('Organization')
  })
})