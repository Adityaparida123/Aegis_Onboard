import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, CornerDownLeft, Send, ShieldAlert } from 'lucide-react';
import { getChatHistory, sendChatMessage } from '../api/chat.api';
import type { ChatReply } from '../types';

const SUGGESTED_QUESTIONS = [
  "What's my onboarding status?",
  'What tasks are still pending?',
  'Which software will I receive?',
  'Is my GitHub access approved?',
  'How do I apply for leave?'
];

interface DisplayMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  reply?: ChatReply;
}

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `m-${Date.now()}-${messageCounter}`;
}

export function AssistantPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: getChatHistory,
    staleTime: 60_000
  });

  useEffect(() => {
    const sessions = historyData?.data?.sessions ?? [];
    if (sessions.length === 0) return;
    const latest = sessions[0];
    setSessionId(latest._id);
    const seeded: DisplayMessage[] = [];
    for (const entry of latest.messages ?? []) {
      seeded.push({ id: `${entry._id}-q`, role: 'user', content: entry.message });
      seeded.push({ id: `${entry._id}-a`, role: 'agent', content: entry.response, reply: entry });
    }
    setMessages(seeded);
  }, [historyData]);

  useEffect(() => {
    const element = threadRef.current;
    if (element && typeof element.scrollTo === 'function') {
      element.scrollTo({ top: element.scrollHeight });
    }
  }, [messages, sending]);

  async function handleSend(override?: string) {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: text }]);
    setSending(true);
    try {
      const response = await sendChatMessage({ message: text, sessionId });
      const reply: ChatReply = response.data;
      setSessionId(reply.sessionId);
      setMessages((prev) => [...prev, { id: nextId(), role: 'agent', content: reply.answer, reply }]);
    } catch (error) {
      toast.error('The assistant is unavailable right now. Please try again.');
      setMessages((prev) => [...prev, { id: nextId(), role: 'agent', content: 'Sorry, I could not reach the assistant service. Please try again.' }]);
    } finally {
      setSending(false);
    }
  }

  const emptyThread = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col gap-4 md:h-[calc(100vh-11rem)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-500 p-2 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-300">AI Employee Support</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Ask about your onboarding</h2>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The assistant answers from your verified employee records. Sensitive requests (password resets, access grants) are never performed automatically — they are routed for human approval and audited.
        </p>
      </div>

      <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        {historyLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your conversation…</p>
        ) : emptyThread ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">How can I help you today?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSend(question)}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-2.5 text-sm text-white">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={message.id} className="space-y-2">
                <div className="flex justify-start">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {message.content}
                  </div>
                </div>
                {message.reply?.actionRequired && message.reply.escalation?.department && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300">
                      <ShieldAlert className="h-4 w-4" />
                      Routed to {message.reply.escalation.department} for human approval{message.reply.requestId ? ` · Request ${message.reply.requestId.slice(-6)}` : ''}
                    </div>
                  </div>
                )}
              </div>
            )
          )
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-slate-700 dark:bg-slate-900"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your onboarding, access, approvals…"
          className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
          <CornerDownLeft className="hidden h-4 w-4 sm:hidden" />
        </button>
      </form>
    </div>
  );
}
