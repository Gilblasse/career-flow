import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should accept text input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    
    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  it('should handle different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text')

    rerender(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="input" />)
    expect(screen.getByTestId('input')).toBeDisabled()
  })

  it('should have disabled styles when disabled', () => {
    render(<Input disabled data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('disabled:opacity-50')
    expect(screen.getByTestId('input')).toHaveClass('disabled:cursor-not-allowed')
  })

  it('should apply custom className', () => {
    render(<Input className="custom-input" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('custom-input')
  })

  it('should forward ref', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should call onChange handler', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<Input onChange={handleChange} data-testid="input" />)
    await user.type(screen.getByTestId('input'), 'a')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('should call onBlur handler', async () => {
    const user = userEvent.setup()
    const handleBlur = vi.fn()
    
    render(<Input onBlur={handleBlur} data-testid="input" />)
    const input = screen.getByTestId('input')
    
    await user.click(input)
    await user.tab()
    
    expect(handleBlur).toHaveBeenCalled()
  })

  it('should have correct default value', () => {
    render(<Input defaultValue="Initial Value" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveValue('Initial Value')
  })

  it('should support controlled value', async () => {
    const user = userEvent.setup()
    const ControlledInput = () => {
      const [value, setValue] = React.useState('controlled')
      return (
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          data-testid="input"
        />
      )
    }
    
    render(<ControlledInput />)
    const input = screen.getByTestId('input')
    expect(input).toHaveValue('controlled')
    
    await user.clear(input)
    await user.type(input, 'new value')
    expect(input).toHaveValue('new value')
  })

  it('should have proper base styles', () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    
    expect(input).toHaveClass('flex')
    expect(input).toHaveClass('h-9')
    expect(input).toHaveClass('w-full')
    expect(input).toHaveClass('rounded-md')
    expect(input).toHaveClass('border')
  })

  it('should pass through HTML attributes', () => {
    render(
      <Input 
        data-testid="input"
        name="test-input"
        id="test-id"
        autoComplete="off"
        required
      />
    )
    const input = screen.getByTestId('input')
    
    expect(input).toHaveAttribute('name', 'test-input')
    expect(input).toHaveAttribute('id', 'test-id')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toBeRequired()
  })
})

// Need React import for controlled component
import React from 'react'
