import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import Select from 'react-select';
import Loader from './Loader';
import customToaster from './Toaster.component';
import { ToasterTypes, StatusType } from '../../Constants/Constants';
import SearchableDropdown from './SearchableDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faPlus } from '@fortawesome/free-solid-svg-icons';

interface TimeOffTypeOption {
  Title: string;
  IsEligibleforPTO: boolean;
}

interface PTOFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (data: any) => void;
  ptoBalance: number;
  dates: string[];
  days: string[];
  timeOffTypes: TimeOffTypeOption[];
  EligibleforPTO: boolean;
  ptoFormData: any;
  weekDetails?: any;
  showResetBtn: boolean;
  isEditForm: boolean;
  UPTOTypes: any;
  TOComments: string
}

interface RowData {
  TimeOffType: string | null;
  IsPTOEligible?: boolean;
  hours: string[];
  Total: number;
}

const PTOFormModal = ({
  isVisible,
  onClose,
  onReset,
  onSubmit,
  ptoBalance,
  dates,
  days,
  timeOffTypes,
  EligibleforPTO,
  ptoFormData,
  weekDetails,
  showResetBtn,
  isEditForm,
  UPTOTypes,
  TOComments
}: PTOFormModalProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const selectRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showToaster, setshowToaster] = useState(false);
  const [ptoFormDataRows, setPTOFormDataRows] = useState(ptoFormData);
  const [Comments, setComments] = useState(TOComments || '');
  const [loading, setLoading] = useState(false);

  const createEmptyRow = (): RowData => ({
    TimeOffType: '',
    IsPTOEligible: false,
    hours: Array(days.length).fill(''),
    Total: 0,
  });

  const mapPtoFormDataToRows = (
    data: any[],
    days: string[],
    timeOffTypes: TimeOffTypeOption[]
  ): RowData[] => {
    return data.map((item) => {
      const foundType = timeOffTypes.find(
        (t) => t.Title.toLowerCase() === item.TimeOffType.toLowerCase()
        // item.TimeOffType.toLowerCase()
      );
      return {
        TimeOffType: item.TimeOffType,
        // item.TimeOffType,
        IsPTOEligible: foundType?.IsEligibleforPTO,
        hours: days.map((day,i) =>
          item[day] !== undefined ? String(item[day]) : item.hours?item.hours[i]:''
        ),
        Total: Number(item.Total) || 0,
      };
    });
  };
  // To avoid duplicated time Off Type selection
  const mapUniqueTimeOffTypes = (data: any[], timeOffTypes: TimeOffTypeOption[]) => {
    let UniqueTimeOffTypesArr = [];
    data.map((item) => {
      let currRow = timeOffTypes.find(t => item.TimeOffType != null && t.Title.toLowerCase() == item.TimeOffType.toLowerCase());
      let TOTArr = [];
      if (currRow != undefined) {
        TOTArr.push({ label: currRow.Title, value: currRow.Title, IsPTOEligible: currRow.IsEligibleforPTO });
      }
      let filteredTimeOffTypes = timeOffTypes.filter(t => !(data.some(Sel => Sel.TimeOffType == t.Title)));
      filteredTimeOffTypes.map((t) => (
        TOTArr.push({ label: t.Title, value: t.Title, IsPTOEligible: t.IsEligibleforPTO })
      ));
      TOTArr.sort((a, b) => a.value.localeCompare(b.value));
      UniqueTimeOffTypesArr.push(TOTArr);
    });
    return UniqueTimeOffTypesArr;
  };
  const [selectOptions, setselectOptions] = useState<Object[]>(mapUniqueTimeOffTypes([createEmptyRow()], timeOffTypes));

  const [rows, setRows] = useState<RowData[]>([createEmptyRow()]);
  const [columnTotals, setColumnTotals] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [filteredDays, setFilteredDays] = useState<string[]>([]);
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  const [disabledDays, setDisabledDays] = useState<boolean[]>([]);
  const [isHolidayDay, setIsHolidayDay] = useState<boolean[]>([]);
  const [grandTotal, setGrandTotal] = useState<string>('0.00');

  useEffect(() => {
    if (isVisible && weekDetails && weekDetails.length > 0) {
      try {
        const weekNamesObj = weekDetails[0].WeekNames[0];
        const weekHeadingsObj = weekDetails[0].WeekHeadings[0];

        const weekDayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const startDay: string = weekNamesObj['day1'];
        const startIndex = weekDayOrder.indexOf(startDay);
        const endIndex = 4; // Friday index

        let selectedDays: string[] = [];
        if (startIndex !== -1 && startIndex <= endIndex) {
          selectedDays = weekDayOrder.slice(startIndex, endIndex + 1);
        } else {
          selectedDays = weekDayOrder.slice(0, 5);
        }

        const selectedDates: string[] = selectedDays.map(
          (day) => weekHeadingsObj[day] //+ 'Date'
        );

        const disabledFlags: boolean[] = selectedDays.map((day, idx) => {
          const isJoinedKey = `Is${day}Joined`;
          const isDayHolidayKey = `IsDay${startIndex + idx + 1}Holiday`;

          const isJoined = !!weekHeadingsObj[isJoinedKey];
          const isHoliday = weekHeadingsObj[isDayHolidayKey]?.isHoliday ?? false;

          return isJoined || isHoliday;
        });

        const holidayFlags: boolean[] = selectedDays.map((_, idx) => {
          const isDayHolidayKey = `IsDay${startIndex + idx + 1}Holiday`;
          return weekHeadingsObj[isDayHolidayKey]?.isHoliday ?? false;
        });

        setFilteredDays(selectedDays);
        setFilteredDates(selectedDates);
        setDisabledDays(disabledFlags);
        setIsHolidayDay(holidayFlags);
      } catch (e) {
        setFilteredDays(days);
        setFilteredDates(dates);
        setDisabledDays(days.map(() => false));
        setIsHolidayDay(days.map(() => false));
      }
    } else {
      setFilteredDays(days);
      setFilteredDates(dates);
      setDisabledDays(days.map(() => false));
      setIsHolidayDay(days.map(() => false));
    }
  }, [isVisible, weekDetails, days, dates, ptoFormDataRows]);

  // useEffect(() => {
  //   if (isVisible) {
  //     if (ptoFormDataRows.length && filteredDays.length && timeOffTypes.length) {
  //       const mappedRows = mapPtoFormDataToRows(ptoFormDataRows, filteredDays, timeOffTypes);
  //       setRows(mappedRows);
  //       const totalSum = mappedRows.reduce((acc, row) => acc + row.total, 0);
  //       const dayTotals = filteredDays.map((_, dayIndex) =>
  //         mappedRows.reduce((sum, row) => {
  //           const num = parseFloat(row.hours[dayIndex]);
  //           return sum + (isNaN(num) ? 0 : num);
  //         }, 0)
  //       );
  //       setColumnTotals(dayTotals);
  //       setGrandTotal(totalSum);
  //     } else {
  //       setRows([createEmptyRow()]);
  //       setColumnTotals(Array(filteredDays.length).fill(0));
  //       setGrandTotal('0.00');
  //     }
  //     // setErrorMessage('');
  //   }
  // }, [isVisible, ptoFormDataRows, timeOffTypes, filteredDays]);

  useEffect(() => {
    if (isVisible) {
      setLoading(true);
      if (ptoFormDataRows.length && filteredDays.length && timeOffTypes.length) {
        const mappedRows = mapPtoFormDataToRows(ptoFormDataRows, filteredDays, timeOffTypes);
        const mappedTOTypes = mapUniqueTimeOffTypes(mappedRows, timeOffTypes);
        setselectOptions(mappedTOTypes);
        setRows(mappedRows);

        const totalSum = mappedRows.reduce((acc, row) => acc + row.Total, 0);
        const totalSumDisplay = totalSum === 0 ? '0.00' : totalSum.toString();

        const dayTotals = filteredDays.map((_, dayIndex) =>
          mappedRows.reduce((sum, row) => {
            const num = parseFloat(row.hours[dayIndex]);
            return sum + (isNaN(num) ? 0 : num);
          }, 0)
        ).map(Total => Total === 0 ? '0.00' : Total.toString());

        setColumnTotals(dayTotals);
        setGrandTotal(totalSumDisplay);
      } else {
        const mappedTOTypes = mapUniqueTimeOffTypes([createEmptyRow()], timeOffTypes);
        setselectOptions(mappedTOTypes);
        setRows([createEmptyRow()]);
        setColumnTotals(Array(filteredDays.length).fill('0.00'));
        setGrandTotal('0.00');
      }
      setLoading(false);

    }
  }, [isVisible, timeOffTypes, filteredDays, ptoFormDataRows]);


  const handleHourChange = (rowIndex: number, dayIndex: number, value: string) => {
    if (value === '' || /^\d*\.?\d{0,4}$/.test(value)) {  // value.match(/\d{0,5}(\.\d{0,4})?/)[0]  /\d{0,5}(\.\d{0,4})?/.test(value)
      // if (value === '.') return;
      if (parseFloat(value) > 8.00)
        return false;
      const updatedRows = [...rows];
      updatedRows[rowIndex].hours[dayIndex] = value;
      calculateTotals(updatedRows);
    }
    else {
      setRows([...rows]);
    }
  };
  // var selectOptions = timeOffTypes.map((t) => ({
  //     label: t.Title,
  //     value: t.Title,
  //     IsPTOEligible: t.IsEligibleforPTO,
  //   }));

  const handleTypeChange = (rowIndex: number, selectedOption: any) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].TimeOffType = selectedOption?.value ?? null;
    const filteredTimeOff = timeOffTypes.filter(item => item.Title == (selectedOption?.value ?? null));
    updatedRows[rowIndex].IsPTOEligible = filteredTimeOff.length ? filteredTimeOff[0].IsEligibleforPTO : false;
    // updatedRows[rowIndex].IsPTOEligible = selectedOption?.IsPTOEligible ?? undefined;
    // To avoid duplicated time Off Type selection
    const mappedTOTypes = mapUniqueTimeOffTypes(updatedRows, timeOffTypes);
    setselectOptions(mappedTOTypes);
    setRows(updatedRows);
  };
  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  }

  // const calculateTotals = (updatedRows: RowData[]) => {
  //   updatedRows.forEach((row) => {
  //     row.total = Number(
  //       row.hours.reduce((acc, h) => {
  //         const num = parseFloat(h);
  //         return acc + (isNaN(num) ? 0 : num);
  //       }, 0)
  //     );
  //   });

  //   const dayTotals = filteredDays.map((_, dayIndex) =>
  //     updatedRows.reduce((sum, row) => {
  //       const num = parseFloat(row.hours[dayIndex]);
  //       return sum + (isNaN(num) ? 0 : num);
  //     }, 0)
  //   );

  //   const totalSum = updatedRows.reduce((acc, row) => acc + row.total, 0);

  //   setRows([...updatedRows]);
  //   setColumnTotals(dayTotals);
  //   setGrandTotal(totalSum);
  // };

  const calculateTotals = (updatedRows: RowData[]) => {
    updatedRows.forEach((row) => {
      const rowTotal = row.hours.reduce((acc, h) => {
        const num = parseFloat(h);
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
      row.Total = parseFloat(rowTotal.toFixed(4)); // keep row.total as number, optional
    });

    const dayTotals = filteredDays.map((_, dayIndex) =>
      updatedRows.reduce((sum, row) => {
        const num = parseFloat(row.hours[dayIndex]);
        return sum + (isNaN(num) ? 0 : num);
      }, 0)
    ).map(Total => Total === 0 ? '0.00' : Total.toString());

    const totalSum = updatedRows.reduce((acc, row) => acc + row.Total, 0);
    const grandTotalDisplay = totalSum === 0 ? '0.00' : totalSum.toString();
    const mappedTOTypes = mapUniqueTimeOffTypes([...updatedRows], timeOffTypes);
    setselectOptions(mappedTOTypes);
    setRows([...updatedRows]);
    setColumnTotals(dayTotals);
    setGrandTotal(grandTotalDisplay);
  };


  const addRow = () => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.Total === 0) {
        const firstNonDisabledInput = inputRefs.current[i]?.find(
          (input, index) => !disabledDays[index]
        );
        if (firstNonDisabledInput) {
          firstNonDisabledInput.classList.add('mandatory-FormContent-focus');
          firstNonDisabledInput.focus();
        }
        customToaster('toster-error', ToasterTypes.Error, `Total time off hours in a week cannot be 0 .`, 4000)
        return false;
      }
    }
    const newRows = [...rows, createEmptyRow()];
    // setPTOFormDataRows(newRows)
    calculateTotals(newRows);
  };

  const deleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    // console.log("ptoFormData :" , ptoFormData)
    // ptoFormData = newRows
    setPTOFormDataRows(newRows);
    calculateTotals(newRows);
  };


  const validateForm = () => {
    // Clear previous mandatory focus classes
    inputRefs.current.forEach((row) =>
      row?.forEach((input) => input?.classList.remove('mandatory-FormContent-focus'))
    );
    selectRefs.current.forEach((select) =>
      select?.classList.remove('mandatory-FormContent-focus')
    );
    // Remove from grand total display too
    const grandTotalElement = document.querySelector('.grand-total-input');
    if (grandTotalElement) {
      grandTotalElement.classList.remove('mandatory-FormContent-focus');
    }
    const ptoRows = rows.filter((r) => r.IsPTOEligible);
    const PTOSubTotal = getSubTotal(ptoRows, 'Paid Time Off');
    console.log(PTOSubTotal.Total)
    const PTOTotal = Object.keys(PTOSubTotal).reduce((acc, key) => {
      const val = parseFloat((PTOSubTotal as any)[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    if (PTOTotal > ptoBalance) {
      customToaster('toster-error', ToasterTypes.Error, "'PTO Hours' cannot be greater than 'PTO Balance'", 4000)

      // setErrorMessage('Grand total exceeds PTO balance.');
      // Focus on the Grand Total input
      if (grandTotalElement) {
        grandTotalElement.classList.add('mandatory-FormContent-focus');
        grandTotalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // for (let i = 0; i < columnTotals.length; i++) {
    //   if (columnTotals[i] > 8) {
    //     customToaster('toster-error', ToasterTypes.Error, `Total hours for ${filteredDays[i]} (${filteredDates[i]}) exceed 8 hours.`, 4000)

    //     // setErrorMessage(
    //     //   `Total hours for ${filteredDays[i]} (${filteredDates[i]}) exceed 8 hours.`
    //     // );
    //     return false;
    //   }
    // }
    for (let i = 0; i < columnTotals.length; i++) {
      const Total = parseFloat(columnTotals[i]);
      if (Total > 8) {
        customToaster(
          'toster-error',
          ToasterTypes.Error,
          `Total hours for ${filteredDays[i]} (${filteredDates[i]}) cannot exceed 8 hours.`,
          4000
        );
        return false;
      }
    }


    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.TimeOffType) {
        customToaster('toster-error', ToasterTypes.Error, `Time Off Type cannot be blank.`, 4000)

        let ddlSearchId = "TimeOffType_" + i;
        document.getElementById(ddlSearchId).getElementsByTagName('input')[0].focus();
        document.getElementById(ddlSearchId).classList.add('searchMandatory');

        return false;
      }

      if (row.Total === 0) {
        const firstNonDisabledInput = inputRefs.current[i]?.find(
          (input, index) => !disabledDays[index]
        );
        if (firstNonDisabledInput) {
          firstNonDisabledInput.classList.add('mandatory-FormContent-focus');
          firstNonDisabledInput.focus();
        }
        customToaster('toster-error', ToasterTypes.Error, `Hours cannot be blank, Please provide valid hours.`, 4000)
        return false;
      }
    }

    const hasAtLeastOneEntry = rows.some((row) =>
      row.hours.some((h) => parseFloat(h) > 0)
    );

    if (!hasAtLeastOneEntry) {
      customToaster('toster-error', ToasterTypes.Error, 'At least one day must have hours.', 4000)

      // setErrorMessage('At least one day must have hours.');
      const input = inputRefs.current[0]?.[0];
      if (input) {
        input.classList.add('mandatory-FormContent-focus');
        input.focus();
      }
      return false;
    }

    if (EligibleforPTO && (ptoBalance - getPTOTotal()) > 0 && (getTOTotal() > 0) && Comments.trim() == '' && rows.some(t => UPTOTypes.includes(t.TimeOffType))) // Comments are mandatory if PTOBalance is avialable, but employee applied for UPTO
    {
      let message = `${Number((ptoBalance - getPTOTotal()).toFixed(4))} PTO hours are available. Please provide comments for selecting 'Unpaid Time Off.'`;
      let elm = document.getElementById('txtTOComments');
      elm.focus();
      setTimeout(() => elm.classList.add('mandatory-FormContent-focus'), 300);
      customToaster('toster-error', ToasterTypes.Error, message, 4000);
      return false;
    }

    // setErrorMessage('');
    return true;
  };

  const getPTOTotal = () => {
    const ptoRows = rows.filter((r) => r.IsPTOEligible);
    const PTOSubTotal = getSubTotal(ptoRows, 'Paid Time Off');
    const PTOTotal = Object.keys(PTOSubTotal).reduce((acc, key) => {
      const val = parseFloat((PTOSubTotal as any)[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return PTOTotal;
  }
  const getTOTotal = () => {
    const toRows = rows.filter((r) => !r.IsPTOEligible);
    const TOSubTotal = getSubTotal(toRows, 'Paid Time Off');
    const TOTotal = Object.keys(TOSubTotal).reduce((acc, key) => {
      const val = parseFloat((TOSubTotal as any)[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return TOTotal;
  }

  const getSubTotal = (rows: RowData[], label: string) => {
    const subtotal: any = { Type: label };
    filteredDays.forEach((_, index) => {
      subtotal[filteredDays[index]] = rows.reduce((sum, row) => {
        const h = parseFloat(row.hours[index]);
        return sum + (isNaN(h) ? 0 : h);
      }, 0);
    });
    return subtotal;
  };
  const handleSubmit = () => {
    if (!validateForm()) return;

    const TimeOffData = rows.map((row) => {
      const rowObj: any = {
        TimeOffType: row.TimeOffType,
        Total: row.Total,
        IsPTOEligible: row.IsPTOEligible
      };
      filteredDays.forEach((day, index) => {
        const val = parseFloat(row.hours[index]);
        const hrs = isNaN(val) ? '' : val;
        rowObj[day] = hrs;
      });
      return rowObj;
    });

    const ptoRows = rows.filter((r) => r.IsPTOEligible);
    const toRows = rows.filter((r) => !r.IsPTOEligible);

    const PTOSubTotal = getSubTotal(ptoRows, 'Paid Time Off');
    const TOSubTotal = getSubTotal(toRows, 'Time Off');

    const PTOTotal = Object.keys(PTOSubTotal).reduce((acc, key) => {
      const val = parseFloat((PTOSubTotal as any)[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    PTOSubTotal['Total'] = PTOTotal;


    const TOTotal = Object.keys(TOSubTotal).reduce((acc, key) => {
      const val = parseFloat((TOSubTotal as any)[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    TOSubTotal['Total'] = TOTotal;

    const finalOutput = {
      TimeOffData,
      Total: [{
        Type: "Total",
        Total: grandTotal,
        ...filteredDays.reduce((acc, d, i) => {
          // acc[d] = columnTotals[i] > 0 ? columnTotals[i] : '';
          acc[d] = parseFloat(columnTotals[i]) > 0 ? columnTotals[i] : '';
          return acc;
        }, {} as Record<string, number | string>),
      }],
      PTOSubTotal,
      TOSubTotal,
      PTOTotal,
      TOTotal,
      IsActive: true,
      TOComments: Comments
    };
    finalOutput.PTOSubTotal = [finalOutput.PTOSubTotal]
    finalOutput.TOSubTotal = [finalOutput.TOSubTotal]
    onSubmit(finalOutput);
    onClose();
  };
  const handleReset = () => {
    const newRows = [createEmptyRow()];
    setPTOFormDataRows(newRows);
    setRows(newRows);
    setComments('');
    onReset();
  }

  useEffect(() => {
    calculateTotals(rows);
  }, []);

  return isVisible ? (
    <div
      className="modal"
      tabIndex={-1}
      style={{ display: 'block' }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl"
        style={{ maxWidth: '1200px' }}
      >
        <div
          className="modal-content rounded-lg shadow-md"
          style={{ backgroundColor: '#ffffff' }}
        >
          <div
            className="modal-header rounded-t-lg"
            style={{ fontWeight: 700, fontSize: '1.5rem' }}
          >
            <h5 className="modal-title">{`${isEditForm ? '' : 'View'} Time Off Request Form`}</h5>
            <button type="button" className='btn-fa-close' onClick={onClose} id={'btnClose'}><span title='Close' ><FontAwesomeIcon icon={faClose} id={'iconClose'}></FontAwesomeIcon></span></button>
          </div>
          <div className="modal-body p-6" style={{ color: '#6b7280', fontSize: '16px' }}>
            {/* <div className="table-responsive"> removed scroll bar for table to overcome the issue of scroll on the open of timeofftype dropdown menu */}
            <div className="">
              {EligibleforPTO && <div className="mb-2 font-semibold">PTO Balance: {ptoBalance}</div>}
              <table className="table table-bordered timetable table-tdp-0 text-center align-middle">
                <thead>
                  <tr>
                    <th>Time Off Type <span className="mandatoryhastrick">*</span></th>
                    {filteredDays.map((day, index) => (
                      <th key={index}>
                        {day} ({filteredDates[index]})
                      </th>
                    ))}
                    <th>Total</th>
                    <th><div className='px-3 th-AddDel-Icon'></div></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td style={{ width: 220 }}>
                        <SearchableDropdown label="Time Off Type" Title="Time Off Type" isLabelRequired={false} name="TimeOffType" id={`TimeOffType_${rowIndex}`} placeholderText="Time Off Type" className="ddlTimeOffType form-control text-left" selectedValue={row.TimeOffType} optionLabel="label" optionValue="value" OptionsList={selectOptions[rowIndex]} onChange={(selectedOption, actionMeta) => handleTypeChange(rowIndex, selectedOption)} isRequired={false} refElement={selectRefs.current[rowIndex]} disabled={!isEditForm} noOptionsMessage="No Time Off Type" />
                      </td>
                      {filteredDays.map((_, dayIndex) => (
                        <td key={dayIndex}>
                          <input
                            ref={(el) => {
                              if (!inputRefs.current[rowIndex]) inputRefs.current[rowIndex] = [];
                              inputRefs.current[rowIndex][dayIndex] = el;
                            }}
                            type="text"
                            className={`form-control text-center  ${isHolidayDay[dayIndex] ? 'ClientHoliday' : ''}`}
                            value={row.hours[dayIndex] || ''}
                            onChange={(e) => handleHourChange(rowIndex, dayIndex, e.target.value)}
                            disabled={disabledDays[dayIndex] || !isEditForm}
                            aria-disabled={disabledDays[dayIndex]}
                          />
                        </td>
                      ))}
                      <td>{row.Total}</td>
                      <td className=' text-start'>
                        {isEditForm && (rows.length === 1 ? (
                          <button type="button" className='span-fa-plus' onClick={addRow} id='addnewRow'><span title='Add new time off row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button>

                        ) : rowIndex === rows.length - 1 ? (
                          <>

                            <button type="button" className='span-fa-close' onClick={() => deleteRow(rowIndex)}><span title='Delete row' ><FontAwesomeIcon icon={faClose}></FontAwesomeIcon></span></button>
                            <button type="button" className='span-fa-plus' onClick={addRow} id='addnewRow'><span title='Add new time off row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button>

                          </>
                        ) : (
                          <button type="button" className='span-fa-close' onClick={() => deleteRow(rowIndex)}><span title='Delete row' ><FontAwesomeIcon icon={faClose}></FontAwesomeIcon></span></button>

                        ))}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="fw-bold text-start">
                      <div className="p-2 fw-bold">
                        <i className="fas fa-business-time color-gray"></i> Grand Total
                      </div>
                    </td>
                    {columnTotals.map((total, index) => (
                      <td key={index}>
                        {total}
                      </td>
                    ))}
                    <td>
                      <strong className="grand-total-input">{grandTotal}</strong>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              {/* {isEditForm &&<div className="light-box my-2 ml-2 p-2 text-center divInfo"><b>Note : </b><div>Submitting or Removing this form does not permanently store you request. Please save or submit your timesheet to finalize your time off request.</div></div>} */}
              <div className="col-md-12">
                <div className="light-text height-auto">
                  <label className="floatingTextarea2 top-11">Comments</label>
                  <textarea className="position-static form-control" onChange={handleCommentsChange} value={Comments} id="txtTOComments" name="Comments" disabled={!isEditForm}></textarea>
                </div>
              </div>
              <div className="">
                <div className="text-center my-2">
                  {isEditForm && <button type="button" onClick={handleSubmit} className="SubmitButtons btn" title="Submit">
                    Submit
                  </button>}
                  {isEditForm && showResetBtn && <button type="button" onClick={handleReset} className="txt-white CancelButtons bc-burgundy btn" title="Reset">Reset</button>}
                  <button type="button" onClick={onClose} className="CancelButtons btn" title="Close">
                    Close
                  </button>

                </div>
              </div>
            </div>
            <span className="text-danger">{errorMessage}</span>
          </div>
          {showToaster && <Toaster />}
          {loading && <Loader />}
        </div>
      </div>
    </div>
  ) : null;
};

export default PTOFormModal;

