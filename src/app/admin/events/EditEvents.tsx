"use client";

import React, { useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, isAfter } from "date-fns";
import { toast } from "react-hot-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventSchedule {
  startTime: string;
  endTime: string;
}

interface Event {
  id: string;
  createdAt: string | Date | Timestamp;
  date: string | Date | Timestamp;
  description: string;
  endDate: string | Date | Timestamp;
  isMultiDay: boolean;
  location: string;
  name: string;
  schedule: EventSchedule;
  status: "active" | "cancelled" | "completed";
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

const defaultSchedule: EventSchedule = {
  startTime: "09:00",
  endTime: "17:00",
};

export default function EditEventModal({
  event,
  onEventUpdated,
}: {
  event: Event;
  onEventUpdated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Event>({
    ...event,
    schedule: event.schedule || defaultSchedule,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!editedEvent.name?.trim()) {
      newErrors.name = "Event name is required";
    }
    if (!editedEvent.description?.trim()) {
      newErrors.description = "Description is required";
    }
    if (!editedEvent.date) {
      newErrors.date = "Start date is required";
    }
    if (editedEvent.isMultiDay && editedEvent.date && editedEvent.endDate) {
      const startDate =
        editedEvent.date instanceof Timestamp
          ? editedEvent.date.toDate()
          : new Date(editedEvent.date);
      const endDate =
        editedEvent.endDate instanceof Timestamp
          ? editedEvent.endDate.toDate()
          : new Date(editedEvent.endDate);
      if (isAfter(startDate, endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }
    if (!editedEvent.schedule?.startTime) {
      newErrors.schedule = {
        ...newErrors.schedule,
        startTime: "Start time is required",
      };
    }
    if (!editedEvent.schedule?.endTime) {
      newErrors.schedule = {
        ...newErrors.schedule,
        endTime: "End time is required",
      };
    }
    if (editedEvent.schedule?.startTime && editedEvent.schedule?.endTime) {
      if (editedEvent.schedule.startTime >= editedEvent.schedule.endTime) {
        newErrors.schedule = {
          ...newErrors.schedule,
          endTime: "End time must be after start time",
        };
      }
    }
    if (!editedEvent.location?.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedEvent((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEvent((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [name]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [name]: undefined },
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setEditedEvent((prev) => ({
      ...prev,
      isMultiDay: checked,
      endDate: checked ? prev.endDate : prev.date,
    }));
  };

  const handleDateChange = (
    date: Date | undefined,
    dateType: "date" | "endDate"
  ) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setEditedEvent((prev) => ({
        ...prev,
        [dateType]: formattedDate,
        ...(dateType === "date" && !prev.isMultiDay
          ? { endDate: formattedDate }
          : {}),
      }));
      setErrors((prev) => ({ ...prev, [dateType]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const eventRef = doc(db, "events", event.id);
        await updateDoc(eventRef, {
          ...editedEvent,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Event updated successfully!");
        onEventUpdated();
        setIsOpen(false);
      } catch (error) {
        console.error("Error updating event:", error);
        toast.error("Failed to update event. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please correct the errors in the form");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              name="name"
              value={editedEvent.name}
              onChange={handleInputChange}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={editedEvent.description}
              onChange={handleInputChange}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={errors.date ? "border-red-500" : ""}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedEvent.date instanceof Timestamp
                      ? format(editedEvent.date.toDate(), "PPP")
                      : format(new Date(editedEvent.date), "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      editedEvent.date instanceof Timestamp
                        ? editedEvent.date.toDate()
                        : new Date(editedEvent.date)
                    }
                    onSelect={(date) => handleDateChange(date, "date")}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMultiDay"
              checked={editedEvent.isMultiDay}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="isMultiDay">Multi-day event</Label>
          </div>

          {editedEvent.isMultiDay && (
            <div className="space-y-2">
              <Label>End Date</Label>
              <div className="flex items-center space-x-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={errors.endDate ? "border-red-500" : ""}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editedEvent.endDate instanceof Timestamp
                        ? format(editedEvent.endDate.toDate(), "PPP")
                        : format(new Date(editedEvent.endDate), "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        editedEvent.endDate instanceof Timestamp
                          ? editedEvent.endDate.toDate()
                          : new Date(editedEvent.endDate)
                      }
                      onSelect={(date) => handleDateChange(date, "endDate")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                id="startTime"
                name="startTime"
                value={editedEvent.schedule?.startTime || ""}
                onChange={handleScheduleChange}
                className={errors.schedule?.startTime ? "border-red-500" : ""}
              />
              {errors.schedule?.startTime && (
                <p className="text-sm text-red-500">
                  {errors.schedule.startTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                type="time"
                id="endTime"
                name="endTime"
                value={editedEvent.schedule?.endTime || ""}
                onChange={handleScheduleChange}
                className={errors.schedule?.endTime ? "border-red-500" : ""}
              />
              {errors.schedule?.endTime && (
                <p className="text-sm text-red-500">
                  {errors.schedule.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={editedEvent.location}
              onChange={handleInputChange}
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
