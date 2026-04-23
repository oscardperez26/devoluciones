import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { useWizardStore } from '@/store/wizard.store';

export const wizardClient = axios.create({ baseURL: '/api/v1' });
export const adminClient = axios.create({ baseURL: '/api/v1' });

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
