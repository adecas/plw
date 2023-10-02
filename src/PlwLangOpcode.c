#include "PlwLangOpcode.h"
#include "PlwStringRef.h"
#include "PlwBlobRef.h"
#include "PlwExceptionHandlerRef.h"
#include "PlwAbstractRef.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

const char *PlwLangOpcodes[] = {
	"CREATE_STRING",
	"CONCAT_STRING",
	"CREATE_BLOB",
	"READ_BLOB",
	"WRITE_BLOB",
	"CONCAT_BLOB",
	"GET_BLOB_MUTABLE_OFFSET",
	"GET_BLOB_SIZE",
	"GET_BLOB_INDEX_OF_ITEM",
	"SLICE_BLOB",
	"CREATE_BLOB_REPEAT_ITEM",
	"CREATE_EXCEPTION_HANDLER",
	"RAISE_EXCEPTION",
	"CREATE_GENERATOR",
	"GET_GENERATOR_NEXT_ITEM",
	"HAS_GENERATOR_ENDED",
	"YIELD_GENERATOR_ITEM"
};

const PlwInt PlwLangOpcodeCount = sizeof(PlwLangOpcodes) / sizeof(char *);

/* create_string(stringId integer)
 */
static void PlwLangOp_CreateString(PlwStackMachine *sm, PlwError *error) {
	PlwInt strId;
	char *str;
	PlwRefId resultRefId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	strId = sm->stack[sm->sp - 1];
	if (strId < 0 || strId >= sm->codeBlocks[sm->codeBlockId].strConstCount) {
		PlwStackMachineError_StrConstAccessOutOfBound(error, sm->codeBlockId, strId);
		return;
	}
	str = PlwStrDup(sm->codeBlocks[sm->codeBlockId].strConsts[strId], error);
	if (PlwIsError(error)) {
		return;
	}
	resultRefId = PlwStringRef_Make(sm->refMan, str, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 1] = resultRefId;
	sm->stackMap[sm->sp - 1] = PlwTrue;
}

/* concat_string(items ...String, itemCount integer)
 */
static void PlwLangOp_ConcatString(PlwStackMachine *sm, PlwError *error) {
	PlwInt itemCount;
	char *resultStr = NULL;
	size_t resultStrSize = 0;
	PlwInt i;
	PlwRefId refId;
	PlwStringRef *ref;
	char *str;
	size_t strSize;
	PlwRefId resultRefId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	itemCount = sm->stack[sm->sp - 1];
	if (itemCount < 0 || sm->sp < itemCount + 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = 0; i < itemCount; i++) {
		refId = sm->stack[sm->sp - itemCount - 1 + i];
		ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
		if (PlwIsError(error)) {
			return;
		}
		str = PlwStringRef_Ptr(ref);
		strSize = strlen(str);
		resultStr = PlwRealloc(resultStr, resultStrSize + strSize + 1, error);
		if (PlwIsError(error)) {
			return;
		}
		memcpy(resultStr + resultStrSize, str, strSize);
		resultStrSize += strSize;
	}
	resultStr[resultStrSize] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultStr, error);
	if (PlwIsError(error)) {
		return;
	}
	for (i = 0; i < itemCount; i++) {
		refId = sm->stack[sm->sp - itemCount - 1 + i];
		PlwRefManager_DecRefCount(sm->refMan, refId, error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->stack[sm->sp - itemCount - 1] = resultRefId;
	sm->stackMap[sm->sp - itemCount - 1] = PlwTrue;
	sm->sp -= itemCount;
}

/* create_blob(item ...integer, blobSize integer)
 */
static void PlwLangOp_CreateBlob(PlwStackMachine *sm, PlwError *error) {
	PlwInt blobSize;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwRefId refId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	blobSize = sm->stack[sm->sp - 1];
	if (blobSize < 0 || sm->sp < 1 + blobSize) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	ptr = PlwAlloc(blobSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}
	mapPtr = PlwAlloc(blobSize * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	memcpy(ptr, sm->stack + sm->sp - 1 - blobSize, blobSize * sizeof(PlwInt));
	memcpy(mapPtr, sm->stackMap + sm->sp - 1 - blobSize, blobSize * sizeof(PlwBoolean));
	refId = PlwBlobRef_Make(sm->refMan, blobSize, ptr, mapPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->sp -= blobSize;
	sm->stack[sm->sp - 1] = refId; 
	sm->stackMap[sm->sp - 1] = PlwTrue;
}

/* read_blob(refId Blob, offset integer, size integer)
 */
static void PlwLangOp_ReadBlob(PlwStackMachine *sm, PlwError *error) {
	PlwInt size;
	PlwInt offset;
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt i;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt value;
	PlwBoolean valueIsRef;
	if (sm->sp < 3) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	size = sm->stack[sm->sp - 1];
	offset = sm->stack[sm->sp - 2];
	refId = sm->stack[sm->sp - 3];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	if (offset < 0 || size < 0 || offset + size > PlwBlobRef_Size(ref)) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	if (size > 3) {
		PlwStackMachine_GrowStack(sm, size - 3, error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp += size - 3;
	ptr = PlwBlobRef_Ptr(ref);
	mapPtr = PlwBlobRef_MapPtr(ref);
	for (i = 0; i < size; i++) {
		value = ptr[offset + i];
		valueIsRef = mapPtr[offset + i];
		sm->stack[sm->sp - size + i] = value;
		sm->stackMap[sm->sp - size + i] = valueIsRef;
		if (valueIsRef) {
			PlwRefManager_IncRefCount(sm->refMan, value, error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
}

/* write_blob(refId Blob, offset integer, val ...integer, size integer)
 */
static void PlwLangOp_WriteBlob(PlwStackMachine *sm, PlwError *error) {
	PlwInt size;
	PlwInt offset;
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt i;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	if (sm->sp < 3) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	size = sm->stack[sm->sp - 1];
	if (size < 0 || sm->sp < 3 + size) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	offset = sm->stack[sm->sp - 2 - size];
	refId = sm->stack[sm->sp - 3 - size];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	if (offset < 0 || offset + size > PlwBlobRef_Size(ref)) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	ptr = PlwBlobRef_Ptr(ref);
	mapPtr = PlwBlobRef_MapPtr(ref);
	for (i = 0; i < size; i++) {
		if (mapPtr[offset + i]) {
			PlwRefManager_DecRefCount(sm->refMan, ptr[offset + i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
		ptr[offset + i] = sm->stack[sm->sp - 1 - size + i];
		mapPtr[offset + i] = sm->stackMap[sm->sp - 1 - size + i];
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->sp -= 3 + size;
}

/* concat_blob(blob ...Blob, itemCount integer)
 */
static void PlwLangOp_ConcatBlob(PlwStackMachine *sm, PlwError *error) {
	PlwInt itemCount;
	PlwInt *resultPtr = NULL;
	PlwBoolean *resultMapPtr = NULL;
	PlwInt resultSize = 0;
	PlwInt i;
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt blobSize;
	PlwRefId resultRefId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	itemCount = sm->stack[sm->sp - 1];
	if (itemCount < 0 || sm->sp < itemCount + 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = 0; i < itemCount; i++) {
		refId = sm->stack[sm->sp - itemCount - 1 + i];
		ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
		if (PlwIsError(error)) {
			return;
		}
		blobSize = PlwBlobRef_Size(ref);
		resultPtr = PlwRealloc(resultPtr, (resultSize + blobSize) * sizeof(PlwInt), error);
		if (PlwIsError(error)) {
			return;
		}
		resultMapPtr = PlwRealloc(resultMapPtr, (resultSize + blobSize) * sizeof(PlwBoolean), error);
		if (PlwIsError(error)) {
			PlwFree(resultPtr);
			return;
		}
		memcpy(resultPtr + resultSize, PlwBlobRef_Ptr(ref), blobSize * sizeof(PlwInt));
		memcpy(resultMapPtr + resultSize, PlwBlobRef_MapPtr(ref), blobSize * sizeof(PlwBoolean));
		resultSize += blobSize;
	}
	for (i = 0; i < resultSize; i++) {
		if (resultMapPtr[i]) {
			PlwRefManager_IncRefCount(sm->refMan, resultPtr[i], error);
			if (PlwIsError(error)) {
				PlwFree(resultMapPtr);
				PlwFree(resultPtr);
				return;
			}
		}
	}
	resultRefId = PlwBlobRef_Make(sm->refMan, resultSize, resultPtr, resultMapPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	for (i = 0; i < itemCount; i++) {
		refId = sm->stack[sm->sp - itemCount - 1 + i];
		PlwRefManager_DecRefCount(sm->refMan, refId, error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->stack[sm->sp - itemCount - 1] = resultRefId;
	sm->stackMap[sm->sp - itemCount - 1] = PlwTrue;
	sm->sp -= itemCount;
}

/* get_blob_mutable_offset(refId Blob, offset integer)
 */
static void PlwLangOp_GetBlobMutableOffset(PlwStackMachine *sm, PlwError *error) {
	PlwInt offset;
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt *ptr;
	PlwRefId value;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	offset = sm->stack[sm->sp - 1];
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	if (offset < 0 || offset >= PlwBlobRef_Size(ref) || !PlwBlobRef_MapPtr(ref)[offset]) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	ptr = PlwBlobRef_Ptr(ref);
	value = PlwRefManager_MakeMutable(sm->refMan, ptr[offset], error);
	if (PlwIsError(error)) {
		return;
	}
	ptr[offset] = value;
	PlwRefManager_IncRefCount(sm->refMan, value, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = value;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

/* get_blob_size(refId Blob)
 */
static void PlwLangOp_GetBlobSize(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt blobSize;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 1];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	blobSize = PlwBlobRef_Size(ref);
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 1] = blobSize;
	sm->stackMap[sm->sp - 1] = PlwFalse;
}

/* get_blob_index_of_item(item ...integer, refId Blob, itemSize integer)
 */
static void PlwLangOp_GetBlobIndexOfItem(PlwStackMachine *sm, PlwError *error) {
	PlwInt itemSize;
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt blobSize;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt indexOf;
	PlwInt baseOffset;
	PlwInt ptrOffset;
	PlwInt i, k;
	PlwBoolean isItemEqual;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	itemSize = sm->stack[sm->sp - 1];
	if (itemSize < 1 && sm->sp < 2 + itemSize) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	blobSize = PlwBlobRef_Size(ref);
	ptr = PlwBlobRef_Ptr(ref);
	mapPtr = PlwBlobRef_MapPtr(ref);
	indexOf = -1;	
	baseOffset = sm->sp - 2 - itemSize;
	ptrOffset = 0;
	for (i = 0; i < blobSize / itemSize; i++) {
		isItemEqual = PlwTrue;
		for (k = 0; k < itemSize; k++) {
			if (mapPtr[k]) {
				isItemEqual = PlwRefManager_CompareRefs(sm->refMan, sm->stack[baseOffset + k], ptr[ptrOffset + k], error);
				if (PlwIsError(error)) {
					return;
				}
			} else {
				isItemEqual = sm->stack[baseOffset + k] == ptr[ptrOffset + k];
			}
			if (!isItemEqual) {
				break;
			}
		}
		if (isItemEqual) {
			indexOf = i;
			break;
		}
		ptrOffset += itemSize;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	for (i = itemSize - 1; i >= 0; i--) {
		if (sm->stackMap[baseOffset + i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[baseOffset + i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	sm->stack[baseOffset] = indexOf;
	sm->stackMap[baseOffset] = PlwFalse;
	sm->sp = baseOffset + 1;
}

/* slice_blob(refId Blob, beginIndex integer, endIndex integer)
 */
static void PlwLangOp_SliceBlob(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwInt beginIndex;
	PlwInt endIndex;
	PlwBlobRef *ref;
	PlwInt blobSize;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt resultBlobSize;
	PlwInt *resultPtr;
	PlwBoolean *resultMapPtr;
	PlwRefId resultRefId;
	PlwInt i;
	if (sm->sp < 3) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 3];
	beginIndex = sm->stack[sm->sp - 2];
	endIndex = sm->stack[sm->sp - 1];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	blobSize = PlwBlobRef_Size(ref);
	ptr = PlwBlobRef_Ptr(ref);
	mapPtr = PlwBlobRef_MapPtr(ref);
	if (beginIndex < 0) {
		beginIndex = 0;
	}
	if (endIndex > blobSize) {
		endIndex = blobSize;
	}
	if (endIndex < beginIndex) {
		endIndex = beginIndex;
	}
	resultBlobSize = endIndex - beginIndex;
	resultPtr = PlwAlloc(resultBlobSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}
	resultMapPtr = PlwAlloc(resultBlobSize * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(resultPtr);
		return;
	}
	memcpy(resultPtr, ptr + beginIndex, resultBlobSize * sizeof(PlwInt));
	memcpy(resultMapPtr, mapPtr + beginIndex, resultBlobSize * sizeof(PlwBoolean));
	for (i = 0; i < resultBlobSize; i++) {
		if (resultMapPtr[i]) {
			PlwRefManager_IncRefCount(sm->refMan, resultPtr[i], error);
			if (PlwIsError(error)) {
				PlwFree(resultMapPtr);
				PlwFree(resultPtr);
				return;
			}
		}
	}
	resultRefId = PlwBlobRef_Make(sm->refMan, resultBlobSize, resultPtr, resultMapPtr, error);
	if (PlwIsError(error)) {
		return;
	}	
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 3] = resultRefId;
	sm->stackMap[sm->sp - 3] = PlwTrue;
	sm->sp -= 2;
}

/* create_blob_repeat_item(item ...integer, itemCount integer, itemSize integer)
 */
static void PlwLangOp_CreateBlobRepeatItem(PlwStackMachine *sm, PlwError *error) {
	PlwInt itemSize;
	PlwInt itemCount;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt i;
	PlwInt blobSize;
	PlwInt baseOffset;
	PlwRefId refId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	itemSize = sm->stack[sm->sp - 1];
	if (itemSize < 0 || sm->sp < 2 + itemSize) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	itemCount = sm->stack[sm->sp - 2];
	if (itemCount < 0) {
		itemCount = 0;
	}
	blobSize = itemCount * itemSize;
	ptr = PlwAlloc(blobSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}	
	mapPtr = PlwAlloc(blobSize * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	baseOffset = sm->sp - 2 - itemSize;
	for (i = 0; i < itemSize; i++) {
		ptr[i] = sm->stack[baseOffset + i];
		mapPtr[i] = sm->stackMap[baseOffset + i];
	}
	for (i = itemSize; i < blobSize; i++) {
		ptr[i] = sm->stack[baseOffset + i % itemSize];
		mapPtr[i] = sm->stackMap[baseOffset + i % itemSize];
		if (mapPtr[i]) {
			PlwRefManager_IncRefCount(sm->refMan, ptr[i], error);
			if (PlwIsError(error)) {
				PlwFree(mapPtr);
				PlwFree(ptr);
				return;
			}
		}
	}
	refId = PlwBlobRef_Make(sm->refMan, blobSize, ptr, mapPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[baseOffset] = refId; 
	sm->stackMap[baseOffset] = PlwTrue;
	sm->sp = baseOffset + 1;
}

/* create_exception_handler(offset integer)
 */
static void PlwLangOp_CreateExceptionHandler(PlwStackMachine *sm, PlwError *error) {
	PlwInt offset;
	PlwRefId refId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	offset = sm->stack[sm->sp - 1];
	refId = PlwExceptionHandlerRef_Make(sm->refMan, sm->codeBlockId, offset, sm->bp, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 1] = refId;	
	sm->stackMap[sm->sp - 1] = PlwTrue;
}

/* raise_exception(errorCode integer)
 */
static void PlwLangOp_RaiseException(PlwStackMachine *sm, PlwError *error) {
	PlwInt errorCode;
	PlwRefId refId;
	PlwExceptionHandlerRef *ref;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	errorCode = sm->stack[sm->sp - 1];
	while (sm->sp > 0) {
		if (sm->stackMap[sm->sp - 1]) {
			refId = sm->stack[sm->sp - 1];
			ref = PlwRefManager_GetRef(sm->refMan, refId, error);
			if (PlwIsError(error)) {
				return;
			}
			if (AsPlwAbstractRef(ref)->tag->name == PlwExceptionHandlerRefTagName) {
				sm->bp = PlwExceptionHandlerRef_Bp(ref);
				PlwStackMachine_SetCodeBlockIdAndIp(sm, PlwExceptionHandlerRef_CodeBlockId(ref), PlwExceptionHandlerRef_Ip(ref), error);
				if (PlwIsError(error)) {
					return;
				}
				PlwRefManager_DecRefCount(sm->refMan, refId, error);
				if (PlwIsError(error)) {
					return;
				}
				sm->stack[sm->sp - 1] = errorCode;
				sm->stackMap[sm->sp - 1] = PlwFalse;
				return;
			}
			PlwRefManager_DecRefCount(sm->refMan, refId, error);
			if (PlwIsError(error)) {
				return;
			}
		}
		sm->sp--;
	}
	PlwStackMachineError_Exception(error, errorCode);
}

/* create_generator(param ...integer, paramCount integer, codeBlockId integer)
 * layout of the created blob is:
 *     0:   codeBlockId
 *     1:   ip
 *     2:   param1
 *     1+n: paramN
 */
static void PlwLangOp_CreateGenerator(PlwStackMachine *sm, PlwError *error) {
	PlwInt codeBlockId;
	PlwInt paramCount;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwRefId refId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	codeBlockId = sm->stack[sm->sp - 1];
	paramCount = sm->stack[sm->sp - 2];
	if (paramCount < 0 || sm->sp < paramCount + 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}					
	ptr = PlwAlloc((paramCount + 2) * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}	
	mapPtr = PlwAlloc((paramCount + 2) * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	ptr[0] = codeBlockId;
	ptr[1] = 0;
	mapPtr[0] = PlwFalse;
	mapPtr[1] = PlwFalse;
	memcpy(ptr + 2, sm->stack + sm->sp - paramCount - 2, paramCount * sizeof(PlwInt));
	memcpy(mapPtr + 2, sm->stackMap + sm->sp - paramCount - 2, paramCount * sizeof(PlwBoolean));
	refId = PlwBlobRef_Make(sm->refMan, paramCount + 2, ptr, mapPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - paramCount - 2] = refId;
	sm->stackMap[sm->sp - paramCount - 2] = PlwTrue;
	sm->sp -= paramCount + 1;
}

/* get_generator_next_item(refId Generator)
 *
 * make the stack like this:
 *      refId			 parameter already on the stack
 *		oldCodeBlockId
 *      oldIp
 *      oldBp
 *   bp param1			 this and below copied from the generator blob
 *      ...
 *      paramN
 *      local1
 *      ...
 *      localN   
 */
static void PlwLangOp_GetGeneratorNextItem(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt blobSize;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt codeBlockId;
	PlwInt ip;
	PlwInt i;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 1];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	blobSize = PlwBlobRef_Size(ref);
	ptr = PlwBlobRef_Ptr(ref);
	mapPtr = PlwBlobRef_MapPtr(ref);
	if (blobSize < 2) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, blobSize + 1, error);
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
	for (i = 0; i < blobSize - 2; i++) {
		sm->stack[sm->sp] = ptr[i + 2];
		sm->stackMap[sm->sp] = mapPtr[i + 2];
		mapPtr[i + 2] = PlwFalse;
		sm->sp++;
	}
	codeBlockId = ptr[0];
	ip = ptr[1];
	if (codeBlockId < 0 || codeBlockId >= sm->codeBlockCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, codeBlockId, ip);
		return;
	}
	if (ip < 0 || ip > sm->codeBlocks[codeBlockId].codeCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, codeBlockId, ip);
		return;
	}
	PlwStackMachine_SetCodeBlockIdAndIp(sm, codeBlockId, ip, error);
}

/* has_generator_ended(refId Generator)
 */
static void PlwLangOp_HasGeneratorEnded(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt *ptr;
	PlwInt codeBlockId;
	PlwInt ended;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 1];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}	
	if (PlwBlobRef_Size(ref) < 2) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	ptr = PlwBlobRef_Ptr(ref);
	codeBlockId = ptr[0];
	if (codeBlockId < 0 || codeBlockId >= sm->codeBlockCount) {
		PlwStackMachineError_CodeAccessOutOfBound(error, codeBlockId, 0);
		return;
	}
	ended = ptr[1] >= sm->codeBlocks[codeBlockId].codeCount ? 1 : 0;
	PlwRefManager_DecRefCount(sm->refMan, sm->stack[sm->sp - 1], error);
	if (PlwIsError(error)) {
		return;
	}	
	sm->stack[sm->sp - 1] = ended;
	sm->stackMap[sm->sp - 1] = PlwFalse;
}

/* yield_generator_item(item ...integer, itemSize)
 * 
 * in a generator, the stack is like this:
 *      refId			 refId of the generator
 *		oldCodeBlockId
 *      oldIp
 *      oldBp
 *   bp param1			 this and below copied from the generator blob
 *      ...
 *      paramN
 *      local1
 *      ...
 *      localN   
 */
static void PlwLangOp_YieldGeneratorItem(PlwStackMachine *sm, PlwError *error) {
	PlwInt itemSize;
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt i;
	PlwInt previousBp;
	PlwInt previousIp;
	PlwInt previousCodeBlockId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	itemSize = sm->stack[sm->sp - 1];
	if (sm->bp < 4 || itemSize < 0 || sm->sp < sm->bp + itemSize + 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->bp - 4];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}	
	PlwBlobRef_Resize(ref, 2 + (sm->sp - sm->bp) - itemSize - 1, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwBlobRef_Ptr(ref);
	mapPtr = PlwBlobRef_MapPtr(ref);
	ptr[1] = sm->ip;
	for (i = 0; i < sm->sp - sm->bp - itemSize - 1; i++) {
		ptr[i + 2] = sm->stack[sm->bp + i];
		mapPtr[i + 2] = sm->stackMap[sm->bp + i];
	}
	previousBp = sm->stack[sm->bp - 1];
	previousIp = sm->stack[sm->bp - 2];
	previousCodeBlockId = sm->stack[sm->bp - 3];
	for (i = 0; i < itemSize; i++) {
		sm->stack[sm->bp - 4 + i] = sm->stack[sm->sp - itemSize - 1 + i];
		sm->stackMap[sm->bp - 4 + i] = sm->stackMap[sm->sp - itemSize - 1 + i];
	}
	sm->sp = sm->bp - 4 + itemSize;
	sm->bp = previousBp;
	PlwStackMachine_SetCodeBlockIdAndIp(sm, previousCodeBlockId, previousIp, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);		
	if (PlwIsError(error)) {
		return;
	}	
}

const PlwNativeFunction PlwLangOps[] = {
	PlwLangOp_CreateString,
	PlwLangOp_ConcatString,
	PlwLangOp_CreateBlob,
	PlwLangOp_ReadBlob,
	PlwLangOp_WriteBlob,
	PlwLangOp_ConcatBlob,
	PlwLangOp_GetBlobMutableOffset,
	PlwLangOp_GetBlobSize,
	PlwLangOp_GetBlobIndexOfItem,
	PlwLangOp_SliceBlob,
	PlwLangOp_CreateBlobRepeatItem,
	PlwLangOp_CreateExceptionHandler,
	PlwLangOp_RaiseException,
	PlwLangOp_CreateGenerator,
	PlwLangOp_GetGeneratorNextItem,
	PlwLangOp_HasGeneratorEnded,
	PlwLangOp_YieldGeneratorItem
};
