import { api } from './client';

export interface College {
  id: string;
  name: string;
  slug: string;
  approvedEmailDomains: string[];
  status: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

export const collegesApi = {
  getColleges: () => api.get<College[]>('/colleges'),
  getCollege: (id: string) => api.get<College>(`/colleges/${id}`),
};

export const categoriesApi = {
  getCategories: () => api.get<Category[]>('/categories'),
};
