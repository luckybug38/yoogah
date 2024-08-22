import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
    id?: string;
    email?: string;
    name?: string;
    username?: string;
    photoURL?: string;
    description?: string;
    currentCompany?: string;
    title?: string;
    likedPosts?: { [key: string]: boolean };
}

export interface CurrentUserState {
    user: User;
}

const initialState: CurrentUserState = {
    user: {}
}

export const currentUserSlice = createSlice({
    name: 'currentUser',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },
        toggleLikedPost: (state, action: PayloadAction<User>) => {
            state.user.likedPosts = action.payload.likedPosts;
        },
        updateProfile: (state, action: PayloadAction<User>) => {
            state.user.currentCompany = action.payload.currentCompany;
            state.user.description = action.payload.description;
            state.user.name = action.payload.name;
            state.user.username = action.payload.username;
            state.user.title = action.payload.title;
        },
        clearUserData: (state) => {
            state.user = {};
        }
    }
})

export const { setUser, toggleLikedPost, updateProfile, clearUserData } = currentUserSlice.actions;

export default currentUserSlice.reducer