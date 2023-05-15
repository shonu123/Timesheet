import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import "react-data-table-component-extensions/dist/index.css";
import "bootstrap/dist/css/bootstrap.css";
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import "../Shared/Menuhandler";

export interface HolidayformProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
}

export interface HolidayformState {
    Holiday: string;
    HolidayDate: Date;
    ItemID: number;
    IsActive: boolean;
    errorMessage: string;
}


class Holidaysform extends React.Component<HolidayformProps, HolidayformState>{
    private inputHoliday;
    private inputDate;
    constructor(props) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.inputHoliday = React.createRef();
        this.inputDate = React.createRef();
    }

    public componentDidMount() {
        //console.log(this.props);
        this.setState({ ItemID: this.props.match.params.id != undefined ? this.props.match.params.id : 0, Holiday: '', IsActive: false });
        if (this.props.match.params.id != undefined) {
            //this.GetItemBasedData(this.props.match.params.id);

        }
    }

    //Latest Verstion of code not Support this code
    // private getInputDeatils = (event) => {
    //     if (event.target.name != 'IsActive'){
    //         this.setState({ [event.target.name]: event.target.value } as HolidayformState);
    //     }
    //     else
    //         this.setState({ [event.target.name]: event.target.checked } as HolidayformState);
    // }


    private getInputDeatils(event) {
        var key = event.target.name;
        var val = key !='IsActive'?event.target.value:event.target.checked;
        var obj  = {};
        obj[key] = val;
        this.setState(obj);
      }


    private SunmitData = () => {
        let data = {

            Holiday: { val: this.state.Holiday, required: true, Name: 'Holiday', Type: ControlType.string, Focusid: this.inputHoliday },
            HolidayDate: { val: this.state.HolidayDate, required: false, Name: 'Date', Type: ControlType.string, Focusid: this.inputDate },
        };
        let formdata = {
            Holiday: this.state.Holiday,
            HolidayDate: this.state.HolidayDate,
            IsActive: this.state.IsActive
        };
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            if (this.state.ItemID == 0) {
                try {
                    sp.web.lists.getByTitle('ApprovalsMatrix').items.add(formdata)
                        .then((res) => {
                            //this.backApprovalForm();
                            console.log('success to add');
                        }, (Error) => {
                            console.log(Error);
                        })
                        .catch((err) => {
                            console.log('Failed to add');
                        });
                }
                catch (e) {
                    console.log(e);
                }
            } else {
                sp.web.lists.getByTitle('ApprovalsMatrix').items.getById(this.state.ItemID).update(data).then((res) => {
                    //this.backApprovalForm();
                    //console.log(res);
                }, (Error) => {
                    console.log(Error);
                }).catch((err) => {
                    console.log('Failed to Update');
                });
            }
        } else {
            this.setState({ errorMessage: isValid.message });
        }
    }
    private backholiday(e) {

    }

    public render() {
        if (this.state) {
            return (
                <div className='container-fluid'>
                    <div className='FormContent'>
                        <div className='title'>
                            <p>Add Holidays</p>
                            <div className='mandatory-note'>
                                <span className='mandatoryhastrick'>*</span> indicates a required field
                        </div>
                        </div>
                        <div className="light-box media-m-2 media-p-1">
                            <div className="my-2">
                                <div className="row pt-2 px-2">

                                    <div className="col-md-4">
                                        <div className='light-text'>
                                            <label>Holiday <span className="mandatoryhastrick">*</span></label>
                                            <input className="form-control" title={'Holiday'} placeholder="" value={this.state.Holiday} type="text" required={true} onChange={this.getInputDeatils} name="FromBudget" ref={this.inputHoliday} />
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className='light-text'>
                                            <label>Date <span className="mandatoryhastrick">*</span></label>
                                            <input className="form-control" title={'Date'} placeholder="" type="text" required={true} name="ToBudget" onChange={this.getInputDeatils} ref={this.inputDate} />
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className='light-text'>
                                            <label className="col-sm-7 col-form-label">Is Active<span className="mandatoryhastrick">*</span></label>
                                            <div className="col-sm-5">
                                                <input type="checkbox" checked={this.state.IsActive} onChange={this.getInputDeatils} name="IsActive"></input>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <span className="text-validator" id="spanErrorMessage">{this.state.errorMessage}</span>
                        <div className="row mx-1" id="">
                            <div className="col-sm-12 text-center mt-2" id="">
                                <button type="button" id="btnSubmit" autoFocus={false} className="SubmitButtons btn" onClick={this.SunmitData}>Submit</button>
                                <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.backholiday} >Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>

            );
        } else {
            return (<div>

            </div>);
        }
    }


}

export default Holidaysform;