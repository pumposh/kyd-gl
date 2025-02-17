import moment from 'moment'

export function formatDate(date: string | Date): string {
  const momentDate = moment(date)
  const today = moment().startOf('day')
  
  if (momentDate.isSame(today, 'day')) {
    return momentDate.format('h:mm A')
  }
  
  return momentDate.format('MMM D, YYYY')
}