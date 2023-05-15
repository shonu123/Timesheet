import { faPaperclip, faWindowClose, faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React,{ useRef, useState } from "react";

function FileUpload(props) {
    const isMultiAllowed = props.ismultiAllowed;
    const isnewForm = props.isnewForm;
    var fileArr = props.files[0];
    var delefileArr = props.files[1];
    let inputFileRef = useRef(null);
    const [isFileNameOk, setFileNameOk] = useState(false);

    function showFilePopup() {
        inputFileRef.current.click();
    }
    function handleFileUpload(e) {
        e.preventDefault();
        setFileNameOk(false);

        let arrFiles = Array.from(e.target.files);
        let stateArrFiles = fileArr;
        arrFiles.map((selItem, index) => {
            let filename = selItem['name'];
            if (/[^a-zA-Z0-9\-_ ()\/]/.test(filename.split(".")[0])) {
                return setFileNameOk(true);
            }
            //let checkProperFileName = 
            let checkexsiting = stateArrFiles.filter((file) => {
                return filename == file.name;
            });
            selItem['IsNew'] = true;
            selItem['IsDeleted'] = false;
            if (checkexsiting.length == 0)
                stateArrFiles.push(selItem);
        });
        props.onFileChanges([stateArrFiles, delefileArr]);
        e.target.value = '';
    }
    function removeSelectedFile(fileName) {
        let fileColl = fileArr;
        let fileCollAfterRemove = fileColl.filter((file) => {
            return file.name != fileName;
        });
        let filearryRemove = fileColl.filter((file) => {
            return file.name == fileName && file.IsNew == false;
        });
        if (filearryRemove.length > 0)
            delefileArr.push(filearryRemove[0]);
        props.onFileChanges([fileCollAfterRemove, delefileArr]);
    }
    function renderFiles() {
        var files: any = fileArr;
        const fsArr = files.map((file) => {
            let fileName = file.name;
            let fileUrl = file.URL;
            if (fileUrl != undefined && fileUrl != null)
                return (<li className="hoverclass col-md-4"><a target="_blank" download href={fileUrl}><FontAwesomeIcon icon={faPaperclip}></FontAwesomeIcon> <span> {fileName} </span></a><span hidden={!isnewForm}><FontAwesomeIcon onClick={() => removeSelectedFile(fileName)} icon={faWindowClose} /></span></li>);
            else
                return (<li className="hoverclass col-md-4"><FontAwesomeIcon icon={faPaperclip}></FontAwesomeIcon> <span> {fileName} </span> <span> <FontAwesomeIcon onClick={() => removeSelectedFile(fileName)} icon={faWindowClose} /></span></li>);
        });
        return fsArr;
    }
    return (
        <div className="">
            <h6 className="my-2">Attachment</h6>
            <div className="">
                <div className="">
                    <button type="button"  onClick={showFilePopup} className="btn upload-btn">Choose File <FontAwesomeIcon icon={faCloudUploadAlt}></FontAwesomeIcon> </button>
                    <input multiple={isMultiAllowed} ref={inputFileRef} type="file" onChange={handleFileUpload} title="Please choose file" style={{ "display": "none" }} className="inputFile" />
                </div>
                <div className="col-md-12 col-sm-12 col-xs-12 col-12">
                    <ul className="attachment-list row">
                        {renderFiles()}
                    </ul>

                    {isFileNameOk ? <span style={{color:'red'}}>Special characters are not allowed in uploaded File</span> : ""}

                </div>
            </div>
        </div>
    );
}
export default FileUpload;