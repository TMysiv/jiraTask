import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import {join} from "path";
import * as XLSX from "xlsx";

@Injectable()
export class XlsService {

    async parseFile(data: Buffer) {
        const workbook = XLSX.read(data, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const test = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const sum = test.reduce((acc, { Hours }) => acc + Hours, 0);
        const xxx = test.map((obj: any) => {
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const unixTime = (obj['Work date'] - 25569) * millisecondsPerDay;
            obj['Work date'] = new Date(unixTime).toLocaleString().slice(0, -12).replace(',','').replace(/\//g, '.')
            const { 'Issue Key': issueKey, 'Work date': workDate, 'Work Description': workDescription, 'Hours': hours } = obj;
            return {'Issue Key': issueKey, 'Work date': workDate, 'Work Description': workDescription, 'Hours': hours}
        });

        return this.generateFile(xxx, test[0]['Full name'], sum as number)
    }

    async generateFile(data: any[], fullname: string, sum: number) {
        const worksheet =  XLSX.utils.json_to_sheet(data);
        const workbook =  XLSX.utils.book_new();

        worksheet['!cols'] = [{wch: 12, }, {wch: 10}, {wch: 40}, {wch: 10}];

        const lastRow = XLSX.utils.decode_range(worksheet['!ref']).e.r;
        const sumCell = XLSX.utils.encode_cell({ r: lastRow + 1, c: 3 });
        XLSX.utils.sheet_add_aoa(worksheet, [[sum]], {origin: sumCell});

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${fullname}.xlsx`);
        return fs.createReadStream(join(process.cwd(), `${fullname}.xlsx`));

        // fs.unlink(join(process.cwd() + `${fullname}.xlsx` ),() => {
        //     console.log('mmm')
        // })

    }
}
