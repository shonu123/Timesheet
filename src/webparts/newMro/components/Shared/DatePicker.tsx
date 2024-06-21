import * as React from 'react';
import { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { SPHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import { Web } from '@pnp/sp/webs';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { addDays } from 'office-ui-fabric-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt} from '@fortawesome/free-solid-svg-icons';


interface DatePickerProps {
  handleChange: (e: any) => void;
  selectedDate: Date;
  className: string;
  labelName: string;
  isDisabled: boolean;
  ref: any;
  Day: string;
  isDateRange?: boolean
}

//   const [selectedDate,setDate] = React.useState(new Date())
//   console.log(selectedDate);
//   const handleChange = date => {
//      setDate(date)
//   };

const filterDays = (date, Day: any) => {
  let currentDate = new Date(date)
  let enableDay = DayCode(Day)
  return currentDate.getDay() === enableDay;
}

const DayCode = (Day) => {
  let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(Day)
}
const getStartDate = (date) => {
  if (new Date(date).getDay() === 1) {
    return new Date(date)
  }
  else {
    let Currentdate = new Date(date)
    while (Currentdate.getDay() !== 1) {
      Currentdate.setDate(Currentdate.getDate() - 1)
    }
    return new Date(Currentdate);
  }
}

const CustomDatePicker = ({ handleChange, selectedDate, className, labelName, isDisabled, ref, Day, isDateRange = true }: DatePickerProps) => {

  return (
      <>
      <label className='z-in-9'>{labelName}<span className="mandatoryhastrick">*</span></label><div className="date-picker-container">
      {/*<FontAwesomeIcon icon={faCalendarAlt} className="calendar-icon-custom" />*/}
      {isDateRange ?
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          minDate={addDays(getStartDate(new Date()), -30)}
          maxDate={new Date()}
          filterDate={date => filterDays(date, Day)}
          className={className + " " + (selectedDate == null ? "mandatory-FormContent-focus" : "")}
          disabled={isDisabled}
          ref={ref}
          required={true}
          name={labelName}
          title={labelName}
          id={className}
          placeholderText={"MM/DD/YYYY"}
          showIcon
          toggleCalendarOnIconClick
        /> :
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          // minDate={addDays(getStartDate(new Date()), -30)}
          maxDate={new Date()}
          filterDate={date => filterDays(date, Day)}
          className={className + " " + (selectedDate == null ? "mandatory-FormContent-focus" : "")}
          disabled={isDisabled}
          ref={ref}
          required={true}
          name={labelName}
          titleText={labelName}
          id={className}
          placeholderText={"MM/DD/YYYY"}
          showIcon
          toggleCalendarOnIconClick
          />} 
    </div>
    </>
  );
}
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default CustomDatePicker
