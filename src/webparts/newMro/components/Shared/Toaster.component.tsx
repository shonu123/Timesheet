import * as React from 'react';
import toast from 'react-hot-toast';
import { faL, faClose,faCheck, faWarning} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToasterTypes } from '../../Constants/Constants';

var customIcon;
const customToaster=(customClassName,toasterType,message,toasterDuration) =>{
    if([undefined,"",null].includes(toasterDuration)){
        toasterDuration = 4000
    }
    customIcon = toasterType==ToasterTypes.Success?<span className='toster-fa-icon toster-fa-plus'><FontAwesomeIcon icon={faCheck}></FontAwesomeIcon></span>:toasterType==ToasterTypes.Warning?<span className='toster-fa-icon toster-fa-warning'><FontAwesomeIcon icon={faWarning}></FontAwesomeIcon></span>:<span className='toster-fa-icon toster-fa-close'><FontAwesomeIcon icon={faClose}></FontAwesomeIcon></span>
    toasterDuration = parseInt(toasterDuration)

return(
    toast(<div className="toster-message">{message}</div>, {
        duration: toasterDuration,
        position: 'top-center',
        className: customClassName,
        // Styling
        style: {display: 'inline-block'},      
        // Custom Icon
        icon: customIcon,
    })
)
}
export default customToaster