import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/auth';

export const register = (data) => axios.post(`${BASE_URL}/register`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const login = (data) => axios.post(`${BASE_URL}/login`, data);
export const updateProfile = (data) => axios.put(`${BASE_URL}/me`, data);
export const updatePreferences = (preferences) => axios.put(`${BASE_URL}/preferences`, { preferences });
export const deleteAccount = () => axios.delete(`${BASE_URL}/me`);
