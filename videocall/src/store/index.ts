import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { mediaSoupApi } from './api/mediaSoupApi';

export const store = configureStore({
  reducer: {
    // Pure RTK Query API only
    [mediaSoupApi.reducerPath]: mediaSoupApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Completely disable serializable check for MediaSoup objects
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          'mediaSoupApi/executeQuery/pending',
          'mediaSoupApi/executeQuery/fulfilled',
          'mediaSoupApi/executeQuery/rejected',
        ],
        ignoredActionsPaths: [
          'payload',
          'meta.arg',
          'meta.baseQueryMeta',
          'meta.fulfilledTimeStamp',
          'meta.requestId',
        ],
        ignoredPaths: [
          `${mediaSoupApi.reducerPath}`,
        ],
        // Disable for all MediaSoup related data
        warnAfter: 128,
      },
      // Disable immutability check for MediaSoup objects as well
      immutableCheck: {
        ignoredPaths: [`${mediaSoupApi.reducerPath}`],
        warnAfter: 128,
      },
    }).concat(mediaSoupApi.middleware),
});

// Setup RTK Query listeners for automatic refetching and cache management
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks - simplified for RTK Query only
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;