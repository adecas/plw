#ifndef PLWSTACKMACHINE_H_
#define PLWSTACKMACHINE_H_

#include "PlwCommon.h"
#include "PlwCodeBlock.h"
#include "PlwRefManager.h"

extern const char * const PlwStackMachineErrorCodeAccessOutOfBound;

struct PlwStackMachine;
typedef struct PlwStackMachine PlwStackMachine;

typedef void (*PlwNativeFunction)(PlwStackMachine *sm, PlwError *error);

struct PlwStackMachine {
	PlwBoolean *stackMap;
	PlwInt *stack;
	PlwInt stackSize;
	PlwInt sp;
	PlwInt bp;
	PlwInt ip;
	PlwRefManager *refMan;
	PlwInt codeBlockId;
	PlwInt codeBlockCount;
	const PlwCodeBlock *codeBlocks;
	PlwInt nativeCount;
	const PlwNativeFunction *natives;
	PlwOffsetValue offsetValue;
};

PlwStackMachine *PlwStackMachine_Create(PlwError *error);

void PlwStackMachine_Destroy(PlwStackMachine *sm);

void PlwStackMachine_SetCodeBlocks(PlwStackMachine *sm, PlwInt codeBlockCount, PlwCodeBlock *codeBlocks);

void PlwStackMachine_SetNatives(PlwStackMachine *sm, PlwInt nativeCount, const PlwNativeFunction *natives);

void PlwStackMachine_Execute(PlwStackMachine *sm, PlwInt codeBlockId, PlwError *error);

#endif
