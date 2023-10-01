#ifndef PLWOPCODE_H_
#define PLWOPCODE_H_

#define PLW_OPCODE_NOARG									1
#define PLW_OPCODE_JZ										2
#define PLW_OPCODE_JNZ										3
#define PLW_OPCODE_JMP										4
#define PLW_OPCODE_PUSH										5
#define PLW_OPCODE_PUSH_GLOBAL								6
#define PLW_OPCODE_PUSH_GLOBAL_MOVE							7
#define PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE					8
#define PLW_OPCODE_PUSH_LOCAL								9
#define PLW_OPCODE_PUSH_LOCAL_MOVE                          10
#define PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE					11
#define PLW_OPCODE_POP_GLOBAL								12
#define PLW_OPCODE_POP_LOCAL								13
#define PLW_OPCODE_POP_VOID									14
#define PLW_OPCODE_CALL										15
#define PLW_OPCODE_CALL_NATIVE								16
#define PLW_OPCODE_PUSHF									17
#define PLW_OPCODE_EQ										18
#define PLW_OPCODE_RET										19
#define PLW_OPCODE_DUP                                  	20
#define PLW_OPCODE_SWAP										21
#define PLW_OPCODE_EXT										22
			
/* One arg */			
			
#define PLW_OPCODE_SUSPEND									1
#define PLW_OPCODE_ADD										2
#define PLW_OPCODE_ADDF										3
#define PLW_OPCODE_SUB										4
#define PLW_OPCODE_SUBF										5
#define PLW_OPCODE_DIV										6
#define PLW_OPCODE_DIVF										7
#define PLW_OPCODE_REM										8
#define PLW_OPCODE_MUL										9
#define PLW_OPCODE_MULF										10
#define PLW_OPCODE_NEG										11
#define PLW_OPCODE_NEGF										12
#define PLW_OPCODE_GT										13
#define PLW_OPCODE_GTF										14
#define PLW_OPCODE_LT										15
#define PLW_OPCODE_LTF										16
#define PLW_OPCODE_GTE										17
#define PLW_OPCODE_GTEF										18
#define PLW_OPCODE_LTE										19
#define PLW_OPCODE_LTEF										20
#define PLW_OPCODE_AND										21
#define PLW_OPCODE_OR										22
#define PLW_OPCODE_NOT										23

extern const char * const PlwOpcodes[];

#endif
