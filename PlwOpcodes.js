"use strict";

// no arg

const OPCODE_SUSPEND									= 1;
const OPCODE_DUP										= 2;
const OPCODE_SWAP										= 3;
const OPCODE_ADD										= 4;
const OPCODE_ADDF										= 5;
const OPCODE_SUB										= 6;
const OPCODE_SUBF										= 7;
const OPCODE_DIV										= 8;
const OPCODE_DIVF										= 9;
const OPCODE_REM										= 10;
const OPCODE_MUL										= 11;
const OPCODE_MULF										= 12;
const OPCODE_NEG										= 13;
const OPCODE_NEGF										= 14;
const OPCODE_GT											= 15;
const OPCODE_GTF										= 16;
const OPCODE_LT											= 17;
const OPCODE_LTF										= 18;
const OPCODE_GTE										= 19;
const OPCODE_GTEF										= 20;
const OPCODE_LTE										= 21;
const OPCODE_LTEF										= 22;
const OPCODE_AND										= 23;
const OPCODE_OR											= 24;
const OPCODE_NOT										= 25;
const OPCODE_EQ											= 26;
const OPCODE_EQF										= 27;
const OPCODE_EQ_REF										= 28;
const OPCODE_NE											= 29;
const OPCODE_NEF										= 30;
const OPCODE_PUSH_PTR_OFFSET							= 31;
const OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE					= 32;
const OPCODE_POP_PTR_OFFSET								= 33;
const OPCODE_RAISE										= 34;
const OPCODE_RET_VAL									= 35;
const OPCODE_RET										= 36;
const OPCODE_YIELD										= 37;
const OPCODE_YIELD_DONE									= 38;
const OPCODE_NEXT										= 39;
const OPCODE_ENDED										= 40;
const OPCODE_BASIC_ARRAY_TIMES							= 41;
const OPCODE_ARRAY_TIMES								= 42;

const OPCODE1_MAX										= 42;
			
// One arg			
			
const OPCODE_JZ											= 43;
const OPCODE_JNZ										= 44;
const OPCODE_JMP										= 45;
const OPCODE_PUSH										= 46;
const OPCODE_PUSH_GLOBAL								= 47;
const OPCODE_PUSH_GLOBAL_FOR_MUTATE						= 48;
const OPCODE_PUSH_LOCAL									= 49;
const OPCODE_PUSH_LOCAL_FOR_MUTATE						= 50;
const OPCODE_PUSH_INDIRECTION							= 51;
const OPCODE_PUSH_INDIRECT								= 52;
const OPCODE_PUSH_INDIRECT_FOR_MUTATE					= 53;
const OPCODE_POP_GLOBAL									= 54;
const OPCODE_POP_LOCAL									= 55;
const OPCODE_POP_INDIRECT								= 56;
const OPCODE_POP_VOID									= 57;
const OPCODE_CREATE_STRING								= 58;
const OPCODE_CREATE_RECORD								= 59;
const OPCODE_CREATE_BASIC_ARRAY							= 60;
const OPCODE_CREATE_ARRAY							 	= 61;
const OPCODE_CALL										= 62;
const OPCODE_CALL_NATIVE								= 63;
const OPCODE_INIT_GENERATOR								= 64;
const OPCODE_CREATE_EXCEPTION_HANDLER					= 65;
const OPCODE_PUSHF										= 66;

const PLW_OPCODES = [
	"",
	"SUSPEND",
	"DUP",
	"SWAP",
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
	"NOT",
	"EQ",
	"EQF",
	"EQ_REF",
	"NE",
	"NEF",
	"PUSH_PTR_OFFSET",
	"PUSH_PTR_OFFSET_FOR_MUTATE",
	"POP_PTR_OFFSET",
	"RAISE",
	"RET_VAL",
	"RET",
	"YIELD",
	"YIELD_DONE",
	"NEXT",
	"ENDED",
	"BASIC_ARRAY_TIMES",
	"ARRAY_TIMES",
	"JZ",
	"JNZ",
	"JMP",
	"PUSH",
	"PUSH_GLOBAL",
	"PUSH_GLOBAL_FOR_MUTATE",
	"PUSH_LOCAL",
	"PUSH_LOCAL_FOR_MUTATE",
	"PUSH_INDIRECTION",
	"PUSH_INDIRECT",
	"PUSH_INDIRECT_FOR_MUTATE",
	"POP_GLOBAL",
	"POP_LOCAL",
	"POP_INDIRECT",
	"POP_VOID",
	"CREATE_STRING",
	"CREATE_RECORD",
	"CREATE_BASIC_ARRAY",
	"CREATE_ARRAY",
	"CALL",
	"CALL_NATIVE",
	"INIT_GENERATOR",
	"CREATE_EXCEPTION_HANDLER",
	"PUSHF"
];

