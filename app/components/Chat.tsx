'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMapContext } from '../state/MapContext';
import { useTodoContext } from '../state/TodoContext';
import { useFloorPlannerContext } from '../state/FloorPlannerContext';
import { useUiContext, type TabKey } from '../state/UiContext';
import { applyToolActions } from '../lib/applyToolActions';

type Role = 'user' | 'assistant';
type Message = { id: number; role: Role; content: string; meta?: { agent?: 'todo' | 'builder' } };
type ApiMessage = { role: Role; content: string };

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: "Hello! I'm your home building assistant! Let's build your dream home! For our purposes, we are focused on Snohomish County. How can I help?" }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const mapContext = useMapContext();
  const todoContext = useTodoContext();
  const plannerContext = useFloorPlannerContext();
  const uiContext = useUiContext();
  const activeTab: TabKey = uiContext.state.activeTab;

  const extractSvgElement = (input: string): string => {
    const svgMatch = input.match(/<svg[\s\S]*?<\/svg>/);
    return svgMatch ? svgMatch[0] : '';
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setError(null);

    const nextId = messages.length ? Math.max(...messages.map(message => message.id)) + 1 : 1;
    const userMsg: Message = { id: nextId, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build API payload strictly with role/content only (no meta/id)
      const payload: ApiMessage[] = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const plannerHasSvg = typeof plannerContext.svgMarkup === 'string' && plannerContext.svgMarkup.trim().length > 0;
      const body: string = JSON.stringify({
        messages: payload,
        todos: todoContext.items.map(it => ({ title: it.title, done: it.done })),
        activeTab,
        plannerHasSvg,
      });
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body
      });
      const data: { reply?: string; error?: string; toolActions?: Array<Record<string, any>> } = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      const replyMsg: Message = { id: nextId + 1, role: 'assistant', content: data.reply ?? '', meta: { agent: activeTab === 'todos' ? 'todo' : 'builder' } };
      setMessages(prev => [...prev, replyMsg]);

      // Apply any tool actions (agent tools)
      if (Array.isArray(data.toolActions)) {
        await applyToolActions(data.toolActions, {
          mapContext,
          todoContext,
          plannerContext,
          uiContext,
          extractSvgElement,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-window" role="log" aria-live="polite">
        {messages.map(m => {
          const isAssistant = m.role === 'assistant';
          const agent = m.meta?.agent;
          const icon = isAssistant ? (agent === 'todo' ? 'pencil' : 'builder') : 'user';
          return (
            <div key={m.id} className={`message ${m.role}`}>
              <div className={`icon ${isAssistant ? (agent || '') : 'user'}`} aria-hidden>
                {icon === 'pencil' ? (
                  <img className="icon-img" src="/pencil.svg" alt="" />
                ) : icon === 'builder' ? (
                  <span>🏗️</span>
                ) : (
                  <span>🙂</span>
                )}
              </div>
              <div className="bubble">{m.content}</div>
            </div>
          );
        })}
        {loading && (
          <div className="message assistant"><div className="bubble">Thinking…</div></div>
        )}
        {error && (
          <div className="message assistant"><div className="bubble">Error: {error}</div></div>
        )}
        <div ref={endRef} />
      </div>
      <form className="input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask about patterns, tools, or ideas..."
          value={input}
          onChange={e => setInput(e.target.value)}
          aria-label="Message"
          disabled={loading}
        />
        <button type="submit" disabled={loading} aria-label="Send message" className="icon-btn primary">
          <span aria-hidden>➤</span>
        </button>
      </form>
    </div>
  );
};

export default Chat;
