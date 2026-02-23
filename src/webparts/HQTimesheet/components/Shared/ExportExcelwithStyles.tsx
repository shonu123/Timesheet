import * as React from 'react';
import * as XLSX from 'xlsx-js-style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';

const ExportExcelwithStyles = ({ tableData,columns,ExcelHeader, filename,wrapColumnsArray,LargeWidthColumnsArray=[] }) => {

const exportToexcel = (dataTable) => {
    const columnOrder =[]
    for (const c of columns) {
        columnOrder.push(c.selector)
    }
    if(wrapColumnsArray==undefined){
        wrapColumnsArray = []
    }
    const wb = XLSX.utils.book_new();
    const workSheetRows = [];
    let Merges=[];
    let headerRow = [];

    //for first row as Header
    ExcelHeader=[null,undefined,''].includes(ExcelHeader)?'':ExcelHeader;
    if(ExcelHeader.trim()!='')
    {
         Merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length-1 } });//1st row header merging
        for (let i in columns) {
            let obj = {}
            if(parseInt(i)==0){
                obj= { v: ExcelHeader, t: "s", s: {alignment: { wrapText: true,vertical: "center", horizontal: "center"},font: { bold: true,color: { rgb: 'FFFFFF' },sz: 15},outerWidth:250,fill: { fgColor: { rgb: '0D2F4B' } }, border: {
                    top: { style: 'thin', color: { rgb: "D9D9D9" } },
                    left: { style: 'thin', color: { rgb: "D9D9D9" } },
                    bottom: { style: 'thin', color: { rgb: "D9D9D9" } },
                    right: { style: 'thin', color: { rgb: "D9D9D9" } },
                }} };
            }
            else{
                obj = {v:'',t:"s",s:{font: { bold: true,color: { rgb: 'FFFFFF' },sz: 15},outerWidth:250,fill: { fgColor: { rgb: '0D2F4B' } },border: {
                    top: { style: 'thin', color: { rgb: "D9D9D9" } },
                    left: { style: 'thin', color: { rgb: "D9D9D9" } },
                    bottom: { style: 'thin', color: { rgb: "D9D9D9" } },
                    right: { style: 'thin', color: { rgb: "D9D9D9" } },
                }}} 
            }
            headerRow.push(obj);
        }
        workSheetRows.push(headerRow);
    }
    // STEP 2: Create data rows and styles
    headerRow = [];
    for (const h of columns) {
        let obj = {}
        if(wrapColumnsArray.includes(h.selector)){
            obj= { v: h.name, t: "s", s: {alignment: { wrapText: true },font: { bold: true,color: { rgb: 'FFFFFF' },sz: 13},outerWidth:250,fill: { fgColor: { rgb: ExcelHeader.trim()!=''?'366092':'0D2F4B' } }, border: {
                top: { style: 'thin', color: { rgb: "D9D9D9" } },
                left: { style: 'thin', color: { rgb: "D9D9D9" } },
                bottom: { style: 'thin', color: { rgb: "D9D9D9" } },
                right: { style: 'thin', color: { rgb: "D9D9D9" } },
            }} };
        }
        else{
            obj = {v:h.name,t:"s",s:{font: { bold: true,color: { rgb: 'FFFFFF' },sz: 13},outerWidth:250,fill: { fgColor: { rgb: ExcelHeader.trim()!=''?'366092':'0D2F4B' } },border: {
                top: { style: 'thin', color: { rgb: "D9D9D9" } },
                left: { style: 'thin', color: { rgb: "D9D9D9" } },
                bottom: { style: 'thin', color: { rgb: "D9D9D9" } },
                right: { style: 'thin', color: { rgb: "D9D9D9" } },
            }}} 
        }
        headerRow.push(obj);
    }
    workSheetRows.push(headerRow)
    wrapColumnsArray = wrapColumnsArray==null? []:wrapColumnsArray;
    dataTable.forEach((item) => {
        let tempArr = [];
        columnOrder.forEach((key) => { 
            if (key !== "Id" && item.hasOwnProperty(key)) { 
                let value = item[key];
                let cellObj = {}
                if(wrapColumnsArray.includes(key)){
                    cellObj= { v: value, t: "s", s: {alignment: { wrapText: true,vertical: "center" },font: { bold: false },border: {
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    } } };
                }
                else{
                    cellObj= { v: value, t: "s", s: { alignment: {vertical: "center"},font: { bold: false },border: {
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    } }};          
                }
                tempArr.push(cellObj);
            }
        });
        workSheetRows.push(tempArr);
    });

// STEP 3: Create worksheet with rows; Add worksheet to workbook
const finalWorkshetData =   XLSX.utils.aoa_to_sheet(workSheetRows)

//custom widths for columns
let Widths=[];
// Adjust the width here (in characters)
columns.forEach(column => {
    if(LargeWidthColumnsArray.includes(column.selector))
    Widths.push({ wch: 35 }) //for large width columns
    else
    Widths.push({ wch: 25 }) //for rest of columns
});
finalWorkshetData['!cols'] =Widths;

//custom Heights for rows
let Heights=[];
// Adjust the height here (in points)
Heights.push({ hpt: 30 }) //for heading 1st row
dataTable.forEach(Row=>{
    let MultiLineCellTextRows=0;
        columns.forEach(element => {
            if(Row[element.selector].toString().includes('\n'))
            {
                if((Row[element.selector].toString().split('\n').length)-1>MultiLineCellTextRows)
                MultiLineCellTextRows=(Row[element.selector].toString().split('\n').length)-1;
            }
    });

        if(MultiLineCellTextRows>1)
        Heights.push({ hpt: MultiLineCellTextRows*20 }) //for Multi line of rows
        else
        Heights.push({ hpt: 25 }) //for rest of rows
})
finalWorkshetData['!rows'] =Heights;
finalWorkshetData["!merges"] = Merges;
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
