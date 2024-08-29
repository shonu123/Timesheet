import React, { useState } from "react";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Loader from '../Shared/Loader';
import { StatusType, ToasterTypes } from "../../Constants/Constants";
import customToaster from "./Toaster.component";

const ExportToPDF = ({ AllTimesheetsData, filename,LogoImgUrl,btnTitle='Export to PDF',className=''}) => {
    // var loading=false;
    const [loading,setLoading] = useState(false)
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
    //To filter necessary fields
    const getStatus=(value)=>{
        let Status=value

        if(value == StatusType.Submit.toString()){
            Status = 'Waiting for Manager Approval'
        }
        else if(value == StatusType.ManagerApprove.toString()){
            Status = 'Waiting for Reviewer Approval'
        }
        else if(value == StatusType.Approved.toString()){
            Status = 'Approved'
        }
        else if(value == StatusType.ManagerReject.toString()){
            Status = "Rejected by Reporting Manager"
        }
        else if(value == StatusType.ReviewerReject.toString()){
           Status = "Rejected by Reviewer"
        }
        return Status
    }
    const actionDetails = (status)=>{
        let actionObj = {
            ActionBy: "Approved By",
            ActionDate: "Approved Date"
        }
        if(status == 'Rejected by Reporting Manager' || status == 'Rejected by Reviewer'){
            actionObj.ActionBy = "Rejected By"
            actionObj.ActionDate = "Rejected Date"
        }
        return actionObj
    }
    var FilteredTimehseets=[];
    var weeks= ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var  Months= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    AllTimesheetsData.forEach(timesheet => {
        var WeekStartDate = new Date(timesheet.WeekStartDate.split('-')[1] + '/' + timesheet.WeekStartDate.split('-')[2].split('T')[0] + '/' + timesheet.WeekStartDate.split('-')[0]);
        let WeekEnd=new Date(WeekStartDate);
        var WeekEndDate=new Date(WeekEnd.setDate(WeekEnd.getDate() + 6));
        var SubmittedDate = new Date(timesheet.DateSubmitted.split('-')[1] + '/' + timesheet.DateSubmitted.split('-')[2].split('T')[0] + '/' + timesheet.DateSubmitted.split('-')[0]);
        var CommentsHistory=JSON.parse(timesheet.CommentsHistory);
        var ApprovedDate=new Date(CommentsHistory[CommentsHistory.length-1].Date);
        var ActionBy=CommentsHistory[CommentsHistory.length-1].User;
        FilteredTimehseets.push( 
            {
            EmployeName: timesheet.Name,
            Client: timesheet.ClientName,
            StartDate: `${WeekStartDate.getDate().toString().length==1?'0'+WeekStartDate.getDate():WeekStartDate.getDate()}-${Months[WeekStartDate.getMonth()]}-${WeekStartDate.getFullYear()}`,
            EndDate:`${WeekEndDate.getDate().toString().length==1?'0'+WeekEndDate.getDate():WeekEndDate.getDate()}-${Months[WeekEndDate.getMonth()]}-${WeekEndDate.getFullYear()}`,
            SubmittedDate:`${SubmittedDate.getDate().toString().length==1?'0'+SubmittedDate.getDate():SubmittedDate.getDate()}-${Months[SubmittedDate.getMonth()]}-${SubmittedDate.getFullYear()}`,
            ActionBy:[StatusType.Submit].includes(timesheet.Status)?'NA':ActionBy,
            ApprovedDate:[StatusType.Submit].includes(timesheet.Status)?'NA':`${ApprovedDate.getDate().toString().length==1?'0'+ApprovedDate.getDate():ApprovedDate.getDate()}-${Months[ApprovedDate.getMonth()]}-${ApprovedDate.getFullYear()}`,
            Status: getStatus(timesheet.Status),
            //properties required for PDF download
            WeeklyHrs: JSON.parse(timesheet.WeeklyHrs),
            OverTimeHrs: JSON.parse(timesheet.OverTimeHrs),
            SynergyOfficeHrs: JSON.parse(timesheet.SynergyOfficeHrs),
            ClientHolidayHrs: JSON.parse(timesheet.ClientHolidayHrs),
            TimeOffHrs: JSON.parse(timesheet.PTOHrs),
            BillableSubtotalHrs: JSON.parse(timesheet.BillableSubtotalHrs),
            TotalHrs: JSON.parse(timesheet.TotalHrs),
            CommentsHistory: JSON.parse(timesheet.CommentsHistory),
            })
    })
      // Define styles for the tables
      const styles = {
        Section_Header: {
            fontSize:16,
            bold: true,
            alignment:'center',
            color:'#ffffff',
            margin:[0, 10, 0, 5],
        },
        Rectangle_Shape:
            {
                type: 'rect',
                x: 0,  //horizontal position
                y: 0,  //vertical position
                w: 1000, // shape width
                h: 30,  // shape height
                r: 10,  // Border radius
                lineColor: '#063b55',
                lineWidth: 1,
                fillColor: '#063b55'
            }
        ,
        Employee_header: {
            fontSize:12,
            bold: true,
            margin: [0, 5, 0, 5],
            padding:[10,0,0,0]
        },
        Timesheet_header: {
            fontSize:11,
            bold: true,
            margin: [0, 5, 0, 5],
            alignment: 'center',
        },
        Sat_Sun_header:{
            color: '#f15e5e',
            fontSize:11,
            bold: true,
            margin: [0, 5, 0, 5],
            alignment: 'center',
        },
        cell: {
            fontSize:11,
            bold: false,            
            alignment: 'center',
            margin: [0, 150, 0, 0]
        },
        Sat_Sun_cell:
        {
        fontSize:11,
        color:'#f15e5e',
        alignment: 'center',
        },
        billableTotal_cell:
        {
           fontSize:11,
           fillColor:'#f5d8d8 ',
           bold: true,  
           alignment: 'center',
           margin: [0, 150, 0, 0]
        },
        grandTotal_cell:
        {
           fontSize:11,
           bold: true,  
           alignment: 'center',
           margin: [0, 150, 0, 0]
        },
        Desc_PrjCode_header: {
            fontSize:11,
            bold: true,
            margin: [0, 20, 0, 0],
            alignment: 'center',
            padding: [0, 20, 0, 0],
        },
    };
    const generatePDF = async () => {
        setLoading(true);
        // Convert local image to Base64 data URL
        const logoBase64 = await fetchImageAsBase64(LogoImgUrl);
        // Create a pdfMake document definition
        const documentDefinition = {
            content: [
            ],
            pageSize: 'A4',
            pageOrientation: 'landscape',
            footer: function(currentPage, pageCount) {
                return {
                    margin: [40, 10],
                    columns: [
                        {
                            text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
                            alignment: 'right',
                            fontSize: 12
                        }
                    ]
                };
            },
        };
        var tables=[];
        if(FilteredTimehseets.length>0)
        {
            for(let index in FilteredTimehseets)
            {
                let employeeTable= getEmployeeData(FilteredTimehseets[index])
                let timesheetTable=getTimesheetData(FilteredTimehseets[index]);
                //let historyTable=(FilteredTimehseets[index].CommentsHistory.length>0)?getActionHistoryData(FilteredTimehseets[index]):['','','',''];
                tables.push(
                    { 
                        image:logoBase64, 
                        width: 170, 
                        height:40,
                        alignment: 'left' 
                    },
                    //foe shapes
                    // {canvas:[styles.Rectangle_Shape],
                    // },
                    { text: '\n' }, // Add space between tables 
                    //Table form section header
                    {
                        table: {
                            headerRows: 1,
                            widths: ['100%'],
                            body: [[{text:'Employee Timesheet Details',style: styles.Section_Header}]]
                        },
                        layout:{
                            fillColor: function (rowIndex, node, columnIndex) {
                                return (rowIndex === 0) ? '#063b55' : null;  // Alternating row colors
                            },
                        },
                    },
                    { text: '\n' }, // Add space between tables 
                    {
                        table: {
                            headerRows: 1,
                            //widths: ['35%', '35%', '30%'],
                            widths: ['12%', '1%','37%','12%', '1%','37%'],
                            body: employeeTable
                        },
                        //layout: 'lightHorizontalLines',
                        layout: 'noBorders',
                        style: 'tableBorder',
                    },
                    { text: '\n' }, // Add space between tables
                    {
                        table: {
                            headerRows: 1,
                            widths: ['15%', '20%', '11%', '7%', '7%', '7%', '7%', '7%', '7%', '7%', '5%'],
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
                    (Number(index)==FilteredTimehseets.length-1)?{ text: '\n' }:
                    { text: '\n',pageBreak: 'after' }, // Add space between tables and page breaks of each timesheet except last  timesheet
                );
            }
            documentDefinition.content=tables;
            // Generate PDF and download
            pdfMake.createPdf(documentDefinition).download(`${filename}.pdf`,closeLoader);
        }
        else{
            customToaster('toster-error', ToasterTypes.Error, 'No approved timesheets found!', 4000);
            closeLoader();
        }
        
    };
    const closeLoader=()=>{
        setLoading(false);
    }
    const getEmployeeData=(TimesheetData) =>{
        var EmpData=[];
        //EmpData.push([{text:'Name',style:styles.Employee_header},{text:'Client',style:styles.Employee_header},{text:'Weekly Start Date',style:styles.Employee_header}]);
        //EmpData.push([TimesheetData.EmployeName,TimesheetData.Client,TimesheetData. Date]);
        EmpData.push([{text:'Name',style:styles.Employee_header},':',TimesheetData.EmployeName,{text:'Submitted Date',style:styles.Employee_header},':',TimesheetData.SubmittedDate]);
        EmpData.push([{text:'Client',style:styles.Employee_header},':',TimesheetData.Client,{text:actionDetails(TimesheetData.Status).ActionBy,style:styles.Employee_header},':',TimesheetData.ActionBy]);
        EmpData.push([{text:'Week Start Date',style:styles.Employee_header},':',TimesheetData.StartDate,{text:actionDetails(TimesheetData.Status).ActionDate,style:styles.Employee_header},':',TimesheetData.ApprovedDate]);
        EmpData.push([{text:'Weekend Date',style:styles.Employee_header},':',TimesheetData.EndDate,{text:'Status',style:styles.Employee_header},':',(TimesheetData.Status)]);
        return EmpData;
    }
    const getTimesheetData=(TimesheetData) =>{
        var TimesheetRows=[];
        //For table  heading row
        var tableHeadRow=[{ text: '', style: styles.Timesheet_header},
        { text: 'Description', style: styles.Desc_PrjCode_header },
        { text: 'Project Code', style: styles.Desc_PrjCode_header },];
        var WeekStartDate=new Date(TimesheetData.StartDate);
        for(let i=0;i<=6;i++)
        {
            let Obj={text:weeks[WeekStartDate.getDay()]+'         '+(WeekStartDate.getDate().toString().length==1?'0'+WeekStartDate.getDate():WeekStartDate.getDate())+'  '+Months[WeekStartDate.getMonth()], style: ([0,6].includes(WeekStartDate.getDay()))?styles.Sat_Sun_header:styles.Timesheet_header};
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
       var tableBodyRow=[];
       var WeekStartDate=new Date(TimesheetData.StartDate);
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
        {loading && <Loader />}
        <a type="button" title={btnTitle} id={className=='a-export-pdf-button'?"btnDownloadPDFFile":''} className={ className+" txt-center"} onClick={(e) => generatePDF()}>
            {className=='a-export-pdf-button'?'Export to PDF':''}<FontAwesomeIcon icon={faFilePdf} className=''></FontAwesomeIcon>
        </a>
        </>
    );
};
export default ExportToPDF;