import * as React from 'react';
import toast from 'react-hot-toast';
import { faL, faClose, faCheck, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToasterTypes } from '../../Constants/Constants';

var customIcon;
let currentMessage = '';
let toastId = null;

const customToaster = (customClassName, toasterType, message, toasterDuration) => {
    if ([undefined, "", null].includes(toasterDuration)) {
        toasterDuration = 4000;
    }
    customIcon = toasterType === ToasterTypes.Success ? 
        <span className='toster-fa-icon toster-fa-plus'><FontAwesomeIcon icon={faCheck} /></span> : 
        toasterType === ToasterTypes.Warning ? 
        <span className='toster-fa-icon toster-fa-warning'><FontAwesomeIcon icon={faWarning} /></span> : 
        <span className='toster-fa-icon toster-fa-close'><FontAwesomeIcon icon={faClose} /></span>;

    toasterDuration = parseInt(toasterDuration);

    // Dismiss the current toast if the message is the same
    if (message === currentMessage && toastId !== null) {
            toast.dismiss(toastId);
        }
    currentMessage = message;
     toastId = toast(<div className="toster-message">{message}</div>, {
        duration: toasterDuration,
        position: 'top-center',
        className: customClassName,
        // Styling
        style: { display: 'inline-block' },
        // Custom Icon
        icon: customIcon,
    });

    //Reset currentMessage after the toaster disappears
    setTimeout(() => {
        toast.dismiss(toastId);
        currentMessage = '';
    }, toasterDuration);

};

export default customToaster;
