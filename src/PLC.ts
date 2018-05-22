

export interface PLCChip
{
	name: string;
	package: string;
	inputs: PLCInterface[];
	outputs: PLCInterface[];
}
export interface PLCCircuit extends PLCChip
{
	channels: PLCChannel[];
	chips: PLCChip[];
}
export interface PLCChannel
{
	id: number;
	type: PLCType;
}

export type PLCType = "bool" | "bit" | "byte" | "int" | "uint" | "float";

export interface PLCInterface
{
	name: string;
	channel: PLCChannel;
}