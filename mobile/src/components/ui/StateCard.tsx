import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Card } from './Card';
import { StateView } from './StateView';

type StateViewProps = React.ComponentProps<typeof StateView>;
type CardVariant = NonNullable<React.ComponentProps<typeof Card>['variant']>;

interface StateCardProps extends StateViewProps {
  /** Card variant; `outlined` matches the loading/empty/error panels elsewhere. */
  variant?: CardVariant;
  /** Outer card spacing, e.g. `{ marginBottom: spacing.lg }`. */
  cardStyle?: StyleProp<ViewStyle>;
}

/**
 * A `StateView` presented as a bordered card. Data-driven screens overwhelmingly
 * render their loading/empty/error panel inside a card, so this keeps that shell
 * (and the variant) in one place instead of re-wrapping it at every call site.
 */
export const StateCard: React.FC<StateCardProps> = ({ variant = 'outlined', cardStyle, ...stateProps }) => (
  <Card variant={variant} style={cardStyle}>
    <StateView {...stateProps} />
  </Card>
);
