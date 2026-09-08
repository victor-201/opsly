import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { IconBot, IconSend, IconUser } from '../../components/ui/icons';
import { useChatTools, useExecuteChatTool } from '../../hooks/useHooks';
import { titleCase } from '../../lib/format';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  data?: unknown;
}

export function ChatPage() {
  const { data: tools, isLoading, isError, error } = useChatTools();
  const execute = useExecuteChatTool();

  const [selectedTool, setSelectedTool] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const run = async () => {
    const query = input.trim();
    if (!query || !selectedTool) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setInput('');

    try {
      const args = parseArgs(query);
      const result = await execute.mutateAsync({ tool: selectedTool, args });
      setMessages((prev) => [...prev, { role: 'assistant', text: `Ran ${selectedTool}`, data: result.data }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', text: err instanceof Error ? err.message : 'Tool execution failed' },
      ]);
    }
  };

  if (isLoading) return <PageLoader label="Loading chat tools…" />;
  if (isError) return <ErrorState title="Failed to load chat tools" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant" description="Query your infrastructure through supported tools." />

      <div className="flex flex-wrap gap-2">
        {(tools?.tools ?? []).map((tool) => (
          <button
            key={tool}
            onClick={() => setSelectedTool(tool)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              selectedTool === tool
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-border text-muted hover:border-surface-300 hover:text-foreground'
            }`}
          >
            {titleCase(tool)}
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          {selectedTool ? (
            <>
              <div className="mb-4 flex items-center gap-2 text-sm text-muted">
                <IconBot width={16} height={16} />
                Now using <span className="font-medium text-foreground">{selectedTool}</span>.
                Enter a natural-language instruction below.
              </div>

              <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted">No commands yet — describe what you want to do.</p>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm ${
                          m.role === 'user'
                            ? 'border-brand-200 bg-brand-50 text-foreground'
                            : m.role === 'error'
                            ? 'border-danger-200 bg-danger-50 text-danger-700'
                            : 'border-border bg-surface-50 text-foreground'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                          {m.role === 'user' ? <IconUser width={12} height={12} /> : <IconBot width={12} height={12} />}
                          {m.role === 'user' ? 'You' : m.role === 'error' ? 'Error' : 'Assistant'}
                        </div>
                        {m.text}
                        {m.data !== undefined && (
                          <pre className="mt-2 max-h-40 overflow-auto rounded bg-surface-900 p-2 text-xs text-surface-100">
                            {JSON.stringify(m.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  className="flex h-10 flex-1 rounded-md border border-input bg-surface-0 px-3 text-sm shadow-sm outline-none transition placeholder:text-surface-300 focus:ring-2 focus:ring-brand-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void run();
                  }}
                  placeholder="e.g. list your unhealthy resources"
                  disabled={execute.isPending}
                />
                <Button onClick={run} loading={execute.isPending} disabled={!input.trim()}>
                  <IconSend width={16} height={16} /> Run
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <IconBot className="text-surface-300" width={40} height={40} />
              <p className="text-sm text-muted">Select a tool above to start your first AI request.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function parseArgs(_query: string): Record<string, string> {
  return {};
}