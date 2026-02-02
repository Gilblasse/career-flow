import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

// Import after mocking
import { AuthProvider, useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

// Test component that uses the auth hook
const TestAuthConsumer: React.FC = () => {
  const { user, session, loading, signIn, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div data-testid="user-status">{user ? `Logged in as ${user.email}` : 'Not logged in'}</div>
      <div data-testid="session-status">{session ? 'Has session' : 'No session'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children', async () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )
    
    await act(async () => {
      await Promise.resolve()
    })
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    // Make getSession never resolve
    vi.mocked(supabase.auth.getSession).mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show not logged in when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
    })
  })

  it('should call signInWithPassword on signIn', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Sign In'))

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should call signOut on sign out', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Sign Out'))

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('should subscribe to auth state changes', async () => {
    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
  })
})

describe('useAuth hook', () => {
  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const TestComponent: React.FC = () => {
      try {
        useAuth()
        return <div>Should not render</div>
      } catch (error) {
        return <div>Error caught</div>
      }
    }

    render(<TestComponent />)
    expect(screen.getByText('Error caught')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
