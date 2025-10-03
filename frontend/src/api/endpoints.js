import api from './axios';

// Columns API
export const columnsApi = {
  // Get all columns with options
  getColumns: () => api.get('/columns'),
  
  // Create new column
  createColumn: (data) => api.post('/columns', data),
  
  // Delete column
  deleteColumn: (id) => api.delete(`/columns/${id}`),
};

// Rows API
export const rowsApi = {
  // Get rows with pagination
  getRows: (page = 1, limit = 10) => api.get(`/rows?page=${page}&limit=${limit}`),
  
  // Create new row
  createRow: () => api.post('/rows'),
  
  // Delete row
  deleteRow: (id) => api.delete(`/rows/${id}`),
};

// Cell API
export const cellApi = {
  // Update cell value
  updateCell: (data) => api.patch('/cell', data),
};

// Summary API
export const summaryApi = {
  // Get column summaries
  getSummary: () => api.get('/summary'),
};
