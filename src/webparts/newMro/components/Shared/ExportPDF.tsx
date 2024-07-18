import * as React from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Loader from '../Shared/Loader';
const ExportToPDF = ({ AllTimesheetsData, filename,LogoImgUrl}) => {
    var loading=false;
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    const fetchImageAsBase64 = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error fetching image:', error);
            return null;
        }
    };
      // Define styles for the tables
      const styles = {
        Employee_header: {
            fontSize:14,
            bold: true,
            margin: [0, 5, 0, 5],
        },
        Timesheet_header: {
            fontSize:14,
            bold: true,
            margin: [0, 5, 0, 5],
            alignment: 'center',
        },
        Sat_Sun_header:{
            color: '#f15e5e',
            fontSize:14,
            bold: true,
            margin: [0, 5, 0, 5],
            alignment: 'center',
        },
        cell: {
            bold: false,            
            alignment: 'center',
            margin: [0, 150, 0, 0]
        },
        Sat_Sun_cell:
        {
        color:'#f15e5e',
        alignment: 'center',
        },
        billableTotal_cell:
        {
           fillColor:'#f5d8d8 ',
           bold: true,  
           alignment: 'center',
           margin: [0, 150, 0, 0]
        },
        grandTotal_cell:
        {
           bold: true,  
           alignment: 'center',
           margin: [0, 150, 0, 0]
        },
        Desc_PrjCode_header: {
            fontSize:14,
            bold: true,
            margin: [0, 20, 0, 0],
            alignment: 'center',
            padding: [0, 20, 0, 0],
        },
    };
    const generatePDF = async () => {
        loading=true;
        // Convert local image to Base64 data URL
        const logoBase64 = await fetchImageAsBase64(LogoImgUrl);
        // Create a pdfMake document definition
        const documentDefinition = {
            content: [
            ],
            pageSize: 'A4',
            pageOrientation: 'landscape',
            // styles: {
            //     Timesheet_header: styles.Timesheet_header,
            //     cell: styles.cell,
            //     tableBorder: styles.tableBorder,
            // },
        };
        var tables=[];
        for(let index in AllTimesheetsData)
        {
            let employeeTable= getEmployeeData(AllTimesheetsData[index])
            let timesheetTable=getTimesheetData(AllTimesheetsData[index]);
            //let historyTable=(AllTimesheetsData[index].CommentsHistory.length>0)?getActionHistoryData(AllTimesheetsData[index]):['','','',''];
            tables.push(
                { 
                    image:logoBase64, 
                    width: 150, 
                    height:30,
                    alignment: 'left' 
                },
                { text: '\n' }, // Add space between tables 
                {
                    table: {
                        headerRows: 1,
                        widths: ['35%', '35%', '30%'],
                        body: employeeTable
                    },
                    layout: 'lightHorizontalLines',
                    style: 'tableBorder',
                },
                { text: '\n' }, // Add space between tables
                {
                    table: {
                        headerRows: 1,
                        widths: ['15%', '30%', '15%', '5%', '5%', '5%', '5%', '5%', '5%', '5%', '5%'],
                        body: timesheetTable,
                    },
                    layout:{
                        fillColor: function (rowIndex, node, columnIndex) {
                            return (rowIndex === 0) ? '#CCCCCC' : null;  // Alternating row colors
                        },
                        hLineWidth: function (i, node) {
                            return 1; // horizontal line width
                        },
                        vLineWidth: function (i, node) {
                            return 1; // vertical line width
                        },
                        hLineColor: function (i, node) {
                            return '#AAAAAA'; // horizontal line color
                        },
                        vLineColor: function (i, node) {
                            return '#AAAAAA'; // vertical line color
                        }
                    },
                   style: 'tableBorder',
                },
                // { text: '\n' }, // Add space between tables
                // {
                //     table: {
                //         headerRows: 1,
                //         widths: ['20%', '10%', '20%', '50%'],
                //         body: historyTable,
                //     },
                //     layout: {
                //         fillColor: function (rowIndex, node, columnIndex) {
                //             return (rowIndex === 0) ? '#CCCCCC' : null;  // Alternating row colors
                //         },
                //         hLineWidth: function (i, node) {
                //             return 1; // horizontal line width
                //         },
                //         vLineWidth: function (i, node) {
                //             return 1; // vertical line width
                //         },
                //         hLineColor: function (i, node) {
                //             return '#AAAAAA'; // horizontal line color
                //         },
                //         vLineColor: function (i, node) {
                //             return '#AAAAAA'; // vertical line color
                //         }
                //     },
                //     style: 'tableBorder',
                // },
                (Number(index)==AllTimesheetsData.length-1)?{ text: '\n' }:
                { text: '\n',pageBreak: 'after' }, // Add space between tables and page breaks of each timesheet except last  timesheet
            );
        }
        documentDefinition.content=tables;
        // Generate PDF and download
        pdfMake.createPdf(documentDefinition).download(`${filename}.pdf`);
        loading=false;
    };
    const getEmployeeData=(TimesheetData) =>{
        var EmpData=[];
        EmpData.push([{text:'Name',style:styles.Employee_header},{text:'Client',style:styles.Employee_header},{text:'Weekly Start Date',style:styles.Employee_header}]);
        EmpData.push([TimesheetData.EmployeName,TimesheetData.Client,TimesheetData. Date]);
        return EmpData;
    }
    const getTimesheetData=(TimesheetData) =>{
        var TimesheetRows=[];
        var weeks= ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var  Months= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        //For table  heading row
        var tableHeadRow=[{ text: '', style: styles.Timesheet_header},
        { text: 'Description', style: styles.Desc_PrjCode_header },
        { text: 'Project Code', style: styles.Desc_PrjCode_header },];
        var WeekStartDate=new Date(TimesheetData.Date);
        for(let i=0;i<=6;i++)
        {
            let Obj={text:weeks[WeekStartDate.getDay()]+' '+(WeekStartDate.getDate().toString().length==1?'0'+WeekStartDate.getDate():WeekStartDate.getDate())+'  '+Months[WeekStartDate.getMonth()], style: ([0,6].includes(WeekStartDate.getDay()))?styles.Sat_Sun_header:styles.Timesheet_header};
            tableHeadRow.push(Obj);
            WeekStartDate=new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1));
        }
        tableHeadRow.push({text: 'Total', style: styles.Timesheet_header});
        TimesheetRows.push(tableHeadRow);
        //For table body rows
        var tableBodyRow=[];
        if(TimesheetData.Client.toLowerCase().includes('synergy'))
        {
            // for Synergy Office Hours
            tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.SynergyOfficeHrs[0],'Office Hours',0);
            TimesheetRows.push(tableBodyRow);
        }
        else{
             //for Weekly Hours
             for(let i in TimesheetData.WeeklyHrs)
             {
                tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.WeeklyHrs[i],'Billable Hours',i);
                TimesheetRows.push(tableBodyRow);
             }
             //for OT Hours
             for(let i in TimesheetData.OverTimeHrs)
             {
                tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.OverTimeHrs[i],'Overtime',i);
                TimesheetRows.push(tableBodyRow);
             }
        }            
        // for Client Holiday Hours
        tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.ClientHolidayHrs[0],'Holiday',0);
        TimesheetRows.push(tableBodyRow);
        // for Time Off Hours
        tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.TimeOffHrs[0],'Time Off',0);
        TimesheetRows.push(tableBodyRow);
        if(!TimesheetData.Client.toLowerCase().includes('synergy'))
        {
            //for Billable subtotal Hours
            tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.BillableSubtotalHrs[0],'Billable Total',0);
            TimesheetRows.push(tableBodyRow);
        }
        // for Grand Total Hours
        tableBodyRow=getTimesheetBodyRow(TimesheetData,TimesheetData.TotalHrs[0],'Grand Total',0);
        TimesheetRows.push(tableBodyRow);

        return TimesheetRows;
    }
    const getTimesheetBodyRow=(TimesheetData,RowObj,Rotype,RowIndex)=>
    { 
       var weeks= ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
       var tableBodyRow=[];
       var WeekStartDate=new Date(TimesheetData.Date);
       Number(RowIndex)==0?tableBodyRow.push(Rotype):tableBodyRow.push('');
       ['Office Hours','Billable Hours','Overtime','Holiday','Time Off'].includes(Rotype)?tableBodyRow.push(RowObj.Description):tableBodyRow.push('');
       ['Office Hours','Billable Hours','Overtime','Holiday','Time Off'].includes(Rotype)?tableBodyRow.push(RowObj.ProjectCode):tableBodyRow.push('');
        for (let i = 0; i <= 6; i++) {
            tableBodyRow.push({text:RowObj[weeks[WeekStartDate.getDay()]],style:([0,6].includes(WeekStartDate.getDay()))?styles.Sat_Sun_cell:styles.cell});
            WeekStartDate = new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1));
        }
        tableBodyRow.push({text:RowObj.Total,style:(Rotype=='Billable Total')?styles.billableTotal_cell:(Rotype=='Grand Total')?styles.grandTotal_cell :styles.cell});
        return tableBodyRow;
    }
    const getActionHistoryData=(TimesheetData)=>
    { 
        var HistoryRows=[];
        var tableHeadRow=['Action By', 'Status', 'Date & Time (EST)', 'Comments'];
        HistoryRows.push(tableHeadRow);
        var tableBodyRow=[];
         for(let obj of TimesheetData.CommentsHistory)
         {
           let DateAndTime=(new Date(obj.Date).getMonth().toString().length == 1 ? "0" + (new Date(obj.Date).getMonth() + 1) : new Date(obj.Date).getMonth() + 1) + "/" + (new Date(obj.Date).getDate().toString().length == 1 ? "0" + new Date(obj.Date).getDate() : new Date(obj.Date).getDate()) + "/" + new Date(obj.Date).getFullYear()+"  " + new Date(obj.Date).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }).split(",")[1] ;
            tableBodyRow=[];
            tableBodyRow.push(obj.User);
            tableBodyRow.push(obj.Action);
            tableBodyRow.push(DateAndTime);
            tableBodyRow.push(obj.Comments);
            HistoryRows.push(tableBodyRow);
         }
        return HistoryRows;
    }
    return (
        <>
        <a type="button" id="btnDownloadFile" className="icon-export-b" onClick={(e) => generatePDF()}>
            <FontAwesomeIcon icon={faFilePdf} className='icon-export-b icon-export-pdf'></FontAwesomeIcon>
        </a>
        {loading && <Loader />}
        </>
    );
};
export default ExportToPDF;