import { formInput } from '../../src/theme/formStyles';
import { colors, radius, spacing, typography } from '../../src/theme/colors';

/**
 * formInput is the shared bordered text-field style for the auth modal, the farm
 * form and the generic service form. Three copies existed; a change to the border,
 * radius or font must apply to all of them at once.
 */
describe('formInput', () => {
  it('is the >=48dp bordered field', () => {
    expect(formInput.height).toBe(48);
    expect(formInput.borderWidth).toBe(1);
    expect(formInput.borderColor).toBe(colors.border);
    expect(formInput.backgroundColor).toBe(colors.surfaceSubtle);
    expect(formInput.borderRadius).toBe(radius.md);
    expect(formInput.paddingHorizontal).toBe(spacing.md);
  });

  it('pairs every font size with a line height for Arabic', () => {
    expect(formInput.fontSize).toBe(typography.fontSizes.sm);
    expect(formInput.lineHeight).toBe(typography.lineHeights.sm);
    expect(formInput.color).toBe(colors.text);
  });
});
