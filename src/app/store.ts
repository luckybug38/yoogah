import { configureStore } from '@reduxjs/toolkit';
import currentUserReducer from '../features/users/currentUserSlice';

export const store = configureStore({
    reducer: {
        currentUser: currentUserReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch