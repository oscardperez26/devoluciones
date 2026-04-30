import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { useWizardStore } from '@/store/wizard.store';

const envApiUrl = import.meta.env.VITE_API_URL?.trim() ?? '';
const normalizedEnvApiUrl = envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
const API_BASE_URL = normalizedEnvApiUrl ? `${normalizedEnvApiUrl}/api/v1` : '/api/v1';

export const wizardClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
export const adminClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

wizardClient.interceptors.request.use((config) => {
  const token = useWizardStore.getState().sessionToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function addEnvelopeInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (res) => {
      if (res.data && typeof res.data === 'object' && 'data' in res.data) {
        res.data = res.data.data;
      }
      return res;
    },
    (error) => Promise.reject(error as Error),
  );
}

addEnvelopeInterceptor(wizardClient);
addEnvelopeInterceptor(adminClient);
