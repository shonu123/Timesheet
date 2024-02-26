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
      <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className={`modal-header txt-white bc-dblue`}>
              <h5 className="modal-title txt-white">{message}</h5>
            </div>
            <div className="modal-body">
              <p>{`Would you like to ${title} the item`}</p>
            </div>
            <div className="light-box border-box-shadow m-1 p-2 pt-3">
                                            <div className="media-px-12">

                                                <div className="light-text height-auto">
                                                    <label className="floatingTextarea2 top-11">Comments </label>
                                                    <textarea className="position-static form-control requiredinput" onChange={comments} value={commentsValue} placeholder="" maxLength={500} id="txtComments" name="Comments" disabled={false}></textarea>
                                                </div>
                                                <div>
                                                    <span className='text-validator'> {errorMessage}</span>
                                                </div>

                                            </div>
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

export default ModalApprovePopUp;