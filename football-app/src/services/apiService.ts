import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiService = axios.create({
  baseURL: API_BASE_URL,
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiService; 