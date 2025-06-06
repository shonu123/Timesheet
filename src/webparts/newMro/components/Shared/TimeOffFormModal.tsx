import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';

interface TimeOffTypeOption {
  Title: string;
  isPTOEligible: boolean;
}

interface PTOFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ptoBalance: number;
  dates: string[];
  days: string[];
  timeOffTypes: TimeOffTypeOption[];
  ptoFormData: any
}

interface RowData {
  type: string | null;
  isPTOEligible?: boolean;
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
  ptoFormData
}: PTOFormModalProps) => {

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const selectRefs = useRef<(HTMLDivElement | null)[]>([]);

  const createEmptyRow = (): RowData => ({
    type: null,
    isPTOEligible: undefined,
    hours: Array(days.length).fill(''),
    total: 0
  });
const mapPtoFormDataToRows = (data: any[], days: string[], timeOffTypes: TimeOffTypeOption[]): RowData[] => {
  return data.map(item => {
    // Find matching timeOffType object by Title (case-insensitive)
    const foundType = timeOffTypes.find(t => t.Title.toLowerCase() === item.TimeOffType.toLowerCase());
    
    return {
      type: item.TimeOffType,
      isPTOEligible: foundType?.isPTOEligible,
      hours: days.map(day => (item[day] !== undefined ? String(item[day]) : '')),  // convert all to string for input
      total: Number(item.Total) || 0,
    };
  });
};

  const [rows, setRows] = useState<RowData[]>([createEmptyRow()]);
  const [columnTotals, setColumnTotals] = useState<number[]>(Array(days.length).fill(0));
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [focusedInput, setFocusedInput] = useState<{ row: number; day: number } | null>(null);

  useEffect(() => {
  if (isVisible) {
    if (ptoFormData.length && days.length && timeOffTypes.length) {
      const mappedRows = mapPtoFormDataToRows(ptoFormData, days, timeOffTypes);
      setRows(mappedRows);
    } else {
      setRows([createEmptyRow()]);
    }
    setColumnTotals(Array(days.length).fill(0));
    setGrandTotal(0);
    setErrorMessage('');
  }
}, [isVisible, ptoFormData, days, timeOffTypes]);

//   const handleHourChange = (rowIndex: number, dayIndex: number, value: string) => {
//     if (!/^\d*\.?\d*$/.test(value)) return;

//     const updatedRows = [...rows];
//     if (value === '' || value === '.') {
//       updatedRows[rowIndex].hours[dayIndex] = '';
//     } else {
//       updatedRows[rowIndex].hours[dayIndex] = parseFloat(value);
//     }
//     calculateTotals(updatedRows);
//   };

//   const handleHourChange = (rowIndex: number, dayIndex: number, value: string) => {
//   // Allow only digits and at most one dot
//   if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
//     const updatedRows = [...rows];
    
//     // Disallow input of only '.' (just a dot)
//     if (value === '.') {
//       // Don't update state on single dot input
//       return;
//     }
    
//     // Convert to number or empty string
//     const numValue = value === '' ? '' : parseFloat(value);
//     updatedRows[rowIndex].hours[dayIndex] = numValue;
    
//     calculateTotals(updatedRows);
//   }
// };

const handleHourChange = (rowIndex: number, dayIndex: number, value: string) => {
  // Allow only digits and at most one dot
  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
    // Disallow only '.' (just dot)
    if (value === '.') {
      return; // ignore this input
    }
    const updatedRows = [...rows];
    updatedRows[rowIndex].hours[dayIndex] = value;
    calculateTotals(updatedRows);
  }
};

  const handleTypeChange = (rowIndex: number, selectedOption: any) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].type = selectedOption?.value ?? null;
    updatedRows[rowIndex].isPTOEligible = selectedOption?.isPTOEligible ?? undefined;
    setRows(updatedRows);
  };

//   const calculateTotals = (updatedRows: RowData[]) => {
//     // updatedRows.forEach((row) => {
//     //   row.total = row.hours.reduce((acc, h) => acc + (typeof h === 'number' ? h : 0), 0);
//     // });

//     updatedRows.forEach((row) => {
//         row.total = Number(row.hours.reduce((acc: number, h): number => {
//         return acc + (typeof h === 'number' ? h : 0);
//     }, 0));

//   });
    

//     const dayTotals = days.map((_, dayIndex) =>
//       updatedRows.reduce((sum, row) => {
//         const val = row.hours[dayIndex];
//         return sum + (typeof val === 'number' ? val : 0);
//       }, 0)
//     );

//     const totalSum = updatedRows.reduce((acc, row) => acc + row.total, 0);

//     setRows([...updatedRows]);
//     setColumnTotals(dayTotals);
//     setGrandTotal(totalSum);
//   };

  const calculateTotals = (updatedRows: RowData[]) => {
  updatedRows.forEach(row => {
    row.total = Number(row.hours.reduce((acc, h) => {
      const num = parseFloat(h);
      return acc + (isNaN(num) ? 0 : num);
    }, 0));
  });

  const dayTotals = days.map((_, dayIndex) =>
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

    inputRefs.current.forEach(row =>
      row?.forEach(input => input?.classList.remove('mandatory-form-content-focus'))
    );
    selectRefs.current.forEach(select =>
      select?.classList.remove('mandatory-form-content-focus')
    );

    if (grandTotal > ptoBalance) {
      setErrorMessage('Grand total exceeds PTO balance.');
      return false;
    }

    for (let i = 0; i < columnTotals.length; i++) {
      if (columnTotals[i] > 8) {
        setErrorMessage(`Total hours for ${days[i]} (${dates[i]}) exceed 8 hours.`);
        return false;
      }
    }

    //
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.type) {
        setErrorMessage(`Time off type is required for row ${i + 1}.`);
        const select = selectRefs.current[i];
        if (select) {
          select.classList.add('mandatory-form-content-focus');
          select.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }

      if (row.total === 0) {
        setErrorMessage(`Total hours for row ${i + 1} cannot be zero.`);
        const input = inputRefs.current[i]?.[0];
        if (input) {
          input.classList.add('mandatory-form-content-focus');
          input.focus();
        }
        return false;
      }
    }

    //

    // for (let i = 0; i < rows.length; i++) {
    //   const row = rows[i];
    //   if (!row.type) {
    //     setErrorMessage(`Time off type is required for row ${i + 1}.`);
    //     return false;
    //   }
    //   if (row.total === 0) {
    //     setErrorMessage(`Total hours for row ${i + 1} cannot be zero.`);
    //     return false;
    //   }
    // }

    //   row.hours.some((h) => typeof h === 'number' && h > 0)
    const hasAtLeastOneEntry = rows.some((row) =>
         row.hours.some((h) => parseFloat(h) > 0)
    );

    if (!hasAtLeastOneEntry) {
      setErrorMessage('At least one day must have hours.');
      const input = inputRefs.current[0]?.[0];
      if (input) {
        input.classList.add('mandatory-form-content-focus');
        input.focus();
      }
      return false;
    }
    

    setErrorMessage('');
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const TimeOffData = rows.map((row) => {
      const rowObj: any = {
        TimeOffType: row.type,
        Total: row.total
      };
      days.forEach((day, index) => {
        const val = parseFloat(row.hours[index]);
        const hrs = isNaN(val)?'':val
        rowObj[day] =  hrs;
      });
      return rowObj;
    });

    const ptoRows = rows.filter(r => r.isPTOEligible);
    const toRows = rows.filter(r => !r.isPTOEligible);

    const getSubTotal = (rows: RowData[], label: string) => {
      const subtotal: any = { Type: label };
      days.forEach((_, index) => {
        subtotal[days[index]] = rows.reduce((sum, row) => {
          const h = parseFloat(row.hours[index]);
          return sum + (isNaN(h) ? 0 : h);
        }, 0);
      });
      return subtotal;
    };

    const PTOSubTotal = getSubTotal(ptoRows, 'Paid Time Off');
    const TOSubTotal = getSubTotal(toRows, 'Time Off');
    const PTOTotal =  Object.keys(PTOSubTotal).reduce((acc, key) => {
                            const val = parseFloat((PTOSubTotal as any)[key]);
                            return acc + (isNaN(val) ? 0 : val);
                        }, 0);
    PTOSubTotal['Total'] = PTOTotal

    const TOTotal = Object.keys(TOSubTotal).reduce((acc, key) => {
                            const val = parseFloat((PTOSubTotal as any)[key]);
                            return acc + (isNaN(val) ? 0 : val);
                        }, 0);
    TOSubTotal['Total'] = TOTotal
    
    const finalOutput = {
      TimeOffData,
      GrandTotal: {
        Total: grandTotal,
        ...days.reduce((acc, d, i) => {
                acc[d] = columnTotals[i] > 0 ? columnTotals[i] : '';
                return acc;
            }, {} as Record<string, number | string>)

      },
      PTOSubTotal,
      TOSubTotal,
      PTOTotal,
      TOTotal
    };

    onSubmit(finalOutput);
    onClose();
  };

  useEffect(() => {
    calculateTotals(rows);
  }, []);

//   useEffect(() => {
//   if (isVisible) {
//     const emptyRow = createEmptyRow();
//     setRows([emptyRow]);
//     setColumnTotals(Array(days.length).fill(0));
//     setGrandTotal(0);
//     setErrorMessage('');
//   }
// }, [isVisible]);

  const selectOptions = timeOffTypes.map(t => ({ label: t.Title, value: t.Title, isPTOEligible: t.isPTOEligible }));

  return isVisible ? (
    <div className="modal" tabIndex={-1} style={{ display: 'block' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">PTO Request Form</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="table-responsive">
              <table className="table table-bordered text-center align-middle">
                <thead>
                  <tr>
                    <th>Time Off Type</th>
                    {days.map((day, index) => (
                      <th key={index}>{`${day} (${dates[index]})`}</th>
                    ))}
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td style={{ width: 220 }}>
                        <Select
                         ref={(ref) => {
                            if (ref) {
                              const el = ref.controlRef?.parentElement;
                              selectRefs.current[rowIndex] = el;
                            }
                          }}
                          options={selectOptions}
                          value={row.type ? selectOptions.find(opt => opt.value === row.type) : null}
                          onChange={(selected) => handleTypeChange(rowIndex, selected)}
                          isClearable
                        />
                      </td>
                      {days.map((_, dayIndex) => (
                        <td key={dayIndex}>
                          <input
                            ref={(el) => {
                              if (!inputRefs.current[rowIndex]) inputRefs.current[rowIndex] = [];
                              inputRefs.current[rowIndex][dayIndex] = el;
                            }}
                            type="text"
                            className={`form-control text-center ${focusedInput?.row === rowIndex && focusedInput.day === dayIndex ? 'mandatory-form-content-focus' : ''}`}
                            value={row.hours[dayIndex]}
                            onChange={(e) => handleHourChange(rowIndex, dayIndex, e.target.value)}
                            onFocus={() => setFocusedInput({ row: rowIndex, day: dayIndex })}
                          />
                        </td>
                      ))}
                      <td>{row.total}</td>
                      <td>
                        {rows.length === 1 ? (
                          <button className="btn btn-sm btn-success" onClick={addRow}>＋</button>
                        ) : rowIndex === rows.length - 1 ? (
                          <>
                            <button className="btn btn-sm btn-danger me-1" onClick={() => deleteRow(rowIndex)}>🗑</button>
                            <button className="btn btn-sm btn-success" onClick={addRow}>＋</button>
                          </>
                        ) : (
                          <button className="btn btn-sm btn-danger" onClick={() => deleteRow(rowIndex)}>🗑</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td><strong>Grand Total</strong></td>
                    {columnTotals.map((total, index) => (
                      <td key={index}><strong>{total}</strong></td>
                    ))}
                    <td><strong>{grandTotal}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <span className="text-danger">{errorMessage}</span>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={handleSubmit} className="btn btn-primary">Submit</button>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default PTOFormModal;
