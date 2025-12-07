// Utility functions for transaction-related operations

export const getCategoryIcon = (categoryName: string, categories: any[]) => {
  const category = categories.find(c => c.name === categoryName);
  return category?.icon || '💰';
};

export const getCategoryColor = (categoryName: string, categories: any[]) => {
  const category = categories.find(c => c.name === categoryName);
  return category?.color || '#6b7280';
};

export const formatDate = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${day} ${dayName} ${month.toString().padStart(2, '0')}.${year}`;
};

export const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Month/Year utilities
export const getMonthYear = (date: Date): { month: number; year: number } => {
  return {
    month: date.getMonth(),
    year: date.getFullYear()
  };
};

export const getMonthYearString = (month: number, year: number): string => {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const isTransactionInMonth = (transactionDate: string, month: number, year: number): boolean => {
  const date = new Date(transactionDate);
  return date.getMonth() === month && date.getFullYear() === year;
};

export const isTransactionBeforeMonth = (transactionDate: string, month: number, year: number): boolean => {
  const date = new Date(transactionDate);
  const transactionYear = date.getFullYear();
  const transactionMonth = date.getMonth();
  
  if (transactionYear < year) return true;
  if (transactionYear === year && transactionMonth < month) return true;
  return false;
};

export const formatMonthYear = (month: number, year: number): string => {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};