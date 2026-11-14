import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

// --- Mocks ---------------------------------------------------------------
const mockGetSession = jest.fn();
let authChangeHandler: ((event: string, session: any) => void) | null = null;

jest.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        authChangeHandler = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(async () => ({ error: null })),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

jest.mock('../../src/api/client', () => ({
  apiRequest: jest.fn(async () => ({ data: { profile: { role: 'farmer' } }, error: null })),
}));

function Probe() {
  const { isAuthenticated, isInitialising, user, hasOnboarded, updateRole } = useAuth();
  return (
    <>
      <Text testID="auth">{String(isAuthenticated)}</Text>
      <Text testID="init">{String(isInitialising)}</Text>
      <Text testID="onboarded">{String(hasOnboarded)}</Text>
      <Text testID="user">{user?.email ?? 'none'}</Text>
      <Text testID="role">{user?.role ?? 'none'}</Text>
      <Text testID="pick-gardener" onPress={() => updateRole('gardener')}>
        gardener
      </Text>
      <Text testID="pick-farmer" onPress={() => updateRole('farmer')}>
        farmer
      </Text>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authChangeHandler = null;
  });

  it('resolves to a signed-out state after restore, with onboarding pending', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('init')).toHaveTextContent('false'), { timeout: 5000 });
    expect(screen.getByTestId('auth')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    // No onboarding flag stored yet -> needs onboarding.
    expect(screen.getByTestId('onboarded')).toHaveTextContent('false');
  });

  it('becomes authenticated when a session is restored', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'token',
          user: { id: 'u1', email: 'farmer@example.com', user_metadata: { full_name: 'Ali' } },
        },
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true'), { timeout: 5000 });
    expect(screen.getByTestId('user')).toHaveTextContent('farmer@example.com');
  });

  it('clears the user when the auth state signs out', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: { access_token: 't', user: { id: 'u1', email: 'a@b.c', user_metadata: {} } },
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true'), { timeout: 5000 });

    await act(async () => {
      authChangeHandler?.('SIGNED_OUT', null);
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('false'), { timeout: 5000 });
  });

  it('applies a local role preference and restores the server role when re-selected', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 't',
          user: { id: 'u1', email: 'a@b.c', user_metadata: {} },
        },
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    // The backend profile mock assigns 'farmer'.
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('farmer'), { timeout: 5000 });

    await act(async () => {
      screen.getByTestId('pick-gardener').props.onPress();
    });
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('gardener'), { timeout: 5000 });

    // Re-selecting the authoritative role clears the local preference.
    await act(async () => {
      screen.getByTestId('pick-farmer').props.onPress();
    });
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('farmer'), { timeout: 5000 });
  });
});
