import { create } from 'zustand';

interface StickyNote {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
}

interface StickyNotesState {
  notes: StickyNote[];
  isVisible: boolean;
  activeNoteId: string | null;
  setNotes: (notes: StickyNote[]) => void;
  addNote: (note: StickyNote) => void;
  updateNote: (id: string, content: string, position: { x: number; y: number }) => void;
  deleteNote: (id: string) => void;
  toggleVisibility: () => void;
  setActiveNote: (id: string | null) => void;
}

export const useStickyNotesStore = create<StickyNotesState>((set) => ({
  notes: [],
  isVisible: false,
  activeNoteId: null,
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (id, content, position) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, content, position } : note
      ),
    })),
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
    })),
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
  setActiveNote: (id) => set({ activeNoteId: id }),
}));
