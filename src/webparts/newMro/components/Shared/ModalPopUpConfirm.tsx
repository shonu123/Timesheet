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
      <div className="modal" tabIndex={-1} style={{display:'block'}} >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className={`modal-header-reject`}>
              <h5 className="" color='rgb(232, 87, 87)'>{message}</h5>
            </div>
            {/* <div className="modal-body">
              <p>{`Would you like to update the item`}</p>
            </div> */}
            <div className="modal-footer">
              <button type="button" onClick={onConfirm} className={`btn RejectButtons txt-white modalclosesuccess `} data-dismiss="modal">Ok</button>
              <button type="button" onClick={onCancel} className={`btn CancelButtons txt-white modalclosesuccess`} data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    ):null;
  };

export default ModalPopUpConfirm;