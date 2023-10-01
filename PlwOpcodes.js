"use strict";

const PLW_OPCODE_NOARG										= 1;
const PLW_OPCODE_JZ											= 2;
const PLW_OPCODE_JNZ										= 3;
const PLW_OPCODE_JMP										= 4;
const PLW_OPCODE_PUSH										= 5;
const PLW_OPCODE_PUSH_GLOBAL								= 6;
const PLW_OPCODE_PUSH_GLOBAL_MOVE							= 7;
const PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE						= 8;
const PLW_OPCODE_PUSH_LOCAL									= 9;
const PLW_OPCODE_PUSH_LOCAL_MOVE                            = 10;
const PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE						= 11;
const PLW_OPCODE_POP_GLOBAL									= 12;
const PLW_OPCODE_POP_LOCAL									= 13;
const PLW_OPCODE_POP_VOID									= 14;
const PLW_OPCODE_CALL										= 15;
const PLW_OPCODE_CALL_NATIVE								= 16;
const PLW_OPCODE_PUSHF										= 17;
const PLW_OPCODE_EQ											= 18;
const PLW_OPCODE_RET										= 19;
const PLW_OPCODE_DUP                                  		= 20;
const PLW_OPCODE_SWAP										= 21;
const PLW_OPCODE_EXT										= 22;


// no arg

const PLW_OPCODE_SUSPEND									= 1;
const PLW_OPCODE_ADD										= 2;
const PLW_OPCODE_ADDF										= 3;
const PLW_OPCODE_SUB										= 4;
const PLW_OPCODE_SUBF										= 5;
const PLW_OPCODE_DIV										= 6;
const PLW_OPCODE_DIVF										= 7;
const PLW_OPCODE_REM										= 8;
const PLW_OPCODE_MUL										= 9;
const PLW_OPCODE_MULF										= 10;
const PLW_OPCODE_NEG										= 11;
const PLW_OPCODE_NEGF										= 12;
const PLW_OPCODE_GT											= 13;
const PLW_OPCODE_GTF										= 14;
const PLW_OPCODE_LT											= 15;
const PLW_OPCODE_LTF										= 16;
const PLW_OPCODE_GTE										= 17;
const PLW_OPCODE_GTEF										= 18;
const PLW_OPCODE_LTE										= 19;
const PLW_OPCODE_LTEF										= 20;
const PLW_OPCODE_AND										= 21;
const PLW_OPCODE_OR											= 22;
const PLW_OPCODE_NOT										= 23;

const PLW_OPCODES = [
	"",
	"NOARG",
	"JZ",
	"JNZ",
	"JMP",
	"PUSH",
	"PUSH_GLOBAL",
	"PUSH_GLOBAL_MOVE",
	"PUSH_GLOBAL_FOR_MUTATE",
	"PUSH_LOCAL",
	"PUSH_LOCAL_MOVE",
	"PUSH_LOCAL_FOR_MUTATE",
	"POP_GLOBAL",
	"POP_LOCAL",
	"POP_VOID",
	"CALL",
	"CALL_NATIVE",
	"PUSHF",
	"EQ",
	"RET",
	"DUP",
	"SWAP",
	"INTERNAL"			
];	

const PLW_NOARG_OPCODES = [
	"",
	"SUSPEND",
	"ADD",
	"ADDF",
	"SUB",
	"SUBF",
	"DIV",
	"DIVF",
	"REM",
	"MUL",
	"MULF",
	"NEG",
	"NEGF",
	"GT",
	"GTF",
	"LT",
	"LTF",
	"GTE",
	"GTEF",
	"LTE",
	"LTEF",
	"AND",
	"OR",
	"NOT"
];

