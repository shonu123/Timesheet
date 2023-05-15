import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/sputilities";

export interface RequisitionReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context:any;
    history: any;
}
 
export interface RequisitionReportState {
    
}

class RequisitionReport extends React.Component<RequisitionReportProps, RequisitionReportState> {
    private siteURL: string;
    private sitecollectionURL: string;
    private selectedPlant: any = {};
    //state = {   }
    constructor(props: RequisitionReportProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.sitecollectionURL=this.props.spContext.siteAbsoluteUrl+"/Mayco";
        //console.log('current siteurl', this.siteURL);
        sp.setup({
            spfxContext: this.props.context
        });
    }
    public componentDidMount() {
       // this.getPlants();
      }
    // private getPlants = () => {
    //     let queryItems = this.sitecollectionURL + "/_api/web/lists/getbytitle('Plant')/items";
    //     let maycoweb=Web(this.sitecollectionURL);
    //     sp.web.lists.getByTitle('LPA').items.getAll(4000).then((res)=>{
    //         //console.log(res);
    //         this.setState({ plants: res });
    //     }, (error) => {
    //         console.log(error);
    //     });
    // }
    // private handleSubmit = event => {
    //     event.preventDefault();
    //   const emailProps: IEmailProperties = {
    //     To: ["spadmin@synergycom.com"],
    //     Subject: "This email is about...",
    //     Body: "Here is the body. <b>It supports html</b>",
    //     AdditionalHeaders: {
    //         "content-type": "text/html"
    //     }
    // };
    // sp.utility.sendEmail(emailProps).then((res) => {
    //     console.log('email sent');
    // }, (error) => {
    //     console.log(error);
    // }); 
    //   }
    public render() { 
        return ( <div>
            Report sample
            {/* <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Send Email</button> */}
        </div> );
    }
}
 
export default RequisitionReport;