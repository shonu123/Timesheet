import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
const BindInfoIcon = (props) => {
    const openDocument = (url) => {
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };
    return (<><button type="button" className='span-fa-IconFormula' id={'IconFormula'} title=''><span><FontAwesomeIcon icon={faCircleQuestion}></FontAwesomeIcon></span> Help</button>
        <div className="info">
            <div className="noteMsg">
                 User Guides
            </div>
            <div className="p-2">
                <div className="divHelp">
                    {/*Below is Word documents format */}
                    {/* {(props.isEmployee || props.isAdmin) &&<div className="helpSection" >
                        <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=%7B92CF11A9-72AB-4F1F-A0DB-BADCBE560AF7%7D&file=Time%20Off%20Submission.docx&action=default`)} className='helpClick' title='Click here to open'>Time Off Submission</span>
                    </div>}
                    {(props.isEmployee || props.isAdmin) &&<div className="helpSection" >
                       <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=%7B756F7EF9-1963-477A-9883-B40234D49B88%7D&file=Timesheet%20Submission.docx&action=default`)} className='helpClick' title='Click here to open'>Timesheet Submission</span>
                    </div>}
                    {(props.isManager || props.isAdmin) &&<div className="helpSection" >
                        <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=%7B457D246C-527D-4AE3-95C6-A98AF1248220%7D&file=Synergy%20Manager%20Time%20Off%20Approval.docx&action=default`)} className='helpClick' title='Click here to open'>Synergy Manager Time Off Approval</span>
                    </div>}
                    {(props.isHR || props.isAdmin) &&<div className="helpSection" >
                        <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=%7BA4D0EB37-A220-4140-B6F3-186ED598D0EB%7D&file=HR%20Time%20Off%20Approval.docx&action=default`)} className='helpClick' title='Click here to open'>HR Time Off Approval</span>
                    </div>} */}
                    {(props.isEmployee || props.isAdmin) &&<div className="helpSection" >
                        <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/UserGuides/Time%20Off%20-%20By%20Employee.pdf`)} className='helpClick' title='Click here to open'>Time Off Submission</span>
                    </div>}
                    {(props.isManager || props.isAdmin) &&<div className="helpSection" >
                        <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/UserGuides/Time%20Off%20-%20By%20Synergy%20Manager.pdf`)} className='helpClick' title='Click here to open'>Synergy Manager Time Off Approval</span>
                    </div>}
                    {(props.isHR || props.isAdmin) &&<div className="helpSection" >
                        <span onClick={()=>openDocument(`${props.webAbsoluteUrl}/UserGuides/Time%20Off%20-%20By%20HR%20Manager.pdf`)} className='helpClick' title='Click here to open'>HR Time Off Approval</span>
                    </div>}
                </div>
            </div>
        </div></>)
}
export default BindInfoIcon;