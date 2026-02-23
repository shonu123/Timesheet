
export enum StatusType {
  Save = 'In-Draft',
  Submit = 'Submitted',
  InProgress = 'In-Progress',
  Approved = "Approved",
  Reject = "Rejected",
  ManagerApprove= "approved by Manager",
  ReviewerApprove="approved by Synergy",
  ManagerReject = "rejected by Manager",
  ReviewerReject = "rejected by Synergy",
  Revoke="Revoked",
  ForwardApprovals = "Forwarded",
  Withdraw = "Withdrawn",
  HRApprove = "approved by HR",
  HRReject = "rejected by HR",
  RecordModified="Record Modified",
  Updated="Updated"
}

export enum ToasterTypes {
  Success = 'Success',
  Error = 'Error',
  Warning = 'Warning'
}

export enum ControlType {
    number='Number',
    string='String',
    mobileNumber='MobileNumber',
    email='Email',
    people='PeoplePicker',
    date='DatePicker',
    compareDates='CompareDates',
    reactSelect='reactSelect',
    MUIMultiSelect='MUIMultiSelect',
  }
  
  
  // export enum PendingStatus {
  //   Level1='Approver 1',
  //   Level2='Approver 2',
  //   Level3='Approver 3',
  //   Level4='Approver ',
  //   Level5='Purchasing Manager',
  //   EscalationLevel='Escalation Approver',
  //   Empty='',
  // }
  
  
  // export enum ApprovalStatus{
  //   Approved="Approved",
  //   Rejected="Rejected",
  //   InProgress="In-Progress",
  //   PurchasingTeamUpdated = "Purchasing Team Updated",
  //   draft='Draft',
  //   Withdraw='Withdraw',
  //   Msave='Master Submitted',
  // }
  
  
  // export enum ActionStatus{
  //   Draft='saved successfully',
  //   Submitted='submitted successfully',
  //   Updated='updated successfully',
  //   Approved='approved successfully',
  //   Rejected='rejected successfully',
  //   Error='Sorry! something went wrong',
  //   Export='exported successfully',
  //   configMaster='Configure Approval Master properly',
  //   Withdraw='withdraw successfully',
  //   Deleted ='Deleted successfully',
  //   PO ='Processed PO successfully',
  
  // }
  
  