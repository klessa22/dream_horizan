// Mock Firebase authentication and Firestore database using localStorage

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
}

// Current user state
let currentUser: User | null = (() => {
  try {
    const stored = localStorage.getItem('dreamhorizon_admin_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

export const auth = {
  get currentUser() {
    return currentUser;
  }
};

type AuthCallback = (user: User | null) => void;
const authListeners = new Set<AuthCallback>();

export const onAuthStateChanged = (authObj: typeof auth, callback: AuthCallback) => {
  authListeners.add(callback);
  callback(currentUser);
  return () => {
    authListeners.delete(callback);
  };
};

const notifyAuthListeners = () => {
  currentUser = (() => {
    try {
      const stored = localStorage.getItem('dreamhorizon_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();
  authListeners.forEach(cb => cb(currentUser));
};

export const loginWithEmail = async (email: string, password: string) => {
  // Simulating small network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  if (email === 'admin@gmail.com' && password === 'admin') {
    const user: User = {
      uid: 'admin-user-id',
      email: 'admin@gmail.com',
      emailVerified: true
    };
    localStorage.setItem('dreamhorizon_admin_user', JSON.stringify(user));
    notifyAuthListeners();
  } else {
    throw new Error('Invalid email or password');
  }
};

export const signOut = async (_authObj?: any) => {
  localStorage.removeItem('dreamhorizon_admin_user');
  notifyAuthListeners();
};

export const loginWithGoogle = async () => {
  alert('Google Login is not supported in offline local mode.');
};

// Projects management
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  client?: string;
  year?: string;
  imageUrl: string;
  createdAt: number;
}

const defaultProjects: Project[] = [
  { id: '1', category: 'Residential', title: 'Mountain View Villa', description: 'A stunning modern villa nestled in the mountains, featuring floor-to-ceiling glass walls that frame panoramic mountain views. The design merges contemporary architecture with natural stone elements.', imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', client: 'Private', year: '2024', createdAt: Date.now() - 600000 },
  { id: '2', category: 'Commercial', title: 'Tech Hub Pavilion', description: 'Innovative workspace designed for the future of tech. Open-plan offices meet collaborative pods, all wrapped in a sustainable timber-and-glass facade.', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', client: 'TechStart Inc.', year: '2024', createdAt: Date.now() - 500000 },
  { id: '3', category: 'Residential', title: 'Urban Minimal Estate', description: 'Clean lines and open spaces in the heart of the city. A minimalist approach that maximizes natural light and creates a serene retreat from the urban bustle.', imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', client: 'Private', year: '2023', createdAt: Date.now() - 400000 },
  { id: '4', category: 'Public', title: 'City Library', description: 'A beacon of knowledge and modern public infrastructure. Dynamic reading spaces, natural ventilation, and a striking spiral staircase define this cultural landmark.', imageUrl: 'https://images.unsplash.com/photo-1541123356219-284ebe98ae3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', client: 'Municipal Corp.', year: '2023', createdAt: Date.now() - 300000 },
  { id: '5', category: 'Hospitality', title: 'Seaside Resort', description: 'Luxury and relaxation meeting the ocean breeze. Private villas with infinity pools, open-air dining pavilions, and lush tropical landscaping.', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', client: 'Oceanic Hotels', year: '2024', createdAt: Date.now() - 200000 },
  { id: '6', category: 'Commercial', title: 'Financial Tower', description: 'An iconic skyscraper defining the city skyline. A double-skin glass facade, sky gardens on every fifth floor, and a dramatic crown that lights up the nightscape.', imageUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', client: 'Apex Capital', year: '2023', createdAt: Date.now() - 100000 }
];

export const getLocalProjects = (): Project[] => {
  const stored = localStorage.getItem('dreamhorizon_projects');
  if (!stored) {
    localStorage.setItem('dreamhorizon_projects', JSON.stringify(defaultProjects));
    return defaultProjects;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultProjects;
  }
};

const saveLocalProjects = (projects: Project[]) => {
  localStorage.setItem('dreamhorizon_projects', JSON.stringify(projects));
};

type ProjectCallback = (projects: Project[]) => void;
const projectListeners = new Set<ProjectCallback>();

export const subscribeProjects = (callback: ProjectCallback) => {
  projectListeners.add(callback);
  callback(getLocalProjects());
  return () => {
    projectListeners.delete(callback);
  };
};

const notifyProjectListeners = () => {
  const projects = getLocalProjects();
  projectListeners.forEach(cb => cb(projects));
};

// Compress image before saving to fit within localStorage quota (5MB)
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
  });
};

// Convert image File to base64 DataURL with compression to prevent QuotaExceededError
const fileToDataUrl = (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    return compressImage(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const createProject = async (
  project: Omit<Project, 'id' | 'imageUrl' | 'createdAt'>,
  file: File
) => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulating network
  const imageUrl = await fileToDataUrl(file);
  const projects = getLocalProjects();
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
    imageUrl,
    createdAt: Date.now()
  };
  projects.unshift(newProject);
  saveLocalProjects(projects);
  notifyProjectListeners();
};

export const updateProject = async (
  id: string,
  updates: Partial<Omit<Project, 'id' | 'imageUrl' | 'createdAt'>>,
  newFile?: File
) => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulating network
  const projects = getLocalProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Project not found');

  let imageUrl = projects[idx].imageUrl;
  if (newFile) {
    imageUrl = await fileToDataUrl(newFile);
  }

  projects[idx] = {
    ...projects[idx],
    ...updates,
    imageUrl
  };
  saveLocalProjects(projects);
  notifyProjectListeners();
};

export const deleteProject = async (id: string) => {
  const projects = getLocalProjects();
  const filtered = projects.filter(p => p.id !== id);
  saveLocalProjects(filtered);
  notifyProjectListeners();
};
