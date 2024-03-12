import * as React from 'react';

interface modalProps {
  message : string;
  title : string;
  isVisible: boolean;
  isSuccess : boolean;
  errorMessage  :string;
  onConfirm : (e:any) => void;
  onCancel : () => void;
  comments : (e:any) => void;
  commentsValue : string;
}

const ModalApprovePopUp =({ message,title,isVisible,isSuccess, onConfirm, onCancel, comments,errorMessage,commentsValue } : modalProps) => {
    return isVisible ? (
      // <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
        <div className="modal" tabIndex={-1} style={{display:'block'}} >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className={`modal-header`}>
              {!isSuccess&& <h5 className="" color='rgb(232, 87, 87)'>{message}</h5>}
              {isSuccess && <h5 className="" color='#0D2F4B'>{message}</h5>}
            </div>
            {/* <div className="modal-body">
              <p>{`Would you like to ${title} the item`}</p>
            </div> */}
            <div className="light-box border-box-shadow m-1 p-2 pt-3">
                                            <div className="media-px-12">

                                                <div className="light-text height-auto">
                                                    <label className="floatingTextarea2 top-11">Comments{!isSuccess&&<span className='mandatoryhastrick'>*</span>} </label>
                                                    <textarea className="position-static form-control requiredinput" onChange={comments} value={commentsValue} placeholder="" maxLength={500} id="txtComments" name="Comments" disabled={false}></textarea>
                                                </div>
                                                <div>
                                                    <span className='text-validator'> {errorMessage}</span>
                                                </div>

                                            </div>
                                        </div>
            <div className="modal-footer">
              {isSuccess && <button type="button" onClick={onConfirm} className={`btn SubmitButtons txt-white modalclosesuccess `} data-dismiss="modal">Approve</button>}
              {!isSuccess &&<button type="button" onClick={onConfirm} className={`btn RejectButtons txt-white modalclosesuccess `} data-dismiss="modal">Reject</button>}
              <button type="button" onClick={onCancel} className={`btn CancelButtons txt-white modalclosesuccess`} data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    ):null;
  };

export default ModalApprovePopUp;