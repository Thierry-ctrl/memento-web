# Memento website and booking requests

## Setup

1. Run `pnpm install`.
2. Ensure the Replit PostgreSQL database and Clerk Auth are enabled.
3. Set `ADMIN_EMAIL` as a Secret to the administrator's sign-in email.
4. Optionally set `VITE_PUBLIC_CONTACT_EMAIL`; the public email row stays hidden when absent.
5. Apply the development schema with `pnpm --filter @workspace/db run push`.
6. Regenerate clients after contract changes with `pnpm --filter @workspace/api-spec run codegen`.
7. Start the managed API Server and Memento web workflows.

## Booking workflow

Customers submit a request, receive a `MEM-...` reference, and may follow up on WhatsApp. Memento reviews potential conflicts and personally changes the request to contacted, confirmed, declined, or cancelled. A request is never presented as confirmed on submission.

## Administration

Sign in at `/sign-in`, then visit `/admin`. Set `ADMIN_EMAIL` before publishing so only the allowlisted Clerk account can use administrator endpoints. The admin area manages statuses, private notes, blocked availability, conflict indicators, customer WhatsApp follow-up, and CSV export.

## Brand handover

The current central CSS tokens use the approved brief's fallback values because the referenced Figma file was not accessible from this project. Replace the fallback sage/taupe values with the final Figma variables when available. All event imagery is local and visibly labelled as placeholder material until approved Memento photography is supplied.

## Publishing

Use Replit Publish for the non-static application. Replit applies the development database schema to production during publish and supplies production Clerk configuration automatically.