import React, { useState } from 'react';
 
const TimeInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);
 const [lastVal,setLastValue] = useState(value)
  const charCode = (e)=>{
    const charCode = e.keyCode || e.which;
    let currentValue = inputValue;
    if(charCode==8){
        currentValue = currentValue.length==3?currentValue.split(':')[0].charAt(0):currentValue;
        setInputValue(currentValue);
    }
    else if(!((charCode>=48 && charCode<=57) || charCode ==8 || charCode == 16)){
        e.preventDefault()
    }
    else
    onChange(currentValue);
  }
  const isValid =(value) => {
    var u = !0
    , e = value.split(":").join("").split("")
    , n = /^\d{0,2}?\:?\d{0,2}$/
    , r = [];
    return n.test(value) || (u = !1),
                    e[0] && (parseInt(e[0], 10) < 0 || parseInt(e[0], 10) > 2) && (u = !1),
                    e[2] && (parseInt(e[2], 10) < 0 || parseInt(e[2], 10) > 5) && (u = !1),
                    r.indexOf(":") ? r = value.split(":") : r.push(value),
                    r[0] && r[0].length && (parseInt(r[0], 10) < 0 || parseInt(r[0], 10) > 23) && (u = !1),
                    r[1] && r[1].length && (parseInt(r[1], 10) < 0 || parseInt(r[1], 10) > 59) && (u = !1),
                    u
  }

  
  const handleInputChange = (e) => {
    let newValue = e.target.value;
 console.log(newValue + " " + isValid(newValue))
 if(isValid(newValue)){
    if (2 === newValue.length && 3 !== lastVal.length && (newValue += ":"),
                        2 === newValue.length && 3 === lastVal.length && (newValue = newValue.slice(0, 1)),
                        newValue.length > 5)
                            return !1;
                            setLastValue(newValue),
                            setInputValue(newValue),
                        5 === newValue.length && onChange(newValue)
 }
  };
 
  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder="HH:MM"
    />
  );
};
 
export default TimeInput;