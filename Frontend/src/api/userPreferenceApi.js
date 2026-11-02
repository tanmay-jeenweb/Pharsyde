/**
 * User table preferences (column order and visibility) persistence
 */
export const getTablePreference = async (tableId) => {
  try {
    const saved = localStorage.getItem(`table_pref_${tableId}`);
    if (saved) {
      return { data: { success: true, data: JSON.parse(saved) } };
    }
  } catch (err) {
    console.warn('Error reading table preference:', err);
  }
  return { data: { success: false, data: null } };
};

export const saveTablePreference = async (tableId, columnOrder) => {
  try {
    localStorage.setItem(`table_pref_${tableId}`, JSON.stringify(columnOrder));
    return { data: { success: true } };
  } catch (err) {
    console.warn('Error saving table preference:', err);
    return { data: { success: false } };
  }
};

