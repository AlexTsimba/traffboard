import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card Components', () => {
  it('renders Card with basic content', () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    )
    
    const card = screen.getByText('Card content').closest('[data-slot="card"]')
    expect(card).toBeInTheDocument()
  })

  it('renders complete Card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main card content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description text')).toBeInTheDocument()
    expect(screen.getByText('Main card content goes here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
  })

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    )
    
    const card = screen.getByText('Content').closest('[data-slot="card"]')
    expect(card).toHaveClass('custom-card')
  })

  it('renders CardHeader with proper structure', () => {
    render(
      <CardHeader>
        <CardTitle>Test Title</CardTitle>
      </CardHeader>
    )
    
    const header = screen.getByText('Test Title').closest('[data-slot="card-header"]')
    expect(header).toBeInTheDocument()
  })

  it('renders CardTitle with proper attributes', () => {
    render(<CardTitle>Title Text</CardTitle>)
    
    const title = screen.getByText('Title Text')
    expect(title).toBeInTheDocument()
    expect(title).toHaveAttribute('data-slot', 'card-title')
  })

  it('renders CardDescription with proper styling', () => {
    render(<CardDescription>Description text</CardDescription>)
    
    const description = screen.getByText('Description text')
    expect(description).toBeInTheDocument()
    expect(description).toHaveAttribute('data-slot', 'card-description')
  })
}) 