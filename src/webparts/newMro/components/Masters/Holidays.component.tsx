
import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import TableGenerator from '../Shared/TableGenerator';
import { ControlType } from '../../Constants/Constants';
import formValidation from '../../Utilities/Formvalidator';
import DatePicker from '../Shared/DatePickerField';
import InputText from '../Shared/InputText';
import InputCheckBox from '../Shared/InputCheckBox';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import ImportExcel from '../Shared/ImportExcel';

export interface HolidaysProps {
  match: any;
  spContext: any;
  spHttpClient: SPHttpClient;
  context: any;
  history: any;
}

export interface HolidaysState {

}

class Holidays extends React.Component<HolidaysProps, HolidaysState>{
  public state = {
    formData: {
      Holiday: '',
      IsActive: true,
      HolidayDate: null
    },
    data: [],
    loading: true,
    modalText: '',
    modalTitle: '',
    isSuccess: false,
    showHideModal: false,
    errorMessage: '',
    IsActive: false,
    ItemID: 0,
    addNewHoliday: false,
    SaveUpdateText: 'Submit',
    ImportedExcelData: []
  };

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
    //console.log('Holiday master:', this.props);
    highlightCurrentNav("holiday");
    this.GetOnloadData();
  }
  private GetOnloadData = () => {
    let HolidaysList = 'Holidays';
    try {
      // get all the items from a list
      sp.web.lists.getByTitle(HolidaysList).items.select("Holiday,*").orderBy("Id", false).get().
        then((response: any[]) => {
          this.BindData(response);
        });
    }
    catch (e) {
      this.setState({
        loading: false,
        modalTitle: 'Error',
        modalText: 'Sorry! something went wrong',
        showHideModal: true,
        isSuccess: false
      });
      console.log('failed to fetch data');
    }
  }
  private BindData(response) {
    let data = [];
    response.forEach((Item) => {
      //let dd:any=new Date();
      //console.log(dd.prototype.format('MM/dd/YYYY'));
      let date = new Date(Item.HolidayDate).getMonth() + 1 + '/' + new Date(Item.HolidayDate).getDate() + '/' + new Date(Item.HolidayDate).getFullYear();
      data.push({
        Id: Item.Id,
        Holiday: Item.Holiday,
        HolidayDate: date,
        Status: Item.IsActive == true ? 'Active' : 'In-Active',
      });
    });

    this.setState({ data: data, loading: false });
  }
  // Add New button click event 
  private addNew = () => {
    this.setState({ addNewHoliday: true });
  }
  private handleChange = (event) => {
    const formData = { ...this.state.formData };
    const { name } = event.target;
    const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;

    formData[name] = value;
    this.setState({ formData });
  }
  private handleonBlur = (event) => {
    const formData = { ...this.state.formData };
    const { name } = event.target;
    const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();

    formData[name] = value;
    this.setState({ formData });
  }
  // private _getDatePickerItems = (date, name) => {
  //   const formData = { ...this.state.formData };
  //   formData['HolidayDate'] = date;
  //   this.setState({ formData });
  // }
  private UpdateDate = (datearry) => {

    const formData = { ...this.state.formData };
    //let rowcount = parseInt(dateprops[1].charAt(0));
    let fildname = datearry[1];
    formData[fildname] = datearry[0];
    this.setState({ formData });

    // let returnObj = {};
    // returnObj[name] = date;
    //const formData = { ...this.state.formData };
    //formData['HolidayDate'] = date;
    //this.setState({ formData });
  }
  // Submit Form
  private SunmitData = () => {
    let data = {
      Holiday: { val: this.state.formData.Holiday, required: true, Name: 'Holiday', Type: ControlType.string, Focusid: this.inputHoliday },
      Date: { val: this.state.formData.HolidayDate, required: true, Name: 'Date', Type: ControlType.date, Focusid: 'divHDate' },
    };

    const formdata = { ...this.state.formData };
    let isValid = formValidation.checkValidations(data);

    if (isValid.status)
      this.checkDuplicates(formdata);
    else
      this.setState({ errorMessage: isValid.message });
  }
  private insertorupdateListitem = (formData, list) => {
    this.setState({ loading: true });
    if (this.state.ItemID == 0) {
      try {
        sp.web.lists.getByTitle(list).items.add(formData)
          .then((res) => {
            this.onSucess();
            //console.log(res);
          }, (Error) => {
            console.log(Error);
            this.onError();
          })
          .catch((err) => {
            console.log(Error);
            this.onError();
          });
      }
      catch (e) {
        console.log(e);
      }
    } else {
      sp.web.lists.getByTitle(list).items.getById(this.state.ItemID).update(formData).then((res) => {
        this.onUpdateSucess();
        //console.log(res);
      }, (Error) => {
        console.log(Error);
        this.onError();
      }).catch((err) => {
        this.onError();
        console.log(err);
      });
    }
  }
  private onSucess = () => {
    this.setState({ modalTitle: 'Success', modalText: 'Holiday submitted successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, errorMessage: '' });
  }
  private onUpdateSucess = () => {
    this.setState({ modalTitle: 'Success', modalText: 'Holiday updated successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, errorMessage: '' });
  }
  private onError = () => {
    this.setState({
      loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, ItemID: 0, errorMessage: ''
    });
  }
  private checkDuplicates = (formData) => {
    let HolidaysList = 'Holidays';
    var filterString;
    try {
      if (this.state.ItemID == 0)
        filterString = `HolidayDate eq datetime'${formData.HolidayDate.toISOString()}'`;
      else
        filterString = `HolidayDate eq datetime'${formData.HolidayDate.toISOString()}' and Id ne ` + this.state.ItemID;
      sp.web.lists.getByTitle(HolidaysList).items.filter(filterString).get().
        then((response: any[]) => {
          if (response.length > 0)
            this.setState({ errorMessage: 'Duplicate record not accept' });
          else
            this.insertorupdateListitem(formData, HolidaysList);
        });
    }
    catch (e) {
      this.onError();
      console.log(e);
    }
    // return findduplicates
  }
  private handleClose = () => {
    this.setState({ showHideModal: false });
    this.GetOnloadData();
    this.resetHolidayForm();
  }
  private cancelHandler = () => {
    this.resetHolidayForm();
  }
  private resetHolidayForm = () => {
    this.setState({ formData: { Holiday: '', IsActive: true, HolidayDate: null }, SaveUpdateText: 'Submit', addNewHoliday: false });
    //this.props.history.push('/holiday');
    () => this.props.history.push('/holiday'); 
  }
  private onEditClickHandler = (id) => {
    try {
      sp.web.lists.getByTitle('Holidays').items.getById(id).get()
        .then((response) => {
          this.setState({
            formData: {
              HolidayDate: new Date(response.HolidayDate),
              Holiday: response.Holiday.trim(),
              IsActive: response.IsActive,
            },
            addNewHoliday: true,
            SaveUpdateText: 'Update',
            ItemID: response.Id,
          });
        })
        .catch(e => {
          console.log('Failed to fetch :' + e);
        });
    }
    catch (e) {
      console.log('failed to fetch data for record :' + id);
    }
  }
  public fetchImportedExcelData = (data) => {
    console.log(data);
    if (data.length > 0) {
      this.setState({ ImportedExcelData: data });
    }
  }

  public submitImportedExcelData = () => {
    var nonDuplicateRec = [];
    var statusChangedRec = [];
    const formdata = { ...this.state };
    var HolidayData = formdata.data;
    var excelData = formdata.ImportedExcelData;
    if (excelData.length) {   //To remove duplicate records from Excel data
      let jsonObject = excelData.map((item:string)=>JSON.stringify(item));
      let uniqueSet:any = new Set(jsonObject);
      excelData = Array.from(uniqueSet).map((el:string)=>JSON.parse(el));
   }

    for (var i = excelData.length - 1; i >= 0; i--) {
      for (var j = 0; j < HolidayData.length; j++) {
        if (excelData[i] && (excelData[i].Holiday.toLowerCase() === HolidayData[j].Holiday.toLowerCase())) {
          if (excelData[i].Status === HolidayData[j].Status) {
            excelData.splice(i, 1);
          } else if (HolidayData[j].IsActive != excelData[i].Status) {
            HolidayData[j].IsActive = excelData[i].Status == "Active" ? true : false;
            statusChangedRec.push(HolidayData[j]);
            excelData.splice(i, 1);
          }
        }
      }
    }
    if (excelData.length) {
      excelData.forEach(item => {
        var obj = {};
        obj["Holiday"] = item.Holiday;
        obj["HolidayDate"] = new Date(item.Date);
        obj["IsActive"] = item.Status == "Active" ? true : false;

        nonDuplicateRec.push(obj);
      });
    } else if (!excelData.length && !statusChangedRec.length) {
      this.resetImportField();
      this.setState({
        loading: false,
        modalTitle: 'Alert',
        modalText: 'No new records found',
        showHideModal: true,
        isSuccess: false
      });

    }
    if (nonDuplicateRec.length) {
      this.insertImportedExcelData(nonDuplicateRec);
    }
    if (statusChangedRec.length) {
      this.updateImportExceldata(nonDuplicateRec, statusChangedRec);
    }
  }
  public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
    statusChangedData.forEach(element => {
        sp.web.lists.getByTitle('Holidays').items.getById(element.Id).update(element).then((res) => {

        }).then((res) => {
            if (!nonDuplicateRec.length) {
                this.GetOnloadData();
                this.setState({
                    modalTitle: 'Success',
                    modalText: 'Holidays updated successfully',
                    showHideModal: true,
                    isSuccess: true
                });
                this.resetImportField();
                console.log(res);
            }
        }).catch((err) => {
            console.log('Failed to add');
        });
    });
}

  public insertImportedExcelData = async (data) => {
    try {
      this.setState({ loading: true });
      let list = await sp.web.lists.getByTitle("Holidays");
      const entityTypeFullName = await list.getListItemEntityTypeFullName();
      let batch = sp.web.createBatch();

      data.forEach((Item) => {
        list.items.inBatch(batch).add({ ...Item }, entityTypeFullName);
      });

      await batch.execute()
        .then((res) => {
          this.GetOnloadData();
          this.setState({
            modalTitle: 'Success',
            modalText: 'Holidays uploaded successfully',
            showHideModal: true,
            isSuccess: true,
          });
          this.resetImportField();
        })
        .catch((err) => {
          console.log('Failed to add');
        });
    }
    catch (e) {
      console.log(e);
      this.setState({
        loading: false,
        modalTitle: 'Alert',
        modalText: 'Error occured',
        showHideModal: true,
        isSuccess: false
      });
    }
  }
  private onMenuItemClick(event) {
    let item = document.getElementById('sideMenuNav');
    item.classList.toggle('menu-hide');
}
  public resetImportField = () => {
    // var fileEle = document.getElementById("inputFile");
    (document.getElementById("inputFile") as HTMLInputElement).value = '';
  }

  public ErrorFileSelect = () => {
    this.resetImportField();
    this.setState({
      loading: false,
      modalTitle: 'Alert',
      modalText: 'Invalid Holidays file selected',
      showHideModal: true,
      isSuccess: false
    });
  }

  public render() {
    let ExportExcelreportColumns = [
      {
        name: "Edit",
        selector: "Id",
      },
      {
        name: "Holiday",
       selector: 'Holiday',
       
      },
      {
        name: "Date",
        selector: 'HolidayDate',

      },
      {
        name: "Status",
        selector: 'Status',
      },
  ];
    let columns = [
      {
        name: "Edit",
        //selector: "Id",
        selector: (row, i) => row.Id,
        
        cell: record => {
          return (
            <React.Fragment>
              <div style={{ paddingLeft: '10px' }}>
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/holiday/${record.Id}`}>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        }
      },

      {
        name: "Holiday",
       // selector: 'Holiday',
        selector: (row, i) => row.Holiday,
        sortable: true

      },
      {
        name: "Date",
        //selector: 'HolidayDate',
        selector: (row, i) => row.HolidayDate,
        sortable: true

      },
      {
        name: "Status",
        //selector: 'Status',
        selector: (row, i) => row.Status,
        sortable: true

      },
    ];
    //var DatePicker = require("react-bootstrap-date-picker");
    return (
      <React.Fragment>
        <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
        <div id="content" className="content p-2 pt-2">
          <div id="clickMenu" className="menu-icon-outer" onClick={(event) => this.onMenuItemClick(event)}>
              <div className="menu-icon">
                  <span>
                  </span>
                  <span>
                  </span>
                  <span>
                  </span>
              </div>
          </div>
          <div className='container-fluid'>
            <div className='FormContent'>
              <div className='title'>Holidays
                {this.state.addNewHoliday &&
                  <div className='mandatory-note'>
                    <span className='mandatoryhastrick'>*</span> indicates a required field
                  </div>
                }
              </div>

              <div className="after-title"></div>

              {this.state.loading && <Loader />}
              <div className="row justify-content-md-left">
                <div className="col-12 col-md-12 col-lg-9">

                  <div className={this.state.addNewHoliday ? 'mx-2 activediv' : 'mx-2'}>
                    <div className="text-right pt-2" id="">

                      <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Holiday", "Date", "Status"]} filename="Holiday" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>
                      <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNew}>Add</button>
                    </div>
                  </div>
                  <div className="light-box border-box-shadow mx-2">
                    <div className={this.state.addNewHoliday ? '' : 'activediv'}>
                      <div className="my-2">
                        <div className="row pt-2 px-2">

                          <InputText
                            type='text'
                            label={"Holiday"}
                            name={"Holiday"}
                            value={this.state.formData.Holiday || ''}
                            isRequired={true}
                            onChange={this.handleChange}
                            refElement={this.inputHoliday}
                            onBlur={this.handleonBlur}
                          />

                          <div className="col-md-3">
                            <div className="light-text div-readonly">
                              <label className="z-in-9">Date</label>
                              <div className="custom-datepicker" id="divHDate">
                                <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.formData.HolidayDate} id={'HolidayDate'} />
                              </div>
                            </div>
                          </div>

                          {/* <div className="col-md-4">
                        <div className="light-text">
                          <label className="z-in-9">Date Required</label>
                          <div className="custom-datepicker" id="divRDate">
                         
                            <DatePicker onDatechnage={(e) => this._getDatePickerItems(e, 'HolidayDate')} selectedDate={this.state.formData.HolidayDate} />
                          </div>
                        </div>
                      </div> */}

                          <InputCheckBox
                            label={"Is Active"}
                            name={"IsActive"}
                            checked={this.state.formData.IsActive}
                            onChange={this.handleChange}
                            isforMasters={true}
                            isdisable={false}
                          />

                        </div>
                      </div>
                      <span className="text-validator" id="spanErrorMessage">{this.state.errorMessage}</span>
                      <div className="row mx-1" id="">
                        <div className="col-sm-12 text-center mt-2" id="">
                          <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.SunmitData}>{this.state.SaveUpdateText}</button>
                          <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.cancelHandler}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="light-box border-box-shadow mx-2 table-head-1st-td">
                    <TableGenerator columns={columns} data={this.state.data} fileName={'Holidays'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ExportExcelCustomisedData={this.state.data}></TableGenerator>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Holidays;

