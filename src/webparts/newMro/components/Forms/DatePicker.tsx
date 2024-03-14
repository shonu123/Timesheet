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
import 'react-datepicker/dist/react-datepicker.css'

interface DatePickerProps {
    handleChange : (e:any) => void;
    selectedDate : Date;
    className: string;
    labelName:string;
    isDisabled:boolean;
    ref:any;
    Day:string;
  }

//   const [selectedDate,setDate] = React.useState(new Date())
//   console.log(selectedDate);
//   const handleChange = date => {
//      setDate(date)
//   };

  const filterDays = (date,enableDay) => {
   let currentDate = new Date(date)
   let Day = DayCode(enableDay)
   return   currentDate.getDay() === Day;
 }
 
const DayCode =(Day)=>{
let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
return days.indexOf('Tuesday')
}
 const getStartDate =(date) =>{
    if(new Date(date).getDay() === 1){
      return new Date(date)
    }
    else{
      let Currentdate = new Date(date)
      while(Currentdate.getDay()!==1){
        Currentdate.setDate(Currentdate.getDate() - 1)
      }
      return new Date(Currentdate);
    }
   }

  const CustomDatePicker =({ handleChange,selectedDate,className,labelName,isDisabled,ref,Day} : DatePickerProps) => {
    return  (

            <div className="App">
                   <label className='z-in-9'>{labelName}<span className="mandatoryhastrick">*</span></label>
                   <DatePicker
                    selected = {selectedDate}
                    onChange={handleChange}
                    minDate={addDays(getStartDate(new Date()),-30)}
                    maxDate={new Date()}
                    filterDate = {filterDays}
                    className = {className+" "+(selectedDate==null?"mandatory-FormContent-focus":"")}
                    disabled = {isDisabled} 
                    ref={ref}   
                    required={true}
                    name={labelName}
                    title={labelName}
                    id={className}
                    placeholder={"MM/DD/YYYY"}
              />
            </div>
          );
    
  }

  export default CustomDatePicker
