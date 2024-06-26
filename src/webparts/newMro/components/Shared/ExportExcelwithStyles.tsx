import * as React from 'react';
import * as XLSX from 'xlsx-js-style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';

const ExportExcelwithStyles = ({ tableData,columns, filename,wrapColumnsArray }) => {

const exportToexcel = (dataTable,) => {
    const columnOrder =[]
    for (const c of columns) {
        columnOrder.push(c.selector)
    }
    if(wrapColumnsArray==undefined){
        wrapColumnsArray = []
    }
    const wb = XLSX.utils.book_new();
    const workSheetRows = []
    let headerRow = []

    // STEP 2: Create data rows and styles
    for (const h of columns) {
        let obj = {}
        if(wrapColumnsArray.includes(h.selector)){
            obj= { v: h.name, t: "s", s: {alignment: { wrapText: true },font: { bold: true},outerWidth:250} };
        }
        else{
            obj = {v:h.name,t:"s",s:{font: { bold: true},outerWidth:250}}
        }
        headerRow.push(obj);
    }
    workSheetRows.push(headerRow)
    wrapColumnsArray = wrapColumnsArray==null? []:wrapColumnsArray
    dataTable.forEach((item) => {
        let tempArr = [];
        columnOrder.forEach((key) => { 
            if (key !== "Id" && item.hasOwnProperty(key)) { 
                let value = item[key];
                let cellObj = {}
                if(wrapColumnsArray.includes(key)){
                    cellObj= { v: value, t: "s", s: {alignment: { wrapText: true },font: { bold: false },outerWidth:250 } };
                }
                else{
                    cellObj= { v: value, t: "s", s: { font: { bold: false } },outerWidth:250 };          
                }
                tempArr.push(cellObj);
            }
        });
        workSheetRows.push(tempArr);
    });

// STEP 3: Create worksheet with rows; Add worksheet to workbook
const finalWorkshetData =   XLSX.utils.aoa_to_sheet(workSheetRows)

// Enable below code to add filters
// finalWorkshetData['!autofilter'] = { ref: 'A1:C1' };
XLSX.utils.book_append_sheet(wb, finalWorkshetData, `${filename}`);

// STEP 4: Write Excel file to browser
XLSX.writeFile(wb, `${filename}.xlsx`);
};

return (
    <a type="button" id="btnDownloadFile" className="icon-export-b" onClick={(e) => exportToexcel(tableData)}>
        <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
    </a>
);};

export default ExportExcelwithStyles;
