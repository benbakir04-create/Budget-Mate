import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import QuickAdd from '../components/QuickAdd';

// One quick-add sheet for the whole app: the «+» in the bottom bar and the buttons on the
// home screen open it. savedCount goes up after each save so open pages can refresh.
const QuickAddContext = createContext({ openQuickAdd: () => {}, savedCount: 0 });

export const QuickAddProvider = ({ children }) => {
  const { user } = useAuth();
  // false when closed, otherwise the kind to open on: 'expense' or 'income'.
  const [open, setOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const openQuickAdd = useCallback(kind => setOpen(kind === 'income' ? 'income' : 'expense'), []);
  const close = useCallback(() => setOpen(false), []);
  const onSaved = useCallback(() => setSavedCount(n => n + 1), []);
  const value = useMemo(() => ({ openQuickAdd, savedCount }), [openQuickAdd, savedCount]);

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAdd
        open={!!open && !!user}
        initialKind={open || 'expense'}
        onClose={close}
        onSaved={onSaved}
        user={user}
      />
    </QuickAddContext.Provider>
  );
};

export const useQuickAdd = () => useContext(QuickAddContext);
