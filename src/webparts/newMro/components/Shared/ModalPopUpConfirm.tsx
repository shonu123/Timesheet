import * as React from 'react';

interface modalProps {
  message : string;
  onConfirm : () => void;
  onCancel : () => void;
}
const ModalPopUpConfirm =({ message, onConfirm, onCancel } : modalProps) => {
  // render: (message, onConfirm, onCancel) => {
    return (
      // <>
      //   <h1> Replace with {message} </h1>
      //   <button onClick={onConfirm}> Yes </button>
      // </>
      <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className={`modal-header txt-white bc-dblue`}>
              <h5 className="modal-title txt-white">{message}</h5>
            </div>
            <div className="modal-body">
              <p>{`Would you like to update the item`}</p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={onConfirm} className={`btn bc-dblue txt-white modalclosesuccess bc-dblue`} data-dismiss="modal">Confirm</button>
              <button type="button" onClick={onCancel} className={`btn bc-dblue txt-white modalclosesuccess bc-dblue`} data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };
//};
// const ModalPopUp = ({ modalText, isVisible, onClose, title , isSuccess, onCancel } : modalProps) => {

//   return isVisible ? (
//     <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
//       <div className="modal-dialog modal-dialog-centered">
//         <div className="modal-content">
//           <div className={`modal-header txt-white ${isSuccess ? 'bc-dblue' : 'bc-burgundy'}`}>
//             <h5 className="modal-title txt-white">{title}</h5>
//           </div>
//           <div className="modal-body">
//             <p>{modalText}</p>
//           </div>
//           <div className="modal-footer">
//             <button type="button" onClick={onClose} className={`btn bc-dblue txt-white modalclosesuccess ${isSuccess ? 'bc-dblue':'bc-burgundy'}`} data-dismiss="modal">Confirm</button>
//             <button type="button" onClick={onCancel} className={`btn bc-dblue txt-white modalclosesuccess ${isSuccess ? 'bc-dblue':'bc-burgundy'}`} data-dismiss="modal">Cancel</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   ) : null;

// };

export default ModalPopUpConfirm;