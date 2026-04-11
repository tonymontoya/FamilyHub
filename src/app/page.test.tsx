import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Home Page', () => {
  it('should render the heading', () => {
    render(<Home />)
    expect(screen.getByText('Family Hub')).toBeInTheDocument()
  })

  it('should render the description', () => {
    render(<Home />)
    expect(screen.getByText(/free, open-source family management platform/i)).toBeInTheDocument()
  })

  it('should have Get Started link', () => {
    render(<Home />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('should have Sign In link', () => {
    render(<Home />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})
