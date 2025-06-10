import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import Select from 'react-select';
import Loader from './Loader';
import customToaster from './Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
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
  onSubmit: (data: any) => void;
  ptoBalance: number;
  dates: string[];
  days: string[];
  timeOffTypes: TimeOffTypeOption[];
  ptoFormData: any;
  weekDetails?: any;
}

interface RowData {
  type: string | null;
  IsEligibleforPTO?: boolean;
  hours: string[];
  total: number;
}

const PTOFormModal = ({
  isVisible,
  onClose,
  onSubmit,
  ptoBalance,
  dates,
  days,
  timeOffTypes,
  ptoFormData,
  weekDetails,
}: PTOFormModalProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const selectRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showToaster, setshowToaster] = useState(false)
  const [loading, setLoading] = useState(false)

  const createEmptyRow = (): RowData => ({
    type: null,
    IsEligibleforPTO: undefined,
    hours: Array(days.length).fill(''),
    total: 0,
  });

  const mapPtoFormDataToRows = (
    data: any[],
    days: string[],
    timeOffTypes: TimeOffTypeOption[]
  ): RowData[] => {
    return data.map((item) => {
      const foundType = timeOffTypes.find(
        (t) => t.Title.toLowerCase() === item.TimeOffType.toLowerCase()
      );
      return {
        type: item.TimeOffType,
        IsEligibleforPTO: foundType?.IsEligibleforPTO,
        hours: days.map((day) =>
          item[day] !== undefined ? String(item[day]) : ''
        ),
        total: Number(item.Total) || 0,
      };
    });
  };

  const [rows, setRows] = useState<RowData[]>([createEmptyRow()]);
  const [columnTotals, setColumnTotals] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');


  const [filteredDays, setFilteredDays] = useState<string[]>([]);
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  const [disabledDays, setDisabledDays] = useState<boolean[]>([]);
  const [isHolidayDay, setIsHolidayDay] = useState<boolean[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);

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
  }, [isVisible, weekDetails, days, dates]);

  useEffect(() => {
    if (isVisible) {
      if (ptoFormData.length && filteredDays.length && timeOffTypes.length) {
        const mappedRows = mapPtoFormDataToRows(ptoFormData, filteredDays, timeOffTypes);
        setRows(mappedRows);
        const totalSum = mappedRows.reduce((acc, row) => acc + row.total, 0);
        const dayTotals = filteredDays.map((_, dayIndex) =>
          mappedRows.reduce((sum, row) => {
            const num = parseFloat(row.hours[dayIndex]);
            return sum + (isNaN(num) ? 0 : num);
          }, 0)
        );
        setColumnTotals(dayTotals);
        setGrandTotal(totalSum);
      } else {
        setRows([createEmptyRow()]);
        setColumnTotals(Array(filteredDays.length).fill(0));
        setGrandTotal(0);
      }
      // setErrorMessage('');
    }
  }, [isVisible, ptoFormData, timeOffTypes, filteredDays]);

  const handleHourChange = (rowIndex: number, dayIndex: number, value: string) => {
    if (value === '' || /^[0-2]*\.?[0-4]*$/.test(value)) {
      if (value === '.') return;
      const updatedRows = [...rows];
      updatedRows[rowIndex].hours[dayIndex] = value;
      calculateTotals(updatedRows);
    }
  };

  const handleTypeChange = (rowIndex: number, selectedOption: any) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].type = selectedOption?.value ?? null;
    const filteredTimeOff = timeOffTypes.filter(item => item.Title == selectedOption.value)
    updatedRows[rowIndex].IsEligibleforPTO = filteredTimeOff ? filteredTimeOff[0].IsEligibleforPTO : false
    // updatedRows[rowIndex].IsEligibleforPTO = selectedOption?.IsEligibleforPTO ?? undefined;
    setRows(updatedRows);
  };

  const calculateTotals = (updatedRows: RowData[]) => {
    updatedRows.forEach((row) => {
      row.total = Number(
        row.hours.reduce((acc, h) => {
          const num = parseFloat(h);
          return acc + (isNaN(num) ? 0 : num);
        }, 0)
      );
    });

    const dayTotals = filteredDays.map((_, dayIndex) =>
      updatedRows.reduce((sum, row) => {
        const num = parseFloat(row.hours[dayIndex]);
        return sum + (isNaN(num) ? 0 : num);
      }, 0)
    );

    const totalSum = updatedRows.reduce((acc, row) => acc + row.total, 0);

    setRows([...updatedRows]);
    setColumnTotals(dayTotals);
    setGrandTotal(totalSum);
  };

  const addRow = () => {
    const newRows = [...rows, createEmptyRow()];
    calculateTotals(newRows);
  };

  const deleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
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
    const ptoRows = rows.filter((r) => r.IsEligibleforPTO);
    const PTOSubTotal = getSubTotal(ptoRows, 'Paid Time Off');
    console.log(PTOSubTotal.Total)
    const PTOTotal = Object.keys(PTOSubTotal).reduce((acc, key) => {
      const val = parseFloat((PTOSubTotal as any)[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    if (PTOTotal > ptoBalance) {
      customToaster('toster-error', ToasterTypes.Error, 'Grand total exceeds PTO balance.', 4000)

      // setErrorMessage('Grand total exceeds PTO balance.');
      // Focus on the Grand Total input
      if (grandTotalElement) {
        grandTotalElement.classList.add('mandatory-FormContent-focus');
        grandTotalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    for (let i = 0; i < columnTotals.length; i++) {
      if (columnTotals[i] > 8) {
        customToaster('toster-error', ToasterTypes.Error, `Total hours for ${filteredDays[i]} (${filteredDates[i]}) exceed 8 hours.`, 4000)

        // setErrorMessage(
        //   `Total hours for ${filteredDays[i]} (${filteredDates[i]}) exceed 8 hours.`
        // );
        return false;
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.type) {
        customToaster('toster-error', ToasterTypes.Error, `Time off type is required for row ${i + 1}.`, 4000)

        let ddlSearchId = "TimeOffType_" + i;
        document.getElementById(ddlSearchId).getElementsByTagName('input')[0].focus();
        document.getElementById(ddlSearchId).classList.add('searchMandatory');

        return false;
      }

      if (row.total === 0) {
        const firstNonDisabledInput = inputRefs.current[i]?.find(
          (input, index) => !disabledDays[index]
        );
        if (firstNonDisabledInput) {
          firstNonDisabledInput.classList.add('mandatory-FormContent-focus');
          firstNonDisabledInput.focus();
        }
        customToaster('toster-error', ToasterTypes.Error, `Total hours for row ${i + 1} cannot be zero.`, 4000)
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

    // setErrorMessage('');
    return true;
  };

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
        TimeOffType: row.type,
        Total: row.total,
        IsEligibleforPTO: row.IsEligibleforPTO
      };
      filteredDays.forEach((day, index) => {
        const val = parseFloat(row.hours[index]);
        const hrs = isNaN(val) ? '' : val;
        rowObj[day] = hrs;
      });
      return rowObj;
    });

    const ptoRows = rows.filter((r) => r.IsEligibleforPTO);
    const toRows = rows.filter((r) => !r.IsEligibleforPTO);

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
      GrandTotal: {
        Total: grandTotal,
        ...filteredDays.reduce((acc, d, i) => {
          acc[d] = columnTotals[i] > 0 ? columnTotals[i] : '';
          return acc;
        }, {} as Record<string, number | string>),
      },
      PTOSubTotal,
      TOSubTotal,
      PTOTotal,
      TOTotal,
    };

    onSubmit(finalOutput);
    onClose();
  };

  useEffect(() => {
    calculateTotals(rows);
  }, []);

  const selectOptions = timeOffTypes.map((t) => ({
    label: t.Title,
    value: t.Title,
    IsEligibleforPTO: t.IsEligibleforPTO,
  }));

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
            <h5 className="modal-title">PTO Request Form</h5>
          </div>
          <div className="modal-body p-6" style={{ color: '#6b7280', fontSize: '16px' }}>
            <div className="table-responsive">
              <div className="mb-4 font-semibold">PTO Balance: {ptoBalance}</div>
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
                        <SearchableDropdown label="Time Off Type" Title="Time Off Type" isLabelRequired={false} name="TimeOffType" id={`TimeOffType_${rowIndex}`} placeholderText="Select Time Off Type" className="" selectedValue={row.type} optionLabel="label" optionValue="value" OptionsList={selectOptions} onChange={(selectedOption, actionMeta) => handleTypeChange(rowIndex, selectedOption)} isRequired={false} refElement={selectRefs.current[rowIndex]} disabled={false} noOptionsMessage="No options available" />
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
                            value={row.hours[dayIndex]}
                            onChange={(e) => handleHourChange(rowIndex, dayIndex, e.target.value)}
                            disabled={disabledDays[dayIndex]}
                            aria-disabled={disabledDays[dayIndex]}
                          />
                        </td>
                      ))}
                      <td>{row.total}</td>
                      <td>
                        {rows.length === 1 ? (
                          <button type="button" className='span-fa-plus' onClick={addRow} id='addnewRow'><span title='Add new time off row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button>

                        ) : rowIndex === rows.length - 1 ? (
                          <>

                            <button type="button" className='span-fa-close' onClick={() => deleteRow(rowIndex)}><span title='Delete row' ><FontAwesomeIcon icon={faClose}></FontAwesomeIcon></span></button>
                            <button type="button" className='span-fa-plus' onClick={addRow} id='addnewRow'><span title='Add new time off row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button>

                          </>
                        ) : (
                          <button type="button" className='span-fa-close' onClick={() => deleteRow(rowIndex)}><span title='Delete row' ><FontAwesomeIcon icon={faClose}></FontAwesomeIcon></span></button>

                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Grand Total</strong>
                    </td>
                    {columnTotals.map((total, index) => (
                      <td key={index}>
                        <strong>{total}</strong>
                      </td>
                    ))}
                    <td>
                      <strong className="grand-total-input">{grandTotal}</strong>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <span className="text-danger">{errorMessage}</span>
          </div>

          <div className="row">
          <div className="col-md-12 text-center my-2">
            <button type="button" onClick={handleSubmit} className="SubmitButtons btn" title="Submit">
              Submit
            </button>
            <button type="button" onClick={onClose} className="CancelButtons btn" title="Cancel">
              Cancel
            </button>
          </div>
          </div>

          {showToaster && <Toaster />}
          {loading && <Loader />}
        </div>
      </div>
    </div>
  ) : null;
};

export default PTOFormModal;

