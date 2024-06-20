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
    <div className="App">
      <label className='z-in-9'>{labelName}<span className="mandatoryhastrick">*</span></label>
      <div className="date-picker-container">
                   <FontAwesomeIcon icon={faCalendarAlt} className="calendar-icon" />
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
          placeholder={"MM/DD/YYYY"}
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
          title={labelName}
          id={className}
          placeholder={"MM/DD/YYYY"}
        />
      }
      </div>
    </div>
  );

}

export default CustomDatePicker
