import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthModal } from '../../src/components/auth/AuthModal';

// The modal drives the real validation + dispatch logic; only the auth actions
// are stubbed so we can assert what the UX does with each outcome.
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockResetPassword = jest.fn();
const mockResendConfirmation = jest.fn();

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    resetPassword: mockResetPassword,
    resendConfirmation: mockResendConfirmation,
    isLoading: false,
  }),
}));

// React 19 renders asynchronously, so every interaction is wrapped in an awaited
// act() to flush the resulting state update before asserting.
const type = (el: any, text: string) =>
  act(async () => {
    fireEvent.changeText(el, text);
  });
const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

const renderModal = (onClose = jest.fn()) =>
  render(
    <LanguageProvider>
      <AuthModal visible onClose={onClose} />
    </LanguageProvider>,
  );

// Tab labels differ from the submit-button labels, so target them by their
// accessibility role to avoid ambiguous text matches.
const tab = (label: string) => screen.getByRole('tab', { name: label });
const emailField = () => screen.getByLabelText('البريد الإلكتروني');
const passwordField = () => screen.getByLabelText('كلمة المرور');

describe('AuthModal UX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('blocks sign-in with no email and shows the Arabic validation message', async () => {
    await renderModal();
    await press(screen.getByText('دخول إلى حسابي'));
    expect(screen.getByText('يرجى إدخال البريد الإلكتروني')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('blocks sign-in when the password is shorter than 6 characters', async () => {
    await renderModal();
    await type(emailField(), 'a@b.com');
    await type(passwordField(), '123');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(screen.getByText('كلمة المرور يجب أن تكون 6 أحرف على الأقل')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with trimmed credentials and closes on success', async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });
    const onClose = jest.fn();
    await renderModal(onClose);
    await type(emailField(), '  user@example.com  ');
    await type(passwordField(), 'secret123');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(onClose).toHaveBeenCalled();
  });

  it('surfaces the server error message on a failed sign-in', async () => {
    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Invalid login credentials' });
    await renderModal();
    await type(emailField(), 'user@example.com');
    await type(passwordField(), 'wrongpass');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(screen.getByText('Invalid login credentials')).toBeTruthy();
  });

  it('reports a rejected/misconfigured auth backend as a localised connection problem', async () => {
    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Invalid API key' });
    await renderModal();
    await type(emailField(), 'user@example.com');
    await type(passwordField(), 'secret123');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(
      screen.getByText('تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Login diagnostic/)).toBeNull();
    expect(screen.queryByText('Invalid API key')).toBeNull();
  });

  it('localises a network failure as a connection problem', async () => {
    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Network request failed' });
    await renderModal();
    await type(emailField(), 'user@example.com');
    await type(passwordField(), 'secret123');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(
      screen.getByText('تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.'),
    ).toBeTruthy();
  });

  it('never labels a wrong password as an unreachable account service', async () => {
    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Invalid login credentials' });
    await renderModal();
    await type(emailField(), 'user@example.com');
    await type(passwordField(), 'wrongpass');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(screen.getByText('Invalid login credentials')).toBeTruthy();
    expect(screen.queryByText(/تعذّر الاتصال بخدمة الحساب/)).toBeNull();
  });

  it('guides an unconfirmed account to confirm its email and offers a resend', async () => {
    mockSignIn.mockResolvedValueOnce({
      success: false,
      error: 'Email not confirmed',
      needsConfirmation: true,
    });
    mockResendConfirmation.mockResolvedValueOnce({ success: true });
    await renderModal();
    await type(emailField(), 'new@example.com');
    await type(passwordField(), 'secret123');
    await press(screen.getByText('دخول إلى حسابي'));
    expect(screen.getByText(/يجب تأكيد بريدك الإلكتروني/)).toBeTruthy();
    expect(screen.queryByText('Email not confirmed')).toBeNull();

    await press(screen.getByText('إعادة إرسال رابط التأكيد'));
    expect(mockResendConfirmation).toHaveBeenCalledWith('new@example.com');
    expect(Alert.alert).toHaveBeenCalledWith('تأكيد البريد الإلكتروني', expect.any(String));
  });

  it('requires a full name before sign-up', async () => {
    await renderModal();
    await press(tab('حساب جديد'));
    await type(emailField(), 'new@example.com');
    await type(passwordField(), 'secret123');
    await press(screen.getByText('إنشاء حساب'));
    expect(screen.getByText('يرجى إدخال الاسم الكامل')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('passes the chosen role and name to sign-up', async () => {
    mockSignUp.mockResolvedValueOnce({ success: true });
    await renderModal();
    await press(tab('حساب جديد'));
    await type(screen.getByLabelText('الاسم الكامل'), 'Ali Ben Salah');
    await type(emailField(), 'ali@example.com');
    await type(passwordField(), 'secret123');
    await press(screen.getByLabelText('مهندس / خبير زراعي'));
    await press(screen.getByText('إنشاء حساب'));
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'ali@example.com',
      password: 'secret123',
      fullName: 'Ali Ben Salah',
      phone: '',
      role: 'agronomist',
    });
  });

  it('shows a confirmation notice and switches to sign-in when email confirmation is required', async () => {
    mockSignUp.mockResolvedValueOnce({ success: true, needsConfirmation: true });
    await renderModal();
    await press(tab('حساب جديد'));
    await type(screen.getByLabelText('الاسم الكامل'), 'Sarra');
    await type(emailField(), 'sarra@example.com');
    await type(passwordField(), 'secret123');
    await press(screen.getByText('إنشاء حساب'));
    expect(Alert.alert).toHaveBeenCalledWith('تأكيد البريد الإلكتروني', expect.any(String));
    // The modal returns to the sign-in tab so the user can log in after confirming.
    expect(screen.getByText('دخول إلى حسابي')).toBeTruthy();
  });

  it('sends a password reset and notifies the user', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true });
    await renderModal();
    await press(tab('استعادة كلمة المرور'));
    await type(emailField(), 'forgot@example.com');
    await press(screen.getByText('إرسال رابط الاستعادة'));
    expect(mockResetPassword).toHaveBeenCalledWith('forgot@example.com');
    expect(Alert.alert).toHaveBeenCalledWith('استعادة كلمة المرور', expect.any(String));
  });

  it('exposes accessible tab roles and selected state for screen readers', async () => {
    await renderModal();
    const signupTab = tab('حساب جديد');
    expect(signupTab.props.accessibilityRole).toBe('tab');
    expect(signupTab.props.accessibilityState).toEqual({ selected: false });
  });
});
