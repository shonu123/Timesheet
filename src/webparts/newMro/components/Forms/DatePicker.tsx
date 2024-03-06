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
  }

//   const [selectedDate,setDate] = React.useState(new Date())
//   console.log(selectedDate);
//   const handleChange = date => {
//      setDate(date)
//   };

  const filterDays = (date) => {
   let currentDate = new Date(date)
   return   currentDate.getDay() === 1;
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

  const CustomDatePicker =({ handleChange,selectedDate,className,labelName,isDisabled } : DatePickerProps) => {
    return  (

            <div className="App">
                   <label className='z-in-9'>{labelName}</label>
                   <DatePicker
                    selected = {selectedDate}
                    onChange={handleChange}
                    minDate={addDays(getStartDate(new Date()),-14)}
                    maxDate={new Date()}
                    filterDate = {filterDays}
                    className = {className}
                    disabled = {isDisabled}
              />
            </div>
          );
    
  }

  export default CustomDatePicker
