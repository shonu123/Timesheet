import React from 'react';
import Select, { components } from 'react-select';

interface DropDownProps {
    isLabelRequired?: boolean;
    label: string;
    Title: string;
    name: string;
    id?: any;
    placeholderText?: string;
    className?: string;
    selectedValue: any;
    optionLabel: any;
    optionValue: any;
    selectedlabel?: any;
    OptionsList: any;
    onChange: any;
    isRequired: boolean;
    disabled?: boolean;
    refElement?: any;
    noOptionsMessage?: string;
    isCustomStylesApplicable?: boolean;
    menuIsOpen?: boolean;
}

const SearchableDropdown = ({ isLabelRequired = true, label, Title, name, id, placeholderText, className, selectedValue, optionLabel, optionValue, selectedlabel, OptionsList, onChange, isRequired, disabled = false, refElement, noOptionsMessage = 'No options', isCustomStylesApplicable = false, menuIsOpen = false }: DropDownProps) => {
    const options = OptionsList.map((item) => ({
        label: typeof (item) == 'string' ? item : optionLabel.includes('.') ? item[optionLabel.split('.')[0]][optionLabel.split('.')[1]] : item[optionLabel],
        value: typeof (item) == 'string' ? item : optionValue.includes('.') ? item[optionValue.split('.')[0]][optionValue.split('.')[1]] : item[optionValue],
        EMail: typeof (item) == 'string' ? item : item['EMail'],
        Color: typeof (item) == 'string' ? item : item['Color'],
        //tooltip:typeof(item)=='string'?item:item['IsEligibleforPTO']?'Eligible for PTO':'Not eligible for PTO'
    }));


    const getOptionStyle = (option) => ({
        backgroundColor: option.Color || 'transparent', // Apply background color
    });

    const customStyles = {
        option: (provided, state) => ({
            ...provided,
            //...getOptionStyle(state.data),
            // position: 'relative',
            // '&:hover::after': {
            //     content: `"${state.data.tooltip}"`,
            //     left: '100%',
            //     top: '50%',
            //     transform: 'translateY(-50%)',
            //     backgroundColor: state.data.Color,
            //     color: '#fff',
            //     padding: '5px',
            //     borderRadius: '3px',
            //     whiteSpace: 'nowrap',
            //     zIndex: 1,
            // },
            position: 'relative',
            paddingLeft: '25px', // Adjust padding to make space for the circle
            '&::before': {
                content: '""',
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: state.data.Color, // Use the color from the option data
            },
        }),
    };

    const onBlur = () => {
        document.getElementById(id).classList.remove('searchMandatory');
    }
    const MenuList = (props) => {
        const eligibleOption = OptionsList.find(option => option.IsEligibleforPTO);
        const eligibleColor = eligibleOption ? eligibleOption.Color : ''; // Default to green if no eligible option found

        return (
            <components.MenuList {...props}>
                {props.children}
                <div className='EforPTOOuterDiv'>
                    <div className='EforPTOInnerDiv' style={{ color: eligibleColor }}>
                        <span className='EforPTOSpan' style={{
                            backgroundColor: eligibleColor, // Use the color from the eligible option
                        }}></span>
                        Eligible for PTO
                    </div>
                </div>
            </components.MenuList>
        );
    };
    return (
        <>{isLabelRequired && <label>{label}
            {isRequired && <span className="mandatoryhastrick">*</span>}
        </label>}
            <Select
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
                isDisabled={disabled}
                ref={refElement}
                isClearable={!['', "None", null, undefined].includes(selectedValue)}
                isSearchable={true}
                noOptionsMessage={() => noOptionsMessage}
                menuIsOpen={menuIsOpen ? menuIsOpen : undefined}
                // styles={isCustomStylesApplicable?customStyles:undefined} // Apply custom styles
                // components={isCustomStylesApplicable? { MenuList }:undefined} // Use custom MenuList component

                // classNamePrefix={'menu-Z-10'} 
                menuPortalTarget={document.body} //to avoid vertical scroll in table dropdowns
                styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                }}
            /></>
    );
};

export default SearchableDropdown;