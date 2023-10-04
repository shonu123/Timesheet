
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

export interface ProjectCategoryProps {
  match: any;
  spContext: any;
  spHttpClient: SPHttpClient;
  context: any;
  history: any;
}

export interface ProjectCategoryState {

}

class ProjectCategory extends React.Component<ProjectCategoryProps, ProjectCategoryState>{

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
    Department: '',
    Category:'',
    IsActive: true,
    SaveUpdateText: 'Submit',
    addNewProjectCategory: false,
    ItemID: 0,
    ImportedExcelData: []
  };

  private inputDepartment;
  private inputCategory;

  constructor(props) {
    super(props);
    sp.setup({
      spfxContext: this.props.context
    });
    this.inputDepartment = React.createRef();
    this.inputCategory = React.createRef();
  }

  public componentDidMount() {
    highlightCurrentNav("ProjectCategory");
    this.GetOnloadData();
  }
  public componentWillReceiveProps(newProps) {
    if (newProps.match.params.id == undefined)
      this.setState({ ProjectCategory: '', IsActive: true, SaveUpdateText: 'Submit', addNewProjectCategory: false });
  }
  private GetOnloadData = () => {
    let TrList = 'ProjectCategory';
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
        Department: Item.Department,
        Category: Item.Category,
        Status: Item.IsActive == true ? 'Active' : 'In-Active',
      });
    });

    this.setState({ data: data, loading: false, SaveUpdateText: 'Submit' });
  }

  // Add New button click event 
  private addNew = () => {
    this.setState({ addNewProjectCategory: true });
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
      Category: { val: this.state.Category, required: true, Name: 'Category', Type: ControlType.string, Focusid: this.inputCategory },
      Department: { val: this.state.Department, required: true, Name: 'Department', Type: ControlType.string, Focusid: this.inputDepartment },
    };
    let isValid = formValidation.checkValidations(data);
    var formdata = {
        Department: this.state.Department,
        Category: this.state.Category,
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
    this.setState({ modalTitle: 'Success', modalText: 'Project Category submitted successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, Department: "", Category: "", errorMessage: "" });
  }

  private onUpdateSucess = () => {
    this.setState({ modalTitle: 'Success', modalText: 'Project Category updated successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, Department: "", Category: "", errorMessage: "" });
  }

  private onError = () => {
    this.setState({
      loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, ItemID: 0, errorMessage: ""
    });
  }

  private checkDuplicates = (formData) => {
    let TrList = 'ProjectCategory';
    var filterString;
    try {
      if (this.state.ItemID == 0)
        filterString = `(Category eq '${formData.Category}' or Department eq '${formData.Department}')`;
      else
        filterString = `(Category eq '${formData.Category}' or Department eq '${formData.Department}') and Id ne ${this.state.ItemID}`;
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
    this.setState({ Department: '', IsActive: true, SaveUpdateText: 'Submit', addNewProjectCategory: false });
   // this.props.history.push('/ProjectCategory');
   ()=> this.props.history.push('/ProjectCategory');
  }

  private handleClose = () => {
    this.GetOnloadData();
    this.resetProjectForm();
    this.setState({ addNewProjectCategory: false, showHideModal: false, Date: null, pr: '', IsActive: false });
  }

  private onEditClickHandler = (id) => {
    console.log('edit clicked', id);
    try {
      sp.web.lists.getByTitle('ProjectCategory').items.getById(id).get()
        .then((response) => {
          this.setState({
            addNewProjectCategory: true,
            Category: response.Category,
            Department: response.Department.trim(),
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
    var ProjectCategoryData = formdata.data;
    var excelData = formdata.ImportedExcelData;
    if (excelData.length) {   //To remove duplicate records from Excel data
      let jsonObject = excelData.map((item:string)=>JSON.stringify(item));
      let uniqueSet:any = new Set(jsonObject);
      excelData = Array.from(uniqueSet).map((el:string)=>JSON.parse(el));
   }

    for (var i = excelData.length - 1; i >= 0; i--) {
      for (var j = 0; j < ProjectCategoryData.length; j++) {
        if (excelData[i] && (excelData[i]["Project Category"].toLowerCase() === ProjectCategoryData[j].ProjectCategory.toLowerCase())) {
          if (excelData[i].Status === ProjectCategoryData[j].Status) {
            excelData.splice(i, 1);
          } else if (ProjectCategoryData[j].IsActive != excelData[i].Status) {
            ProjectCategoryData[j].IsActive = excelData[i].Status == "Active" ? true : false;
            statusChangedRec.push(ProjectCategoryData[j]);
            excelData.splice(i, 1);
          }
        }
      }
    }
    if (excelData.length) {
      excelData.forEach(item => {
        var obj = {};
        obj["Category"] = item["Category"];
        obj["Department"] = item["Department"];
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
        sp.web.lists.getByTitle('ProjectCategory').items.getById(element.Id).update(element).then((res) => {

        }).then((res) => {
            if (!nonDuplicateRec.length) {
                this.GetOnloadData();
                this.setState({
                    modalTitle: 'Success',
                    modalText: 'Project Category updated successfully',
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
      let list = await sp.web.lists.getByTitle("ProjectCategory");
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
            modalText: 'Project Category uploaded successfully',
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
      modalText: 'Invalid Project Category file selected',
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
        name: "Department",
        selector: 'Department',

      },
      {
        name: "Category",
        selector: 'Category',

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
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/ProjectCategory/${record.Id}`}>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        }
      },

      {
        name: "Department",
        //selector: 'ProjectCategory',
        selector: (row, i) => row.Department,
        sortable: true

      },
      {
        name: "Category",
        //selector: 'Title',
        selector: (row, i) => row.Category,
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
            <div className='title'> Project Category
              {this.state.addNewProjectCategory &&
                <div className='mandatory-note'>
                  <span className='mandatoryhastrick'>*</span> indicates a required field
                </div>
              }
            </div>

            <div className="after-title"></div>
            <div className="row justify-content-md-left">
              <div className="col-12 col-md-12 col-lg-12">

                <div className={this.state.addNewProjectCategory ? 'mx-2 activediv' : 'mx-2'}>
                  <div className="text-right pt-2" id="">

                    <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Department","Category", "Status"]} filename="Project Category" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>
                    <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNew}>Add</button>
                  </div>
                </div>
                <div className="light-box border-box-shadow mx-2">
                  <div className={this.state.addNewProjectCategory ? '' : 'activediv'}>
                    <div className="my-2">
                      <div className="row">
                        <InputText
                          type='text'
                          label={"Department"}
                          name={"Department"}
                          value={this.state.Department || ''}
                          isRequired={true}
                          onChange={this.handleChange}
                          refElement={this.inputDepartment}
                          onBlur={this.handleonBlur}
                        />
                        <InputText
                          type='text'
                          label={"Category"}
                          name={"Category"}
                          value={this.state.Category || ''}
                          isRequired={true}
                          onChange={this.handleChange}
                          refElement={this.inputCategory}
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
                  <TableGenerator columns={columns} data={this.state.data} fileName={'Project Category'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default ProjectCategory;

