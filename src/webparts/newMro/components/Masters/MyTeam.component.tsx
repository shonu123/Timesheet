import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';

export interface MyTeamProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface MyTeamState {
    MyTeamMembers: Array<Object>;
    loading: boolean;
    message: string;
    title: string;
    showHideModal: boolean;
    isSuccess: boolean;
    comments: string;
    Action: string;
    errorMessage: string;
    ItemID: Number
}

class MyTeam extends React.Component<MyTeamProps, MyTeamState> {
    constructor(props: MyTeamProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = { MyTeamMembers: [], loading: false, message: '', title: '', showHideModal: false, isSuccess: true, comments: '', Action: '', errorMessage: '', ItemID: 0 };
    }

    public componentDidMount() {
        this.getMyTeam();
    }
    // this function is used to get 1 month records of weeklytime data of the employees who's manager is current logged in user from weeklytimesheet list
    private getMyTeam = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        var filterString = "ReportingManager/ID eq '" + userId + "'"

        sp.web.lists.getByTitle('EmployeeMaster').items.top(2000).filter(filterString).expand("Employee").select('Employee/Title', '*').orderBy('Employee/Title', false).get()
            .then((response) => {
                console.log("My Team")
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.DateOfJoining)
                    let DelegateToString = '';
                    if (d.DelegateTo != undefined) {
                        if (d.DelegateTo.length > 0) {
                            for (let r of d.DelegateTo) {
                                DelegateToString += "<div>" + r.Title + "</div>"
                            }
                        }
                    }
                    Data.push({
                        Id: d.Id,
                        Employee: d.Employee.Title,
                        Doj: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        PDM: d.MandatoryDescription ? "Mandatory" : "Not-Mandatory",
                        PCM: d.MandatoryProjectCode ? "Mandatory" : "Not-Mandatory",
                        DelegateTo: DelegateToString,
                    })
                }
                // console.log(Data);
                this.setState({ MyTeamMembers: Data, loading: false });
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }

    public render() {
        const columns = [
            {
                name: "Edit",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/EmployeeMasterForm/${record.Id}/Edit`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.Employee,
                width: '250px',
                sortable: true
            },
            {
                name: "Date of Joining",
                selector: (row, i) => row.Doj,
                // width: '250px',
                sortable: true
            },
            {
                name: "Project Description",
                selector: (row, i) => row.PDM,
                // width: '250px',
                sortable: true
            },
            {
                name: "Project Code",
                selector: (row, i) => row.PCM,
                // width: '250px',
                sortable: true
            },
            {
                name: "Delegate To",
                selector: (row, i) => row.DelegateTo,
                // width: '250px',
                sortable: true
            },
        ];
        return (
            <React.Fragment>
                <div>
                    <div className='table-head-1st-td'>
                        <TableGenerator columns={columns} data={this.state.MyTeamMembers} fileName={'My Team'} showExportExcel={false}
                            showAddButton={false} customBtnClass='' btnDivID='' navigateOnBtnClick='' btnSpanID='' btnCaption='' btnTitle='' searchBoxLeft={true}></TableGenerator>
                    </div>
                </div>
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default MyTeam