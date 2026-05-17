import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function getPeriodInfo(date: Date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  // Start month of the 2-month period
  const startMonth = month % 2 === 0 ? month : month - 1;
  const startDate = new Date(year, startMonth, 1);
  const endDate = endOfMonth(addMonths(startDate, 1));
  
  return {
    id: `${year}-${String(startMonth + 1).padStart(2, '0')}`,
    name: `${format(startDate, 'MMM', { locale: es })} - ${format(endDate, 'MMM yyyy', { locale: es })}`,
    startDate,
    endDate
  };
}

export function getNextPeriod(currentDate: Date) {
  return addMonths(currentDate, 2);
}

export function getPrevPeriod(currentDate: Date) {
  return subMonths(currentDate, 2);
}
