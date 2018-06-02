
export type PLCDataType = "bool" | "bit" | "byte" | "int" | "uint" | "long" | "ulong" | "float" | "double";
export type PLCChannelID = number;

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
	id: PLCChannelID;
	type: PLCDataType;
}

export interface PLCInterface
{
	name: string;
	type: PLCDataType;
	channel: PLCChannelID;
}