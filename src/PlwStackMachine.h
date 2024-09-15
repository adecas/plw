#ifndef PLWSTACKMACHINE_H_
#define PLWSTACKMACHINE_H_

#include "PlwCommon.h"
#include "PlwCodeBlock.h"
#include "PlwRefManager.h"

extern const char * const PlwStackMachineErrorCodeAccessOutOfBound;

void PlwStackMachineError_Suspended(PlwError *error);
void PlwStackMachineError_CodeAccessOutOfBound(PlwError *error, PlwInt ip);
void PlwStackMachineError_StackAccessOutOfBound(PlwError *error);
void PlwStackMachineError_StrConstAccessOutOfBound(PlwError *error, PlwInt codeBlockId, PlwInt strId);
void PlwStackMachineError_RefAccessOutOfBound(PlwError *error);
void PlwStackMachineError_Exception(PlwError *error, PlwInt errorCode);

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
	PlwCodeBlock *codeBlock;
	PlwInt *codes;
	PlwInt codeCount;
	PlwInt extopsCount;
	const PlwNativeFunction *extops;
	PlwInt nativeCount;
	const PlwNativeFunction *natives;
};

PlwStackMachine *PlwStackMachine_Create(PlwError *error);

void PlwStackMachine_Destroy(PlwStackMachine *sm);

void PlwStackMachine_SetCodeBlock(PlwStackMachine *sm, PlwCodeBlock *codeBlock);

void PlwStackMachine_SetExtops(PlwStackMachine *sm, PlwInt extopsCount, const PlwNativeFunction *extops);

void PlwStackMachine_SetNatives(PlwStackMachine *sm, PlwInt nativeCount, const PlwNativeFunction *natives);

void PlwStackMachine_GrowStack(PlwStackMachine *sm, PlwInt addedSize, PlwError *error);

void PlwStackMachine_SetIp(PlwStackMachine *sm, PlwInt ip, PlwError *error);

void PlwStackMachine_RunLoop(PlwStackMachine *sm, PlwError *error);

#endif
