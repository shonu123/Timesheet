import React, { useState } from "react";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
//import 'bootstrap/dist/css/bootstrap.min.css';
const DatePickercontrol = (props,ref) => {
    var [selectedDay,setDate] = useState(null);
    let selectedDate = props.selectedDate!=null?props.selectedDate:null;
    let selDate=null;
    let reference = ref
    let id = props.id
    let title = props.title
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

    if(props.isDisabled){
      setTimeout(() => {
        var DatePickers = document.getElementsByClassName("DatePicker");
        for (var i = 0; i < DatePickers.length; i++) { 
            (DatePickers[i] as HTMLInputElement).disabled  = true;
        }
      }, 1000);
    }else{
      setTimeout(() => {
        var DatePickers = document.getElementsByClassName("DatePicker");
        for (var i = 0; i < DatePickers.length; i++) { 
            (DatePickers[i] as HTMLInputElement).disabled  = false;
        }
      }, 1000);
    }
    //var selDate =selectedDate!= null?(selectedDate.getMonth()+1) +"/"+selectedDate.getDate() +"/"+ selectedDate.getFullYear():null;
   // const formatInputValue = () => {
     // if(selectedDate!=null)
       // var selectedate = (selectedDate.getMonth()+1) +"/"+selectedDate.getDate() +"/"+ selectedDate.getFullYear();
       // return selectedate;
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
    <DatePicker 
    selected={selectedDay } 
    dateFormat={'MM/dd/yyyy'} 
          showBorder ={true}       
          onChange={handlechangeevent}
          placeholder={'MM/DD/YYYY '}
          className="form-control DatePicker"//{props.isDisabled ? "form-control DatePicker c-input-readonly" : "form-control DatePicker"}//"form-control DatePicker" // custom class
        //  ref={reference}
         disabled={props.isDisabled}
         id={id}
         title={title}
        />
     );
  };

  // export default React.forwardRef(DatePickercontrol);
  export default DatePickercontrol