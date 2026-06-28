import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { createProject, updateProject } from '../../lib/firebase';

type Props = {
  initialData?: any | null; // null => create mode
  onClose: () => void;
};

export const ProjectForm = ({ initialData, onClose }: Props) => {
  const isEdit = !!initialData;
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [desc, setDesc] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Residential');
  const [client, setClient] = useState(initialData?.client ?? '');
  const [year, setYear] = useState(initialData?.year ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl ?? initialData?.image ?? null);
  const [loading, setLoading] = useState(false);

  const categories = ['Residential', 'Commercial', 'Public', 'Hospitality'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    if (selectedFile) {
      // Clean up previous blob URL if any
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { title, description: desc, category, client, year };
    try {
      if (isEdit) {
        await updateProject(initialData.id, payload, file ?? undefined);
      } else {
        if (!file) throw new Error('An image file is required to create a project');
        await createProject(payload, file);
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDesc(initialData.description);
      setCategory(initialData.category);
      setClient(initialData.client ?? '');
      setYear(initialData.year ?? '');
      setPreviewUrl(initialData.imageUrl ?? initialData.image ?? null);
    } else {
      setTitle('');
      setDesc('');
      setCategory('Residential');
      setClient('');
      setYear('');
      setPreviewUrl(null);
    }
    setFile(null);
  }, [initialData]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl bg-stone-900 border border-stone-800 p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-stone-800 p-2 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="space-y-1">
          <h3 className="text-2xl font-serif font-bold text-white leading-tight">
            {isEdit ? 'Edit Project Details' : 'Publish New Project'}
          </h3>
          <p className="text-xs text-stone-500">
            {isEdit ? 'Modify details or replace image file' : 'Fill details and select image from local computer'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Project Title</label>
            <input
              type="text"
              placeholder="e.g. Modernist Penthouse"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700/60 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent transition-all"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Description</label>
            <textarea
              placeholder="Provide context, materials, and architectural features..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              required
              className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700/60 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent transition-all resize-none"
            />
          </div>

          {/* Grid for details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-sm text-stone-300 focus:outline-none focus:border-accent transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-stone-950 text-stone-200">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Project Year</label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700/60 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Client / Organization</label>
            <input
              type="text"
              placeholder="e.g. Private / Corporation"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700/60 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent transition-all"
            />
          </div>

          {/* Image Upload + Live Preview */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">
              Project Image {isEdit ? '(Optional)' : '(Required)'}
            </label>
            
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="col-span-2 relative">
                <input
                  type="file"
                  accept="image/*"
                  id="image-file-input"
                  required={!isEdit}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="image-file-input"
                  className="flex items-center justify-center gap-2 border border-dashed border-stone-800 hover:border-accent/50 bg-stone-950 text-stone-400 hover:text-white px-4 py-5 rounded-xl cursor-pointer transition-all duration-300 text-xs font-semibold"
                >
                  <Upload size={14} className="text-accent" />
                  {file ? 'Replace File' : 'Upload from PC'}
                </label>
              </div>

              {/* Preview Box */}
              <div className="relative h-16 rounded-xl border border-stone-800 bg-stone-950 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Project preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={18} className="text-stone-700" />
                )}
              </div>
            </div>
            {file && (
              <p className="text-[0.65rem] text-stone-500 italic mt-1">
                Selected: <span className="text-stone-300">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 px-4 py-3 text-xs font-semibold tracking-wider uppercase text-stone-400 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-accent flex-1 rounded-xl px-4 py-3 text-xs font-semibold tracking-wider uppercase shadow-lg shadow-accent/10 hover:shadow-accent/20 disabled:opacity-50"
          >
            {loading ? 'Processing…' : isEdit ? 'Save Changes' : 'Publish Project'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};
