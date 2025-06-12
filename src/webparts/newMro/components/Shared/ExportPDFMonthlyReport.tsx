import React, { useState } from "react";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Loader from './Loader';
import { StatusType, ToasterTypes } from "../../Constants/Constants";
import customToaster from "./Toaster.component";

const ExportPDFMonthlyReport = ({ ReportData,ReportHeaders,ReportFields,ClientName,DateRange, filename,LogoImgUrl,btnTitle='Export to PDF',className=''}) => {
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
      // Define styles for the tables
      const styles = {
        //Below are Monthly Report CSS
        Section_Header: {
            fontSize:16,
            bold: true,
            alignment:'center',
            color:'#ffffff',
            margin:[0, 10, 0, 5],
        },
         Field_header: {
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
        Timesheet_header_Client: {
            fontSize:11,
            bold: true,
            margin: [0, 5, 0, 5],
            colSpan:2,
            alignment: 'center',
            // color:'#ffffff',
        },
        Timesheet_header_DateRange: {
            fontSize:11,
            bold: true,
            margin: [0, 5, 0, 5],
            colSpan:4,
            alignment: 'center',
            // color:'#ffffff',
        },
        Hcenter_cell: {
            fontSize:11,
            bold: false,            
            alignment: 'center',
            margin: [0, 150, 0, 0]
        },
        HVcenter_cell: {
            fontSize:11,
            bold: false,            
            alignment: 'center',
            margin: [0, 150, 0, 0],
        },
    };
    const closeLoader=()=>{
        setLoading(false);
    }
    //Below functions to generate PDF as Monthly report formate
    const generatePDFReport = async () => {
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
                let FiledsTable=getFieldsTable();
                let ReportTable=getTimesheetReport(ReportData);
                let TimesheetTabelWidths=['5%','19%','19%','19%','19%','19%'];
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
                            body: [[{text:'Timesheet Bi-Weekly Report',style: styles.Section_Header}]]
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
                            widths: ['11%', '1%','30%','8%', '1%','20%','8%', '1%','20%'],
                            body: FiledsTable
                        },
                        //layout: 'lightHorizontalLines',
                        layout: 'noBorders',
                        style: 'tableBorder',
                    },
                    { text: '\n' }, // Add space between tables
                    {
                        table: {
                            headerRows: 1,
                            widths: TimesheetTabelWidths,
                            body: ReportTable,
                        },
                        layout:{
                            fillColor: function (rowIndex, node, columnIndex) {
                                // return (rowIndex === 0) ?'#c2dce7':(rowIndex === 1) ? '#CCCCCC' : null;  // Alternating row colors //two rows heading
                                return (rowIndex === 0) ?'#CCCCCC' : null; //one row heading
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
                    // (Number(index)==FilteredTimehseets.length-1)?{ text: '\n' }:
                    //{ text: '\n',pageBreak: 'after' }, // Add space between tables and page breaks of each timesheet except last  timesheet
                );
            documentDefinition.content=tables;
            // Generate PDF and download
            pdfMake.createPdf(documentDefinition).download(`${filename}.pdf`,closeLoader);
    };
    const getFieldsTable=() =>{
        var FieldsData=[];
        FieldsData.push([{text:'Client Name',style:styles.Field_header},':',ReportFields.ClientName,{text:'Start Date',style:styles.Field_header},':',ReportFields.StartDate,{text:'End Date',style:styles.Field_header},':',ReportFields.EndDate]);
        return FieldsData;
    }
    const getTimesheetReport=(TimesheetData) =>{
        var EmployeeRows=[];
        //For table  heading row
        let tableHeadRow=[];
        //For first rwo heading
        // tableHeadRow.push({text:ClientName, style: styles.Timesheet_header_Client,colSpan:styles.Timesheet_header_Client.colSpan});
        // tableHeadRow.push({text:'', style: styles.Timesheet_header}); // 2 column merged
        // tableHeadRow.push({text:DateRange, style: styles.Timesheet_header_DateRange,colSpan:styles.Timesheet_header_DateRange.colSpan});
        // for(let i=1;i<=3;i++) // 4 columns merged
        // {
        //     tableHeadRow.push({text:'', style: styles.Timesheet_header});
        // }
        //EmployeeRows.push(tableHeadRow);
        //For second rwo heading
        tableHeadRow=[];
        ReportHeaders.map((Item,index)=>{
            tableHeadRow.push({text:Item, style: styles.Timesheet_header});
        });
        EmployeeRows.push(tableHeadRow);
        //For table body rows
        let SlNo=1;
        for(let EmployeeName in TimesheetData)
        {
            let tableBodyRow=[];
            let noOfWeeks=1;
            for(let WeekObj of TimesheetData[EmployeeName])
            {
                tableBodyRow=[];
                if(noOfWeeks==1) //rowSpan,colSpan did not worked directly in styles
                {
                    tableBodyRow.push({text:SlNo,style:styles.HVcenter_cell ,rowSpan:TimesheetData[EmployeeName].length,vAlign: 'middle',lineheight:2}); //for S.No row merging
                    tableBodyRow.push({text:WeekObj.EmployeeName,style:styles.HVcenter_cell ,rowSpan:TimesheetData[EmployeeName].length,vAlign: 'middle',lineheight:2});//for EmployeeName row merging
                }
                else{
                    tableBodyRow.push({text:'',style:styles.Hcenter_cell});
                    tableBodyRow.push({text:'',style:styles.Hcenter_cell}); 
                }
                tableBodyRow.push({text:WeekObj.DateRange,style:styles.Hcenter_cell});
                tableBodyRow.push({text:WeekObj.BillableHours,style:styles.Hcenter_cell});
                tableBodyRow.push({text:WeekObj.ApprovedBy,style:styles.Hcenter_cell});
                tableBodyRow.push({text:WeekObj.ApprovedOn,style:styles.Hcenter_cell});
                noOfWeeks++;
                EmployeeRows.push(tableBodyRow);
            }
            SlNo++;
           
        }
        return EmployeeRows;
    }
    return (
        <>
        {loading && <Loader />}
        <a type="button" title={btnTitle} id={className=='a-export-pdf-button'?"btnDownloadPDFFile":''} className={ className+" txt-center"} onClick={(e) => generatePDFReport()}>
            {className=='a-export-pdf-button'?'Export to PDF':''}<FontAwesomeIcon icon={faFilePdf} className=''></FontAwesomeIcon>
        </a>
        </>
    );
};
export default ExportPDFMonthlyReport;