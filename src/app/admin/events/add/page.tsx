"use client";

import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, isAfter } from "date-fns";

interface EventSchedule {
  startTime: string;
  endTime: string;
}

interface Event {
  name: string;
  description: string;
  date: string;
  schedule: EventSchedule;
  location: string;
  isMultiDay?: boolean;
  endDate?: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  date?: string;
  endDate?: string;
  schedule?: {
    startTime?: string;
    endTime?: string;
  };
  location?: string;
}

export default function EventForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [event, setEvent] = useState<Event>({
    name: "",
    description: "",
    date: "",
    schedule: { startTime: "", endTime: "" },
    location: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!event.name.trim()) {
      newErrors.name = "Event name is required";
    }
    if (!event.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!event.date) {
      newErrors.date = "Start date is required";
    }
    if (event.isMultiDay && event.date && event.endDate) {
      if (isAfter(new Date(event.date), new Date(event.endDate))) {
        newErrors.endDate = "End date must be after start date";
      }
    }
    if (!event.schedule.startTime) {
      newErrors.schedule = { ...newErrors.schedule, startTime: "Start time is required" };
    }
    if (!event.schedule.endTime) {
      newErrors.schedule = { ...newErrors.schedule, endTime: "End time is required" };
    }
    if (event.schedule.startTime && event.schedule.endTime) {
      if (event.schedule.startTime >= event.schedule.endTime) {
        newErrors.schedule = {
          ...newErrors.schedule,
          endTime: "End time must be after start time",
        };
      }
    }
    if (!event.location.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEvent((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvent((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [name]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [name]: undefined },
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setEvent((prev) => ({ 
      ...prev, 
      isMultiDay: checked,
      endDate: checked ? prev.endDate : prev.date // Set endDate to date if not multiday
    }));
  };

  const handleDateChange = (
    date: Date | undefined,
    dateType: "date" | "endDate"
  ) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setEvent((prev) => ({ 
        ...prev, 
        [dateType]: formattedDate,
        // If changing start date and not multiday, update end date too
        ...(dateType === 'date' && !prev.isMultiDay ? { endDate: formattedDate } : {})
      }));
      setErrors((prev) => ({ ...prev, [dateType]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const eventData = {
          ...event,
          createdAt: new Date().toISOString(),
          status: "active",
        };

        await addDoc(collection(db, "events"), eventData);
        toast.success("Event created successfully!");
        router.push("/admin/events");
      } catch (error) {
        console.error("Error creating event:", error);
        toast.error("Failed to create event. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please correct the errors in the form");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-6">Create Event</h2>

      <div className="space-y-2">
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          name="name"
          value={event.name}
          onChange={handleInputChange}
          required
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={event.description}
          onChange={handleInputChange}
          required
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {event.date ? format(new Date(event.date), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={event.date ? new Date(event.date) : undefined}
              onSelect={(date) => handleDateChange(date, "date")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isMultiDay"
          checked={event.isMultiDay}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="isMultiDay">Multi-day event</Label>
      </div>

      {event.isMultiDay && (
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {event.endDate ? format(new Date(event.endDate), "PPP") : <span>Pick an end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={event.endDate ? new Date(event.endDate) : undefined}
                onSelect={(date) => handleDateChange(date, "endDate")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>
      )}

      <div className="flex space-x-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            value={event.schedule.startTime}
            onChange={handleScheduleChange}
            required
          />
          {errors.schedule?.startTime && (
            <p className="text-sm text-red-500">{errors.schedule.startTime}</p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            value={event.schedule.endTime}
            onChange={handleScheduleChange}
            required
          />
          {errors.schedule?.endTime && (
            <p className="text-sm text-red-500">{errors.schedule.endTime}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={event.location}
          onChange={handleInputChange}
          required
        />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Event...
          </span>
        ) : (
          "Create Event"
        )}
      </Button>
    </form>
  );
}