/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../../src/pages/LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as authHook from '../../src/hooks/useAuth';

const queryClient = new QueryClient();

// Mock the Auth hook
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Component: LoginPage', () => {
  it('should render login form', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
      isLoading: false,
      hasRole: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Sign in to SSRL ERP')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should show validation errors on empty submit', async () => {
    const loginMock = vi.fn();
    vi.mocked(authHook.useAuth).mockReturnValue({
      isAuthenticated: false,
      login: loginMock,
      logout: vi.fn(),
      user: null,
      isLoading: false,
      hasRole: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });
    
    expect(loginMock).not.toHaveBeenCalled();
  });
});
