"use client" // Indicates a client-side component. ST10062618

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, parseISO, isPast } from "date-fns"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Event {
  id: string;
  createdAt: string | Date | Timestamp;
  date: string | Date | Timestamp;
  description: string;
  endDate: string | Date | Timestamp;
  isMultiDay: boolean;
  location: string;
  name: string;
  schedule: {
    endTime: string;
    startTime: string;
  };
  status: "active" | "cancelled" | "completed";
}

// Helper function to safely format dates
const formatDate = (
  date: string | Date | Timestamp | undefined,
  pattern: string
) => {
  if (!date) return "N/A";

  try {
    // Handle Firestore Timestamp
    if (date instanceof Timestamp) {
      return format(date.toDate(), pattern);
    }

    // Handle Date objects
    if (date instanceof Date) {
      return format(date, pattern);
    }

    // Handle ISO strings
    if (typeof date === "string") {
      // Try parsing as ISO first
      try {
        return format(parseISO(date), pattern);
      } catch {
        // If ISO parsing fails, try creating a new Date
        return format(new Date(date), pattern);
      }
    }

    return "Invalid date";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export default function EventTable() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true)
        setError(null)
        
        const eventsRef = collection(db, "events")
        const q = query(eventsRef, orderBy("date", "desc"))
        const querySnapshot = await getDocs(q)
        
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[]

        setEvents(fetchedEvents)
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Failed to load events. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getStatusColor = (
    status: Event["status"],
    date: Event["date"],
    endDate: Event["endDate"]
  ) => {
    if (status === "cancelled") return "bg-red-500";

    const endDateTime =
      endDate instanceof Date
        ? endDate
        : endDate instanceof Timestamp
        ? endDate.toDate()
        : new Date(endDate);

    if (status === "completed" || isPast(endDateTime)) return "bg-gray-500";
    return "bg-green-500";
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventId)
      );
      console.log("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event. Please try again later.");
    }
  };

  const getStatusText = (
    status: Event["status"],
    date: Event["date"],
    endDate: Event["endDate"]
  ) => {
    if (status === "cancelled") return "Cancelled";

    const endDateTime =
      endDate instanceof Date
        ? endDate
        : endDate instanceof Timestamp
        ? endDate.toDate()
        : new Date(endDate);

    if (status === "completed" || isPast(endDateTime)) return "Past";
    return "Upcoming";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </Link>
      </div>
      {events.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No events found.</p>
          <Link href="/admin/events/add">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Create your first event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span
                            className={`h-2 w-2 rounded-full inline-block mr-2 ${getStatusColor(
                              event.status,
                              event.date,
                              event.endDate
                            )}`}
                          ></span>
                          {getStatusText(
                            event.status,
                            event.date,
                            event.endDate
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Created:{" "}
                            {formatDate(event.createdAt, "MMM d, yyyy HH:mm")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    {formatDate(event.date, "MMM d, yyyy")}
                    {event.isMultiDay &&
                      ` - ${formatDate(event.endDate, "MMM d, yyyy")}`}
                  </TableCell>
                  <TableCell>
                    {event.schedule?.startTime || "N/A"} -{" "}
                    {event.schedule?.endTime || "N/A"}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="truncate block max-w-[200px]">
                            {event.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{event.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
