#ifndef _H__PLC_ADD_INTS
#define _H__PLC_ADD_INTS

struct s_plc_add_ints_input {
	unsigned long x;
	unsigned long y;
}
struct s_plc_add_ints_output {
	unsigned long sum;
}
struct s_plc_add_ints_output * f_plc_add_ints(struct s_plc_add_ints_input * input);

#endif