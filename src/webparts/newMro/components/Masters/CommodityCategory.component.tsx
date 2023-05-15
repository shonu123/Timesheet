
import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import {  NavLink } from "react-router-dom";
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
import InputCheckBox from '../Shared/InputCheckBox';
import InputText from '../Shared/InputText';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import ImportExcel from '../Shared/ImportExcel';

export interface CommodityProps {
  match: any;
  spContext: any;
  spHttpClient: SPHttpClient;
  context: any;
  history: any;
}

export interface CommodityState {

}

class Commodity extends React.Component<CommodityProps, CommodityState>{

  // Onload

  public state = {
    addNewCategoryCode: false,
    data: [],
    columns: [],
    tableData: {},
    loading: true,
    modalText: '',
    modalTitle: '',
    isSuccess: false,
    showHideModal: false,
    errorMessage: '',
    Title: '',
    Code: '',
    IsActive: true,
    SaveUpdateText: 'Submit',
    ItemID: 0,
    ImportedExcelData: [],
  };
  private inputCommodityTitle;
  private inputCommodityCode;
  constructor(props) {
    super(props);
    sp.setup({
      spfxContext: this.props.context
    });
    this.inputCommodityTitle = React.createRef();
    this.inputCommodityCode = React.createRef();

  }

  public componentDidMount() {
    //console.log('Commodity Code:', this.props);
    highlightCurrentNav("commoditycategory");
    this.GetOnloadData();
  }
  public componentWillReceiveProps(newProps) {
    if (newProps.match.params.id == undefined)
      this.setState({ Title: '', IsActive: true, Code: '', SaveUpdateText: 'Submit', addNewCategoryCode: false });
  }
  private GetOnloadData = () => {
    let TrList = 'CommodityCategory';
    try {

      // get all the items from a list
      sp.web.lists.getByTitle(TrList).items.select("*").orderBy("Id", false).get().
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
        CategoryCode: Item.Category_x0020_Code,
        Status: Item.IsActive == true ? 'Active' : 'In-Active',
      });
    });

    this.setState({ data: data, loading: false, SaveUpdateText: 'Submit' });
  }

  // Add New button click event 
  private addNew = () => {
    this.setState({ addNewCategoryCode: true });
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
      Title: { val: this.state.Title, required: true, Name: 'Category Title', Type: ControlType.string, Focusid: this.inputCommodityTitle },
      Code: { val: this.state.Code, required: true, Name: 'Category Code', Type: ControlType.string, Focusid: this.inputCommodityCode },
    };
    let isValid = formValidation.checkValidations(data);
    var formdata = {
      Title: this.state.Title,
      Category_x0020_Code: this.state.Code,
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
    this.setState({ modalTitle: 'Success', modalText: 'Commodity Category submitted successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, Title: "", Code: "", errorMessage: "", IsActive: true });
  }
  private onUpdateSucess = () => {
    this.setState({ modalTitle: 'Success', modalText: 'Commodity Category updated successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0, Title: "", Code: "", errorMessage: "", IsActive: true });
  }
  private onError = () => {
    this.setState({ loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, ItemID: 0, errorMessage: "", Title: "", code: "", IsActive: true });
  }

  private checkDuplicates = (formData) => {
    let TrList = 'CommodityCategory';
    var filterString;
    try {
      if (this.state.ItemID == 0)
        filterString = `(Category_x0020_Code eq '${formData.Category_x0020_Code}' or Title eq '${formData.Title}') and IsActive eq '${formData.IsActive ? 1 : 0}'`;
      else
        filterString = `(Category_x0020_Code eq '${formData.Category_x0020_Code}' or Title eq '${formData.Title}') and IsActive ne '${formData.IsActive}' and Id ne ${this.state.ItemID}`;
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
    this.resetCategoryForm();
  }
  private resetCategoryForm = () => {
    this.setState({ Title: '', IsActive: true, Code: '', SaveUpdateText: 'Submit', addNewCategoryCode: false });
    //this.props.history.push('/commoditycategory');
    ()=>this.props.history.push('/commoditycategory');
  }

  private handleClose = () => {
    this.GetOnloadData();
    this.resetCategoryForm();
    this.setState({ addNewCategoryCode: false, showHideModal: false, Title: "", code: "", IsActive: false });
  }

  private onEditClickHandler = (id) => {
    console.log('edit clicked', id);
    try {
      sp.web.lists.getByTitle('CommodityCategory').items.getById(id).get()
        .then((response) => {
          this.setState({
            addNewCategoryCode: true,
            Title: response.Title.trim(),
            Code: response.Category_x0020_Code.trim(),
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
    var commodityCatData = formdata.data;
    var excelData = formdata.ImportedExcelData;
    if (excelData.length) {   //To remove duplicate records from Excel data
      let jsonObject = excelData.map((item:string)=>JSON.stringify(item));
      let uniqueSet:any = new Set(jsonObject);
      excelData = Array.from(uniqueSet).map((el:string)=>JSON.parse(el));
   }

    for (var i = excelData.length - 1; i >= 0; i--) {
      for (var j = 0; j < commodityCatData.length; j++) {
        if (excelData[i] && (excelData[i].Title.toLowerCase() === commodityCatData[j].Title.toLowerCase() && excelData[i].Code.toLowerCase() == commodityCatData[j].CategoryCode.toLowerCase())) {
          if (excelData[i].Status == commodityCatData[j].Status) {
            excelData.splice(i, 1);
          } else if (commodityCatData[j].IsActive != excelData[i].Status) {
            commodityCatData[j].IsActive = excelData[i].Status == "Active" ? true : false;
            statusChangedRec.push(commodityCatData[j]);
            excelData.splice(i, 1);
          }
        }
      }
    }
    if (excelData.length) {
      excelData.forEach(item => {
        var obj = {};
        obj["Title"] = item.Title;
        obj["Category_x0020_Code"] = item.Code.toString();
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
        sp.web.lists.getByTitle('CommodityCategory').items.getById(element.Id).update(element).then((res) => {

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
      let list = await sp.web.lists.getByTitle("CommodityCategory");
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
            modalText: 'Commodity Category uploaded successfully',
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
      modalText: 'Invalid Commodity Category file selected',
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
        name: "Title",
        selector: 'Title',

      },

      {
        name: "Code",
        selector: 'CategoryCode',

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
        sortable: true,
        cell: record => {
          return (
            <React.Fragment>
              <div style={{ paddingLeft: '10px' }}>
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/commoditycategory/${record.Id}`}>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        }
      },
      {
        name: "Title",
        //selector: 'Title',
        selector: (row, i) => row.Title,
        sortable: true

      },

      {
        name: "Code",
        //selector: 'CategoryCode',
        selector: (row, i) => row.CategoryCode,
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
        <div id="content" className="content p-2 pt-2">
          <div className='container-fluid'>
            <div className='FormContent'>
              <div className='title'>Commodity Category
                {this.state.addNewCategoryCode &&
                  <div className='mandatory-note'>
                    <span className='mandatoryhastrick'>*</span> indicates a required field
                  </div>
                }
              </div>

              <div className="after-title"></div>
              <div className="row justify-content-md-left">
                <div className="col-12 col-md-12 col-lg-9">



                  <div className={this.state.addNewCategoryCode ? 'mx-2 activediv' : 'mx-2'}>
                    <div className="text-right pt-2" id="">
                      <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Title", "Code", "Status"]} filename="Commodity Category" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>
                      <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNew}>Add</button>
                    </div>
                  </div>
                  <div className="light-box border-box-shadow mx-2">
                    <div className={this.state.addNewCategoryCode ? '' : 'activediv'}>
                      <div className="my-2">
                        <div className="row">

                          <InputText
                            type='text'
                            label={"Category"}
                            name={"Title"}
                            value={this.state.Title || ''}
                            isRequired={true}
                            onChange={this.handleChange}
                            refElement={this.inputCommodityTitle}
                            onBlur={this.handleonBlur}
                          />

                          <InputText
                            type='text'
                            label={"Category Code"}
                            name={"Code"}
                            value={this.state.Code || ''}
                            isRequired={true}
                            onChange={this.handleChange}
                            refElement={this.inputCommodityCode}
                            onBlur={this.handleonBlur}
                          />

                          <InputCheckBox
                            label={"Is Active"}
                            name={"IsActive"}
                            checked={this.state.IsActive}
                            onChange={this.handleChange}
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
                    <TableGenerator columns={columns} data={this.state.data} fileName={'Commodity Category'} showExportExcel={true}  ExportExcelCustomisedColumns={ExportExcelreportColumns} ExportExcelCustomisedData={this.state.data}></TableGenerator>
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

export default Commodity;

