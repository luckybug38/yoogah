import { configureStore } from '@reduxjs/toolkit';
import currentUserReducer from '../features/users/currentUserSlice';
import familyReducer from '../features/family/familySlice';
export const store = configureStore({
    reducer: {
        currentUser: currentUserReducer,
        family: familyReducer
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch