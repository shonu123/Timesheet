import React from 'react';
import Select from 'react-select';

interface DropDownProps {
    label: string;
    Title: string;
    name: string;
    id?: any;
    placeholderText?: string;
    className?: string;
    selectedValue: any;
    optionLabel:any;
    optionValue:any;
    selectedlabel?: any;
    OptionsList: any;
    onChange: any;
    isRequired: boolean;
    disabled?: boolean;
    refElement: any;
    noOptionsMessage?:string;
}

const SearchableDropdown = ({ label, Title, name, id, placeholderText, className, selectedValue,optionLabel,optionValue, selectedlabel, OptionsList, onChange, isRequired, disabled = false, refElement,noOptionsMessage='No options' }: DropDownProps) => {
    const options = OptionsList.map((item) => ({
        label: typeof(item)=='string'?item:optionLabel.includes('.')?item[optionLabel.split('.')[0]][optionLabel.split('.')[1]]:item[optionLabel],
        value: typeof(item)=='string'?item:optionValue.includes('.')?item[optionValue.split('.')[0]][optionValue.split('.')[1]]:item[optionValue],
        EMail:typeof(item)=='string'?item:item['EMail']
    }));
    const onBlur=()=>{
        document.getElementById(id).classList.remove('searchMandatory');
    }
    return (
        <><label>{label}
            {isRequired && <span className="mandatoryhastrick">*</span>}
        </label><Select
                name={name}
                id={id}
                divId={'divSearch'}
                title={Title}
                placeholder={placeholderText}
                className={className}
                value={options.find((option) => option.value === selectedValue) || ''}
                options={options}
                onChange={(selectedOption, actionMeta) => { onChange(selectedOption, actionMeta) }}
                onBlur={onBlur}
                isDisabled ={disabled}
                ref={refElement}
                isClearable={!['', "None", null, undefined].includes(selectedValue)}
                isSearchable={true}
                noOptionsMessage={() => noOptionsMessage}
            // classNamePrefix={'menu-Z-10'} 
            /></>
    );
};

export default SearchableDropdown;