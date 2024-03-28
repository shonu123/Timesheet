//toast.error(isValid.message)
import * as React from 'react';
import toast from 'react-hot-toast';
import { faL, faClose,faCircleCheck, faWarning} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToasterTypes } from '../../Constants/Constants';
// interface customToasterProps {
//     customClassName:string,
//     ToasterType:string,
//     message:string
// }
var customIcon;

const customToaster=(customClassName,toasterType,message,toasterDuration) =>{
    if([undefined,"",null].includes(toasterDuration)){
        toasterDuration = 4000
    }
    // customClassName= 'toster-error'
    customIcon = toasterType==ToasterTypes.Success?<span className='toster-fa-icon toster-fa-plus'><FontAwesomeIcon icon={faCircleCheck}></FontAwesomeIcon></span>:toasterType==ToasterTypes.Warning?<span className='toster-fa-icon toster-fa-warning'><FontAwesomeIcon icon={faWarning}></FontAwesomeIcon></span>:<span className='toster-fa-icon toster-fa-close'><FontAwesomeIcon icon={faClose}></FontAwesomeIcon></span>
    toasterDuration = parseInt(toasterDuration)

return(
    toast(message, {
        duration: toasterDuration,
        position: 'top-center',
        className: customClassName,
        // Styling
        // style: {color:'#e5a05b'},      
        // Custom Icon
        icon: customIcon,
    })
)
}
export default customToaster