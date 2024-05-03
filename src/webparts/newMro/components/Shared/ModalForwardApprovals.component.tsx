import * as React from 'react';

interface modalProps {
    message: string;
    title: string;
    isVisible: boolean;
    isSuccess?: boolean;
    errorMessage?: string;
    onConfirm: (e: any) => void;
    onCancel: () => void;
    changeEvent: (e: any) => void;
    modalHeader: string;
    dropdownObject:any;
    selectedValue:any;
    commentsValue:any;
}

const ModalForwardApprovals = ({ message, modalHeader, title, isVisible, onConfirm, onCancel, changeEvent, selectedValue,dropdownObject,commentsValue}: modalProps) => {
    return isVisible ? (
        // <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
        <div className="modal" tabIndex={-1} style={{ display: 'block' }} >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className={modalHeader}>

                         <h5 className="" color='rgb(232, 87, 87)'>{message}</h5>
                        {/*isSuccess && <h5 className="" color='#0D2F4B'>{message}</h5>} */}
                    </div>
                    <div className="light-box border-box-shadow m-1 p-2">
                        <div className="media-px-12">
                            <div className="light-text height-auto mb-4">
                                <label>Delegate To<span className="mandatoryhastrick">*</span></label>
                                <select className="form-control" required={true} name="DelegateToId" title="Delegate To" id='ddlDelegateTo' onChange={changeEvent}>
                                    <option value=''>None</option>
                                    {dropdownObject.map((option) => (
                                        <option value={option.ID} selected={option.Title == selectedValue}>{option.Title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="light-text height-auto">
                            <label className="floatingTextarea2 top-12">Comments<span className='mandatoryhastrick'>*</span></label>
                            <textarea className="position-static form-control requiredinput" onChange={changeEvent} value={commentsValue} placeholder="" maxLength={500} id="txtComments" name="comments" disabled={false}></textarea>
                        </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onConfirm} className={`btn SubmitButtons txt-white modalclosesuccess `} data-dismiss="modal">Forward</button>
                        <button type="button" onClick={onCancel} className={`btn CancelButtons txt-white modalclosesuccess`} data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;
};

export default ModalForwardApprovals;