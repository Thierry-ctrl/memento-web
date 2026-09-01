import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateBooking } from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"

const bookingSchema = z.object({
  customerType: z.enum(["individual", "organization"]),
  organizationName: z.string().max(160).optional().nullable(),
  fullName: z.string().min(2, "Name is required").max(120),
  phone: z.string().min(7, "Valid phone required").max(30),
  email: z.string().email("Valid email required").or(z.literal("")).nullable(),
  preferredContactMethod: z.enum(["whatsapp", "phone", "email"]),
  eventType: z.string().min(2, "Event type required").max(80),
  eventDate: z.string().min(1, "Date required"), // simple string for now
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  endTime: z.string().optional().nullable(),
  durationHours: z.coerce.number().int("Use whole hours").min(2, "Minimum booking is 2 hours").max(24),
  venue: z.string().min(2, "Venue required").max(160),
  location: z.string().min(2, "Location required").max(120),
  guestCount: z.coerce.number().min(1, "Guest count required"),
  printFormat: z.string().min(2, "Print format required"),
  backdropPreference: z.string().min(2, "Backdrop preference required"),
  addOns: z.array(z.string()).optional(),
  brandedRequirements: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  consent: z.boolean().refine(val => val === true, "Consent required"),
  website: z.string().optional().nullable(), // honeypot
  earlyRequest: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.customerType === "organization" && !data.organizationName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["organizationName"],
      message: "Organization name is required",
    })
  }
})

type BookingFormValues = z.infer<typeof bookingSchema>

export default function Book() {
  useScrollReveal()
  const [step, setStep] = React.useState(1)
  const { toast } = useToast()
  const createBooking = useCreateBooking()
  const [confirmation, setConfirmation] = React.useState<{
    reference: string
    totalAmountRwf: number
    depositAmountRwf: number
  } | null>(null)

  // Retrieve draft from localStorage if available
  const savedData = React.useMemo(() => {
    try {
      const stored = localStorage.getItem("memento_booking_draft")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerType: "individual",
      organizationName: "",
      fullName: "",
      phone: "",
      email: "",
      preferredContactMethod: "whatsapp",
      eventType: "",
      eventDate: "",
      startTime: "18:00",
      durationHours: 2,
      venue: "",
      location: "",
      guestCount: 100,
      printFormat: "4x6",
      backdropPreference: "signature-warm",
      addOns: [],
      notes: "",
      consent: false,
      ...savedData,
    },
    mode: "onChange",
  })

  // Save to localStorage on change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("memento_booking_draft", JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [form])

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["customerType", "organizationName", "fullName", "phone", "email", "preferredContactMethod"]
    if (step === 2) fieldsToValidate = ["eventType", "eventDate", "startTime", "durationHours", "venue", "location", "guestCount"]
    if (step === 3) fieldsToValidate = ["printFormat", "backdropPreference"]
    
    const isValid = await form.trigger(fieldsToValidate as any, { shouldFocus: true })
    if (isValid) setStep(s => Math.min(s + 1, 5))
    else toast({
      title: "Please check this step",
      description: "Complete the highlighted required fields before continuing.",
      variant: "destructive",
    })
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const onSubmit = (data: BookingFormValues) => {
    if (data.website) return // Honeypot filled
    
    createBooking.mutate({ data }, {
      onSuccess: (result) => {
        setConfirmation({
          reference: result.reference,
          totalAmountRwf: result.totalAmountRwf,
          depositAmountRwf: result.depositAmountRwf,
        })
        localStorage.removeItem("memento_booking_draft")
        window.scrollTo(0, 0)
      },
      onError: (error: unknown) => {
        const apiError = error as { status?: number; data?: { error?: string } }
        toast({
          title: apiError.status === 409 ? "Time unavailable" : "Submission failed",
          description: apiError.data?.error ?? "There was an error submitting your request. Please try again or contact us directly.",
          variant: "destructive"
        })
      }
    })
  }

  if (confirmation) {
    return (
       <main className="min-h-screen flex items-center justify-center paper px-6 pt-24">
        <div className="max-w-2xl text-center fade-up">
           <p className="annotation text-3xl mb-6">request received</p>
           <h1 className="font-serif text-5xl text-primary mb-8">Thank <em>you.</em></h1>
          <p className="text-primary/70 font-light leading-relaxed mb-12">
            We have received your booking request. Your reference is <strong>{confirmation.reference}</strong>. We will review availability and contact you personally. Submission does not guarantee confirmation.
          </p>
          <div className="border border-primary/15 bg-card p-6 mb-10 text-left">
            <p className="eyebrow text-primary/50 mb-3">Estimated booking</p>
            <p className="text-primary">Total: RWF {confirmation.totalAmountRwf.toLocaleString()}</p>
            <p className="text-primary">30% deposit: RWF {confirmation.depositAmountRwf.toLocaleString()}</p>
            <p className="text-sm text-primary/60 mt-3">No payment is due yet. After Memento approves availability, we will send MTN Mobile Money payment instructions.</p>
          </div>
          <a href="https://wa.me/250788628735" target="_blank" rel="noreferrer" className="inline-block mb-5 font-sans uppercase tracking-widest text-xs border-b border-primary">Follow up on WhatsApp</a>
          <Link href="/">
            <Button variant="outline" className="rounded-none border-primary uppercase tracking-widest text-xs h-12 px-8">Return Home</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
     <main className="min-h-screen flex flex-col pt-32 pb-24 paper">
      <div className="max-w-3xl mx-auto w-full px-6">
        
        {/* Progress indicator */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-2">
             <span className="eyebrow text-primary/50">Step {step} of 5</span>
            <span className="font-serif text-primary/80">
              {step === 1 && "Personal Details"}
              {step === 2 && "Event Details"}
              {step === 3 && "The Experience"}
              {step === 4 && "Additional Notes"}
              {step === 5 && "Review"}
            </span>
          </div>
           <div className="h-px w-full bg-primary/10 flex">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step 1: Personal */}
            <div className={step === 1 ? "block" : "hidden"}>
              <h2 className="font-serif text-4xl text-primary mb-10">Who are we speaking with?</h2>
              <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking For</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="individual">An Individual</SelectItem>
                          <SelectItem value="organization">An Organization</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("customerType") === "organization" && (
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input placeholder="Organization name" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person’s Full Name</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+250..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="jane@example.com" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Step 2: Event Details */}
            <div className={step === 2 ? "block" : "hidden"}>
              <h2 className="font-serif text-4xl text-primary mb-10">Tell us about the gathering.</h2>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <FormControl><Input placeholder="e.g. Wedding, Gala, Birthday" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Guest Count</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours Required</FormLabel>
                        <FormControl><Input type="number" min={2} max={24} step={1} {...field} /></FormControl>
                        <p className="text-xs text-primary/55 mt-2">Minimum 2 hours · RWF 150,000 per hour</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="bg-card border border-primary/10 p-5">
                  <p className="eyebrow text-primary/50 mb-2">Price estimate</p>
                  <p className="font-serif text-2xl text-primary">
                    RWF {((Number(form.watch("durationHours")) || 0) * 150000).toLocaleString()}
                  </p>
                  <p className="text-sm text-primary/60 mt-1">
                    30% deposit after approval: RWF {Math.round((Number(form.watch("durationHours")) || 0) * 150000 * 0.3).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date (YYYY-MM-DD)</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Start Time (HH:MM)</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Kigali Marriott" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood / Area</FormLabel>
                        <FormControl><Input placeholder="e.g. Kiyovu" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Experience */}
            <div className={step === 3 ? "block" : "hidden"}>
              <h2 className="font-serif text-4xl text-primary mb-10">Curate your setup.</h2>
              <div className="space-y-12">
                <FormField
                  control={form.control}
                  name="printFormat"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Print Format</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            type="button"
                            className={`border p-6 cursor-pointer transition-colors ${field.value === '4x6' ? 'border-primary bg-card' : 'border-primary/20 hover:border-primary/50'}`}
                            onClick={() => field.onChange('4x6')}
                            aria-pressed={field.value === '4x6'}
                          >
                            <p className="font-serif text-xl text-primary mb-2">Classic 4x6</p>
                            <p className="text-sm font-light text-primary/70">The Studio Portrait style. Large, clear, editorial.</p>
                          </button>
                          <button
                            type="button"
                            className={`border p-6 cursor-pointer transition-colors ${field.value === '2x6-strip' ? 'border-primary bg-card' : 'border-primary/20 hover:border-primary/50'}`}
                            onClick={() => field.onChange('2x6-strip')}
                            aria-pressed={field.value === '2x6-strip'}
                          >
                            <p className="font-serif text-xl text-primary mb-2">2x6 Strip</p>
                            <p className="text-sm font-light text-primary/70">The Noir style. A 3-frame sequence on a tactile strip.</p>
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backdropPreference"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Backdrop Style</FormLabel>
                      <FormControl>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { val: 'signature-warm', label: 'Signature Warm', desc: 'A rich, neutral canvas.' },
                            { val: 'pure-white', label: 'Pure White', desc: 'High contrast, clean.' },
                            { val: 'custom', label: 'Custom / Bespoke', desc: 'Built for your event.' }
                          ].map((opt) => (
                            <button
                              type="button"
                              key={opt.val}
                              className={`border p-5 cursor-pointer transition-colors ${field.value === opt.val ? 'border-primary bg-card' : 'border-primary/20 hover:border-primary/50'}`}
                              onClick={() => field.onChange(opt.val)}
                              aria-pressed={field.value === opt.val}
                            >
                              <p className="font-serif text-lg text-primary mb-1">{opt.label}</p>
                              <p className="text-xs font-light text-primary/70">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Step 4: Notes */}
            <div className={step === 4 ? "block" : "hidden"}>
              <h2 className="font-serif text-4xl text-primary mb-10">Any additional details?</h2>
              <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="brandedRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branding / Customization (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Logos, specific text, or overlay designs you'd like on the prints..." 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Anything else we should know about the event flow, venue restrictions, or special requests..." 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Honeypot */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Step 5: Review */}
            <div className={step === 5 ? "block" : "hidden"}>
              <h2 className="font-serif text-4xl text-primary mb-10">Review & Submit</h2>
              
              <div className="bg-card border border-primary/10 p-8 mb-8 space-y-6 print-lift">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-primary/60">Name</div>
                  <div className="text-primary">{form.getValues("fullName")}</div>

                  <div className="text-primary/60">Booking for</div>
                  <div className="text-primary">
                    {form.getValues("customerType") === "organization"
                      ? form.getValues("organizationName")
                      : "Individual"}
                  </div>
                  
                  <div className="text-primary/60">Event</div>
                  <div className="text-primary">{form.getValues("eventType")}</div>
                  
                  <div className="text-primary/60">Date & Time</div>
                  <div className="text-primary">{form.getValues("eventDate")} at {form.getValues("startTime")} for {form.getValues("durationHours")} hours</div>
                  
                  <div className="text-primary/60">Venue</div>
                  <div className="text-primary">{form.getValues("venue")}, {form.getValues("location")}</div>
                  
                  <div className="text-primary/60">Setup</div>
                  <div className="text-primary">{form.getValues("printFormat")} with {form.getValues("backdropPreference")}</div>

                  <div className="text-primary/60">Estimated total</div>
                  <div className="text-primary">RWF {(Number(form.getValues("durationHours")) * 150000).toLocaleString()}</div>

                  <div className="text-primary/60">Deposit after approval</div>
                  <div className="text-primary">30% · RWF {Math.round(Number(form.getValues("durationHours")) * 150000 * 0.3).toLocaleString()}</div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-primary/10">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs normal-case tracking-normal">
                        I understand that this is an availability request, not a confirmed booking. If Memento approves the request, I will receive instructions to pay the 30% deposit through MTN Mobile Money.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-primary/10 mt-12">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={prevStep} className="uppercase tracking-widest text-xs px-0 hover:bg-transparent hover:text-primary/60 text-primary/80">
                  ← Back
                </Button>
              ) : <div></div>}
              
              {step < 5 ? (
                <Button type="button" onClick={nextStep} className="rounded-none bg-primary text-primary-foreground uppercase tracking-widest text-xs h-12 px-8">
                  Continue →
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createBooking.isPending || !form.watch("consent")} 
                  className="rounded-none bg-primary text-primary-foreground uppercase tracking-widest text-xs h-12 px-10"
                >
                  {createBooking.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              )}
            </div>

          </form>
        </Form>

      </div>
    </main>
  )
}
