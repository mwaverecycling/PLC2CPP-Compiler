import { readFileSync, ensureDir, ensureDirSync, ensureFile, createWriteStream } from "fs-extra";
import { join as joinPath, sep as pathSep } from "path";

import { PLCCircuit, PLCType } from "./PLC";



export class PLCCompiler
{
	private outdir: string;

	public constructor()
	{
		this.outdir = "./output";
		ensureDirSync(this.outdir);
	}

	public async compileFromJSON(filename: string): Promise<void>
	{
		const obj = JSON.parse(readFileSync(filename, "utf8")) as PLCCircuit;
		return this.compileToC(obj);
	}

	private async compileToC(circuit: PLCCircuit): Promise<void>
	{
		const builddir = joinPath(this.outdir, this.package_path(circuit.package));
		const headerfile = joinPath(builddir, `${circuit.name}.h`);
		const sourcefile = joinPath(builddir, `${circuit.name}.c`);
		ensureDir(builddir)
			.then(() => Promise.all([
				ensureFile(headerfile).then(() => this.compileToC_Header(circuit, headerfile)),
				ensureFile(sourcefile).then(() => this.compileToC_Source(circuit, sourcefile))
			])).then(() => {  });
	}
	private async compileToC_Header(circuit: PLCCircuit, filename: string): Promise<void>
	{
		const outinc = createWriteStream(filename);


		var outchunk = `#ifndef _H__PLC_${circuit.name.toUpperCase()}\n#define _H__PLC_${circuit.name.toUpperCase()}\n\n`;
		outinc.write(outchunk, "utf8");

		outchunk = `struct s_plc_${circuit.name}_input {\n`;
		circuit.inputs.forEach((input) => {
			outchunk += `\t${this.map_type(input.channel.type)} ${input.name};\n`;
		});
		outchunk += "}\n";
		outinc.write(outchunk, "utf8");

		outchunk = `struct s_plc_${circuit.name}_output {\n`;
		circuit.outputs.forEach((output) => {
			outchunk += `\t${this.map_type(output.channel.type)} ${output.name};\n`;
		});
		outchunk += "}\n";
		outinc.write(outchunk, "utf8");

		outchunk = `struct s_plc_${circuit.name}_output * f_plc_${circuit.name}(struct s_plc_${circuit.name}_input * input);\n\n`;
		outchunk += "#endif";
		return new Promise<void>((resolve, reject) => {
			outinc.end(outchunk, "utf8", () => resolve());
		});
	}
	private async compileToC_Source(circuit: PLCCircuit, filename: string): Promise<void>
	{
		const outsrc = createWriteStream(filename);

		var outchunk = `#include "${this.package_path(circuit.package)}/${circuit.name}.h"\n\n`;
		const includes = circuit.chips
			.map((chip) => `${this.package_path(chip.package)}/${chip.name}.h`)
			.filter((include, index, arr) => arr.indexOf(include) == index);
		includes.forEach((include) => { outchunk += `#include "${include}"\n` });

		return new Promise<void>((resolve, reject) => {
			outsrc.end(outchunk, () => resolve());
		});
	}



	private package_path(pak: string): string { return pak.replace(/\./g, pathSep); }
	private map_type(plcType: PLCType): string 
	{
		switch (plcType) {
			case "bool": case "bit": case "byte":
				return "unsigned char"
			case "int":
				return "long";
			case "uint":
				return "unsigned long";
			case "float":
				return "double";
		}
	}
}