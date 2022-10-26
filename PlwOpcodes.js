"use strict";

// no arg

const OPCODE_DEBUG										= 1;
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

const OPCODE1_MAX										= 99;
			
// One arg			
			
const OPCODE_JZ											= 100;
const OPCODE_JNZ										= 101;
const OPCODE_JMP										= 102;
const OPCODE_PUSH										= 103;
const OPCODE_PUSH_GLOBAL								= 104;
const OPCODE_PUSH_GLOBAL_FOR_MUTATE						= 105;
const OPCODE_PUSH_LOCAL									= 106;
const OPCODE_PUSH_LOCAL_FOR_MUTATE						= 107;
const OPCODE_PUSH_INDIRECTION							= 108;
const OPCODE_PUSH_INDIRECT								= 109;
const OPCODE_PUSH_INDIRECT_FOR_MUTATE					= 110;
const OPCODE_POP_GLOBAL									= 111;
const OPCODE_POP_LOCAL									= 112;
const OPCODE_POP_INDIRECT								= 113;
const OPCODE_POP_VOID									= 114;
const OPCODE_CREATE_STRING								= 115;
const OPCODE_CREATE_RECORD								= 116;
const OPCODE_CREATE_BASIC_ARRAY							= 117;
const OPCODE_CREATE_ARRAY							 	= 118;
const OPCODE_CALL										= 119;
const OPCODE_CALL_ABSTRACT								= 120;
const OPCODE_CALL_NATIVE								= 121;
const OPCODE_INIT_GENERATOR								= 122;
const OPCODE_CREATE_EXCEPTION_HANDLER					= 123;

