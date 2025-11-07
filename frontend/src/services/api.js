import axios from 'axios';
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:6000/api' });
export default API;

export function authHeader(token){
  return { headers: { Authorization: `Bearer ${token}` } };
}
