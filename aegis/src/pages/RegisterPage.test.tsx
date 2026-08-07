import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { RegisterPage } from './RegisterPage';
import { registerUser } from '../api/auth.api';

vi.mock('../api/auth.api', () => ({
  registerUser: vi.fn()
}));

const mockRegister = vi.mocked(registerUser);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Toaster richColors />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Login Page Marker</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function fillForm(overrides: Partial<{ name: string; email: string; password: string; confirmPassword: string }> = {}) {
  const values = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    ...overrides
  };
  fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), { target: { value: values.name } });
  fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: values.email } });
  const passwordInputs = screen.getAllByPlaceholderText('••••••••');
  fireEvent.change(passwordInputs[0], { target: { value: values.password } });
  fireEvent.change(passwordInputs[1], { target: { value: values.confirmPassword } });
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset();
  });

  it('renders all registration fields', () => {
    renderPage();

    expect(screen.getByPlaceholderText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows a validation error when passwords do not match', async () => {
    renderPage();
    await fillForm({ confirmPassword: 'different' });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('registers and redirects to the login page', async () => {
    mockRegister.mockResolvedValue({ success: true });
    renderPage();
    await fillForm();

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByText('Login Page Marker')).toBeInTheDocument());
    expect(mockRegister).toHaveBeenCalledWith('Ada Lovelace', 'ada@example.com', 'secret123', 'HR');
  });

  it('surfaces backend errors such as duplicate email', async () => {
    mockRegister.mockRejectedValue({ response: { data: { error: 'User with this email already exists' } } });
    renderPage();
    await fillForm();

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByText('User with this email already exists')).toBeInTheDocument());
    expect(screen.queryByText('Login Page Marker')).not.toBeInTheDocument();
  });
});
