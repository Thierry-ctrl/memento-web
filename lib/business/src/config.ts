// Edit this file, update the version, then rebuild/redeploy both apps.
// Existing requests keep their original pricing snapshot.
export const business = {
  pricingVersion: "2026-09-16",
  contact: {
    email: "mementokigali@gmail.com",
    phone: "+250788628735",
    phoneLabel: "0788 628 735",
    instagram: "https://www.instagram.com/memento_kigali/",
    // Add the verified WhatsApp Business number in international digits when ready.
    whatsappNumber: "250788628735" as string | null,
  },
  booking: {
    timeZone: "Africa/Kigali",
    earliestEventDate: "2026-10-01",
    acceptEarlyRequests: true,
    maxHours: 24,
    // No deposit percentage or payment method has been approved yet.
    depositPercentage: null as number | null,
  },
  packages: [
    {
      id: "birthday",
      name: "Birthday",
      includedHours: 2,
      basePriceRwf: 200000,
      extraHourRwf: 75000,
    },
    {
      id: "wedding",
      name: "Wedding",
      includedHours: 2,
      basePriceRwf: 300000,
      extraHourRwf: 150000,
    },
    {
      id: "other",
      name: "Other celebrations & corporate events",
      includedHours: 2,
      basePriceRwf: null,
      extraHourRwf: null,
    },
  ],
  inclusions: [
    "Custom photo layout",
    "Unlimited instant prints",
    "Choice of preferred print format",
    "Digital copies & online album",
    "iPad sharing station",
    "Choice of backdrop from our selection",
    "Professional on-site attendant",
  ],
  addOns: [
    {
      id: "keepsakes",
      name: "Keepsakes & Memory Books",
      description: "A place to collect prints and personal messages.",
    },
    {
      id: "custom-backdrop",
      name: "Custom Backdrops",
      description: "A backdrop tailored to your event, subject to discussion.",
    },
    {
      id: "branded-experience",
      name: "Branded Experiences",
      description: "Custom layouts and brand details for your gathering.",
    },
  ],
} as const;
