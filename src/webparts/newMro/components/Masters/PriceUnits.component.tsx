
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
import InputText from '../Shared/InputText';
import InputCheckBox from '../Shared/InputCheckBox';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import ImportExcel from '../Shared/ImportExcel';

export interface UnitsProps {
  match: any;
  spContext: any;
  spHttpClient: SPHttpClient;
  context: any;
  history: any;
}

export interface UnitsState {

}

class units extends React.Component<UnitsProps, UnitsState>{

  // Onload
  public state = {
    data: [],
    columns: [],
    tableData: {},
    loading: true,
    modalText: '',
    modalTitle: '',
    isSuccess: false,
    showHideModal: false,
    errorMessage: '',
    Unit: '',
    Description:'',
    IsActive: true,
    SaveUpdateText: 'Submit',
    addNewUnit: false,
    ItemID: 0,
    ImportedExcelData: [],
  };

  private inputUnit;
  private UnitDescription;
  constructor(props) {
    super(props);
    sp.setup({
      spfxContext: this.props.context
    });
    this.inputUnit = React.createRef();
    this.UnitDescription = React.createRef();
  }

  public componentDidMount() {
    //console.log('Project Code:', this.props);
    highlightCurrentNav("priceunit");
    this.GetOnloadData();
  }
  public componentWillReceiveProps(newProps) {
    if (newProps.match.params.id == undefined)
      this.setState({ Unit: '',Description:'', IsActive: true, SaveUpdateText: 'Submit', addNewUnit: false });
  }
  private GetOnloadData = () => {
    let TrList = 'PriceUnit';
    try {

      // get all the items from a list
      sp.web.lists.getByTitle(TrList).items.orderBy("Id", false).get().
        then((response: any[]) => {
          //console.log(response);
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
      data.push({
        Id: Item.Id,
        Title: Item.Title,
        Description:Item.Description,
        Status: Item.IsActive == true ? 'Active' : 'In-Active',
      });
    });

    this.setState({ data: data, loading: false, SaveUpdateText: 'Submit' });
  }

  // Add New button click event 
  private addNew = () => {
    this.setState({ addNewUnit: true });
  }

  private handleChange = (event) => {
    let returnObj = {};
    if (event.target.name != 'IsActive')
      returnObj[event.target.name] = event.target.value;
    else
      returnObj[event.target.name] = event.target.checked;
    this.setState(returnObj);
  }

  private handleonBlur = (event) => {
    let returnObj = {};
    if (event.target.name != 'IsActive')
      returnObj[event.target.name] = event.target.value.trim();
    else
      returnObj[event.target.name] = event.target.checked;
    this.setState(returnObj);
  }

  // Submit Form
  private SunmitData = () => {
    let data = {
      Unit: { val: this.state.Unit, required: true, Name: 'Unit', Type: ControlType.string, Focusid: this.inputUnit },
      Description: { val: this.state.Description, required: false, Name: 'Description', Type: ControlType.string, Focusid: this.UnitDescription },
    };
    let isValid = formValidation.checkValidations(data);
    var formdata = {
      Title: this.state.Unit,
      Description:this.state.Description,
      IsActive: this.state.IsActive
    };
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
    this.setState({ modalTitle: 'Success', modalText: 'Price for Unit submitted successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, Unit: "", errorMessage: "" });
  }

  private onUpdateSucess = () => {
    this.setState({ modalTitle: 'Success', modalText: 'Price for Unit updated successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, Unit: "", errorMessage: "" });
  }

  private onError = () => {
    this.setState({
      loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, ItemID: 0, errorMessage: ""
    });
  }

  private checkDuplicates = (formData) => {
    let TrList = 'PriceUnit';
    var filterString;
    try {
      if (this.state.ItemID == 0)
        filterString = `Title eq '${formData.Title}'`;
      else
        filterString = `Title eq '${formData.Title}' and Id ne ${this.state.ItemID}`;
      sp.web.lists.getByTitle(TrList).items.filter(filterString).get().
        then((response: any[]) => {
          if (response.length > 0)
            this.setState({ errorMessage: 'Duplicate record not accept' });
          else
            this.insertorupdateListitem(formData, TrList);
        });
    }
    catch (e) {
      this.onError();
      console.log(e);
    }
    // return findduplicates
  }

  private cancelHandler = () => {
    this.resetProjectForm();
  }

  private resetProjectForm = () => {
    this.setState({ Unit: '', IsActive: true, SaveUpdateText: 'Submit', addNewUnit: false });
    //this.props.history.push('/priceunit');
    ()=>this.props.history.push('/priceunit');
  }

  private handleClose = () => {
    this.GetOnloadData();
    this.resetProjectForm();
    this.setState({ addNewUnit: false, showHideModal: false, Date: null, pr: '', IsActive: false });
  }

  private onEditClickHandler = (id) => {
    console.log('edit clicked', id);
    try {
      sp.web.lists.getByTitle('PriceUnit').items.getById(id).get()
        .then((response) => {
          this.setState({
            addNewUnit: true,
            Unit: response.Title.trim(),
            Description: response.Description !=null ?response.Description:"",
            IsActive: response.IsActive,
            ItemID: response.Id,
            SaveUpdateText: 'Update',
            errorMessage: ""
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
    var PriceForUnitsData = formdata.data;
    var excelData = formdata.ImportedExcelData;
    if (excelData.length) {   //To remove duplicate records from Excel data
      let jsonObject = excelData.map((item:string)=>JSON.stringify(item));
      let uniqueSet:any = new Set(jsonObject);
      excelData = Array.from(uniqueSet).map((el:string)=>JSON.parse(el));
    }

    for (var i = excelData.length - 1; i >= 0; i--) {
      for (var j = 0; j < PriceForUnitsData.length; j++) {
        if (excelData[i] && (excelData[i].Unit.toLowerCase() === PriceForUnitsData[j].Title.toLowerCase())) {
          if (excelData[i].Status === PriceForUnitsData[j].Status) {
            excelData.splice(i, 1);
          } else if (PriceForUnitsData[j].IsActive != excelData[i].Status) {
            PriceForUnitsData[j].IsActive = excelData[i].Status == "Active" ? true : false;
            statusChangedRec.push(PriceForUnitsData[j]);
            excelData.splice(i, 1);
          }
        }
      }
    }
    if (excelData.length) {
      excelData.forEach(item => {
        var obj = {};
        obj["Title"] = item.Unit.toString();
        obj["Description"] = (item.Description !=null && item.Description != undefined) ? item.Description.toString():'';
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
    if (statusChangedRec.length) {
      this.updateImportExceldata(nonDuplicateRec, statusChangedRec);
    }
    if (nonDuplicateRec.length) {
      this.insertImportedExcelData(nonDuplicateRec);
    }
  }

  public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
    statusChangedData.forEach(element => {
      sp.web.lists.getByTitle('PriceUnit').items.getById(element.Id).update(element).then((res) => {

      }).then((res) => {
        if (!nonDuplicateRec.length) {
          this.GetOnloadData();
          this.setState({
            modalTitle: 'Success',
            modalText: 'Buyer updated successfully',
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
      let list = await sp.web.lists.getByTitle("PriceUnit");
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
            modalText: 'Price for Units uploaded successfully',
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

  public resetImportField = () => {
    // var fileEle = document.getElementById("inputFile");
    (document.getElementById("inputFile") as HTMLInputElement).value = '';
  }

  public ErrorFileSelect = () => {
    this.resetImportField();
    this.setState({
      loading: false,
      modalTitle: 'Alert',
      modalText: 'Invalid Price for Units file selected',
      showHideModal: true,
      isSuccess: false
    });
  }


  public render() {
    let ExportExcelreportColumns= [
      {
        name: "Edit",
        selector: "Id",        
      },
      {
        name: "Unit",
        selector: 'Title',

      },
      {
        name: "Description",
        selector: 'Description',
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
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/priceunit/${record.Id}`}>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        }
      },


      {
        name: "Unit",
        //selector: 'Title',
        selector: (row, i) => row.Title,
        sortable: true

      },
      {
        name: "Description",
        //selector: 'Description',
        selector: (row, i) => row.Description,
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
        {this.state.loading && <Loader />}

        <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
        <div className='container-fluid'>
          <div className='FormContent'>
            <div className='title'> Price for Units
              {this.state.addNewUnit &&
                <div className='mandatory-note'>
                  <span className='mandatoryhastrick'>*</span> indicates a required field
                </div>
              }
            </div>

            <div className="after-title"></div>


            <div className="row justify-content-md-left">
              <div className="col-12 col-md-12 col-lg-7">

                <div className={this.state.addNewUnit ? 'mx-2 activediv' : 'mx-2'}>
                  <div className="text-right pt-2" id="">

                    <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Unit","Description", "Status"]} filename="Price for Units" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>

                    <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNew}>Add</button>
                  </div>
                </div>
                <div className="light-box border-box-shadow mx-2">
                  <div className={this.state.addNewUnit ? '' : 'activediv'}>
                    <div className="my-2">
                      <div className="row">
                        <InputText
                          type='text'
                          label={"Unit"}
                          name={"Unit"}
                          value={this.state.Unit || ''}
                          isRequired={true}
                          onChange={this.handleChange}
                          refElement={this.inputUnit}
                          onBlur={this.handleonBlur}
                        />
                        <div className="col-md-4">
                            <div className="light-text">
                                <label>Description</label>
                                <textarea rows={2} className="form-control" ref={this.UnitDescription} maxLength={1000} placeholder="" name="Description" title="Description" value={this.state.Description || ''} autoComplete="false" onChange={this.handleChange}></textarea>
                            </div>
                        </div>
                        <InputCheckBox
                          label={"Is Active"}
                          name={"IsActive"}
                          checked={this.state.IsActive}
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
                  <TableGenerator columns={columns} data={this.state.data} fileName={'Price for Units'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default units;

