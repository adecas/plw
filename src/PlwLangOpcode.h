#ifndef PLWLANGOPCODE_H_
#define PLWLANGOPCODE_H_

#include "PlwStackMachine.h"

#define PLW_LOPCODE_CREATE_STRING						  0
#define PLW_LOPCODE_CONCAT_STRING                         1
#define PLW_LOPCODE_CREATE_BLOB                           2
#define PLW_LOPCODE_READ_BLOB                             3
#define PLW_LOPCODE_WRITE_BLOB                            4
#define PLW_LOPCODE_CONCAT_BLOB                           5
#define PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET				  6
#define PLW_LOPCODE_GET_BLOB_SIZE                         7
#define PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM          	  8
#define PLW_LOPCODE_SLICE_BLOB							  9
#define PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM				  10
#define PLW_LOPCODE_CREATE_EXCEPTION_HANDLER			  11
#define PLW_LOPCODE_RAISE_EXCEPTION						  12
#define PLW_LOPCODE_CREATE_GENERATOR					  13
#define PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM				  14
#define PLW_LOPCODE_HAS_GENERATOR_ENDED					  15
#define PLW_LOPCODE_YIELD_GENERATOR_ITEM				  16

extern const char *PlwLangOpcodes[];

extern const PlwInt PlwLangOpcodeCount;

extern const PlwNativeFunction PlwLangOps[];

#endif
