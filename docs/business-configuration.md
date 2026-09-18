# Memento launch settings

The editable source of truth is `lib/business/src/config.ts`. Both the website and server use it. Change it, increment `pricingVersion`, test, and redeploy both together. The server recalculates prices and rejects submissions from an out-of-date website. Historical requests retain their pricing snapshot.

| Package | Included time | Base price | Each extra hour |
| --- | --- | --- | --- |
| Birthday | 2 hours | RWF 200,000 | RWF 75,000 |
| Wedding | 2 hours | RWF 300,000 | RWF 150,000 |
| Other celebrations / corporate | Tailored | Quote | Quote |

## Owner confirmations still needed

- The notes mention both RWF 100,000 and RWF 75,000 for a birthday extra hour. The last, explicit value (75,000) is used provisionally.
- “Soft” is interpreted as digital copies, consistent with the earlier online-album inclusion. Confirm this wording.
- Previously proposed 30% deposits / MTN MoMo are not treated as approved terms. The new flow promises no payment amount or method; terms accompany a personal quote.
- Earliest online event date remains 1 October 2026; inquiries can be submitted earlier. Earlier events go to email. Change `earliestEventDate` if needed.
- All earlier package inclusions remain: custom layout, unlimited prints, format choice, digital copies/album, iPad sharing station, backdrop from selection and attendant.
- The three optional add-ons have no approved price. They can be selected, appear in the summary/admin/email, and are quoted separately. Do not silently price them at zero.
- WhatsApp Business is not configured. Email is mementokigali@gmail.com, Instagram is @memento_kigali. The previously supplied phone 0788 628 735 remains a call link, not a WhatsApp promise.
- No 90-day gallery promise is published pending owner clarification. Agree actual gallery and booking-record retention before launch.

## Common edits

- Prices/durations: update the matching package entry; existing requests keep their stored prices.
- WhatsApp: replace `whatsappNumber: null` with international digits, e.g. `"2507…"` (the actual verified number, no plus or spaces). Rebuild; the contact buttons and contact-method option then appear.
- Inclusions/copy: edit `inclusions` or `addOns`. Keep existing IDs stable so older requests retain their meaning. Add a new ID rather than repurposing an old one.
- Email/Instagram/telephone: edit `contact`. SMTP credentials are separate server secrets, never public configuration.
- Gallery duration/privacy: edit the privacy page only after the owner confirms operations. Do not invent retention or legal assurances.

## Before confirming a request

Review selected add-ons, venue/travel time and final quote. “Confirm” reserves its event time but does not send a confirmation email or collect a payment; contact the customer personally. Use “Contacted” while discussing details. Block setup/travel time manually. Cancellation frees the time and recalculates conflict flags.

## Data and business boundaries

One booking capacity is assumed until multiple independent booths and staffing rules are specified. Pending inquiries may overlap and are flagged; they do not reserve the calendar. Confirmed bookings and explicit blocked times prevent new requests and overlapping confirmations, including across midnight in Kigali time. No automated cancellation policy, customer accounts, payments, gallery hosting or accounting system has been added.
