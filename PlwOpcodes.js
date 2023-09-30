"use strict";

const OPCODE_NOARG										= 1;
const OPCODE_JZ											= 2;
const OPCODE_JNZ										= 3;
const OPCODE_JMP										= 4;
const OPCODE_PUSH										= 5;
const OPCODE_PUSH_GLOBAL								= 6;
const OPCODE_PUSH_GLOBAL_MOVE							= 7;
const OPCODE_PUSH_GLOBAL_FOR_MUTATE						= 8;
const OPCODE_PUSH_LOCAL									= 9;
const OPCODE_PUSH_LOCAL_MOVE                            = 10;
const OPCODE_PUSH_LOCAL_FOR_MUTATE						= 11;
const OPCODE_POP_GLOBAL									= 12;
const OPCODE_POP_LOCAL									= 13;
const OPCODE_POP_VOID									= 14;
const OPCODE_CALL										= 15;
const OPCODE_CALL_NATIVE								= 16;
const OPCODE_PUSHF										= 17;
const OPCODE_EQ											= 18;
const OPCODE_RET										= 19;
const OPCODE_DUP                                  		= 20;
const OPCODE_SWAP										= 21;
const OPCODE_CALL_INTERNAL								= 22;


// no arg

const OPCODE_SUSPEND									= 1;
const OPCODE_ADD										= 2;
const OPCODE_ADDF										= 3;
const OPCODE_SUB										= 4;
const OPCODE_SUBF										= 5;
const OPCODE_DIV										= 6;
const OPCODE_DIVF										= 7;
const OPCODE_REM										= 8;
const OPCODE_MUL										= 9;
const OPCODE_MULF										= 10;
const OPCODE_NEG										= 11;
const OPCODE_NEGF										= 12;
const OPCODE_GT											= 13;
const OPCODE_GTF										= 14;
const OPCODE_LT											= 15;
const OPCODE_LTF										= 16;
const OPCODE_GTE										= 17;
const OPCODE_GTEF										= 18;
const OPCODE_LTE										= 19;
const OPCODE_LTEF										= 20;
const OPCODE_AND										= 21;
const OPCODE_OR											= 22;
const OPCODE_NOT										= 23;

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

