import { ensureDir, ensureFile, writeFile } from "fs-extra";
import { join as joinPath } from "path";

import { PLCCircuit } from "../PLC";
import { PLCCompiler, templateFile } from "../compiler";

export class PLC2CPPChipCompiler extends PLCCompiler
{
	public constructor() { super(); }

	protected async compile(circuit: PLCCircuit): Promise<void>
	{
		circuit.chips.forEach((chip) => { chip.name = `PLCChip_${chip.name}`; });
		circuit.name = `PLCChip_${circuit.name}`;

		const builddir = joinPath(this.outdir, this.package_path(circuit.package));
		const headerfile = joinPath(builddir, `${circuit.name}.hpp`);
		const sourcefile = joinPath(builddir, `${circuit.name}.cpp`);
		ensureDir(builddir)
			.then(() => Promise.all([
				ensureFile(headerfile).then(() => this.compileHeader(circuit, headerfile)),
				ensureFile(sourcefile).then(() => this.compileSource(circuit, sourcefile))
			])).then(() => {  });
	}
	private async compileHeader(circuit: PLCCircuit, filename: string): Promise<void>
	{
		const header_options = {
			CLASSNAME: circuit.name,
			HEADERNAME: circuit.name.toUpperCase()
		};

		return templateFile("tmpls/header.tmpl.hpp", filename, header_options);
	}
	private async compileSource(circuit: PLCCircuit, filename: string): Promise<void>
	{
		const imports = circuit.chips
			.map((chip) => `#include "${chip.package}/${chip.name}.hpp"`)
			.filter((hpp, index, arr) => arr.indexOf(hpp) == index)
			.join('\n');

		let initcode = "";
		initcode += circuit.chips
			.map((chip, index) => `    ${chip.name}* chip${index} = new ${chip.name}();`)
			.join('\n');
		initcode += '\n';
		initcode += circuit.channels
			.map((channel) => `    PLCChannel* channel${channel.id} = new PLCChannel();`)
			.join('\n');
		initcode += '\n\n';

		initcode += circuit.chips
			.map((chip, chip_index) => {
				return chip.inputs.map((input, input_index) => `    channel${input.channel}->addListener(chip${chip_index}, ${input_index});`).join('\n')
					 + '\n'
					 + chip.outputs.map((output, output_index) => `    chip${chip_index}->setListener(${output_index}, channel${output.channel});`).join('\n');
			})
			.join('\n');
		initcode += '\n\n';

		initcode += circuit.outputs
			.map((output, index) => `    channel${output.channel}->addCallback([this](PLCValueEvent & event) { this->outputs[${index}] = event; });`)
			.join('\n');
		initcode += '\n\n';

		initcode += circuit.chips
			.map((chip, index) => `    this->chips[${index}] = chip${index};`)
			.join('\n');
		initcode += '\n';
		initcode += circuit.channels
			.map((channel) => `    this->channels[${channel.id}] = channel${channel.id};`)
			.join('\n');

		let applycode = "";
		applycode += circuit.inputs
			.map((input, index) => `    this->channels[${input.channel}]->onChange(this->inputs.at(${index}));`)
			.join('\n');


		const source_options = {
			CLASSNAME: circuit.name,
			PACKAGENAME: circuit.package,
			IMPORTS: imports,
			INPUTS: circuit.inputs.length.toString(),
			OUTPUTS: circuit.outputs.length.toString(),
			CHIPS: circuit.chips.length.toString(),
			CHANNELS: circuit.channels.length.toString(),
			INITCODE: initcode,
			APPLYCODE: applycode
		};

		return templateFile("tmpls/source.tmpl.cpp", filename, source_options);
	}
}