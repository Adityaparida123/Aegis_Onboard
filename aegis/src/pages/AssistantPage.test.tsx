import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssistantPage } from './AssistantPage';
import { getChatHistory, sendChatMessage } from '../api/chat.api';
import type { ChatReply } from '../types';

vi.mock('../api/chat.api', () => ({
  getChatHistory: vi.fn(),
  sendChatMessage: vi.fn()
}));

const mockHistory = vi.mocked(getChatHistory);
const mockSend = vi.mocked(sendChatMessage);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AssistantPage />
    </QueryClientProvider>
  );
}

const emptyHistory = { data: { sessions: [] } };

const answer: ChatReply = {
  answer: 'Your onboarding is in progress and waiting for manager approval.',
  intent: 'onboarding_status',
  actionRequired: false,
  actionTaken: 'none',
  escalation: { status: 'none', department: null },
  requestId: null,
  sessionId: 's1'
};

describe('AssistantPage', () => {
  beforeEach(() => {
    mockHistory.mockReset();
    mockSend.mockReset();
    mockHistory.mockResolvedValue(emptyHistory);
  });

  it('renders the chat UI with suggested questions', async () => {
    renderPage();

    expect(screen.getByText('Ask about your onboarding')).toBeInTheDocument();
    expect(await screen.findByText("What's my onboarding status?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about your onboarding, access, approvals…')).toBeInTheDocument();
  });

  it('sends a message and renders the assistant reply', async () => {
    mockSend.mockResolvedValue({ data: answer });

    renderPage();
    const input = screen.getByPlaceholderText('Ask about your onboarding, access, approvals…');

    fireEvent.change(input, { target: { value: "What's my onboarding status?" } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText('Your onboarding is in progress and waiting for manager approval.')).toBeInTheDocument());
    expect(screen.getByText("What's my onboarding status?")).toBeInTheDocument();
    expect(mockSend).toHaveBeenCalledWith({ message: "What's my onboarding status?", sessionId: undefined });
  });

  it('shows the escalation banner when a request is routed for human approval', async () => {
    mockSend.mockResolvedValue({
      data: {
        answer: 'I have created a request to reset your password.',
        intent: 'support_request',
        actionRequired: true,
        actionTaken: 'support_request_created',
        escalation: { status: 'routed', department: 'IT' },
        requestId: 'req-123456',
        sessionId: 's1'
      }
    });

    renderPage();
    const input = screen.getByPlaceholderText('Ask about your onboarding, access, approvals…');

    fireEvent.change(input, { target: { value: 'Please reset my password.' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText(/Routed to IT for human approval/)).toBeInTheDocument());
  });

  it('renders an error message when the assistant is unreachable', async () => {
    mockSend.mockRejectedValue(new Error('network down'));

    renderPage();
    const input = screen.getByPlaceholderText('Ask about your onboarding, access, approvals…');

    fireEvent.change(input, { target: { value: 'Hello?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText('Sorry, I could not reach the assistant service. Please try again.')).toBeInTheDocument());
  });
});
