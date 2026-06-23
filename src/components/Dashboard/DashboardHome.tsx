import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Home, 
  LogOut, 
  Search, 
  Briefcase, 
  Layers, 
  Grid, 
  FileText 
} from 'lucide-react';
import { deleteProject, subscribeProjects, signOut, getLocalProjects } from '../../lib/firebase';
import { ProjectForm } from './ProjectForm';

export const DashboardHome = () => {
  const [projects, setProjects] = useState<any[]>(() => getLocalProjects());
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const unsub = subscribeProjects(setProjects);
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  
  const openEdit = (project: any) => {
    setEditing(project);
    setShowForm(true);
  };
  
  const closeForm = () => setShowForm(false);

  // Statistics calculation
  const totalProjects = projects.length;
  const residentialCount = projects.filter(p => p.category === 'Residential').length;
  const commercialCount = projects.filter(p => p.category === 'Commercial').length;
  const hospitalityCount = projects.filter(p => p.category === 'Hospitality').length;
  const publicCount = projects.filter(p => p.category === 'Public').length;

  const categories = ['All', 'Residential', 'Commercial', 'Public', 'Hospitality'];

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="min-h-screen bg-stone-950 text-stone-100 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Block */}
        <header className="bg-stone-900/50 backdrop-blur-md border border-stone-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] animate-pulse" />
              <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Portfolio Admin</h2>
            </div>
            <p className="text-xs text-stone-400 font-medium">
              Authorized session: <span className="text-[#f97316]">admin@gmail.com</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-stone-300 hover:text-white hover:bg-stone-800 hover:border-stone-700 transition-all duration-300"
            >
              <Home size={15} /> View Site
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-[#f97316] px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#e6620f] shadow-lg shadow-[#f97316]/10 hover:shadow-[#f97316]/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Plus size={15} /> Add Project
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-stone-900 border border-stone-800 px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-stone-400 hover:text-white hover:bg-stone-800 hover:border-stone-700 transition-all duration-300"
            >
              <LogOut size={15} /> Log Out
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-stone-900/40 border border-stone-800/60 rounded-2xl p-5 space-y-3 hover:border-stone-800 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[0.65rem] font-bold tracking-[0.2em] text-stone-500 uppercase">Total Works</span>
              <div className="p-2 rounded-lg bg-[#f97316]/10 text-[#f97316]"><Grid size={15} /></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-serif font-bold text-white">{totalProjects}</h3>
              <p className="text-[0.7rem] text-stone-500">Live website showcases</p>
            </div>
          </div>
          
          <div className="bg-stone-900/40 border border-stone-800/60 rounded-2xl p-5 space-y-3 hover:border-stone-800 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[0.65rem] font-bold tracking-[0.2em] text-stone-500 uppercase">Residential</span>
              <div className="p-2 rounded-lg bg-[#f97316]/10 text-[#f97316]"><Briefcase size={15} /></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-serif font-bold text-white">{residentialCount}</h3>
              <p className="text-[0.7rem] text-stone-500">Private luxury estates</p>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-stone-800/60 rounded-2xl p-5 space-y-3 hover:border-stone-800 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[0.65rem] font-bold tracking-[0.2em] text-stone-500 uppercase">Commercial</span>
              <div className="p-2 rounded-lg bg-[#f97316]/10 text-[#f97316]"><Layers size={15} /></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-serif font-bold text-white">{commercialCount}</h3>
              <p className="text-[0.7rem] text-stone-500">Corporate & retail offices</p>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-stone-800/60 rounded-2xl p-5 space-y-3 hover:border-stone-800 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[0.65rem] font-bold tracking-[0.2em] text-stone-500 uppercase">Other Sectors</span>
              <div className="p-2 rounded-lg bg-[#f97316]/10 text-[#f97316]"><FileText size={15} /></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-serif font-bold text-white">{hospitalityCount + publicCount}</h3>
              <p className="text-[0.7rem] text-stone-500">Hospitality & Public spaces</p>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-stone-900/25 border border-stone-800/40 rounded-2xl p-5">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[0.7rem] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-[#f97316] text-white shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-stone-500" size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search projects by name..."
              aria-label="Search projects"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-stone-900/60 border border-stone-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all duration-300"
            />
          </div>
        </div>

        {/* Project Grid */}
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group relative rounded-2xl overflow-hidden bg-stone-900/50 border border-stone-800/80 hover:border-stone-700/80 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-stone-950">
                    <img 
                      src={p.imageUrl || p.image} 
                      alt={p.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <span className="absolute top-3 left-3 text-[0.6rem] font-bold tracking-widest uppercase bg-stone-900/90 backdrop-blur px-2.5 py-1 rounded text-stone-300 border border-stone-800">
                      {p.category}
                    </span>
                  </div>
                  
                  <div className="p-5 space-y-2">
                    <h3 className="font-serif text-lg font-bold text-white leading-snug group-hover:text-[#f97316] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">
                      {p.description || "No description provided."}
                    </p>
                    { (p.client || p.year) && (
                      <div className="flex gap-4 pt-2 border-t border-stone-800/50 text-[0.65rem] text-stone-500">
                        {p.client && <span>Client: <strong className="text-stone-400">{p.client}</strong></span>}
                        {p.year && <span>Year: <strong className="text-stone-400">{p.year}</strong></span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-800 hover:border-stone-700 px-3 py-2 text-xs font-semibold text-stone-300 hover:text-white transition-all duration-200"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project?')) {
                        deleteProject(p.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-950/20 bg-red-950/20 hover:bg-red-900/35 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-20 bg-stone-900/20 border border-dashed border-stone-800 rounded-2xl space-y-3">
            <p className="text-stone-500 text-sm">No projects match your query.</p>
            <button
              onClick={openCreate}
              className="text-[#f97316] text-xs font-bold hover:underline tracking-wider uppercase"
            >
              Add first project
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ProjectForm
            initialData={editing}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
