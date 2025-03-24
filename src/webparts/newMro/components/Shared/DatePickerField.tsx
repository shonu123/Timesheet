import React, { useState } from "react";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt} from '@fortawesome/free-solid-svg-icons';
//import 'bootstrap/dist/css/bootstrap.min.css';
const DatePickercontrol = (props,ref) => {
    var [selectedDay,setDate] = useState(null);
    let selectedDate = props.selectedDate!=null?props.selectedDate:null;
    let EndDate = ![null,undefined,''].includes(props.endDate)?props.endDate:null;
    let StartDate = ![null,undefined,''].includes(props.startDate)?props.startDate:null;
    let selDate=null,reference = ref,id = props.id,title = props.title,customDate,minDate= props.minDate,maxDate= props.maxDate
    if([null,undefined,""].includes(props.customDate))
      customDate = false
      else
      customDate = props.customDate
    
    if(selectedDate !=null)
    {
    //   let month =selectedDate.getMonth()+1;
    //   let day =selectedDate.getDate();
    //   let year =selectedDate.getFullYear();
    //   if(month<10)month ="0"+month;
    //   else
    //   month =month;
    //  if(day<10)
    //   day ="0"+day;
    //   selDate =month+"/"+day+"/"+year;
      selectedDay=selectedDate;
    }
    else{
      selectedDay="";
    }

    // if(props.isDisabled){
    //   setTimeout(() => {
    //     var DatePickers = document.getElementsByClassName("DatePicker");
    //     for (var i = 0; i < DatePickers.length; i++) { 
    //         (DatePickers[i] as HTMLInputElement).disabled  = true;
    //     }
    //   }, 1000);
    // }else{
    //   setTimeout(() => {
    //     var DatePickers = document.getElementsByClassName("DatePicker");
    //     for (var i = 0; i < DatePickers.length; i++) { 
    //         (DatePickers[i] as HTMLInputElement).disabled  = false;
    //     }
    //   }, 1000);
    // }
    //var selDate =selectedDate!= null?(selectedDate.getMonth()+1) +"/"+selectedDate.getDate() +"/"+ selectedDate.getFullYear():null;
   // const formatInputValue = () => {
     // if(selectedDate!=null)
       // var selectedate = (selectedDate.getMonth()+1) +"/"+selectedDate.getDate() +"/"+ selectedDate.getFullYear();
       // return selectedate;
   // };
//    const customDayClassName = (date) => {
//     return "custom-day";
// };
// const customDayRender = (day, date) => {
//   const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
//   const className = `react-datepicker__day${isDisabled ? ' react-datepicker__day--disabled' : ''}`;
//   return (
//       <div className={className} tabIndex={0} aria-label={`Choose ${date.toDateString()}`} role="option" aria-disabled={isDisabled} aria-selected={false}>
//           {day}
//       </div>
//   );
// };

    function handlechangeevent(seldate){
     // let selDate =e._d;
     //var datearry =seldate.split('/');
      //let selectedDatestring = datearry[2]+"-"+datearry[0]+"-"+datearry[1]+"T00:00:00";
      setDate(seldate);
      //let selDatestring = new Date(seldate);
      props.onDatechange([seldate,props.id]);  
    }
    return (
    //   <span>abc</span>
    //   <DatePicker
    //   timePicker={false}
    //   inputReadOnly={true}
    //   value={selectedDate}
    //   onChange={handlechangeevent}
    //   className="form-control"
    //   format='M/D/YYYY'
      
    // />
    customDate?<div className="date-picker-container">
    {/* <FontAwesomeIcon icon={faCalendarAlt} className="calendar-icon" /> */}
    <DatePicker 
    selected={selectedDay } 
    dateFormat={'MM/dd/yyyy'} 
          showBorder ={true}       
          onChange={handlechangeevent}
          placeholderText={'MM/DD/YYYY'}
          className="form-control DatePicker"//{props.isDisabled ? "form-control DatePicker c-input-readonly" : "form-control DatePicker"}//"form-control DatePicker" // custom class
        //  ref={reference}
         disabled={props.isDisabled}
         id={id}
         titleText={title}
         showIcon
         minDate = {[null,undefined,''].includes(minDate)?undefined:minDate}
        //  maxDate = {maxDate}
         toggleCalendarOnIconClick
        //  dayClassName={customDayClassName}
        //  renderDayContents={customDayRender}
        />
        </div>:
    <div className="date-picker-container">
    {/* <FontAwesomeIcon icon={faCalendarAlt} className="calendar-icon" /> */}
    <DatePicker 
    selected={selectedDay } 
    dateFormat={'MM/dd/yyyy'} 
          showBorder ={true}       
          onChange={handlechangeevent}
          placeholderText={'MM/DD/YYYY'}
          className="form-control DatePicker"//{props.isDisabled ? "form-control DatePicker c-input-readonly" : "form-control DatePicker"}//"form-control DatePicker" // custom class
        //  ref={reference}
         disabled={props.isDisabled}
         id={id}
         titleText={title}
         showIcon
         toggleCalendarOnIconClick
         minDate={[null,undefined,''].includes(StartDate)?undefined:StartDate}
         maxDate = {[null,undefined,''].includes(EndDate)?undefined:EndDate}
        //  dayClassName={customDayClassName}
        //  renderDayContents={customDayRender}
        />
        </div>


     );
  };

  // export default React.forwardRef(DatePickercontrol);
  export default DatePickercontrol;