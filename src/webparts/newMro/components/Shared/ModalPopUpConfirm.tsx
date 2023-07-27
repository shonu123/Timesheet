import * as React from 'react';

interface modalProps {
  message : string;
  title : string;
  isVisible: boolean;
  isSuccess : boolean;
  onConfirm : () => void;
  onCancel : () => void;
}

const ModalPopUpConfirm =({ message,title,isVisible,isSuccess, onConfirm, onCancel } : modalProps) => {
    return isVisible ? (
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
    ):null;
  };

export default ModalPopUpConfirm;