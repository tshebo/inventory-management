'use client'
import { format } from "date-fns";
import { useEvents } from "@/hooks/useEvents"; // Adjust path as needed
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function EventList() {
  const { events, loading, error, deleteEvent } = useEvents();

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);

      toast.success("The event has been successfully removed.");
    } catch (error) {

      toast.error("There was a problem deleting the event. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>{format(event.date, "PPP")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{event.description}</p>
            <p className="mt-2 font-semibold">{event.location}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(event.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
          <Toaster
  position="top-center"
  reverseOrder={false}
/>
    </div>
  );
}
