import * as React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFilePdf} from '@fortawesome/free-solid-svg-icons';

interface IExportToPDF {
    columns :[];
    data : [];
    listName: string;
}

function ExportListItemsToPDF(props: IExportToPDF) {

    let { columns, data,listName } = props;

    function genearatePDF() {
        const doc = new jsPDF();
        // autoTable(doc, { html: htmlElementForPDF, theme: 'grid' });
        autoTable(doc, { columns : columns, body : data, theme: 'grid' });
        doc.save(`${listName}.pdf`);
    }

    return (
        <button type="button" id="btnDownloadFile" className="icon-export-b btn" onClick={() => genearatePDF()}>
            <FontAwesomeIcon icon={faFilePdf} className='icon-export-b'></FontAwesomeIcon>
        </button>
    );
}

export default ExportListItemsToPDF;