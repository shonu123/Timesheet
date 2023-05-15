import React from 'react';

interface InputTextProps {
    type: string;
    label: string;
    name: string;
    value: any;
    onChange: any;
    onBlur:any;
    isRequired: boolean;
    refElement: any;
    disabled?: boolean;
    maxlength?:number;

}

const InputText = ({ type, label, name, value, isRequired, onChange, refElement,disabled,maxlength,onBlur }: InputTextProps) => {

    return (
        <div className="col-md-4">
            <div className='light-text'>
                <label>{label}
                    {isRequired && <span className="mandatoryhastrick">*</span>}
                </label>
                
                <input className="form-control" type={type} title={label} placeholder="" value={value || ''}
                    required={true} onChange={onChange} onBlur={onBlur} name={name} ref={refElement} autoComplete="off" disabled={disabled} maxLength={maxlength}
                />
            </div>
        </div>
    );
};

export default InputText;