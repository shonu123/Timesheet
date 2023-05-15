import * as React from 'react';
import * as XLSX from 'xlsx';

const ExportExcel = ({ tableData, filename,hidden }) => {
  
    const exportExcelFile = (workbook) => {
        return XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const exportToexcel = (dataTable) => {
        // console.log('excel', tableData);
        var workbook = XLSX.utils.book_new();
        var worksheet_data = XLSX.utils.json_to_sheet(dataTable);

        workbook.SheetNames.push(filename);
        workbook.Sheets[filename] = worksheet_data;

        exportExcelFile(workbook);
    };
    
    return (
        <button type="button" id="btnDownloadFile" className="SaveButtons btn" onClick={(e) => exportToexcel(tableData)} hidden={hidden}>Export 
        </button>
    );
};

export default ExportExcel;