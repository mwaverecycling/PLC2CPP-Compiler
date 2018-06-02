import { readFileSync, ensureDir, ensureDirSync, ensureFile, createWriteStream, readFile, writeFile } from "fs-extra";
import { join as joinPath, sep as pathSep } from "path";

import { PLCCircuit } from "./PLC";


export type template_option = { [key: string]: string }
export async function templateFile(infile: string, options?: template_option): Promise<string>;
export async function templateFile(infile: string, outfile: string, options?: template_option): Promise<void>;
export async function templateFile(infile: string, outfile?: string | template_option, options: template_option = {  }): Promise<string | void>
{
	if(outfile && typeof(outfile) !== "string") { options = outfile; }
	return readFile(infile, "utf8")
		.then<string | void>((data) => {
			for(let key in options)
			{
				data = data.replace(new RegExp(`%${key}%`, "g"), options[key]);
			}

			return (outfile && typeof(outfile) === "string") ? writeFile(outfile, data, "utf8") : data;
		});
}

export type PLCCompilerMessage = { status: string; message: string; };
function compilerError(msg: string): PLCCompilerMessage { return { status: "error", message: msg }; }
export function checkCircuit(circuit: PLCCircuit): PLCCompilerMessage
{
	let errmsgs: string[] = [  ];
	// Friendly name errors
	if(!/^[a-zA-Z]/.test(circuit.name)) { errmsgs.push("Circuit name must start with a letter"); }
	else if(!/^[a-zA-Z][a-zA-Z0-9_]+$/g.test(circuit.name)) { errmsgs.push("Circuit name can only contain alphanumeric characters and underscores"); }

	// Friendly package errors
	if(circuit.package.charAt(0) === "/" || circuit.package.charAt(circuit.package.length - 1) === "/") { errmsgs.push("Circuit package cannot start or end with a path separator"); }
	else if(!/^([a-zA-Z0-9_]+)(\/[a-zA-Z0-9_]+)*$/.test(circuit.package)) { errmsgs.push("Circuit package must be a valid path using alphanumerics and/or underscores"); }

	const channelTypes = circuit.channels.map((channel) => channel.type);
	circuit.inputs.forEach((input) => {
		if(input.type !== channelTypes[input.channel]) { errmsgs.push(`Type of input '${input.name}' does not match attached channel's type [${input.type} != ${channelTypes[input.channel]}]`); }
	});
	circuit.outputs.forEach((output) => {
		if(output.type !== channelTypes[output.channel]) { errmsgs.push(`Type of output '${output.name}' does not match attached channel's type [${output.type} != ${channelTypes[output.channel]}]`); }
	});
	circuit.chips.forEach((chip) => {
		chip.inputs.forEach((input) => {
			if(input.type !== channelTypes[input.channel]) { errmsgs.push(`Type of ${chip.name}'s input '${input.name}' does not match attached channel's type [${input.type} != ${channelTypes[input.channel]}]`); }
		});
		chip.outputs.forEach((output) => {
			if(output.type !== channelTypes[output.channel]) { errmsgs.push(`Type of ${chip.name}'s output '${output.name}' does not match attached channel's type [${output.type} != ${channelTypes[output.channel]}]`); }
		});
	});

	return errmsgs.length > 0 ? compilerError(errmsgs.join('\n')) : { status: "success", message: "Circuit is valid!" };
}


export abstract class PLCCompiler
{
	protected outdir: string;

	public constructor()
	{
		this.outdir = "./output";
		ensureDirSync(this.outdir);
	}

	public async compileFromJSON(filename: string): Promise<void>
	{
		const obj = JSON.parse(readFileSync(filename, "utf8")) as PLCCircuit;
		return this.compile(obj);
	}
	protected abstract async compile(obj: PLCCircuit): Promise<void>;

	protected package_path(pak: string): string { return pak.replace(/\./g, pathSep); }
}