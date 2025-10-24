This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Development Notes

- Weekly timeline overlay fix (2024-10-23): `src/features/calendar/components/week-timeline.tsx` now sets `inset-y-0` on the event overlay container so events anchor within their time slots instead of dropping into the horizontal scrollbar.
- Event detail dialog stacking (2024-10-23): raised dialog overlay/content to `z-40`/`z-50` in `src/features/calendar/components/event-detail-dialog.tsx` so week timeline cards no longer cover the modal.
- Event composer stacking (2024-10-23): `src/features/calendar/components/event-composer.tsx` uses the same elevated z-index values so the edit/create dialog stays above timeline events.
- Overlap guard & banner (2024-10-23): `src/server/events/service.ts` rejects overlapping create/update requests; the client (`src/features/calendar/calendar-page.tsx`) shows a top banner when a conflicting schedule is attempted.
- Date picker alignment (2024-10-23): Event composer swapped the popover calendar for native date inputs and serialises recurrence end dates as ISO strings to satisfy API validation.
- Members & filters (2024-10-24): Added `Member`/`EventParticipant` models, participant selection UI, and a sticky filter sidebar (category, 참가자, 기간, 검색) via `src/server/events/service.ts`, `src/features/calendar/calendar-page.tsx`, and `src/features/calendar/components/event-composer.tsx`.
- Filter polish (2024-10-24): Debounced sidebar 검색 입력과 월/주간 뷰 이벤트에 페이드 애니메이션을 추가해 필터링 시 스크롤 튐 현상을 줄이고 전환을 부드럽게 함 (`src/features/calendar/calendar-page.tsx`, `src/features/calendar/components/month-view.tsx`, `.../week-timeline.tsx`).
- Prisma/SQLite setup: `.env` currently pins `DATABASE_URL` to the absolute path `file:/home/iclab/minseo/Calender/lcda-calendar/prisma/dev.db`. Update this when cloning to a different location or switch back to a relative path before committing to shared repos.
- Remote dev access: run `npm run dev -- --hostname 0.0.0.0 --port 3000` and tunnel via `ssh -L 3000:localhost:3000 <user>@<host>` to inspect the app from a local browser.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
