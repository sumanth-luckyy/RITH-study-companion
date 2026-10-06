import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  RefreshCw,
  Download,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PDF {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_size: string | null;
  uploader_name: string;
  created_at: string;
}

const DEFAULT_CATEGORIES = ['General', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Notes'];

export default function PDFManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PDF | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchPdfs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdfs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdfs(data || []);
    } catch (error: unknown) {
      console.error('Error fetching PDFs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PDFs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File',
          description: 'Please select a PDF file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Maximum file size is 20MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace('.pdf', '') }));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a PDF file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for the PDF.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log('DEBUG: Starting PDF upload process', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      // Upload file to storage
      const fileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (uploadError) {
        console.error('DEBUG: Supabase storage upload error:', uploadError);
        throw new Error(`Storage Error: ${uploadError.message} (Code: ${uploadError.name})`);
      }

      console.log('DEBUG: File uploaded successfully, getting public URL');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded file.');
      }

      console.log('DEBUG: Public URL generated:', urlData.publicUrl);

      // Insert record into database
      const { error: insertError } = await supabase
        .from('pdfs')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          file_url: urlData.publicUrl,
          file_size: formatFileSize(selectedFile.size),
          uploader_name: profile?.full_name || 'Admin',
        });

      if (insertError) {
        console.error('DEBUG: Supabase database insert error:', insertError);
        throw new Error(`Database Error: ${insertError.message}`);
      }

      toast({
        title: 'PDF Uploaded',
        description: `${formData.title} has been uploaded successfully.`,
      });

      setShowUploadModal(false);
      setFormData({ title: '', description: '', category: 'General' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPdfs();
    } catch (error: unknown) {
      console.error('DEBUG: Critical error in handleUpload:', error);

      const errObj = error as { message?: string };
      const isBucketError = errObj.message?.includes('Bucket not found');
      const isTableError = errObj.message?.includes("Could not find the table 'public.pdfs'");

      toast({
        title: isBucketError ? 'Storage Bucket Missing' : isTableError ? 'Database Table Missing' : 'Upload Failed',
        description: isBucketError
          ? 'The "pdfs" storage bucket does not exist. Please create it in your Supabase dashboard.'
          : isTableError
            ? 'The "pdfs" database table does not exist. Please run the SQL migration in your Supabase dashboard.'
            : errObj.message || 'Failed to upload PDF. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPdf) return;

    if (!formData.title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for the PDF.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('pdfs')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
        })
        .eq('id', editingPdf.id);

      if (error) throw error;

      toast({
        title: 'PDF Updated',
        description: 'The PDF has been updated successfully.',
      });

      setEditingPdf(null);
      setFormData({ title: '', description: '', category: 'General' });
      fetchPdfs();
    } catch (error: unknown) {
      console.error('Error updating PDF:', error);
      toast({
        title: 'Update Failed',
        description: (error as Error).message || 'Failed to update PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (pdf: PDF) => {
    try {
      // Extract filename from URL
      const urlParts = pdf.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage.from('pdfs').remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from('pdfs')
        .delete()
        .eq('id', pdf.id);

      if (error) throw error;

      toast({
        title: 'PDF Deleted',
        description: 'The PDF has been removed.',
      });

      setDeleteConfirm(null);
      fetchPdfs();
    } catch (error: unknown) {
      console.error('Error deleting PDF:', error);
      toast({
        title: 'Delete Failed',
        description: (error as Error).message || 'Failed to delete PDF.',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (pdf: PDF) => {
    setFormData({
      title: pdf.title,
      description: pdf.description || '',
      category: pdf.category,
    });
    setEditingPdf(pdf);
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pdf.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">PDF Management</h2>
          <p className="text-sm text-muted-foreground">Upload, edit, and manage PDF documents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchPdfs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="gradient" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pdfs.length}</p>
              <p className="text-sm text-muted-foreground">Total PDFs</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <FolderOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(pdfs.map(p => p.category)).size}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by title or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-12"
        />
      </motion.div>

      {/* PDF List */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading PDFs...</p>
          </div>
        ) : filteredPdfs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No PDFs found</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Try a different search term' : 'Upload your first PDF to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">PDF</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Category</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Size</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPdfs.map((pdf) => (
                    <tr key={pdf.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-xs">{pdf.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{pdf.description || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                          {pdf.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">{pdf.file_size || 'Unknown'}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <a href={pdf.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(pdf)}
                            className="text-accent hover:text-accent hover:bg-accent/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {deleteConfirm === pdf.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(pdf)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(pdf.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {filteredPdfs.map((pdf) => (
                <div key={pdf.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[150px]">{pdf.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{pdf.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-9 w-9 p-0 text-primary hover:bg-primary/10"
                      >
                        <a href={pdf.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(pdf)}
                        className="h-9 w-9 p-0 text-accent hover:bg-accent/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {deleteConfirm === pdf.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(pdf)}
                            className="h-9 w-9 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                            className="h-9 w-9 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(pdf.id)}
                          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {pdf.description && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg italic">
                      {pdf.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1">
                    <span>Size: {pdf.file_size || 'Unknown'}</span>
                    <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border shadow-lg w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Upload PDF</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFormData({ title: '', description: '', category: 'General' });
                  setSelectedFile(null);
                }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">PDF File *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf"
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all cursor-pointer bg-muted/30 p-2 rounded-xl border border-dashed border-border hover:border-primary/50"
                />
                <p className="text-[10px] text-muted-foreground">Maximum file size: 20MB. Only PDF documents allowed.</p>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter PDF title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input min-h-[80px] resize-none"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <input
                  type="text"
                  list="category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  placeholder="Select or type a category (e.g., Semester 1)"
                />
                <datalist id="category-options">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">Type a custom name or select from suggestions</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({ title: '', description: '', category: 'General' });
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  className="flex-1"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border shadow-lg w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Edit PDF</h2>
              <button
                onClick={() => {
                  setEditingPdf(null);
                  setFormData({ title: '', description: '', category: 'General' });
                }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter PDF title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input min-h-[80px] resize-none"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <input
                  type="text"
                  list="category-options-edit"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  placeholder="Select or type a category"
                />
                <datalist id="category-options-edit">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">Type a custom name or select from suggestions</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setEditingPdf(null);
                    setFormData({ title: '', description: '', category: 'General' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
