import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Droplets, CheckCircle2, AlertCircle, Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getMyProfile, updateMyProfile } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const Profile = () => {
  const { user, checkAuth } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    bloodGroup: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        if (response.success) {
          setProfile(response.data);
          setFormData({
            name: response.data.name || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
            address: response.data.address || "",
            dob: response.data.dob ? new Date(response.data.dob).toISOString().split("T")[0] : "",
            bloodGroup: response.data.bloodGroup || "",
          });
        }
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load profile data." });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await updateMyProfile({
        ...formData,
        dob: formData.dob ? new Date(formData.dob).toISOString() : null
      });
      if (response.success) {
        setProfile(response.data);
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        await checkAuth(); // Refresh global user state
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 px-0 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medical Profile</h1>
          <p className="text-gray-500">Manage your personal and medical information.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Basic Info & QR Code */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.name || "Patient Name"}</h2>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-mono mt-1">ID: {profile?.id.slice(-8)}</p>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 inline-block">
              {profile?.qrCode ? (
                <div className="space-y-3">
                  <QRCodeSVG value={profile.qrCode} size={128} className="mx-auto" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <QrCode size={12} /> Digital ID QR
                  </p>
                </div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-gray-300">
                  <QrCode size={64} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4 px-4 italic">
              Scan this QR at the PHC reception desk for instant check-in.
            </p>
          </div>
        </div>

        {/* Right Column: Detailed Info Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Personal Information
              </h3>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Full Name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  icon={User}
                />
                <Input 
                  label="Email Address" 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                  icon={Mail}
                />
                <Input 
                  label="Phone Number" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  icon={Phone}
                />
                <Input 
                  label="Date of Birth" 
                  type="date"
                  value={formData.dob} 
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  disabled={!isEditing}
                  icon={Calendar}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Droplets size={14} className="text-red-500" /> Blood Group
                  </label>
                  <select 
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none disabled:bg-gray-50 disabled:text-gray-500"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                    disabled={!isEditing}
                  >
                    <option value="">Select...</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" /> Permanent Address
                </label>
                <textarea 
                  className="w-full min-h-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-50">
                  <Button variant="outline" onClick={() => setIsEditing(false)} type="button" disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={saving}>
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
