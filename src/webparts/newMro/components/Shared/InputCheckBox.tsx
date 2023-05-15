import React from 'react';

interface InputTextProps {
    label: string;
    name: string;
    checked: boolean;
    onChange: any;
    //isRequired: boolean;
    //refElement: any;
}

const InputCheckBox = ({ label, name, checked, onChange }: InputTextProps) => {

    return (
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
    );
};

export default InputCheckBox;