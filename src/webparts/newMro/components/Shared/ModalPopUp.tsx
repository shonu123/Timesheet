import * as React from 'react';

interface modalProps {
  modalText : string;
  isVisible: boolean;
  onClose : () => void;
  title : string;
  isSuccess : boolean;
}

const ModalPopUp = ({ modalText, isVisible, onClose, title , isSuccess } : modalProps) => {

  return isVisible ? (
    <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className={`modal-header txt-white ${isSuccess ? 'bc-dblue' : 'bc-burgundy'}`}>
            <h5 className="modal-title txt-white">{title}</h5>
          </div>
          <div className="modal-body">
            <p>{modalText}</p>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className={`btn bc-dblue txt-white modalclosesuccess ${isSuccess ? 'bc-dblue':'bc-burgundy'}`} data-dismiss="modal">Ok</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

};

export default ModalPopUp;