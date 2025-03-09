import * as fs from 'fs';
import * as path from 'path';

import { Controller, Get, Param, Res } from '@cmmv/http';

@Controller('proto')
export class ProtobufController {
    @Get(':contract', { exclude: true })
    async getContract(@Param('contract') contract, @Res() res) {
        const contractFilename = path.resolve(
            process.cwd(),
            `./src/protos/${contract}.json`,
        );

        if (fs.existsSync(contractFilename)) {
            const contract = fs.readFileSync(contractFilename, 'utf-8');
            res.json(JSON.parse(contract));
        } else {
            res.status(404).send();
        }
    }
}
