#include "PlwStackMachine.h"
#include "PlwCommon.h"
#include "PlwOpcode.h"
#include <stdio.h>
#include <string.h>

const char * const PlwStackMachineErrorUnsuitableArch = "PlwStackMachineErrorUnsuitableArch";

void PlwStackMachineError_UnsuitableArch(PlwError *error) {
	error->code = PlwStackMachineErrorUnsuitableArch;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Unsuitable arch");
}

const char * const PlwStackMachineErrorStackAccessOutOfBound = "PlwStackMachineErrorStackAccessOutOfBound";

void PlwStackMachineError_StackAccessOutOfBound(PlwError *error) {
	error->code = PlwStackMachineErrorStackAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Stack access out of bound");
}

const char * const PlwStackMachineErrorCodeAccessOutOfBound = "PlwStackMachineErrorCodeAccessOutOfBound";

void PlwStackMachineError_CodeAccessOutOfBound(PlwError *error, PlwInt codeBlockId, PlwInt ip) {
	error->code = PlwStackMachineErrorCodeAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Code access out of bound, codeBlockId %ld, ip %ld", codeBlockId, ip);
}

const char * const PlwStackMachineErrorRefAccessOutOfBound = "PlwStackMachineErrorRefAccessOutOfBound";

void PlwStackMachineError_RefAccessOutOfBound(PlwError *error) {
	error->code = PlwStackMachineErrorRefAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Ref access out of bound");
}

const char * const PlwStackMachineErrorCodeBlockAccessOutOfBound = "PlwStackMachineErrorCodeBlockAccessOutOfBound";

void PlwStackMachineError_CodeBlockAccessOutOfBound(PlwError *error, PlwInt codeBlockId) {
	error->code = PlwStackMachineErrorCodeBlockAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Code block id %ld out of bound", codeBlockId);
}

const char * const PlwStackMachineErrorNativeAccessOutOfBound = "PlwStackMachineErrorNativeAccessOutOfBound";

void PlwStackMachineError_NativeAccessOutOfBound(PlwError *error, PlwInt nativeId) {
	error->code = PlwStackMachineErrorNativeAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Native id %ld out of bound", nativeId);
}

const char * const PlwStackMachineErrorInvalidFuncId = "PlwStackMachineErrorInvalidFuncId";

void PlwStackMachineError_InvalidFuncId(PlwError *error, PlwInt funcId, PlwRefId refId) {
	error->code = PlwStackMachineErrorInvalidFuncId;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Invalid func id %ld in ref id %ld", funcId, refId);
}

const char * const PlwStackMachineErrorSuspended = "PlwStackMachineErrorSuspended";

void PlwStackMachineError_Suspended(PlwError *error) {
	error->code = PlwStackMachineErrorSuspended;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Suspended");
}

const char * const PlwStackMachineErrorUnknownOp = "PlwStackMachineErrorUnknownOp";

void PlwStackMachineError_UnknownOp(PlwError *error, PlwInt code) {
	error->code = PlwStackMachineErrorUnknownOp;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Unknown opcode %ld", code);
}

const char * const PlwStackMachineErrorDivByZero = "PlwStackMachineErrorDivByZero";

void PlwStackMachineError_DivByZero(PlwError *error) {
	error->code = PlwStackMachineErrorDivByZero;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Division by zero");
}

const char * const PlwStackMachineErrorException = "PlwStackMachineErrorException";

void PlwStackMachineError_Exception(PlwError *error, PlwInt errorCode) {
	error->code = PlwStackMachineErrorException;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Exception %ld", errorCode);
}

const char * const PlwStackMachineErrorStrConstAccessOutOfBound = "PlwStackMachineErrorStrConstAccessOutOfBound";

void PlwStackMachineError_StrConstAccessOutOfBound(PlwError *error, PlwInt codeBlockId, PlwInt strId) {
	error->code = PlwStackMachineErrorStrConstAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "String constant %ld in code block %ld does not exist", strId, codeBlockId);
}

const char * const PlwStackMachineErrorFloatConstAccessOutOfBound = "PlwStackMachineErrorFloatConstAccessOutOfBound";

void PlwStackMachineError_FloatConstAccessOutOfBound(PlwError *error, PlwInt codeBlockId, PlwInt floatId) {
	error->code = PlwStackMachineErrorFloatConstAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Float constant %ld in code block %ld does not exist", floatId, codeBlockId);
}

PlwStackMachine *PlwStackMachine_Create(PlwError *error) {
	PlwStackMachine *sm;
	if (sizeof(PlwInt) != sizeof(PlwFloat)) {
		PlwStackMachineError_UnsuitableArch(error);
		return NULL;	
	}
	sm = PlwAlloc(sizeof(PlwStackMachine), error);
	if (PlwIsError(error)) {
		return NULL;
	}
	sm->stackSize = 1024;
	sm->stackMap = PlwAlloc(sm->stackSize * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(sm);
		return NULL;
	}
	sm->stack = PlwAlloc(sm->stackSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		PlwFree(sm->stackMap);
		PlwFree(sm);
		return NULL;
	}	
	sm->sp = 0;
	sm->bp = 0;
	sm->ip = 0;
	sm->refMan = PlwRefManager_Create(error);
	if (PlwIsError(error)) {
		PlwFree(sm->stackMap);
		PlwFree(sm->stack);
		PlwFree(sm);
		return NULL;
	}
	sm->codeBlockId = -1;
	sm->codeBlocks = NULL;
	sm->nativeCount = 0;
	sm->natives = NULL;
	return sm;
}

void PlwStackMachine_Destroy(PlwStackMachine *sm) {
	PlwFree(sm->stackMap);
	PlwFree(sm->stack);
	PlwRefManager_Destroy(sm->refMan);
	PlwFree(sm);
}

void PlwStackMachine_SetCodeBlocks(PlwStackMachine *sm, PlwInt codeBlockCount, PlwCodeBlock *codeBlocks) {
	sm->codeBlockCount = codeBlockCount;
	sm->codeBlocks = codeBlocks;
}

void PlwStackMachine_SetExtops(PlwStackMachine *sm, PlwInt extopsCount, const PlwNativeFunction *extops) {
	sm->extopsCount = extopsCount;
	sm->extops = extops;
}

void PlwStackMachine_SetNatives(PlwStackMachine *sm, PlwInt nativeCount, const PlwNativeFunction *natives) {
	sm->nativeCount = nativeCount;
	sm->natives = natives;
}

void PlwStackMachine_GrowStack(PlwStackMachine *sm, PlwInt addedSize, PlwError *error) {
	if (sm->sp + addedSize > sm->stackSize) {
		if (addedSize < sm->stackSize) {
			addedSize = sm->stackSize;
		}
		sm->stackSize += addedSize;
		sm->stackMap = PlwRealloc(sm->stackMap, sm->stackSize * sizeof(PlwBoolean), error);
		if (PlwIsError(error)) {
			return;
		}
		sm->stack = PlwRealloc(sm->stack, sm->stackSize * sizeof(PlwInt), error);
		if (PlwIsError(error)) {
			return;
		}
	}
}

static void PlwStackMachine_OpcodeAdd(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] += sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeAddf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	w1.f += w2.f;
	sm->stack[sm->sp - 2] = w1.i;
	sm->sp--;
}

static void PlwStackMachine_OpcodeSub(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] -= sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeSubf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	w1.f -= w2.f;
	sm->stack[sm->sp - 2] = w1.i;
	sm->sp--;
}

static void PlwStackMachine_OpcodeDiv(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] == 0) {
		PlwStackMachineError_DivByZero(error);
		return;
	} else {
		sm->stack[sm->sp - 2] /= sm->stack[sm->sp - 1];
		sm->sp--;
	}
}

static void PlwStackMachine_OpcodeDivf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	w1.f /= w2.f;
	sm->stack[sm->sp - 2] = w1.i;
	sm->sp--;
}

static void PlwStackMachine_OpcodeRem(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] == 0) {
		PlwStackMachineError_DivByZero(error);
	} else {
		sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] % sm->stack[sm->sp - 1];
		sm->sp--;
	}
}

static void PlwStackMachine_OpcodeMul(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] *= sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeMulf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	w1.f *= w2.f;
	sm->stack[sm->sp - 2] = w1.i;
	sm->sp--;
}

static void PlwStackMachine_OpcodeNeg(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 1] = -sm->stack[sm->sp - 1];
}

static void PlwStackMachine_OpcodeNegf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w.i = sm->stack[sm->sp - 1];
	w.f = -w.f;
	sm->stack[sm->sp - 1] = w.i;
}

static void PlwStackMachine_OpcodeGt(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] > sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeGtf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	sm->stack[sm->sp - 2] = w1.f > w2.f;
	sm->sp--;
}

static void PlwStackMachine_OpcodeLt(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] < sm->stack[sm->sp - 1];
	sm->sp--;	
}

static void PlwStackMachine_OpcodeLtf(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	sm->stack[sm->sp - 2] = w1.f < w2.f;
	sm->sp--;
}

static void PlwStackMachine_OpcodeGte(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] >= sm->stack[sm->sp - 1];
	sm->sp--;	
}

static void PlwStackMachine_OpcodeGtef(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	sm->stack[sm->sp - 2] = w1.f >= w2.f;
	sm->sp--;
}

static void PlwStackMachine_OpcodeLte(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] <= sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeLtef(PlwStackMachine *sm, PlwError *error) {
	PlwWord w1, w2;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	w1.i = sm->stack[sm->sp - 2];
	w2.i = sm->stack[sm->sp - 1];
	sm->stack[sm->sp - 2] = w1.f <= w2.f;
	sm->sp--;
}

static void PlwStackMachine_OpcodeAnd(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] && sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeOr(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] || sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeNot(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 1] = !sm->stack[sm->sp - 1];	
}

static void PlwStackMachine_OpcodeJz(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] == 0) {
		PlwStackMachine_SetIp(sm, arg1, error);
	}
	sm->sp--;
}

static void PlwStackMachine_OpcodeJnz(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] != 0) {
		PlwStackMachine_SetIp(sm, arg1, error);
	}
	sm->sp--;
}

static void PlwStackMachine_OpcodeJmp(PlwStackMachine *sm, PlwInt arg, PlwError *error) {
	PlwStackMachine_SetIp(sm, arg, error);
}

static void PlwStackMachine_OpcodePush(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = arg1;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
}

static void PlwStackMachine_OpcodePushGlobal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[offset];
	sm->stackMap[sm->sp] = sm->stackMap[offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushGlobalMove(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[offset];
	sm->stackMap[sm->sp] = sm->stackMap[offset];
	sm->stack[offset] = -1;
	sm->stackMap[offset] = PlwFalse;
	sm->sp++;
}

static void PlwStackMachine_OpcodePushGlobalForMutate(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[offset] = PlwRefManager_MakeMutable(sm->refMan, sm->stack[offset], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stackMap[offset] = PlwTrue;
	sm->stack[sm->sp] = sm->stack[offset];
	sm->stackMap[sm->sp] = sm->stackMap[offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushLocal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[sm->bp + offset];
	sm->stackMap[sm->sp] = sm->stackMap[sm->bp + offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushLocalMove(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[sm->bp + offset];
	sm->stackMap[sm->sp] = sm->stackMap[sm->bp + offset];
	sm->stack[sm->bp + offset] = -1;
	sm->stackMap[sm->bp + offset] = PlwFalse;
	sm->sp++;
}

static void PlwStackMachine_OpcodePushLocalForMutate(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->bp + offset] = PlwRefManager_MakeMutable(sm->refMan, sm->stack[sm->bp + offset], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stackMap[sm->bp + offset] = PlwTrue;
	sm->stack[sm->sp] = sm->stack[sm->bp + offset];
	sm->stackMap[sm->sp] = sm->stackMap[sm->bp + offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePopGlobal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->sp < 1 || offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stackMap[offset]) {
		PlwRefManager_DecRefCount(sm->refMan, sm->stack[offset], error);
		if (PlwIsError(error)) {
			return;
		}						
	}
	sm->stack[offset] = sm->stack[sm->sp - 1];
	sm->stackMap[offset] = sm->stackMap[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodePopLocal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->sp < 1 || sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stackMap[sm->bp + offset]) {
		PlwRefManager_DecRefCount(sm->refMan, sm->stack[sm->bp + offset], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->stack[sm->bp + offset] = sm->stack[sm->sp - 1];
	sm->stackMap[sm->bp + offset] = sm->stackMap[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodePopVoid(PlwStackMachine *sm, PlwInt cellCount, PlwError *error) {
	PlwInt i;
	if (cellCount < 0 || cellCount > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = sm->sp - 1; i >= sm->sp - cellCount; i--) {
		if (sm->stackMap[i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	sm->sp -= cellCount;	
}

static void PlwStackMachine_OpcodeCall(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	if (arg1 < 0 || arg1 > sm->codeBlockCount) {
		PlwStackMachineError_CodeBlockAccessOutOfBound(error, arg1);
		return;
	}
	PlwStackMachine_GrowStack(sm, 3, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->codeBlockId;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->stack[sm->sp] = sm->ip;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;					
	sm->stack[sm->sp] = sm->bp;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->bp = sm->sp;
	sm->ip = 0;
	PlwStackMachine_SetCodeBlockId(sm, arg1, error);
}

static void PlwStackMachine_OpcodeCallNative(PlwStackMachine *sm, PlwInt nativeId, PlwError *error) {
	if (nativeId < 0 || nativeId >= sm->nativeCount) {
		PlwStackMachineError_NativeAccessOutOfBound(error, nativeId);
		return;
	}
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	if (sm->sp < sm->stack[sm->sp - 1]) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	((PlwNativeFunction)(sm->natives[nativeId]))(sm, error);
}

static void PlwStackMachine_OpcodePushf(PlwStackMachine *sm, PlwInt floatId, PlwError *error) {
	PlwWord w;
	const PlwCodeBlock *codeBlock = &sm->codeBlocks[sm->codeBlockId];
	if (floatId < 0 || floatId >= codeBlock->floatConstCount) {
		PlwStackMachineError_FloatConstAccessOutOfBound(error, sm->codeBlockId, floatId);
		return;				
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	w.f = codeBlock->floatConsts[floatId];
	sm->stack[sm->sp] = w.i;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;	
}

static void PlwStackMachine_OpcodeEq(PlwStackMachine *sm, PlwInt count, PlwError *error) {
	PlwInt idx1;
	PlwInt idx2;
	PlwBoolean result;
	PlwInt i;
	if (count < 1 || sm->sp < count * 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	idx1 = sm->sp - 2 * count;
	idx2 = sm->sp - count;
	result = PlwTrue;
	for (i = 0; i < count; i++) {
		if (result) {
			if (sm->stackMap[idx1]) {
				result = PlwRefManager_CompareRefs(sm->refMan, sm->stack[idx1], sm->stack[idx2], error);
				if (PlwIsError(error)) {
					return;
				}
			} else {
				result = sm->stack[idx1] == sm->stack[idx2];
			}
		}
		if (sm->stackMap[idx1]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[idx1], error);
			if (PlwIsError(error)) {
				return;
			}
		}
		if (sm->stackMap[idx2]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[idx2], error);
			if (PlwIsError(error)) {
				return;
			}
		}
		idx1++;
		idx2++;
	}
	sm->stack[sm->sp - 2 * count] = result;
	sm->stackMap[sm->sp - 2 * count] = PlwFalse;
	sm->sp -= 2 * count - 1;
}

static void PlwStackMachine_OpcodeRet(PlwStackMachine *sm, PlwInt count, PlwError *error) {
	PlwInt previousBp;
	PlwInt previousIp;
	PlwInt previousCodeBlockId;
	PlwInt argCount;
	PlwInt i;
	if (count < 0 || sm->bp < 4 || sm->bp > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	previousBp = sm->stack[sm->bp - 1];
	previousIp = sm->stack[sm->bp - 2];
	previousCodeBlockId = sm->stack[sm->bp - 3];
	argCount = sm->stack[sm->bp - 4];
	if (sm->bp < 4 + argCount) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = sm->sp - count - 1; i >= sm->bp - 4 - argCount; i--) {
		if (sm->stackMap[i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	for (i = 0; i < count; i++) {
		sm->stack[sm->bp - 4 - argCount + i] = sm->stack[sm->sp - count + i];
		sm->stackMap[sm->bp - 4 - argCount + i] = sm->stackMap[sm->sp - count + i];
	}
	sm->sp = sm->bp - 4 - argCount + count;
	sm->bp = previousBp;
	PlwStackMachine_SetCodeBlockIdAndIp(sm, previousCodeBlockId, previousIp, error);
}

static void PlwStackMachine_OpcodeDup(PlwStackMachine *sm, PlwInt count, PlwError *error) {
	PlwInt i;
	if (count < 1 || sm->sp < count) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, count, error);
	if (PlwIsError(error)) {
		return;
	}	
	for (i = 0; i < count; i++) {
		sm->stack[sm->sp] = sm->stack[sm->sp - count];
		sm->stackMap[sm->sp] = sm->stackMap[sm->sp - count];
		if (sm->stackMap[sm->sp]) {
			PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
			if (PlwIsError(error)) {
				return;
			}
		}
		sm->sp++; 
	}
}

static void PlwStackMachine_OpcodeSwap(PlwStackMachine *sm, PlwInt count, PlwError *error) {
	PlwInt i;
	PlwInt tmp;
	PlwBoolean tmpMap;
	if (count < 1 || sm->sp < count) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = 0; i < count / 2; i++) {
		tmp = sm->stack[sm->sp - count + i];
		tmpMap = sm->stackMap[sm->sp - count + i];
		sm->stack[sm->sp - count + i] = sm->stack[sm->sp - 1 - i];
		sm->stackMap[sm->sp - count + i] = sm->stackMap[sm->sp - 1 - i];
		sm->stack[sm->sp - 1 - i] = tmp;
		sm->stackMap[sm->sp - 1 - i] = tmpMap;
	}
}

static void PlwStackMachine_OpcodeExt(PlwStackMachine *sm, PlwInt extOpcode, PlwError *error) {
	((PlwNativeFunction)(sm->extops[extOpcode]))(sm, error);	
}

static void PlwStackMachine_OpcodeNoarg(PlwStackMachine *sm, PlwInt code, PlwError *error) {
	switch(code) {
	case PLW_OPCODE_SUSPEND:
		PlwStackMachineError_Suspended(error);
		break;
	case PLW_OPCODE_ADD:
		PlwStackMachine_OpcodeAdd(sm, error);
		break;
	case PLW_OPCODE_ADDF:
		PlwStackMachine_OpcodeAddf(sm, error);
		break;
	case PLW_OPCODE_SUB:
		PlwStackMachine_OpcodeSub(sm, error);
		break;
	case PLW_OPCODE_SUBF:
		PlwStackMachine_OpcodeSubf(sm, error);
		break;
	case PLW_OPCODE_DIV:
		PlwStackMachine_OpcodeDiv(sm, error);
		break;
	case PLW_OPCODE_DIVF:
		PlwStackMachine_OpcodeDivf(sm, error);
		break;
	case PLW_OPCODE_REM:
		PlwStackMachine_OpcodeRem(sm, error);
		break;
	case PLW_OPCODE_MUL:
		PlwStackMachine_OpcodeMul(sm, error);
		break;
	case PLW_OPCODE_MULF:
		PlwStackMachine_OpcodeMulf(sm, error);
		break;
	case PLW_OPCODE_NEG:
		PlwStackMachine_OpcodeNeg(sm, error);
		break;
	case PLW_OPCODE_NEGF:
		PlwStackMachine_OpcodeNegf(sm, error);
		break;
	case PLW_OPCODE_GT:
		PlwStackMachine_OpcodeGt(sm, error);
		break;
	case PLW_OPCODE_GTF:
		PlwStackMachine_OpcodeGtf(sm, error);
		break;
	case PLW_OPCODE_LT:
		PlwStackMachine_OpcodeLt(sm, error);
		break;
	case PLW_OPCODE_LTF:
		PlwStackMachine_OpcodeLtf(sm, error);
		break;
	case PLW_OPCODE_GTE:
		PlwStackMachine_OpcodeGte(sm, error);
		break;
	case PLW_OPCODE_GTEF:
		PlwStackMachine_OpcodeGtef(sm, error);
		break;
	case PLW_OPCODE_LTE:
		PlwStackMachine_OpcodeLte(sm, error);
		break;
	case PLW_OPCODE_LTEF:
		PlwStackMachine_OpcodeLtef(sm, error);
		break;
	case PLW_OPCODE_AND:
		PlwStackMachine_OpcodeAnd(sm, error);
		break;
	case PLW_OPCODE_OR:
		PlwStackMachine_OpcodeOr(sm, error);
		break;
	case PLW_OPCODE_NOT:
		PlwStackMachine_OpcodeNot(sm, error);
		break;
	default:
		PlwStackMachineError_UnknownOp(error, code);
	}
}

static void PlwStackMachine_Opcode(PlwStackMachine *sm, PlwInt code, PlwInt arg, PlwError *error) {
	switch(code) {
	case PLW_OPCODE_NOARG:
		PlwStackMachine_OpcodeNoarg(sm, arg, error);
		break;
	case PLW_OPCODE_JZ:
		PlwStackMachine_OpcodeJz(sm, arg, error);
		break;
	case PLW_OPCODE_JNZ:
		PlwStackMachine_OpcodeJnz(sm, arg, error);
		break;
	case PLW_OPCODE_JMP:
		PlwStackMachine_OpcodeJmp(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH:
		PlwStackMachine_OpcodePush(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH_GLOBAL:
		PlwStackMachine_OpcodePushGlobal(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH_GLOBAL_MOVE:
		PlwStackMachine_OpcodePushGlobalMove(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE:
		PlwStackMachine_OpcodePushGlobalForMutate(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH_LOCAL:
		PlwStackMachine_OpcodePushLocal(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH_LOCAL_MOVE:
		PlwStackMachine_OpcodePushLocalMove(sm, arg, error);
		break;
	case PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE:
		PlwStackMachine_OpcodePushLocalForMutate(sm, arg, error);
		break;
	case PLW_OPCODE_POP_GLOBAL:
		PlwStackMachine_OpcodePopGlobal(sm, arg, error);
		break;
	case PLW_OPCODE_POP_LOCAL:
		PlwStackMachine_OpcodePopLocal(sm, arg, error);
		break;
	case PLW_OPCODE_POP_VOID:
		PlwStackMachine_OpcodePopVoid(sm, arg, error);
		break;
	case PLW_OPCODE_CALL:
		PlwStackMachine_OpcodeCall(sm, arg, error);
		break;
	case PLW_OPCODE_CALL_NATIVE:
		PlwStackMachine_OpcodeCallNative(sm, arg, error);
		break;
	case PLW_OPCODE_PUSHF:
		PlwStackMachine_OpcodePushf(sm, arg, error);
		break;
	case PLW_OPCODE_EQ:
		PlwStackMachine_OpcodeEq(sm, arg, error);
		break;
	case PLW_OPCODE_RET:
		PlwStackMachine_OpcodeRet(sm, arg, error);
		break;
	case PLW_OPCODE_DUP:
		PlwStackMachine_OpcodeDup(sm, arg, error);
		break;
	case PLW_OPCODE_SWAP:
		PlwStackMachine_OpcodeSwap(sm, arg, error);
		break;
	case PLW_OPCODE_EXT:
		PlwStackMachine_OpcodeExt(sm, arg, error);
		break;
	default:
		PlwStackMachineError_UnknownOp(error, code);
	}
}

void PlwStackMachine_SetCodeBlockId(PlwStackMachine *sm, PlwInt codeBlockId, PlwError *error) {
	if (codeBlockId < 0 || codeBlockId >= sm->codeBlockCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, codeBlockId, 0);
		return;
	} 
	sm->codeBlockId = codeBlockId;
	sm->codes = sm->codeBlocks[sm->codeBlockId].codes;
	sm->codeCount = sm->codeBlocks[sm->codeBlockId].codeCount;
}

void PlwStackMachine_SetCodeBlockIdAndIp(PlwStackMachine *sm, PlwInt codeBlockId, PlwInt ip, PlwError *error) {
	if (codeBlockId < 0 || codeBlockId >= sm->codeBlockCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, codeBlockId, 0);
		return;
	} 
	sm->codeBlockId = codeBlockId;
	sm->codes = sm->codeBlocks[sm->codeBlockId].codes;
	sm->codeCount = sm->codeBlocks[sm->codeBlockId].codeCount;
	if (ip < 0 || ip > sm->codeCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, codeBlockId, ip);
		return;
	}
	sm->ip = ip;
}

void PlwStackMachine_SetIp(PlwStackMachine *sm, PlwInt ip, PlwError *error) {
	if (ip < 0 || ip > sm->codeCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, sm->codeBlockId, ip);
		return;
	}
	sm->ip = ip;
}

static void PlwStackMachine_RunLoop(PlwStackMachine *sm, PlwError *error) {
	PlwInt code;
	PlwInt arg;
	while (sm->ip < sm->codeCount - 1) {
		code = sm->codes[sm->ip];
		sm->ip++;
		arg = sm->codes[sm->ip];
		sm->ip++;
#ifdef PLW_DEBUG_SM
		printf("sp: %ld, bp: %ld, cs: %ld, ip: %ld nbrefs: %ld   %s\n",
			sm->sp, sm->bp, sm->codeBlockId, sm->ip - 1, PlwRefManager_RefCount(sm->refMan), PlwOpcodes[code]);
#endif
		PlwStackMachine_Opcode(sm, code, arg, error);
		if (PlwIsError(error)) {
			return;
		}
	}
}

void PlwStackMachine_Execute(PlwStackMachine *sm, PlwInt codeBlockId, PlwError *error) {
	sm->ip = 0;
	PlwStackMachine_SetCodeBlockId(sm, codeBlockId, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwStackMachine_RunLoop(sm, error);
}

