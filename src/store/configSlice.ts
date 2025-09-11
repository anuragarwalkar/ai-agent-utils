import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type AIConfig, DEFAULT_CONFIG } from '@/config';

interface ConfigState {
  config: AIConfig;
  isLoading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  config: DEFAULT_CONFIG,
  isLoading: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<AIConfig>) => {
      state.config = action.payload;
      state.error = null;
    },
    updateConfig: (state, action: PayloadAction<Partial<AIConfig>>) => {
      state.config = { ...state.config, ...action.payload };
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setConfig, updateConfig, setLoading, setError, clearError } = configSlice.actions;
export default configSlice.reducer;
