# AgriVibe Home dashboard

## Account-scoped farm overview

`mobile/src/components/home/HomeFarmOverview.tsx` adds a signed-in user's farm activity summary to the Home screen.

The card reads only the existing authenticated mobile API functions:

- `getFarms()` (`GET /api/farms`) for persisted farm records and registered area.
- `getCultivations()` (`GET /api/assistant/cultivations`) for persisted crop/cultivation records and expected harvest dates.

It displays:

- Number of registered farms.
- Sum of their registered area in hectares.
- Number of registered cultivation records.
- The nearest future expected harvest date, only when a date exists.
- For farmer accounts, the next open persisted task and the number of pending/in-progress tasks, when available.

No values are estimated or generated. If the account has no farms or cultivations, the card invites the user to register a farm. If the request fails with no usable records, it shows a retry state instead of a fabricated zero-state success.

The Home pull-to-refresh gesture refreshes this summary as well as the existing dashboard data.

## Scope and limitations

- The summary is intentionally limited to persisted records; it does not yet show soil analyses, expenses, yields or profitability.
- Task data is requested only for farmer accounts because the existing task API is farmer-role guarded. Other supported agricultural roles still see farm/cultivation data without a task card.
- It is hidden for signed-out users.
- The card does not replace the dedicated Farms and Production Projects screens.
- No database migration or production deployment is required for this read-only integration.
- The code change has been committed to `mobile-development`; run the mobile TypeScript, lint and device checks before release.