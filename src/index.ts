import { existsSync } from "fs";

import { PLC2CPPMainCompiler } from "./compilers/PLC2CPPMainCompiler";



class Main
{
	public constructor() { this.main(process.argv.slice(2)); }
	public main(args: string[])
	{
		const filename = args[0];
		if(filename && existsSync(filename)) {
			const compiler = new PLC2CPPMainCompiler();
			compiler.compileFromJSON(filename)
				.then(() => {
					console.log("Compilation Finished!");
				})
				.catch((err) => {
					console.error("Erro during compilation!");
					console.error(err);
				});
		}
	}

}
new Main();
