import React, { useState, useEffect } from "react";
import Checkbox from "@material-ui/core/Checkbox";
import InputLabel from "@material-ui/core/InputLabel";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";
import { MenuProps as MuiMenuProps } from "@material-ui/core/Menu";

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        width: 300
    },
    indeterminateColor: {
        color: "#f50057"
    },
    selectAllText: {
        fontWeight: 500
    },
    selectedAll: {
        backgroundColor: "rgba(0, 0, 0, 0.08)",
        "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.08)"
        }
    }
}));

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps: Partial<MuiMenuProps> = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250
        }
    },
    getContentAnchorEl: null,
    anchorOrigin: {
        vertical: "bottom",
        horizontal: "center"
    },
    transformOrigin: {
        vertical: "top",
        horizontal: "center"
    },
    variant: "menu" as "menu"
};


function MultiSelectDropdown(Props) {
    const classes = useStyles();
    const [searchText, setSearchText] = useState("");
    const [selVal, setSelVal] = useState('');
    const isAllSelected =
        Props.OptionsList.length > 0 && Props.selectedValue.length === Props.OptionsList.length;
    useEffect(() => {
        setSearchText('');
        setSelVal(Props.OptionsList
            .filter(opt => Props.selectedValue.includes(opt[Props.optionValue]))
            .map(opt => opt[Props.optionLabel])
            .join(", "));
    }, []);
    useEffect(() => {
        // setSearchText('');
        setSelVal(Props.OptionsList
            .filter(opt => Props.selectedValue.includes(opt[Props.optionValue]))
            .map(opt => opt[Props.optionLabel])
            .join(", "));
    }, [Props.selectedValue]);

    return (
        <FormControl className={classes.formControl}>
            <label id="multiple-select-label">{Props.label}{Props.isRequired && <span className="mandatoryhastrick"> *</span>}</label>
            <Select
                labelId="multiple-select-label"
                multiple
                value={Props.selectedValue}
                onChange={(selectedOption, actionMeta) => { Props.onChange(selectedOption, actionMeta) }}
                renderValue={() => selVal}
                title={selVal}
                MenuProps={MenuProps}
                name={Props.name}
                id={Props.id}
                className={Props.className}
                disabled={Props.disabled}
            >
                <MenuItem disableGutters>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); }}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            padding: "8px",
                            margin: "5px"
                        }}
                    />
                </MenuItem>

                {Props.OptionsList.length ? 
                !searchText && <MenuItem
                    value="all"
                    classes={{
                        root: isAllSelected ? classes.selectedAll : ""
                    }}
                >
                    <ListItemIcon>
                        <Checkbox
                            classes={{ indeterminate: classes.indeterminateColor }}
                            checked={isAllSelected}
                            indeterminate={
                                Props.selectedValue.length > 0 && Props.selectedValue.length < Props.OptionsList.length
                            }
                        />
                    </ListItemIcon>
                    <ListItemText
                        classes={{ primary: classes.selectAllText }}
                        primary="Select All"
                    />
                </MenuItem> : <MenuItem><ListItemText
                    classes={{ primary: classes.selectAllText }}
                    primary={Props.noOptionsMessage}
                    onClick={(e) => e.stopPropagation()}
                /></MenuItem>}
                {Props.OptionsList.filter(option =>
                    option[Props.optionLabel]
                        .toLowerCase()
                        .includes(searchText.toLowerCase())
                ).map((option) => (
                    <MenuItem key={option[Props.optionValue]} value={option[Props.optionValue]}>
                        <ListItemIcon>
                            <Checkbox checked={Props.selectedValue.indexOf(option[Props.optionValue]) > -1} />
                        </ListItemIcon>
                        <ListItemText primary={option[Props.optionLabel]} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default MultiSelectDropdown;