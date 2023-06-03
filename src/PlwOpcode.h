#ifndef PLWOPCODE_H_
#define PLWOPCODE_H_

#define PLW_OPCODE_NOP										0
#define PLW_OPCODE_SUSPEND									1
#define PLW_OPCODE_DUP										2
#define PLW_OPCODE_SWAP										3
#define PLW_OPCODE_ADD										4
#define PLW_OPCODE_ADDF										5
#define PLW_OPCODE_SUB										6
#define PLW_OPCODE_SUBF										7
#define PLW_OPCODE_DIV										8
#define PLW_OPCODE_DIVF										9
#define PLW_OPCODE_REM										10
#define PLW_OPCODE_MUL										11
#define PLW_OPCODE_MULF										12
#define PLW_OPCODE_NEG										13
#define PLW_OPCODE_NEGF										14
#define PLW_OPCODE_GT										15
#define PLW_OPCODE_GTF										16
#define PLW_OPCODE_LT										17
#define PLW_OPCODE_LTF										18
#define PLW_OPCODE_GTE										19
#define PLW_OPCODE_GTEF										20
#define PLW_OPCODE_LTE										21
#define PLW_OPCODE_LTEF										22
#define PLW_OPCODE_AND										23
#define PLW_OPCODE_OR										24
#define PLW_OPCODE_NOT										25
#define PLW_OPCODE_EQ										26
#define PLW_OPCODE_EQF										27
#define PLW_OPCODE_EQ_REF									28
#define PLW_OPCODE_NE										29
#define PLW_OPCODE_NEF										30
#define PLW_OPCODE_PUSH_PTR_OFFSET							31
#define PLW_OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE				32
#define PLW_OPCODE_POP_PTR_OFFSET							33
#define PLW_OPCODE_RAISE									34
#define PLW_OPCODE_RET_VAL									35
#define PLW_OPCODE_RET										36
#define PLW_OPCODE_YIELD									37
#define PLW_OPCODE_YIELD_DONE								38
#define PLW_OPCODE_NEXT										39
#define PLW_OPCODE_ENDED									40
#define PLW_OPCODE_BASIC_ARRAY_TIMES						41
#define PLW_OPCODE_ARRAY_TIMES								42

#define PLW_OPCODE1_MAX										42
			
/* One arg */			
			
#define PLW_OPCODE_JZ										43
#define PLW_OPCODE_JNZ										44
#define PLW_OPCODE_JMP										45
#define PLW_OPCODE_PUSH										46
#define PLW_OPCODE_PUSH_GLOBAL								47
#define PLW_OPCODE_PUSH_GLOBAL_MOVE							48
#define PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE					49
#define PLW_OPCODE_PUSH_LOCAL								50
#define PLW_OPCODE_PUSH_LOCAL_MOVE							51
#define PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE					52
#define PLW_OPCODE_PUSH_INDIRECTION							53
#define PLW_OPCODE_PUSH_INDIRECT							54
#define PLW_OPCODE_PUSH_INDIRECT_FOR_MUTATE					55
#define PLW_OPCODE_POP_GLOBAL								56
#define PLW_OPCODE_POP_LOCAL								57
#define PLW_OPCODE_POP_INDIRECT								58
#define PLW_OPCODE_POP_VOID									59
#define PLW_OPCODE_CREATE_STRING							60
#define PLW_OPCODE_CREATE_RECORD							61
#define PLW_OPCODE_CREATE_BASIC_ARRAY						62
#define PLW_OPCODE_CREATE_ARRAY							 	63
#define PLW_OPCODE_CALL										64
#define PLW_OPCODE_CALL_NATIVE								65
#define PLW_OPCODE_INIT_GENERATOR							66
#define PLW_OPCODE_CREATE_EXCEPTION_HANDLER					67
#define PLW_OPCODE_PUSHF									68
#define PLW_OPCODE_EQ_TUPLE									69
#define PLW_OPCODE_RET_TUPLE								70

extern const char * const PlwOpcodes[];

#endif
