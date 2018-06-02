import { ensureDir, ensureFile, writeFile } from "fs-extra";
import { join as joinPath } from "path";

import { PLCCircuit, PLCDataType } from "../PLC";
import { templateFile } from "../compiler";
import { PLC2CPPChipCompiler } from "./PLC2CPPChipCompiler";

function type2cap(plcType: PLCDataType): string 
{
	switch (plcType)
	{
		case "bit":  case "bool": return "Bool";
		case "byte": return "Byte";
		case "int": return "Int";
		case "uint": return "UInt";
		case "long": return "Long";
		case "ulong": return "ULong";
		case "float": return "Float";
		case "double": return "Double";
		default: return plcType;
	}
}
function type2ex(plcType: PLCDataType): string 
{
	switch (plcType)
	{
		case "bit":  case "bool": return "true";
		case "byte": return "7";
		case "int": return "1";
		case "uint": return "12";
		case "long": return "123";
		case "ulong": return "1234";
		case "float": return "2.718";
		case "double": return "3.1415926536";
	}
}

export class PLC2CPPMainCompiler extends PLC2CPPChipCompiler
{
	public constructor() { super(); }

	protected async compile(circuit: PLCCircuit): Promise<void>
	{
		const sourcefile = joinPath(this.outdir, `${circuit.name}.cpp`);
		return super.compile(circuit)
			.then(() => ensureFile(sourcefile))
			.then(() => this.compileMain(circuit, sourcefile));
	}
	private async compileMain(circuit: PLCCircuit, filename: string): Promise<void>
	{
		const imports = `#include "${circuit.package}/${circuit.name}.hpp"\n`;

		let code = '    PLCChip_Print* printer = new PLCChip_Print();\n';
		code += `    ${circuit.name}* circuit = new ${circuit.name}();\n\n`;
		code += circuit.outputs
			.map((output, index) => `    circuit->setListener(${index}, printer);`)
			.join('\n');
		code += '\n\n';

		code += circuit.inputs
			.map((input) => `    PLCValueEvent ${input.name}_event = PLCValueEvent::From${type2cap(circuit.channels[input.channel].type)}(${type2ex(circuit.channels[input.channel].type)});`)
			.join('\n');
		code += '\n\n';
		code += circuit.inputs
			.map((input, index) => `    circuit->onChange(${index}, ${input.name}_event);`)
			.join('\n');
		code += '\n\n';

		code += '    delete printer;\n';
		code += '    delete circuit;';


		const source_options = {
			IMPORTS: imports,
			CODE: code
		};

		return templateFile("tmpls/main.tmpl.cpp", filename, source_options);
	}
}