import { addDays } from 'office-ui-fabric-react';
import React,{ useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'

function App(joinDate) {

  // const [joiningDate,setJoiningDate] = useState(null)
  // const [mondayDate,setMondayDate] = useState(null)

  // const assignMondayOfjoiningDate=(joinDate)=>{
  //   let date = new Date(joinDate)
  // let dateFormate =`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  //   setJoiningDate({ dateFormate})
  //   console.log(joiningDate)

  //   while(new Date(date).getDay()!=1)
  //   {
  //     date.setDate(date.getDate()-1)
  //   }
  //    dateFormate =`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  // setMondayDate({dateFormate});
  // }

  // assignMondayOfjoiningDate(joinDate);
     const [selectedDate,setDate] = useState(new Date())
     console.log(selectedDate);
     const  state = {
        startDate: new Date(),
        mindate : new Date().setDate(new Date().getDate() - 14)
      };
     const handleChange = date => {
        setDate(date)
     };

     const filterDays = (date) => {
      let currentDate = new Date(date)
      // let formateDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`
      // if(formateDate == '2/29/2024'){
      //   return new Date(formateDate)
      // }
      // else if(formateDate == '2/26/2024'){
      //   return false;
      // }
      return   currentDate.getDay() === 1;
    }

    const getMonday = (date)=>{


    }

     const getStartDate =(date) =>{
      if(new Date(date).getDay() === 1){
        return new Date(date)
      }
      else{
        let Currentdate = new Date(date)
        while(Currentdate.getDay()!==1){
          Currentdate.setDate(new Date().getDate() - 1)
        }
        return new Date(Currentdate);
      }
     }

     return (
       <div className="App">
              <label htmlFor="current-date"> Current Date</label>
              <DatePicker
            selected = {selectedDate}
           onChange={handleChange}
          //  minDate={new Date().setDate(new Date().getDate() - 14)}
          minDate={addDays(getStartDate(new Date()),-14)}
           maxDate={new Date()}
           filterDate = {filterDays}
          //  excludeDays = {[new Date().setDate(new Date().getDate()-4)]}
         />
       </div>
     );
   }
   
   export default App;