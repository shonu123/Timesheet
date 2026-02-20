// import * as React from 'react';
// import { SPHttpClient } from '@microsoft/sp-http';
// import Formvalidator from '../Utilities/Formvalidator';
// import { ControlType } from '../Constants/Constants';
// import Loader from '../components/Shared/Loader';
// import { sp } from '@pnp/sp';
// import "@pnp/sp/webs";
// import "@pnp/sp/lists";
// import "@pnp/sp/items";
// import "@pnp/sp/attachments";
// import "@pnp/sp/sputilities";
// import "@pnp/sp/files";
// import "@pnp/sp/folders";
// import "@pnp/sp/site-users/web";
// import "@pnp/sp/site-groups";
// import { highlightCurrentNav, highlightCurrentNav2 } from '../Utilities/HighlightCurrentComponent';
// import CustomDatePicker from "../components/Shared/DatePicker";
// import { NavLink, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import customToaster from '../components/Shared/Toaster.component';
// import ExportToPDF from '../components/Shared/ExportPDF';
// import { ToasterTypes } from '../Constants/Constants';
// import { addDays } from 'office-ui-fabric-react';
// import * as XLSX from 'xlsx-js-style';
// import { faEye, faFileExcel, faHistory } from '@fortawesome/free-solid-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { StatusType } from '../Constants/Constants';
// import TableGenerator from '../components/Shared/TableGenerator';
// export interface PTOTransactionHistoryProps {
//     match: any;
//     spContext: any;
//     spHttpClient: SPHttpClient;
//     context: any;
//     history: any;
//     EmployeeId:any;
//     EmployeeTitle:any;
//     isVisible:boolean;
// }
// export interface PTOTransactionHistoryState {
// }

// class PTOTransactionHistory extends React.Component<PTOTransactionHistoryProps, PTOTransactionHistoryState> {

//     private siteURL: string;
//     private EmployeeDropdown;
//     constructor(props: PTOTransactionHistoryProps) {
//         super(props);
//         this.siteURL = this.props.spContext.webAbsoluteUrl;
//         sp.setup({
//             spfxContext: this.props.context
//         });
//         this.EmployeeDropdown = React.createRef();
//     }
//     public state = {
//         Employee: '',
//         Year: new Date().getFullYear(),
//         loading: false,
//         Homeredirect: false,
//         isPageAccessable: true,
//         showToaster: false,
//         PTOTransactionExcelData: [],
//         PTOTransactionData: [],
//         isAdmin: false
//     }
//     public componentDidMount() {
//         highlightCurrentNav("PTOReport");
//         this.setState({ loading: true });
//         this.getOnLoadData()
//     }
//     private async getOnLoadData() {
//         let EmployeeID=this.props.match.params.id;
//         let EmployeeTitle=this.props.match.params.Title;
//         let selectQuery = "Employee/Id,Employee/Title,*"
//         let [groups, PTOTansactions] = await Promise.all([
//             sp.web.currentUser.groups(),
//             sp.web.lists.getByTitle('PTOTransactions').items.expand('Employee').filter("Employee/Id eq "+EmployeeID).select(selectQuery).orderBy('ID', false).getAll()
//         ]);
//         let userGroups = []
//         for (const grp of groups) {
//             userGroups.push(grp.Title)
//         }
//         let isAdmin = false;
//         if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins') || userGroups.includes('Synergycom Timesheet Members')) {
//             this.setState({ isPageAccessable: true })
//             if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
//                 this.setState({ isAdmin: true})
//                 isAdmin = true;
//             }
//         }
//         else {
//             this.setState({ isPageAccessable: false })
//             return false
//         }
//         let Data = [];
//         let ExcelData = [];
//         PTOTansactions.forEach(item=>{
//             let PostedOn = new Date(item.PostedOn.split('-')[1] + '/' + item.PostedOn.split('-')[2].split('T')[0] + '/' + item.PostedOn.split('-')[0]);
//             let From = new Date(item.From.split('-')[1] + '/' + item.From.split('-')[2].split('T')[0] + '/' + item.From.split('-')[0]);
//             let To = new Date(item.To.split('-')[1] + '/' + item.To.split('-')[2].split('T')[0] + '/' + item.To.split('-')[0]);
//             Data.push({
//                 Id: item.Id,
//                 Employee: item.Employee.Title,
//                 TransactionType: item.TransactionType,
//                 PostedOn: `${PostedOn.getMonth() + 1}/${PostedOn.getDate()}/${PostedOn.getFullYear()}`,
//                 From:`${From.getMonth() + 1}/${From.getDate()}/${From.getFullYear()}`,
//                 To:`${To.getMonth() + 1}/${To.getDate()}/${To.getFullYear()}`,
//                 Hours: [null, undefined, ''].includes(item.Hours) ? 0.00 : parseFloat(item.Hours),
//                 Reason:item.Reason,
//             })
//             ExcelData.push({
//                 Id: item.Id,
//                 Employee: item.Employee.Title,
//                 TransactionType: item.TransactionType,
//                 PostedOn: `${PostedOn.getMonth() + 1}/${PostedOn.getDate()}/${PostedOn.getFullYear()}`,
//                 From:`${From.getMonth() + 1}/${From.getDate()}/${From.getFullYear()}`,
//                 To:`${To.getMonth() + 1}/${To.getDate()}/${To.getFullYear()}`,
//                 Hours: [null, undefined, ''].includes(item.Hours) ? 0.00 : parseFloat(item.Hours),
//                 Reason:item.Reason,
//             })
//             }
//             )
//             Data.sort((a, b) => b.Id - a.Id);//acending order
//             this.setState({Employee:EmployeeTitle, PTOTransactionData: Data, PTOTransactionExcelData:ExcelData,loading: false, showToaster: true })
//     }
//     public render() {
//         const columns = [
//             {
//                 name: "",
//                 export: false,
//                 cell: '',
//                 width: '5px'
//             },
//             {
//                 name: "Transaction Type",
//                 selector: (row, i) => row.TransactionType,
//                 width:'200px',
//                 sortable: true
//             },
//             {
//                 name: "Posted On",
//                 selector: (row, i) => row.PostedOn,
//                 width: '150px',
//                 sortable: true
//             },
//             {
//                 name: "From",
//                 selector: (row, i) => row.From,
//                 width: '150px',
//                 sortable: true
//             },
//             {
//                 name: "To",
//                 selector: (row, i) => row.To,
//                 width: '150px',
//                 sortable: true
//             },
//             {
//                 name: "Hours",
//                 selector: (row, i) => row.Hours,
//                 width: '70px',
//                 sortable: true
//             },
//             {
//                 name: "Reason",
//                 selector: (row, i) => row.Reason,
//                 sortable: true,
//             },
//         ];
//         const Exportcolumns = [
//             {
//                 name: "Transaction Type",
//                 selector: "TransactionType",
//                 width:'230px',
//                 sortable: true
//             },
//             {
//                 name: "Posted On",
//                 selector: "PostedOn",
//                 width: '230px',
//                 sortable: true
//             },
//             {
//                 name: "From",
//                 selector: "From",
//                 sortable: true
//             },
//             {
//                 name: "To",
//                 selector: "To",
//                 sortable: true
//             },
//             {
//                 name: "Hours",
//                 selector: "Hours",
//                 sortable: true
//             },
//             {
//                 name: "Reason",
//                 selector: "Reason",
//                 width:'220px',
//                 sortable: true,
//             },
//         ];
//         if (!this.state.isPageAccessable) {
//             let url = this.siteURL + "/SitePages/AccessDenied.aspx"
//             window.location.href = url
//         }
//         if (this.state.Homeredirect) {
//             let url = `/Dashboard/`
//             return (<Navigate to={url} />);
//         }
//         else {
//             return (
//                 <React.Fragment>
//                     <div className='container-fluid'>
//                         <div className='FormContent-2'>
//                             <div className="title">PTO Transaction History
//                                 {/* <div className='mandatory-note'>
//                                     <span className='mandatoryhastrick'>*</span> indicates a required field
//                                 </div> */}
//                             </div>
//                             <div className="after-title"></div>
//                             <div className="media-m-2 media-p-1">
//                                 <div className="my-2">
//                                     <div className="row pt-2 px-3">
//                                         {/* <div className="col-md-4">
//                                             <div className="light-text">
//                                                 <label>Client<span className="mandatoryhastrick">*</span></label>
//                                                 <select className="form-control" required={true} name="ClientName" title="Client" id='client' ref={this.client} onChange={this.handleClientChange}>
//                                                     <option value=''>None</option>
//                                                     {this.state.ClientsObject.map((option) => (
//                                                         <option value={option.Title} selected={option.Title == this.state.ClientName}>{option.Title}</option>
//                                                     ))}
//                                                 </select>
//                                             </div>
//                                         </div> */}
//                                         <div className="col-md-4">
//                                             <div className="light-text ">
//                                                 <label>Employee</label>
//                                                 <input className="form-control" disabled={true} name="Employee" title="Employee" value={this.state.Employee}>
//                                                 </input>
//                                             </div>
//                                         </div>
//                                         <div className="col-md-4">
//                                             <div className="light-text">
//                                                 <label>Year</label>
//                                                 <input className="form-control" disabled={true} name="Year" title="Year" value={this.state.Year}>
//                                                 </input>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 {/* <div className="row mx-1" id="">
//                                     <div className="col-sm-12 text-center my-4" id="">
//                                         <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Submit</button>
//                                         <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
//                                     </div>
//                                 </div> */}
//                                <div className='c-v-table table-head-1st-td dataTables_wrapper-overflow'>
//                                     <TableGenerator columns={columns} data={this.state.PTOTransactionData} fileName={'PTO Transaction History'} showExportExcel={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.PTOTransactionExcelData}></TableGenerator>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     {this.state.showToaster && <Toaster />}
//                     {this.state.loading && <Loader />}
//                 </React.Fragment >
//             );
//         }
//     }
// }
// export default PTOTransactionHistory