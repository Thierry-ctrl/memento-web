import * as React from "react"
import { 
  useListBookings, 
  useGetAdminSummary, 
  BookingStatus, 
  useUpdateBooking,
  useGetBooking,
  useAddBookingNote,
  useListBlockedAvailability,
  useCreateBlockedAvailability,
  useDeleteBlockedAvailability,
  getGetBookingQueryKey,
  getListBlockedAvailabilityQueryKey
} from "@workspace/api-client-react"
import { format } from "date-fns"
import { Search, Download, AlertCircle, Calendar, MessageSquare, Trash2, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"

function BookingDetails({ id, onClose }: { id: number, onClose: () => void }) {
  const { data: booking, isLoading } = useGetBooking(id, { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) } })
  const addNote = useAddBookingNote()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = React.useState("")
  
  if (isLoading || !booking) return <div className="p-8 text-center text-primary/50">Loading details...</div>
  
  const handleAddNote = () => {
    if (!newNote.trim()) return
    addNote.mutate({ id, data: { note: newNote } }, {
      onSuccess: (updatedNote) => {
        setNewNote("")
        queryClient.setQueryData(getGetBookingQueryKey(id), (old: any) => 
          old ? { ...old, adminNotes: [...old.adminNotes, updatedNote] } : old
        )
        toast({ title: "Note added" })
      }
    })
  }
  
  const waLink = `https://wa.me/${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${booking.fullName}, this is Memento Kigali regarding your inquiry for ${booking.eventDate}...`)}`
  
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary/50">Client</p>
          <p className="text-primary">{booking.fullName}</p>
          <p className="text-primary/70">{booking.email || 'No email'}</p>
          <p className="text-primary/70">{booking.phone}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary/50">Event</p>
          <p className="text-primary">{booking.eventType}</p>
          <p className="text-primary/70">{format(new Date(booking.eventDate), 'MMM d, yyyy')}</p>
          <p className="text-primary/70">{booking.startTime} {booking.endTime ? `- ${booking.endTime}` : booking.durationHours ? `(${booking.durationHours} hrs)` : ''}</p>
          <p className="text-primary/70">{booking.guestCount} guests</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-widest text-primary/50">Location</p>
          <p className="text-primary">{booking.venue}, {booking.location}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-widest text-primary/50">Setup & Requirements</p>
          <p className="text-primary">{booking.printFormat} format, {booking.backdropPreference} backdrop</p>
          {booking.addOns && booking.addOns.length > 0 && (
            <p className="text-primary/70 mt-1">Add-ons: {booking.addOns.join(", ")}</p>
          )}
          {booking.brandedRequirements && (
             <div className="mt-2 bg-muted p-3 border-l border-primary/20">
               <p className="text-primary/70 italic text-xs">"{booking.brandedRequirements}"</p>
             </div>
          )}
          {booking.notes && (
             <div className="mt-2 bg-muted p-3 border-l border-primary/20">
               <p className="text-primary/70 italic text-xs">"{booking.notes}"</p>
             </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 border border-primary px-4 py-2 text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors">
          <MessageSquare className="w-4 h-4" /> Message on WhatsApp
        </a>
      </div>

      <div className="border-t border-primary/10 pt-6">
        <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-4">Internal Notes</p>
        <div className="space-y-3 mb-4">
          {booking.adminNotes && booking.adminNotes.length > 0 ? (
            booking.adminNotes.map(note => (
              <div key={note.id} className="bg-card border border-primary/5 p-3 text-sm">
                <p className="text-primary/80">{note.note}</p>
                <p className="text-[10px] text-primary/40 mt-2">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-primary/40 italic">No notes yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add a private note..." 
            value={newNote} 
            onChange={e => setNewNote(e.target.value)} 
            className="h-10 text-sm"
          />
          <Button onClick={handleAddNote} disabled={addNote.isPending} className="h-10 rounded-none px-6 text-xs uppercase tracking-widest">Add</Button>
        </div>
      </div>
    </div>
  )
}

function AvailabilityManager() {
  const { data: blocked, isLoading } = useListBlockedAvailability()
  const createBlocked = useCreateBlockedAvailability()
  const deleteBlocked = useDeleteBlockedAvailability()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [date, setDate] = React.useState("")
  const [reason, setReason] = React.useState("")

  const handleAdd = () => {
    if (!date || !reason) return
    createBlocked.mutate({ data: { date, reason } }, {
      onSuccess: () => {
        setDate("")
        setReason("")
        queryClient.invalidateQueries({ queryKey: getListBlockedAvailabilityQueryKey() })
        toast({ title: "Blocked date added" })
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to block date", variant: "destructive" })
      }
    })
  }

  const handleDelete = (id: number) => {
    deleteBlocked.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBlockedAvailabilityQueryKey() })
        toast({ title: "Blocked date removed" })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-primary/10 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-primary/50 block mb-1">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 text-sm" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-primary/50 block mb-1">Reason (Internal)</label>
          <Input placeholder="e.g. Maintenance, Away" value={reason} onChange={e => setReason(e.target.value)} className="h-10 text-sm" />
        </div>
        <Button onClick={handleAdd} disabled={createBlocked.isPending || !date || !reason} className="h-10 rounded-none uppercase tracking-widest text-xs">
          Block Date
        </Button>
      </div>

      <div className="border-t border-primary/10 pt-4 max-h-[50vh] overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-4">Currently Blocked</p>
        {isLoading ? (
          <p className="text-sm text-primary/50">Loading...</p>
        ) : blocked && blocked.length > 0 ? (
          <div className="space-y-2">
            {blocked.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-card p-3 border border-primary/5">
                <div>
                  <p className="text-sm text-primary font-medium">{format(new Date(b.date), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-primary/60">{b.reason}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-primary/50 italic">No blocked dates.</p>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  useScrollReveal()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedBookingId, setSelectedBookingId] = React.useState<number | null>(null)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = React.useState(false)
  
  const { data: summary, isLoading: isLoadingSummary } = useGetAdminSummary()
  const { data: bookings, isLoading: isLoadingBookings, refetch } = useListBookings({
    status: statusFilter !== "all" ? (statusFilter as BookingStatus) : undefined,
    search: searchTerm || undefined
  })
  const updateBooking = useUpdateBooking()
  const { toast } = useToast()

  const handleStatusChange = (id: number, status: BookingStatus) => {
    updateBooking.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: "Booking status has been saved." })
          refetch()
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
      }
    )
  }

  const exportCsv = () => {
    window.open("/api/admin/export.csv", "_blank")
  }

  return (
    <main className="w-full flex flex-col min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-[1400px] mx-auto w-full px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 fade-up">
          <div>
            <h1 className="font-serif text-5xl text-primary mb-2">Bookings</h1>
            <p className="text-primary/60 font-light">Manage inquiries, availability, and confirmed events.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="rounded-none border-primary/20 text-xs tracking-widest uppercase px-6 h-10" onClick={() => setIsAvailabilityOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" /> Availability
            </Button>
            <Button variant="outline" className="rounded-none border-primary/20 text-xs tracking-widest uppercase px-6 h-10" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {!isLoadingSummary && summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12 fade-up">
            <div className="bg-card border border-primary/5 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/50 mb-2">Pending</p>
              <p className="font-serif text-3xl text-primary">{summary.pending}</p>
            </div>
            <div className="bg-card border border-primary/5 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/50 mb-2">Confirmed</p>
              <p className="font-serif text-3xl text-primary">{summary.confirmed}</p>
            </div>
            <div className="bg-card border border-primary/5 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/50 mb-2">Conflicts</p>
              <p className="font-serif text-3xl text-destructive flex items-center gap-2">
                {summary.potentialConflicts} {summary.potentialConflicts > 0 && <AlertCircle className="w-4 h-4" />}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
            <Input 
              placeholder="Search reference, name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="py-4 px-4 font-sans text-[10px] tracking-[0.2em] uppercase text-primary/50 font-normal">Reference</th>
                <th className="py-4 px-4 font-sans text-[10px] tracking-[0.2em] uppercase text-primary/50 font-normal">Client</th>
                <th className="py-4 px-4 font-sans text-[10px] tracking-[0.2em] uppercase text-primary/50 font-normal">Event Date</th>
                <th className="py-4 px-4 font-sans text-[10px] tracking-[0.2em] uppercase text-primary/50 font-normal">Status</th>
                <th className="py-4 px-4 font-sans text-[10px] tracking-[0.2em] uppercase text-primary/50 font-normal">Conflicts</th>
                <th className="py-4 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {isLoadingBookings ? (
                <tr><td colSpan={6} className="py-8 text-center text-primary/40 text-sm">Loading bookings...</td></tr>
              ) : bookings?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-primary/40 text-sm">No bookings found.</td></tr>
              ) : (
                bookings?.map((booking) => (
                  <tr key={booking.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors group">
                    <td className="py-4 px-4 font-mono text-xs text-primary/60">{booking.reference}</td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-primary">{booking.fullName}</p>
                      <p className="text-xs text-primary/50">{booking.eventType}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-primary">{format(new Date(booking.eventDate), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-primary/50">{booking.startTime}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Select 
                        value={booking.status} 
                        onValueChange={(val) => handleStatusChange(booking.id, val as BookingStatus)}
                      >
                        <SelectTrigger className="h-8 text-xs border-transparent bg-transparent w-[120px] px-2 shadow-none group-hover:border-primary/20 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-4 px-4">
                      {booking.potentialConflict ? (
                        <span className="inline-flex items-center px-2 py-1 bg-destructive/10 text-destructive text-[10px] uppercase tracking-widest border border-destructive/20">
                          Conflict
                        </span>
                      ) : (
                        <span className="text-primary/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBookingId(booking.id)} className="h-8 px-3 text-xs uppercase tracking-widest text-primary/60 hover:text-primary">
                        View <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      <Dialog open={selectedBookingId !== null} onOpenChange={(open) => !open && setSelectedBookingId(null)}>
        <DialogContent className="max-w-2xl bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBookingId && <BookingDetails id={selectedBookingId} onClose={() => setSelectedBookingId(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
        <DialogContent className="max-w-2xl bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Manage Availability</DialogTitle>
            <DialogDescription>Block out dates to prevent new inquiries for those days.</DialogDescription>
          </DialogHeader>
          <AvailabilityManager />
        </DialogContent>
      </Dialog>
    </main>
  )
}
