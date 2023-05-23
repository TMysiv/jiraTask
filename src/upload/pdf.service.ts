import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import {join} from "path";
import JsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

@Injectable()
export class PdfService {

    async generateFile(data) {
        const doc = new JsPDF();
        const headers = Object.keys(data[0][0]).slice(0, 3);

        for (let i = 0; i < data.length; i++) {
            const sum = data[i].reduce((acc, {Hours}) => acc + Hours, 0);
            const modifyHours = data[i].map(row => {
                return {
                    ['Work date'] : row['Work date'],
                    ['Work Description'] : row['Work Description'],
                    ['Hours'] : String(row['Hours']).substring(0,3),
                };
            });

            doc.setFontSize(12).setFont('Helvetica', 'bold').text(`Project -  ${data[i][0]['Activity Name']}`, 50, 20);
            doc.text(`Developer -  ${data[i][0]['Full name']}`, 50, 25);

            autoTable(doc, {
                theme: 'plain',
                head: [headers],
                headStyles: {halign: 'center',fontSize: 11},
                columnStyles: {
                    0: {halign: 'center', cellWidth: 25, valign: 'middle', fontSize: 11},
                    1: {halign: 'center', cellWidth: 60, valign: 'middle', fontSize: 11},
                    2: {halign: 'center', cellWidth: 20, valign: 'middle', fontSize: 11}
                },
                body: modifyHours.map((row) => Object.values(row).slice(0, 3)),
                margin: {left: 46, top: 28},
                foot: [['','',`Total ${sum}`]],
                footStyles: {fontSize: 11,halign: 'center'},
                showFoot: "lastPage",
                didDrawPage: () => {
                    doc.setLineWidth(0.5);
                    doc.line(49, 34, doc.internal.pageSize.getWidth() - 60, 34);
                },
            })
            doc.addPage();

        }
        const fileName = new Date().getTime();
        doc.save(`files/${fileName}.pdf`)
        return fs.createReadStream(join(process.cwd(), 'files' ,`${fileName}.pdf`));
    }

}
