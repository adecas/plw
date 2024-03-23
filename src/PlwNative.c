#include "PlwNative.h"
#include "PlwAbstractRef.h"
#include "PlwStringRef.h"
#include "PlwBlobRef.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <math.h>

const char * const PlwNativeErrorNotImplemented = "PlwNativeErrorNotImplemented";

void PlwNativeError_NotImplemented(PlwError *error, const char *funcName) {
	error->code = PlwNativeErrorNotImplemented;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Native function %s is not implemented", funcName);
}

static void PlwNativeFunc_GetChar_Char(PlwStackMachine *sm, PlwError *error) {
	sm->stack[sm->sp - 1] = getchar();
	sm->stackMap[sm->sp - 1] = PlwFalse;	
}

static void PlwNativeProc_Write_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	printf("%s", PlwStringRef_Ptr(ref));
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->sp -= 2;
}

static void PlwNativeProc_Print_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	printf("%s\n", PlwStringRef_Ptr(ref));
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->sp -= 2;
}

static void PlwNativeFunc_Print_Text(PlwStackMachine *sm, PlwError *error) {
	PlwNativeError_NotImplemented(error, "PlwNativeFunc_Print_Text");
}

static void PlwNativeFunc_Text_Integer(PlwStackMachine *sm, PlwError *error) {
	char buffer[128];
	char *ptr;
	PlwRefId refId;
	snprintf(buffer, 128, "%ld", sm->stack[sm->sp - 2]);
	ptr = PlwStrDup(buffer, error);
	if (PlwIsError(error)) {
		return;
	}
	refId = PlwStringRef_Make(sm->refMan, ptr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = refId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Text_Real(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	char buffer[128];
	char *ptr;
	PlwRefId refId;
	w.i = sm->stack[sm->sp - 2];
	snprintf(buffer, 128, "%f", w.f);
	ptr = PlwStrDup(buffer, error);
	if (PlwIsError(error)) {
		return;
	}
	refId = PlwStringRef_Make(sm->refMan, ptr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = refId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Text_Char(PlwStackMachine *sm, PlwError *error) {
	char buffer[2];
	char *ptr;
	PlwRefId refId;
	buffer[0] = sm->stack[sm->sp - 2];
	buffer[1] = '\0';
	ptr = PlwStrDup(buffer, error);
	if (PlwIsError(error)) {
		return;
	}
	refId = PlwStringRef_Make(sm->refMan, ptr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = refId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Text_Boolean(PlwStackMachine *sm, PlwError *error) {
	char *ptr;
	PlwRefId refId;
	ptr = PlwStrDup(sm->stack[sm->sp - 2] ? "true" : "false", error);
	if (PlwIsError(error)) {
		return;
	}
	refId = PlwStringRef_Make(sm->refMan, ptr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = refId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Length_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	PlwInt length;
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	length = strlen(PlwStringRef_Ptr(ref));
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = length;
	sm->stackMap[sm->sp - 2] = PlwFalse;
	sm->sp--;
}

static void PlwNativeFunc_Text_ArrayOfChar(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt size;
	PlwInt *ptr;
	PlwInt i;
	char *resultPtr;
	PlwRefId resultRefId;
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	size = PlwBlobRef_Size(ref);
	ptr = PlwBlobRef_Ptr(ref);
	resultPtr = PlwAlloc(size + 1, error);
	if (PlwIsError(error)) {
		return;
	}
	for (i = 0; i < size; i++) {
		resultPtr[i] = ptr[i];
	}
	resultPtr[size] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = resultRefId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Text_ArrayOfInteger(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt size;
	PlwInt *ptr;
	char *resultPtr = NULL;
	PlwInt resultPtrLen = 0;
	PlwInt resultPtrCapacity = 0;
	PlwRefId resultRefId;
	PlwInt i;
	char buffer[128];
	PlwInt itemLen;
	
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	size = PlwBlobRef_Size(ref);
	ptr = PlwBlobRef_Ptr(ref);
	PlwGrowArray(1, 1, &resultPtr, &resultPtrLen, &resultPtrCapacity, error);
	if (PlwIsError(error)) {
		return;
	}
	resultPtr[0] = '[';
	for (i = 0; i < size; i++) {
		itemLen = snprintf(buffer, 128, "%ld", ptr[i]);
		if (itemLen > 0) {
			PlwGrowArray(itemLen + (i > 0 ? 1 : 0), 1, &resultPtr, &resultPtrLen, &resultPtrCapacity, error);
			if (PlwIsError(error)) {
				PlwFree(resultPtr);
				return;
			}
			if (i > 0) {
				resultPtr[resultPtrLen - itemLen - 1] = ',';
			}
			memcpy(&resultPtr[resultPtrLen - itemLen], buffer, itemLen);
		}
	}
	resultPtr = PlwRealloc(resultPtr, resultPtrLen + 2, error);
	if (PlwIsError(error)) {
		PlwFree(resultPtr);
		return;
	}
	resultPtr[resultPtrLen] = ']';
	resultPtr[resultPtrLen + 1] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = resultRefId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Text_ArrayOfBoolean(PlwStackMachine *sm, PlwError *error) {
	PlwNativeFunc_Text_ArrayOfInteger(sm, error);
}

static void PlwNativeFunc_Text_ArrayOfText(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwBlobRef *ref;
	PlwInt size;
	PlwInt *ptr;
	char *resultPtr = NULL;
	PlwInt resultPtrLen = 0;
	PlwInt resultPtrCapacity = 0;
	PlwRefId resultRefId;
	PlwInt i;
	PlwStringRef *itemRef;
	char *itemPtr;
	PlwInt itemLen;
	
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwBlobRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	size = PlwBlobRef_Size(ref);
	ptr = PlwBlobRef_Ptr(ref);
	PlwGrowArray(1, 1, &resultPtr, &resultPtrLen, &resultPtrCapacity, error);
	if (PlwIsError(error)) {
		return;
	}
	resultPtr[0] = '[';
	for (i = 0; i < size; i++) {
		itemRef = PlwRefManager_GetRefOfType(sm->refMan, ptr[i], PlwStringRefTagName, error);
		if (PlwIsError(error)) {
			PlwFree(resultPtr);
			return;
		}
		itemPtr = PlwStringRef_Ptr(itemRef);
		itemLen = strlen(itemPtr);
		PlwGrowArray(itemLen + (i > 0 ? 2 : 0), 1, &resultPtr, &resultPtrLen, &resultPtrCapacity, error);
		if (PlwIsError(error)) {
			PlwFree(resultPtr);
			return;
		}
		if (i > 0) {
			resultPtr[resultPtrLen - itemLen - 2] = ',';
			resultPtr[resultPtrLen - itemLen - 1] = ' ';
		}
		memcpy(&resultPtr[resultPtrLen - itemLen], itemPtr, itemLen);
	}
	resultPtr = PlwRealloc(resultPtr, resultPtrLen + 2, error);
	if (PlwIsError(error)) {
		PlwFree(resultPtr);
		return;
	}
	resultPtr[resultPtrLen] = ']';
	resultPtr[resultPtrLen + 1] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = resultRefId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwNativeFunc_Concat_Text_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId1;
	PlwStringRef *ref1;
	PlwRefId refId2;
	PlwStringRef *ref2;
	char *ptr1;
	char *ptr2;
	size_t len1;
	size_t len2;
	char *ptr;
	PlwRefId resultRefId;

	refId1 = sm->stack[sm->sp - 3];
	ref1 = PlwRefManager_GetRefOfType(sm->refMan, refId1, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	refId2 = sm->stack[sm->sp - 2];
	ref2 = PlwRefManager_GetRefOfType(sm->refMan, refId2, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr1 = PlwStringRef_Ptr(ref1);
	ptr2 = PlwStringRef_Ptr(ref2);
	len1 = strlen(ptr1);
	len2 = strlen(ptr2);
	if (AsPlwAbstractRef(ref1)->refCount == 1) {
		ptr1 = PlwRealloc(ptr1, len1 + len2 + 1, error);
		if (PlwIsError(error)) {
			return;
		}
		memcpy(ptr1 + len1, ptr2, len2 + 1);
		PlwStringRef_SetPtr(ref1, ptr1);
		PlwRefManager_DecRefCount(sm->refMan, refId2, error);
		if (PlwIsError(error)) {
			return;
		}
	} else {
		ptr = PlwAlloc(len1 + len2 + 1, error);
		if (PlwIsError(error)) {
			return;
		}
		memcpy(ptr, ptr1, len1);
		memcpy(ptr + len1, ptr2, len2 + 1);
		resultRefId = PlwStringRef_Make(sm->refMan, ptr, error);
		if (PlwIsError(error)) {
			return;
		}
		PlwRefManager_DecRefCount(sm->refMan, refId1, error);
		if (PlwIsError(error)) {
			return;
		}
		PlwRefManager_DecRefCount(sm->refMan, refId2, error);
		if (PlwIsError(error)) {
			return;
		}
		sm->stack[sm->sp - 3] = resultRefId;
		sm->stackMap[sm->sp - 3] = PlwTrue;
	}
	sm->sp -= 2;

}

static void PlwNativeFunc_Subtext_Text_Integer_Integer(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	char *ptr;
	PlwInt len;
	PlwInt index;
	PlwInt sublen;
	char *resultPtr;
	PlwRefId resultRefId;

	refId = sm->stack[sm->sp - 4];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStringRef_Ptr(ref);
	len = strlen(ptr);
	index = sm->stack[sm->sp - 3];
	sublen = sm->stack[sm->sp - 2];
	if (index < 0 || sublen < 0) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	if (index + sublen > len) {
		PlwStackMachineError_RefAccessOutOfBound(error);
		return;
	}
	resultPtr = PlwAlloc(sublen + 1, error);
	if (PlwIsError(error)) {
		return;
	}
	memcpy(resultPtr, ptr + index, sublen);
	resultPtr[sublen] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 4] = resultRefId;
	sm->stackMap[sm->sp - 4] = PlwTrue;
	sm->sp -= 3;
}

static void PlwNativeFunc_Subtext_Text_Integer(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	char *ptr;
	PlwInt len;
	PlwInt index;
	PlwInt sublen;
	char *resultPtr;
	PlwRefId resultRefId;
	
	refId = sm->stack[sm->sp - 3];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStringRef_Ptr(ref);
	len = strlen(ptr);
	index = sm->stack[sm->sp - 2];
	if (index < 0) {
		index = 0;
	}
	sublen = len - index;
	if (sublen < 0) {
		sublen = 0;
	}
	resultPtr = PlwAlloc(sublen + 1, error);
	if (PlwIsError(error)) {
		return;
	}
	memcpy(resultPtr, ptr + index, sublen);
	resultPtr[sublen] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultPtr, error);
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

static void PlwNativeFunc_Trim_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	char *ptr;
	char *endPtr;
	PlwInt resultLen;
	char *resultPtr;
	PlwRefId resultRefId;
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStringRef_Ptr(ref);
	endPtr = ptr + strlen(ptr) - 1;
	while (*ptr == ' ' || *ptr == '\t' || *ptr == '\r' || *ptr == '\n') {
		ptr++;
	}
	while (endPtr >= ptr && (*endPtr == ' ' || *endPtr == '\t' || *endPtr == '\r' || *endPtr == '\n')) {
		endPtr--;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	resultLen = endPtr - ptr + 1;
	resultPtr = PlwAlloc(resultLen + 1, error);
	if (PlwIsError(error)) {
		return;
	}
	memcpy(resultPtr, ptr, resultLen);
	resultPtr[resultLen] = '\0';
	resultRefId = PlwStringRef_Make(sm->refMan, resultPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = resultRefId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp -= 1;
}

static void PlwNativeFunc_CharCode_Text_Integer(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwInt index;
	PlwStringRef *ref;
	char *ptr;
	PlwInt charCode;
	
	refId = sm->stack[sm->sp - 3];
	index = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStringRef_Ptr(ref);
	charCode = ptr[index];
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 3] = charCode;
	sm->stackMap[sm->sp - 3] = PlwFalse;
	sm->sp -= 2;
}

static void PlwNativeFunc_CharAt_Text_Integer(PlwStackMachine *sm, PlwError *error) {
	PlwNativeFunc_CharCode_Text_Integer(sm, error);
}

static void PlwNativeFunc_IndexOf_Char_Text(PlwStackMachine *sm, PlwError *error) {
	PlwInt charCode;
	PlwRefId refId;
	PlwStringRef *ref;
	char *ptr;
	char *p;
	PlwInt indexOf;
	charCode = sm->stack[sm->sp - 3];
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStringRef_Ptr(ref);
	p = strchr(ptr, charCode);
	indexOf = p == NULL ? -1 : p - ptr;
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 3] = indexOf;
	sm->stackMap[sm->sp - 3] = PlwFalse;
	sm->sp -= 2;
}

static void PlwNativeFunc_IndexOf_Text_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId1;
	PlwStringRef *ref1;
	char *ptr1;
	PlwRefId refId2;
	PlwStringRef *ref2;
	char *ptr2;
	char *p;
	PlwInt indexOf;
	refId1 = sm->stack[sm->sp - 3];
	ref1 = PlwRefManager_GetRefOfType(sm->refMan, refId1, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	refId2 = sm->stack[sm->sp - 2];
	ref2 = PlwRefManager_GetRefOfType(sm->refMan, refId2, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr1 = PlwStringRef_Ptr(ref1); 
	ptr2 = PlwStringRef_Ptr(ref2);
	p = strstr(ptr2, ptr1);
	indexOf = p == NULL ? -1 : p - ptr2;
	PlwRefManager_DecRefCount(sm->refMan, refId2, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 3] = indexOf;
	sm->stackMap[sm->sp - 3] = PlwFalse;
	sm->sp -= 2;
}

static void PlwNativeFunc_Split_Text_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId1;
	PlwStringRef *ref1;
	char *ptr1;
	PlwRefId refId2;
	PlwStringRef *ref2;
	char *ptr2;
	size_t ptr2len;
	PlwRefId *resultPtr = NULL;
	PlwBoolean *resultMapPtr;
	PlwInt i;
	PlwInt resultSize = 0;
	PlwInt resultCapacity = 0;
	PlwRefId resultRefId;
	char *nextPos;
	char *lastPos;
	char *itemPtr;
	PlwRefId itemRefId;
	PlwBoolean again;
	/*
	   Get the parameters
	*/
	refId1 = sm->stack[sm->sp - 3];
	ref1 = PlwRefManager_GetRefOfType(sm->refMan, refId1, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	refId2 = sm->stack[sm->sp - 2];
	ref2 = PlwRefManager_GetRefOfType(sm->refMan, refId2, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr1 = PlwStringRef_Ptr(ref1); 
	ptr2 = PlwStringRef_Ptr(ref2);
	ptr2len = strlen(ptr2);
	/*
	   Split the string
	*/
	lastPos = ptr1;
	again = PlwTrue;
	do {
		nextPos = strstr(lastPos, ptr2);
		if (nextPos == NULL) {
			nextPos = ptr1 + strlen(ptr1);
			again = PlwFalse;
		}
		itemPtr = PlwStrnDup(lastPos, nextPos - lastPos, error);
		if (PlwIsError(error)) {
			PlwFree(resultPtr);
			return;
		}
		itemRefId = PlwStringRef_Make(sm->refMan, itemPtr, error);
		if (PlwIsError(error)) {
			PlwFree(resultPtr);
			return;
		}
		if (!again) {
			resultSize++;
			resultPtr = PlwRealloc(resultPtr, resultSize * sizeof(PlwRefId), error);
		} else {
			PlwGrowArray(1, sizeof(PlwRefId), &resultPtr, &resultSize, &resultCapacity, error);
		}
		if (PlwIsError(error)) {
			PlwFree(resultPtr);
			return;
		}
		resultPtr[resultSize - 1] = itemRefId;
		lastPos = nextPos + ptr2len;
	} while (again);
	/*
	   Create the result Array
	*/
	resultMapPtr = PlwAlloc(resultSize * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(resultPtr);
		return;
	}
	for (i = 0; i < resultSize; i++) {
		resultMapPtr[i] = PlwTrue;
	}
	resultRefId = PlwBlobRef_Make(sm->refMan, resultSize, resultPtr, resultMapPtr, error);
	if (PlwIsError(error)) {
		return;
	}
	/*
	   Return the result
	*/
	PlwRefManager_DecRefCount(sm->refMan, refId2, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, refId1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 3] = resultRefId;
	sm->stackMap[sm->sp - 3] = PlwTrue;
	sm->sp -= 2;
}

static void PlwNativeFunc_Abs_Integer(PlwStackMachine *sm, PlwError *error) {
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] < 0 ? -sm->stack[sm->sp - 2] : sm->stack[sm->sp - 2];
	sm->stackMap[sm->sp - 2] = PlwFalse;
	sm->sp--;
}

static void PlwNativeFunc_Real_Integer(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	w.i = sm->stack[sm->sp - 2];
	w.f = w.i;
	sm->stack[sm->sp - 2] = w.i;
	sm->sp--;
}

static void PlwNativeFunc_Sqrt_Real(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	w.i = sm->stack[sm->sp - 2];
	w.f = sqrt(w.f);
	sm->stack[sm->sp - 2] = w.i;
	sm->sp--;
}

static void PlwNativeFunc_Log_Real(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	w.i = sm->stack[sm->sp - 2];
	w.f = log(w.f);
	sm->stack[sm->sp - 2] = w.i;
	sm->sp--;
}

static void PlwNativeFunc_Now(PlwStackMachine *sm, PlwError *error) {
	struct timespec tp;
	clock_gettime(CLOCK_REALTIME_COARSE, &tp);
	sm->stack[sm->sp - 1] = tp.tv_sec * 1000 + (tp.tv_nsec / 1000 / 1000);
	sm->stackMap[sm->sp - 1] = PlwFalse;
}

static void PlwNativeFunc_Random_Integer_Integer(PlwStackMachine *sm, PlwError *error) {
	PlwInt lowBound;
	PlwInt highBound;
	PlwInt result;
	lowBound = sm->stack[sm->sp - 3];
	highBound = sm->stack[sm->sp - 2];
	result = random() % (highBound - lowBound + 1) + lowBound;
	sm->stack[sm->sp - 3] = result;
	sm->stackMap[sm->sp - 3] = PlwFalse;
	sm->sp -= 2;
}

static void PlwNativeFunc_Integer_Text(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwStringRef *ref;
	char *ptr;
	PlwInt result;
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwStringRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStringRef_Ptr(ref);
	result = atol(ptr);
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = result;
	sm->stackMap[sm->sp - 2] = PlwFalse;
	sm->sp--;
}

static void PlwNativeFunc_Ceil_Real(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	w.i = sm->stack[sm->sp - 2];
	sm->stack[sm->sp - 2] = ceil(w.f);
	sm->sp--;
}

static void PlwNativeFunc_Floor_Real(PlwStackMachine *sm, PlwError *error) {
	PlwWord w;
	w.i = sm->stack[sm->sp - 2];
	sm->stack[sm->sp - 2] = floor(w.f);
	sm->sp--;
}


const PlwNativeFunction PlwNativeFunctions[] = {
	PlwNativeFunc_GetChar_Char,
	PlwNativeProc_Write_Text,
	PlwNativeProc_Print_Text,
	PlwNativeFunc_Print_Text,
	PlwNativeFunc_Text_Integer,
	PlwNativeFunc_Text_Real,
	PlwNativeFunc_Text_Char,
	PlwNativeFunc_Text_Boolean,
	PlwNativeFunc_Length_Text,
	PlwNativeFunc_Text_ArrayOfChar,
	PlwNativeFunc_Text_ArrayOfInteger,
	PlwNativeFunc_Text_ArrayOfBoolean,
	PlwNativeFunc_Text_ArrayOfText,
	PlwNativeFunc_Concat_Text_Text,
	PlwNativeFunc_Subtext_Text_Integer_Integer,
	PlwNativeFunc_Subtext_Text_Integer,
	PlwNativeFunc_Trim_Text,
	PlwNativeFunc_CharCode_Text_Integer,
	PlwNativeFunc_CharAt_Text_Integer,
	PlwNativeFunc_IndexOf_Char_Text,
	PlwNativeFunc_IndexOf_Text_Text,
	PlwNativeFunc_Split_Text_Text,
	PlwNativeFunc_Abs_Integer,
	PlwNativeFunc_Real_Integer,
	PlwNativeFunc_Sqrt_Real,
	PlwNativeFunc_Log_Real,
	PlwNativeFunc_Now,
	PlwNativeFunc_Random_Integer_Integer,
	PlwNativeFunc_Integer_Text,
	PlwNativeFunc_Ceil_Real,
	PlwNativeFunc_Floor_Real
};

const PlwInt PlwNativeFunctionCount = sizeof(PlwNativeFunctions) / sizeof(PlwNativeFunction);

