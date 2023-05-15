import * as React from 'react';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';


const ExportExcel = ({ tableData,columns, filename }) => {
  
    const exportExcelFile = (workbook) => {
        return XLSX.writeFile(workbook, `${filename}.xlsx`);
    };
    const exportToexcel = (dataTable,) => {
        let newjson=[];
        dataTable.map((selItem, index) => {
            var obj ={};
            columns.map((column,i) => {
                let name =column.name;
                if(name != 'Edit' && name !="View")
                {
                let seletor =column.selector;
                obj[name] =selItem[seletor];
                }
            });
            newjson.push(obj);
        });

        var workbook = XLSX.utils.book_new();
        var worksheet_data = XLSX.utils.json_to_sheet(newjson);

        workbook.SheetNames.push(filename);
        workbook.Sheets[filename] = worksheet_data;

        exportExcelFile(workbook);
    };
    
    return (
        <a type="button" id="btnDownloadFile" className="icon-export-b" onClick={(e) => exportToexcel(tableData)}>
            <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
        </a>
    );
};

export default ExportExcel;