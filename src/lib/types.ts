// src/lib/types.ts

import Dexie from 'dexie';
export interface Note {
    id?: number;
    title: string;
    content: string;
    createdAt: Date;
  }
  
  export interface MyAppDatabase {
    notes: Dexie.Table<Note, number>;  // Table<Model, PrimaryKeyType>
  }
  
  // Extend Dexie with our types
  declare module 'dexie' {
    interface Dexie {
      notes: Dexie.Table<Note, number>;
    }
  }