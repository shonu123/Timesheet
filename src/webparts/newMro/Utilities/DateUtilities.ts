import { addDays } from 'office-ui-fabric-react';

class DateUtilities {
    public static getDateMMDDYYYY(givenDate) //for Displaying
    {
        let date=new Date(givenDate);
          return (date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "/" + (date.getDate() <= 9 ? "0" + date.getDate() : date.getDate()) + "/" + date.getFullYear();
    }
    public static getDateYYYYMMDDForSorting(givenDate) //For Sorting
    {
        let date=new Date(givenDate);
          return `${date.getFullYear()}${date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1}${date.getDate() <= 9 ? "0" + date.getDate() : date.getDate()}` ;
    }
    public static GetDateMMDDYYYYAsInList(DateTimeSting) //this function is to get MM/DD/YYYY string from entire date time string
    {
        return DateTimeSting.split('-')[1] + '/' + DateTimeSting.split('-')[2].split('T')[0] + '/' + DateTimeSting.split('-')[0];
    }
    public static getDateMMDDYYYYSeparatedWithIphen(givenDate) //for file download
    {
        let date=new Date(givenDate);
          return (date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "-" + (date.getDate() <= 9 ? "0" + date.getDate() : date.getDate()) + "-" + date.getFullYear();
    }
    public static getcurrWeekSunDay=()=>{ // to get current week sunday
                let date=new Date();
                if(new Date(date).getDay() === 0){
                  return new Date(date);
                }
                else{
                  return addDays(new Date(),7-(new Date().getDay()));
                }
    }
    //get current week start date based on clients weekstartday
    public static getCurrentWeekStartDate = (weekStartDay) => {
      let weeks = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let dayCode = weeks.indexOf(weekStartDay);
      let date = new Date();
      while (date.getDay() != dayCode) {
          date.setDate(date.getDate() - 1)
      }
      return date;
  }
 }
 export default DateUtilities;