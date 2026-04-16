import React, { useState, useEffect } from "react";
import { FolderOpen, Upload, File, Trash2, Download, Plus, Loader2, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import { getMyDocuments, uploadDocument, deleteDocument } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const MedicalRecords = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    documentType: "PRESCRIPTION",
    file: null,
  });

  const fetchDocuments = async () => {
    if (!user?.patient?.id) return;
    try {
      const response = await getMyDocuments(user.patient.id);
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (err) {
      setError("Failed to load your medical documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleFileChange = (e) => {
    setError("");
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document from your vault?")) return;
    try {
      await deleteDocument(user.patient.id, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setSuccess("Document removed from vault.");
    } catch (err) {
      setError("Failed to delete document.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      payload.append("documentType", formData.documentType);
      payload.append("file", formData.file);

      const response = await uploadDocument(user.patient.id, payload);
      if (response.success) {
        setSuccess("Document uploaded to your vault.");
        setIsUploadModalOpen(false);
        setFormData({ documentType: "PRESCRIPTION", file: null });
        fetchDocuments();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading medical vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Vault</h1>
          <p className="text-gray-500">Securely store and manage your external medical reports and prescriptions.</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
          <Upload size={18} />
          Upload Document
        </Button>
      </div>

      {(error || success) && (
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-3 border",
          success ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        )}>
          {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{success || error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                {doc.documentType}
              </span>
            </div>
            
            <div className="flex-1 space-y-1 mb-6">
              <h3 className="font-bold text-gray-900 truncate" title={doc.originalFilename || doc.fileUrl.split('/').pop()}>
                {doc.originalFilename || doc.fileUrl.split('/').pop() || "Medical Document"}
              </h3>
              <p className="text-xs text-gray-500">Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}</p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-50">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2" 
                onClick={() => window.open(doc.fileUrl, "_blank")}
              >
                <Download size={14} />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50 h-9 w-9 p-0"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Your vault is empty</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-1">
              Keep all your external medical records organized in one place.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setIsUploadModalOpen(true)}>
              Upload your first record
            </Button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Document Type</label>
                  <select 
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                    value={formData.documentType}
                    onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                  >
                    <option value="PRESCRIPTION">External Prescription</option>
                    <option value="LAB_REPORT">External Lab Report</option>
                    <option value="DISCHARGE">Discharge Summary</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Select File</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleFileChange}
                      required
                    />
                    <div className="w-full border-2 border-dashed border-gray-200 group-hover:border-blue-300 group-hover:bg-blue-50/30 rounded-xl p-8 transition-all text-center">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {formData.file ? formData.file.name : "Click to browse or drag file here"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setIsUploadModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" isLoading={uploading}>
                  Upload to Vault
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
