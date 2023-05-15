import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { ICamlQuery } from '@pnp/sp/lists';
import FileUpload from '../Shared/FileUpload';

export interface HomeProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
}
export interface HomeState {

}
class Home extends React.Component<HomeProps, HomeState> {
    public state = { isFilesLoaded: false, fileArr: [] };
    private inputFileRef;
    constructor(props) {
        super(props);
        this.inputFileRef = React.createRef();
        sp.setup({
            spfxContext: this.props.context
        });
    }

    public componentDidMount() {
        //console.log(this.props);
    }
    private submitForm = (e) => {
        e.preventDefault();
        //console.log('submit ');

        let siteAbsoluteURL = this.props.context.pageContext.web.serverRelativeUrl;
        const caml: ICamlQuery = {
            ViewXml: "<View><ViewFields><FieldRef Name='Title' /></ViewFields><RowLimit>5</RowLimit></View>",
        };
        try {
            let processedFiles = 0;
            for (const i in this.state.fileArr) {
                let file = this.state.fileArr[i];
                sp.web.getFolderByServerRelativeUrl(siteAbsoluteURL + "/Shared Documents").files.add(file.name, file, true).then((f) => {
                    //console.log("uploaded the file", file.name);
                    processedFiles = processedFiles + 1;
                    if (this.state.fileArr.length == processedFiles) {
                        alert('FilesUploaded');
                    }
                }, (err) => {
                    console.log("Error while uploading the file", file.name, err);
                });

            }
            console.log('checking async');
        }
        catch (e) {
            console.log(e);
        }

    }
    private filesChanged = (selectedFiles) => {
        this.setState({ fileArr: selectedFiles });
    }
    public render() {
        return (
            <div>
                <FileUpload ismultiAllowed={true} onFileChanges={this.filesChanged} isnewForm={true} />
                <button className="btn btn-success" onClick={this.submitForm}>Upload</button>
            </div>

        );
    }
}
export default Home;
