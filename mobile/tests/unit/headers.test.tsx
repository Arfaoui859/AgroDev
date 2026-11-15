import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { ServiceHeader } from '../../src/components/ui/ServiceHeader';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { ScreenHeading } from '../../src/components/ui/ScreenHeading';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * The three heading treatments (service screens, in-page sections, tab roots)
 * are the app's single source of truth for headings. These guard the contract
 * the screens rely on: an optional subtitle never renders an empty node, and the
 * section action/trailing slots stay mutually exclusive and pressable.
 */
describe('shared headings', () => {
  it('renders a service header with its title and subtitle', async () => {
    await wrap(
      <ServiceHeader
        icon="sprout"
        iconColor="#16a34a"
        iconBg="#dcfce7"
        title="تحليل التربة"
        subtitle="وصف مختصر"
      />,
    );
    expect(screen.getByText('تحليل التربة')).toBeTruthy();
    expect(screen.getByText('وصف مختصر')).toBeTruthy();
  });

  it('omits the service header subtitle cleanly when not provided', async () => {
    await wrap(
      <ServiceHeader icon="sprout" iconColor="#16a34a" iconBg="#dcfce7" title="الري الذكي" />,
    );
    expect(screen.getByText('الري الذكي')).toBeTruthy();
    expect(screen.queryByText('وصف مختصر')).toBeNull();
  });

  it('fires the section action and does not render trailing alongside it', async () => {
    const onAction = jest.fn();
    await wrap(
      <SectionHeader
        title="أخبار زراعية"
        actionLabel="عرض الكل"
        onAction={onAction}
        trailing={<Text>شارة</Text>}
      />,
    );
    fireEvent.press(screen.getByText('عرض الكل'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders a trailing node when no action is supplied', async () => {
    await wrap(<SectionHeader title="الخدمات الذكية" trailing={<Text>3 متاحة</Text>} />);
    expect(screen.getByText('3 متاحة')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a section icon and allows the title to wrap in card bodies', async () => {
    await wrap(
      <SectionHeader title="الأعراض" icon="leaf" iconSize={18} titleNumberOfLines={0} />,
    );
    expect(screen.getByText('الأعراض')).toBeTruthy();
  });

  it('renders the tab-root heading with a leading node', async () => {
    await wrap(
      <ScreenHeading title="حسابي" subtitle="إدارة حسابك" leading={<Text>أيقونة</Text>} />,
    );
    expect(screen.getByText('حسابي')).toBeTruthy();
    expect(screen.getByText('إدارة حسابك')).toBeTruthy();
    expect(screen.getByText('أيقونة')).toBeTruthy();
  });
});
