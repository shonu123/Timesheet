import React from 'react';

interface InputTextProps {
    label: string;
    name: string;
    checked: boolean;
    onChange: any;
    isforMasters:boolean;
    //isRequired: boolean;
    //refElement: any;
}

const InputCheckBox = ({ label, name, checked, onChange,isforMasters }: InputTextProps) => {

    return isforMasters?(
        <div className="col-md-4">
            <div className='row mt-3'>
                <div className="col-sm-4">
                    <label className="col-form-label p-0">{label}</label>
                </div>
                {/* {isRequired && <span className="mandatoryhastrick">*</span>} */}
                <div className="col-sm-7">
                    <input type='checkbox' checked={checked} required={true} onChange={onChange} name={name} autoComplete="off" />
                </div>
            </div>
        </div>
    ):(
        <div className="col-md-3">
            <div className='mt-3'>
                <input type='checkbox' checked={checked} required={false} onChange={onChange} name={name} autoComplete="off" />
                <label className="col-form-label p-0">{label}</label>
            </div>
        </div>
    );
};

export default InputCheckBox;