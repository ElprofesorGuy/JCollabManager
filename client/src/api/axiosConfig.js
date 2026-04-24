import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Using Vite proxy
  withCredentials: true, // IMPORTANT: Allows sending and receiving HttpOnly cookies
});

export default api;
