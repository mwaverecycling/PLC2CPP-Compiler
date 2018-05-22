import { existsSync } from "fs";

import { PLCCompiler } from "./compiler";



class Main
{
	public constructor() { this.main(process.argv.slice(2)); }
	public main(args: string[])
	{
		const filename = args[0];
		if(filename && existsSync(filename)) {
			const compiler = new PLCCompiler();
			compiler.compileFromJSON(filename);
		}
	}

}
new Main();
