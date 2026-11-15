import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { ModalSheet } from '../../src/components/ui/ModalSheet';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * ModalSheet is the shared bottom-sheet chrome for the onboarding persona picker
 * and the auth modal. Both sheets depend on the same contract: the header slot
 * renders, the children render, and the close button is the single dismissal
 * control. A regression here would break both sheets at once.
 */
describe('ModalSheet', () => {
  it('renders the header slot and children', async () => {
    await wrap(
      <ModalSheet visible onClose={() => {}} closeLabel="إغلاق" header={<Text>عنوان</Text>}>
        <Text>محتوى</Text>
      </ModalSheet>,
    );
    expect(screen.getByText('عنوان')).toBeTruthy();
    expect(screen.getByText('محتوى')).toBeTruthy();
  });

  it('fires onClose from the shared close button', async () => {
    const onClose = jest.fn();
    await wrap(
      <ModalSheet visible onClose={onClose} closeLabel="إغلاق" header={<Text>عنوان</Text>}>
        <Text>محتوى</Text>
      </ModalSheet>,
    );
    fireEvent.press(screen.getByLabelText('إغلاق'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('accepts per-sheet header spacing without dropping the close button', async () => {
    await wrap(
      <ModalSheet
        visible
        onClose={() => {}}
        closeLabel="إغلاق"
        headerStyle={{ marginBottom: 4 }}
        header={<Text>عنوان</Text>}
      >
        <Text>محتوى</Text>
      </ModalSheet>,
    );
    expect(screen.getByLabelText('إغلاق')).toBeTruthy();
  });
});
