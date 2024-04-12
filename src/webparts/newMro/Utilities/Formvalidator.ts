import * as EmailValidator from 'email-validator';
import { ControlType } from '../Constants/Constants';

function validate(data){
    let status = true;
    let message ="";
    let propertieTypes={Number:ControlType.number,String:ControlType.string,MobileNumber:ControlType.mobileNumber,Email:ControlType.email,People:ControlType.people,Date:ControlType.date,compareDates:ControlType.compareDates};
    for (let key in data) {
        let value = data[key].val;
        let type =data[key].Type;
        let isrequired =data[key].required;
        if([undefined,null,'',-1].includes(value) && propertieTypes.People!=type && propertieTypes.Date!=type && isrequired)
        {
            let prpel =data[key].Focusid;
            message =data[key].Name+" cannot be blank.";
            prpel.current.focus();
            prpel.current.classList.add('mandatory-FormContent-focus');
            status = false;
            break;
        }
        //--- Commented on 4/12/2024 start
        // else if(![undefined,null,''].includes(value) && propertieTypes.People!=type && propertieTypes.Date!=type && propertieTypes.String==type && value.includes(','))
        // {
        //     let prpel =data[key].Focusid;
        //     message ="Commas(,) are not allowed in "+ data[key].Name +".";
        //     prpel.current.focus();
        //     prpel.current.classList.add('mandatory-FormContent-focus');
        //     status = false;
        //     break;
        // }
        //---End
        // else if(propertieTypes.People!=type && propertieTypes.Date!=type && value.includes(','))
        // {
        //     let prpel =data[key].Focusid;
        //     message = "Comma's(,) are not allowed in "+ data[key].Name +".";
        //     prpel.current.focus();
        //     prpel.current.classList.add('mandatory-FormContent-focus');
        //     status = false;
        //     break;
        // }
        else if((propertieTypes.People==type && isrequired) && [undefined,null,''].includes(value))
        {
            message =data[key].Name+" cannot be blank.";
            let prpIsreq =data[key].Focusid;
            document.getElementById(prpIsreq).getElementsByTagName('input')[0].focus();
            document.getElementById(prpIsreq).getElementsByTagName('input')[0].classList.add('mandatory-FormContent-focus');
            status = false;
            break;
        }
        else if((propertieTypes.Date==type && isrequired) && [undefined,null,''].includes(value))
        {
            message =data[key].Name+" cannot be blank.";
            let prpData =data[key].Focusid;
            document.getElementById(prpData).getElementsByTagName('input')[0].focus();
            document.getElementById(prpData).getElementsByTagName('input')[0].classList.add('mandatory-FormContent-focus');
            status = false;
            break;
        }
        else if(propertieTypes.MobileNumber ==type && ![undefined,null,''].includes(value)&& (!isNaN(value) || Math.floor(value) !=value))
        {
            let prpMob =data[key].Focusid;
            message =data[key].Name+" enter valid number.";
            prpMob.current.focus();
            prpMob.current.classList.add('mandatory-FormContent-focus');
            status = false;
            break;
        }
        else if(propertieTypes.Number ==type && ![undefined,null,''].includes(value)&& isNaN(value))
        {
            let prpNum =data[key].Focusid;
            message =data[key].Name+" enter valid number.";
            prpNum.current.focus();
            prpNum.current.classList.add('mandatory-FormContent-focus');
            status = false;
            break;
        }
        else if(propertieTypes.Email ==type&& !EmailValidator.validate(value) && ![undefined,null,''].includes(value))
        {
            let prpEmail =data[key].Focusid;
            message =data[key].Name+" enter valid email.";
            prpEmail.current.focus();
            prpEmail.current.classList.add('mandatory-FormContent-focus');
            status = false;
            break;
        }
        else if(propertieTypes.compareDates ==type)
        {
            let startDate = data[key].startDate;
            let EndDate = data[key].EndDate;
            if(startDate.getTime() > EndDate.getTime()){
                message =data[key].startDateName+" must be greater than "+data[key].EndDatename+".";
                let prpData =data[key].Focusid;
                document.getElementById(prpData).getElementsByTagName('input')[0].focus();
                document.getElementById(prpData).getElementsByTagName('input')[0].classList.add('mandatory-FormContent-focus');
                status = false;
                break;
            }
        }
    }
    let retunobject ={message,status};
    return retunobject;
}

function peoplePickerValidation(data){
    let status = true;
    let message ="";
    let propertieTypes={Number:ControlType.number,String:ControlType.string,MobileNumber:ControlType.mobileNumber,Email:ControlType.email,People:ControlType.people,Date:ControlType.date,compareDates:ControlType.compareDates};
    for (let key in data) {
        let value = data[key].val.results.length
        value = value>0?value:null
        let type =data[key].Type;
        let isrequired =data[key].required;

     if((propertieTypes.People==type && isrequired) && [undefined,null,''].includes(value))
    {
        message =data[key].Name+" cannot be blank.";
        let prpIsreq =data[key].Focusid;
        document.getElementById(prpIsreq).getElementsByTagName('input')[0].focus();
        document.getElementById(prpIsreq).getElementsByTagName('input')[0].classList.add('mandatory-FormContent-focus');
        status = false;
        break;
    }
}
let retunobject ={message,status};
return retunobject;
}

class formValidation {
   public static checkValidations=(formData)=>{
       let status= validate(formData); 
       return status;
     }

    public static multiplePeoplePickerValidation=(formData)=>{
        let status= peoplePickerValidation(formData); 
        return status;
      }
 }
 export default formValidation;


 //import Formvalidator from '../utilities/formvalidator';
 //let data = {   
//      //Control name 
//      //val = control value, 
//      //required is validation reuired or not ,
//      // Name : Display name 
//      // Type: Text box Type ['Number','String','MobileNumber','Email','PeoplePiker']
//      //FocusId : text ref selector 
//      //for PeoplePiker div id 
 
//      FromBudget: {val: this.state.FromBudget,required:true,Name:'From Budget',Type:'Number',Focusid:this.inputFromBudget},
//      ToBudget: {val: this.state.ToBudget,required:false,Name:'To Budget',Type:'Number',Focusid:this.inputToBudget},
//      Approval1Id: {val: this.state.Approval1Id,required:true,Name:'Approval 1',Type:'PeoplePiker',Focusid:'divApproval1'},
//      Approval2Id: {val: this.state.Approval2Id,required:false,Name:'Approval 2',Type:'PeoplePiker' ,Focusid:'divApproval1'},
//      Approval3Id: {val: this.state.Approval3Id,required:false,Name:'Approval 3',Type:'PeoplePiker',Focusid:'divApproval1'},
//      ReviewerId: {val: this.state.ReviewerId,required:false,Name:'Reviewer',Type:'PeoplePiker',Focusid:'divApproval1'},
//  };
 
//  let validate = Formvalidator.getName(data);
 
//  // Retun Like this
//  validate ={status:boolean, message:'From Date cannot be blank.'}

