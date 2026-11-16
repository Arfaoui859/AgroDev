import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AIAssistantScreen } from '../../src/screens/AIAssistantScreen';

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'assistant-test-user' } }),
}));

const mockChat = jest.fn();

jest.mock('../../src/api/client', () => ({
  chatWithAIAssistant: (...args: any[]) => mockChat(...args),
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AIAssistantScreen />
    </LanguageProvider>,
  );

describe('AIAssistantScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('restores and persists the signed-in user conversation locally', async () => {
    await AsyncStorage.setItem('agrogrowth.assistant.assistant-test-user', JSON.stringify({
      conversationId: 'saved-conversation',
      messages: [{ id: 'saved-1', sender: 'assistant', text: 'Saved project advice', timestamp: '10:00' }],
    }));

    await renderScreen();
    await waitFor(() => expect(screen.getByText('Saved project advice')).toBeTruthy());

    mockChat.mockResolvedValueOnce({
      data: { reply: 'New response', meta: { provenance: 'llm', isRealData: true }, conversationId: 'saved-conversation' },
      error: null,
    });
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('اكتب سؤالك هنا بالعامية التونسية أو الفصحى...');
    await user.type(input, 'Continue my project');
    await user.press(screen.getByLabelText('إرسال'));
    await waitFor(() => expect(screen.getByText('New response')).toBeTruthy());

    const stored = JSON.parse((await AsyncStorage.getItem('agrogrowth.assistant.assistant-test-user')) || '{}');
    expect(stored.conversationId).toBe('saved-conversation');
    expect(stored.messages.some((message: any) => message.text === 'Saved project advice')).toBe(true);
    expect(stored.messages.some((message: any) => message.text === 'New response')).toBe(true);
  });

  it('threads prior turns and the returned conversationId across messages', async () => {
    mockChat
      .mockResolvedValueOnce({
        data: { reply: 'جواب أول', meta: { provenance: 'llm', isRealData: true }, conversationId: 'conv-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { reply: 'جواب ثانٍ', meta: { provenance: 'llm', isRealData: true }, conversationId: 'conv-1' },
        error: null,
      });

    const user = userEvent.setup();
    await renderScreen();

    const input = screen.getByPlaceholderText('اكتب سؤالك هنا بالعامية التونسية أو الفصحى...');
    await user.type(input, 'سؤال أول');
    await user.press(screen.getByLabelText('إرسال'));

    await waitFor(() => expect(screen.getByText('جواب أول')).toBeTruthy());

    // First call: no thread yet, no prior turns.
    const firstArgs = mockChat.mock.calls[0];
    expect(firstArgs[2].conversationId).toBeNull();
    expect(firstArgs[2].history).toEqual([{ role: 'user', content: 'سؤال أول' }]);

    await user.type(input, 'سؤال ثانٍ');
    await user.press(screen.getByLabelText('إرسال'));

    await waitFor(() => expect(screen.getByText('جواب ثانٍ')).toBeTruthy());

    // Second call: continues the returned thread and carries the first turn.
    const secondArgs = mockChat.mock.calls[1];
    expect(secondArgs[2].conversationId).toBe('conv-1');
    expect(secondArgs[2].history).toEqual([
      { role: 'user', content: 'سؤال أول' },
      { role: 'assistant', content: 'جواب أول' },
      { role: 'user', content: 'سؤال ثانٍ' },
    ]);
  });
});
