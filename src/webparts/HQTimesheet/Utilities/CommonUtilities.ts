import { StatusType } from '../Constants/Constants';


class CommonUtilities {
    // common functions for Status dispalying in TimeOffDashboard
    public static getTOStatus(value) {
        let Status = value
        if (value == "approved by Manager") {
            // Status = "Approved by Synergy Manager";
            Status = "Pending with HR";
        }
        else if (value == "Submitted") {
            Status = "Pending with Manager";  // in back end stored as Submitted ,but in Front end displayed as Pending with Manager
        }
        else if (value == "rejected by Manager") {
            Status = "Rejected by Synergy Manager";
        }
        else if (value == "approved by Synergy") {
            // Status = "Approved by Reviewer";
            Status = "Pending with HR";
        }
        else if (value == "rejected by Synergy") {
            Status = "Rejected by Reviewer";
        }
        else if (value == "rejected by HR") {
            Status = "Rejected by HR";
        }
        else if (value == "Updated") {
            Status = "Approved";
        }
        return Status;
    }
    public static getTOStatusInShortForm(value) {
        let Status = value;
        if (value == "approved by Manager") {
            // Status = "Manager Approved";
            Status = "Pending with HR";
        }
        else if (value == "Submitted") {
            Status = "Pending with Manager"; // in back end stored as Submitted ,but in Front end displayed as Pending with Manager
        }
        else if (value == "rejected by Manager") {
            Status = "Manager Rejected";
        }
        else if (value == "rejected by Synergy") {
            Status = "Reviewer Rejected";
        }
        else if (value == "approved by Synergy") {
            // Status = "Reviewer Approved";
            Status = "Pending with HR";
        }
        else if (value == "rejected by HR") {
            Status = "HR Rejected";
        }
        else if (value == "Updated") {
            Status = "Approved";
        }
        return Status;
    }
    public static getStatusClass(Status) {
        if (Status == "Submitted") {
            return "span-blue";
        }
        else if (Status == "Approved" || Status == "Updated") {
            return "span-green";
        }
        else if (Status == "approved by Manager" || Status == "approved by Synergy") {
            return "span-manager-approve";
        }
        // else if (Status == "approved by Synergy") {
        //     return "span-reviewer-approve";
        // }
        else if (Status == "rejected by Manager" || Status == "rejected by Synergy" || Status == "rejected by HR") {
            return "span-rejected";
        }
        else if (Status == "Withdrawn") {
            return "span-withdraw";
        }
        else if (Status == "Revoked") {
            return "span-revoke";
        }
        else if (Status == "In-Draft") {
            return "span-indraft";
        }
    }
    // common functions for Status dispalying in Dashboard
    public static getTSStatus(value) {
        let Status = value
        if (value == "approved by Manager") {
            Status = "Pending with Reviewer";
        }
        else if (value == "Submitted") {
            Status = "Pending with Manager";  // in back end stored as Submitted ,but in Front end displayed as Pending with Manager
        }
        else if (value == "rejected by Manager") {
            Status = "Rejected by Reporting Manager";
        }
        else if (value == "approved by Synergy") {
            Status = "Approved by Reviewer";
        }
        else if (value == "rejected by Synergy") {
            Status = "Rejected by Synergy";
        }
        else if (value == "rejected by HR") {
            Status = "Rejected by HR";
        }
        return Status;
    }
    public static getTSStatusInShortForm(value) {
        let Status = value;
        if (value == "approved by Manager") {
            Status = "Pending with Reviewer";
        }
        else if (value == "Submitted") {
            Status = "Pending with Manager"; // in back end stored as Submitted ,but in Front end displayed as Pending with Manager
        }
        else if (value == "rejected by Manager") {
            Status = "Manager Rejected";
        }
        else if (value == "rejected by Synergy") {
            Status = "Reviewer Rejected";
        }
        else if (value == "approved by Synergy") {
            Status = "Pending with HR";
        }
        else if (value == "rejected by HR") {
            Status = "HR Rejected";
        }
        return Status;
    }
}
export default CommonUtilities;