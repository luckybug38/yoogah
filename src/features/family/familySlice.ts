import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../users/currentUserSlice";

    export interface Child {
        id: string;
        displayName: string;
        gender: string;
        birthday: string;
        imageUrl?: string | null;
    }

    export interface Family {
        children?: Child[];
        mom?: User | null;
        dad?: User | null;
    }

export interface FamilyState {
    family: Family;
}

const initialState: FamilyState = {
    family: {}
}

export const familySlice = createSlice({
    name: 'family',
    initialState,
    reducers: {
        setFamily: (state, action: PayloadAction<Family>) => {
            state.family = action.payload;
        },
        updateFamily: (state, action: PayloadAction<Family>) => {
            state.family.children = action.payload.children;
            state.family.mom = action.payload.mom;
            state.family.dad = action.payload.dad;
        },
        clearFamily: (state) => {
            state.family = {};
        },
        addChild: (state, action: PayloadAction<Child>) => {
            state.family.children = state.family.children ? [...state.family.children, action.payload] : [action.payload];
        },
        editChild: (state, action: PayloadAction<Child>) => {
            if (state.family.children) {
                const index = state.family.children.findIndex(child => child.id === action.payload.id);
                if (index !== -1) {
                    state.family.children[index] = action.payload;
                }
            }
        },
        removeChild: (state, action: PayloadAction<string>) => {
            if (state.family.children) {
                state.family.children = state.family.children.filter(child => child.id !== action.payload);
            }
        }
    }   
});

export const { setFamily, updateFamily, clearFamily, addChild, editChild, removeChild } = familySlice.actions;

export default familySlice.reducer;