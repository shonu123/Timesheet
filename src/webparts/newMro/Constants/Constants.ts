
export enum StatusType {
  Save = 'In-Draft',
  Submit = 'Submitted',
  InProgress = 'In-Progress',
  Approved = "Approved",
  Reject = "Rejected"
}




export enum ControlType {
    number='Number',
    string='String',
    mobileNumber='MobileNumber',
    email='Email',
    people='PeoplePicker',
    date='DatePicker',
    compareDates='CompareDates',
  }
  
  
  export enum PendingStatus {
    Level1='Approver 1',
    Level2='Approver 2',
    Level3='Approver 3',
    Level4='Approver ',
    Level5='Purchasing Manager',
    EscalationLevel='Escalation Approver',
    Empty='',
  }
  
  
  export enum ApprovalStatus{
    Approved="Approved",
    Rejected="Rejected",
    InProgress="In-Progress",
    PurchasingTeamUpdated = "Purchasing Team Updated",
    draft='Draft',
    Withdraw='Withdraw',
    Msave='Master Submitted',
  }
  
  
  export enum ActionStatus{
    Draft='saved successfully',
    Submitted='submitted successfully',
    Updated='updated successfully',
    Approved='approved successfully',
    Rejected='rejected successfully',
    Error='Sorry! something went wrong',
    Export='exported successfully',
    configMaster='Configure Approval Master properly',
    Withdraw='withdraw successfully',
    Deleted ='Deleted successfully',
    PO ='Processed PO successfully',
  
  }
  export enum Dropdowns{
  Programs= "{'drp':[{Title:'Assembly'},{Title:'JT'},{Title:'JL'},{Title:'Mold'},{Title:'Press'},{Title:'WD'},{Title:'WK'},{Title:'WL'}]}",
  Companys= '{"drp":[{"Title":"Mayco"},{"Title":"Jvis"}]}',
  }
  
  