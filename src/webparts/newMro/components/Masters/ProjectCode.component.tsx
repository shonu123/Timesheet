
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

export interface ProjectCodeProps {
  match: any;
  spContext: any;
  spHttpClient: SPHttpClient;
  context: any;
  history: any;
}

export interface ProjectCodeState {

}

class ProjectCode extends React.Component<ProjectCodeProps, ProjectCodeState>{

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
    ProjectCode: '',
    ProjectTitle:'',
    IsActive: true,
    SaveUpdateText: 'Submit',
    addNewProjectCode: false,
    ItemID: 0,
    ImportedExcelData: []
  };

  private inputProjectCode;
  private inputProjectTitle;

  constructor(props) {
    super(props);
    sp.setup({
      spfxContext: this.props.context
    });
    this.inputProjectCode = React.createRef();
    this.inputProjectTitle = React.createRef();
  }

  public componentDidMount() {
    //console.log('Project Code:', this.props);
    highlightCurrentNav("projectcode");
    this.GetOnloadData();
  }
  public componentWillReceiveProps(newProps) {
    if (newProps.match.params.id == undefined)
      this.setState({ ProjectCode: '', IsActive: true, SaveUpdateText: 'Submit', addNewProjectCode: false });
  }
  private GetOnloadData = () => {
    let TrList = 'ProjectCode';
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
      //let dd:any=new Date();
      //console.log(dd.prototype.format('MM/dd/YYYY'));
      //let date = new Date(Item.HolidayDate).getMonth()+1+'/'+new Date(Item.HolidayDate).getDate()+'/'+new Date(Item.HolidayDate).getFullYear();
      data.push({
        Id: Item.Id,
        Title: Item.Title,
        ProjectCode: Item.Project_x0020_Code,
        Status: Item.IsActive == true ? 'Active' : 'In-Active',
      });
    });

    this.setState({ data: data, loading: false, SaveUpdateText: 'Submit' });
  }

  // Add New button click event 
  private addNew = () => {
    this.setState({ addNewProjectCode: true });
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
      ProjectCode: { val: this.state.ProjectCode, required: true, Name: 'Project Code', Type: ControlType.string, Focusid: this.inputProjectCode },
      ProjectTitle: { val: this.state.ProjectTitle, required: true, Name: 'Project Title', Type: ControlType.string, Focusid: this.inputProjectTitle },
    };
    let isValid = formValidation.checkValidations(data);
    var formdata = {
      Title: this.state.ProjectTitle,
      Project_x0020_Code: this.state.ProjectCode,
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
    this.setState({ modalTitle: 'Success', modalText: 'Project Code submitted successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, ProjectTile: "", ProjectCode: "", errorMessage: "" });
  }

  private onUpdateSucess = () => {
    this.setState({ modalTitle: 'Success', modalText: 'Project Code updated successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, ProjectTile: "", ProjectCode: "", errorMessage: "" });
  }

  private onError = () => {
    this.setState({
      loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, ItemID: 0, errorMessage: ""
    });
  }

  private checkDuplicates = (formData) => {
    let TrList = 'ProjectCode';
    var filterString;
    try {
      if (this.state.ItemID == 0)
        filterString = `(Project_x0020_Code eq '${formData.Project_x0020_Code}' or Title eq '${formData.Title}')`;
      else
        filterString = `(Project_x0020_Code eq '${formData.Project_x0020_Code}' or Title eq '${formData.Title}') and Id ne ${this.state.ItemID}`;
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
    this.setState({ ProjectCode: '', IsActive: true, SaveUpdateText: 'Submit', addNewProjectCode: false });
   // this.props.history.push('/projectcode');
   ()=> this.props.history.push('/projectcode');
  }

  private handleClose = () => {
    this.GetOnloadData();
    this.resetProjectForm();
    this.setState({ addNewProjectCode: false, showHideModal: false, Date: null, pr: '', IsActive: false });
  }

  private onEditClickHandler = (id) => {
    console.log('edit clicked', id);
    try {
      sp.web.lists.getByTitle('ProjectCode').items.getById(id).get()
        .then((response) => {
          this.setState({
            addNewProjectCode: true,
            ProjectTitle: response.Title,
            ProjectCode: response.Project_x0020_Code.trim(),
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
    var ProjectCodeData = formdata.data;
    var excelData = formdata.ImportedExcelData;
    if (excelData.length) {   //To remove duplicate records from Excel data
      let jsonObject = excelData.map((item:string)=>JSON.stringify(item));
      let uniqueSet:any = new Set(jsonObject);
      excelData = Array.from(uniqueSet).map((el:string)=>JSON.parse(el));
   }

    for (var i = excelData.length - 1; i >= 0; i--) {
      for (var j = 0; j < ProjectCodeData.length; j++) {
        if (excelData[i] && (excelData[i]["Project Code"].toLowerCase() === ProjectCodeData[j].ProjectCode.toLowerCase())) {
          if (excelData[i].Status === ProjectCodeData[j].Status) {
            excelData.splice(i, 1);
          } else if (ProjectCodeData[j].IsActive != excelData[i].Status) {
            ProjectCodeData[j].IsActive = excelData[i].Status == "Active" ? true : false;
            statusChangedRec.push(ProjectCodeData[j]);
            excelData.splice(i, 1);
          }
        }
      }
    }
    if (excelData.length) {
      excelData.forEach(item => {
        var obj = {};
        obj["Title"] = item["Project Title"];
        obj["Project_x0020_Code"] = item["Project Code"];
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
        sp.web.lists.getByTitle('ProjectCode').items.getById(element.Id).update(element).then((res) => {

        }).then((res) => {
            if (!nonDuplicateRec.length) {
                this.GetOnloadData();
                this.setState({
                    modalTitle: 'Success',
                    modalText: 'Project Code updated successfully',
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
      let list = await sp.web.lists.getByTitle("ProjectCode");
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
            modalText: 'Project Code uploaded successfully',
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
      modalText: 'Invalid Project Code file selected',
      showHideModal: true,
      isSuccess: false
    });
  }

  public render() {
    let ExportExcelreportColumns =[
      {
        name: "Edit",
       selector: "Id",    
      },

      {
        name: "Project Code",
        selector: 'ProjectCode',

      },
      {
        name: "Project Title",
        selector: 'Title',

      },
      {
        name: "Status",
        selector: 'Status',
      },
    ];
    let columns = [
      {
        name: "Edit",
       // selector: "Id",
        selector: (row, i) => row.Id,
        cell: record => {
          return (
            <React.Fragment>
              <div style={{ paddingLeft: '10px' }}>
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/projectcode/${record.Id}`}>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        }
      },

      {
        name: "Project Code",
        //selector: 'ProjectCode',
        selector: (row, i) => row.ProjectCode,
        sortable: true

      },
      {
        name: "Project Title",
        //selector: 'Title',
        selector: (row, i) => row.Title,
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
            <div className='title'> Project Code
              {this.state.addNewProjectCode &&
                <div className='mandatory-note'>
                  <span className='mandatoryhastrick'>*</span> indicates a required field
                </div>
              }
            </div>

            <div className="after-title"></div>
            <div className="row justify-content-md-left">
              <div className="col-12 col-md-12 col-lg-12">

                <div className={this.state.addNewProjectCode ? 'mx-2 activediv' : 'mx-2'}>
                  <div className="text-right pt-2" id="">

                    <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Project Code","Project Title", "Status"]} filename="Project Code" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>
                    <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNew}>Add</button>
                  </div>
                </div>
                <div className="light-box border-box-shadow mx-2">
                  <div className={this.state.addNewProjectCode ? '' : 'activediv'}>
                    <div className="my-2">
                      <div className="row">
                        <InputText
                          type='text'
                          label={"Project Code"}
                          name={"ProjectCode"}
                          value={this.state.ProjectCode || ''}
                          isRequired={true}
                          onChange={this.handleChange}
                          refElement={this.inputProjectCode}
                          onBlur={this.handleonBlur}
                        />
                        <InputText
                          type='text'
                          label={"Project Title"}
                          name={"ProjectTitle"}
                          value={this.state.ProjectTitle || ''}
                          isRequired={true}
                          onChange={this.handleChange}
                          refElement={this.inputProjectTitle}
                          onBlur={this.handleonBlur}
                        />

                        <InputCheckBox
                          label={"Is Active"}
                          name={"IsActive"}
                          checked={this.state.IsActive}
                          onChange={this.handleChange}
                          isforMasters={true}
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
                  <TableGenerator columns={columns} data={this.state.data} fileName={'Project Code'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default ProjectCode;

