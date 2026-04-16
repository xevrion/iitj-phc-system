import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, X, AlertCircle, Loader2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { cn } from "../../../utils/cn";
import { publishEvent, getEvents } from "../services/admin.service";

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", eventDate: "", location: "" });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      if (res.success) setEvents(res.data);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await publishEvent({
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
      });
      if (res.success) {
        setEvents(prev => [res.data, ...prev]);
        setShowForm(false);
        setForm({ title: "", description: "", eventDate: "", location: "" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish event.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PHC Events</h1>
          <p className="text-gray-500">Publish announcements and health events for the campus.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          {showForm ? "Cancel" : "Publish Event"}
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handlePublish} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">New Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              placeholder="Blood Donation Camp"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="Location"
              placeholder="PHC Hall, IITJ Campus"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
            <Input
              label="Event Date & Time"
              type="datetime-local"
              value={form.eventDate}
              onChange={e => setForm({ ...form, eventDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Brief description of the event..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button type="submit" isLoading={saving}>Publish</Button>
        </form>
      )}

      <div className="space-y-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex gap-5">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-gray-900">{ev.title}</h3>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(ev.eventDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              {ev.description && <p className="text-sm text-gray-600 mt-1">{ev.description}</p>}
              {ev.location && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">📍 {ev.location}</p>}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
            <CalendarDays size={36} className="text-gray-300 mb-3" />
            <p className="font-bold text-gray-900">No upcoming events</p>
            <p className="text-sm text-gray-400 mt-1">Publish an event to display it here and notify users.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsManagement;
