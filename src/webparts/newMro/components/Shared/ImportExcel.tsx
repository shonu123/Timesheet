import React from 'react';
// import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx-js-style';

const ImportExcel = ({ onDataFetch, submitData, filename, columns, ErrorFileSelect }) => {

  const exportExcelFile = (workbook) => {
    return XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const readExcel = (file, event) => {
    // var validExts = new Array(".xlsx");
    // var fileExt = file.name;
    // fileExt = fileExt.substring(fileExt.lastIndexOf('.'));

    // if (file.name.includes(filename))
    if (true) 
    {
      const promise = new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);

        fileReader.onload = (e) => {
          const bufferArray = fileReader.result;

          const workbook = XLSX.read(bufferArray, { type: "buffer" });

          const wsname = workbook.SheetNames[0];

          const worksheet = workbook.Sheets[wsname];

          const data = XLSX.utils.sheet_to_json(worksheet,{raw: false});

          resolve(data);
          // setItems(data);
          onDataFetch(data);
          submitData();
        };

        fileReader.onerror = (error) => {
          reject(error);
        };
      });
    } else {
      // alert('please upload vendor file');
      ErrorFileSelect();
    }
    // promise.then((data) => {
    //   setItems(data);
    // });
  };

  const openDialog = () => {
    document.getElementById('inputFile').click();
  };

  const onTemplateClick = () => {
    var Heading = [];
    var row =[]
for (const c of columns) {
  let obj = {}
  obj = {v:c,t:"s",s:{font: { bold: true}}}
  row.push(obj)
}
Heading.push(row);

    var ws = XLSX.utils.aoa_to_sheet(Heading);
    // XLSX.utils.sheet_add_json(ws, [], {
    //   skipHeader: true,
    //   origin: -1
    // });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holidays List");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    // exportExcelFile(wb);

  };

  return (
    <React.Fragment>

      <span className='span-link' onClick={onTemplateClick} >
        Download template to import the data
      </span>

      <input className="pl-4" style={{ width: "214px" }} type="file" accept=".xlsx" id="inputFile" onChange={(e) => {
        const file = e.target.files[0];
        readExcel(file, e);
      }} hidden></input>
      {/* <button id="btnImport" style={{ width: "inherit" }} className="SubmitButtons btn" type="button" onClick={submitData}>Import Excel</button> */}
      <button id="btnImport" className="SubmitButtons btn" style={{ width: "inherit" }} onClick={openDialog} type="button" title='Import Excel'>Import Excel</button>
    </React.Fragment>
  );
};

export default ImportExcel;