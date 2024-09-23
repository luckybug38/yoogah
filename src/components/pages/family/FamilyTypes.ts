// src/types/FamilyTypes.ts

export interface FamilyMember {
    id: string;
    name: string;
    role: string;
    imageUrl?: string;
    partner?: FamilyMember | null;
    children: FamilyMember[];
    birthday?: string;
    gender?: string;
}
  