#include "PlwRecordRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwRecordRef {
	PlwAbstractRef super;
	PlwInt refSize;
	PlwInt totalSize;
	PlwInt *ptr;
};

const char * const PlwRecordRefTagName = "PlwRecordRef";

const PlwAbstractRefTag PlwRecordRefTag = {
	PlwRecordRefTagName,
	PlwRecordRef_SetOffsetValue,
	PlwRecordRef_GetOffsetValue,
	PlwRecordRef_ShallowCopy,
	PlwRecordRef_CompareTo,
	PlwRecordRef_Destroy,
	PlwRecordRef_QuickDestroy
};

PlwRefId PlwRecordRef_Make(PlwRefManager *refMan, PlwInt refSize, PlwInt totalSize, PlwInt *ptr, PlwError *error) {
	PlwRecordRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwRecordRef), error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->super.tag = &PlwRecordRefTag;
	ref->super.refCount = 1;
	ref->refSize = refSize;
	ref->totalSize = totalSize;
	ref->ptr = ptr;
	refId = PlwRefManager_AddRef(refMan, ref, error);
	if (PlwIsError(error)) {
		PlwFree(ref);
		return -1;
	}
	return refId;
}

PlwInt PlwRecordRef_RefSize(PlwRecordRef *ref) {
	return ref->refSize;
}

PlwInt PlwRecordRef_TotalSize(PlwRecordRef *ref) {
	return ref->totalSize;
}

PlwInt *PlwRecordRef_Ptr(PlwRecordRef *ref) {
	return ref->ptr;
}

void PlwRecordRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error) {
	PlwRecordRef *recordRef = ref;
	if (offset < 0 || offset >= recordRef->totalSize) {
		PlwRefManError_InvalidOffset(error, offset);
		return;
	}
	if (offset < recordRef->refSize) {
		PlwRefManager_DecRefCount(refMan, recordRef->ptr[offset], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	recordRef->ptr[offset] = value;
}

void PlwRecordRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result) {
	PlwRecordRef *recordRef = ref;
	if (offset < 0 || offset >= recordRef->totalSize) {
		PlwRefManError_InvalidOffset(error, offset);
		return;
	}
	if (isForMutate == PlwTrue) {
		recordRef->ptr[offset] = PlwRefManager_MakeMutable(refMan, recordRef->ptr[offset], error);
		if (PlwIsError(error)) {
			return;
		}				
	}
	result->value = recordRef->ptr[offset];
	result->isRef = offset < recordRef->refSize;	
}

PlwRefId PlwRecordRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwRecordRef *recordRef = ref;
	PlwInt *newPtr;
	PlwInt i;
	newPtr = PlwAlloc(recordRef->totalSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return -1;
	}
	memcpy(newPtr, recordRef->ptr, recordRef->totalSize * sizeof(PlwInt));
	for (i = 0; i < recordRef->refSize; i++) {
		PlwRefManager_IncRefCount(refMan, newPtr[i], error);
		if (PlwIsError(error)) {
			return -1;
		}
	}
	return PlwRecordRef_Make(refMan, recordRef->refSize, recordRef->totalSize, newPtr, error);
}

PlwBoolean PlwRecordRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwRecordRef *recordRef1 = ref1;
	PlwRecordRef *recordRef2 = ref2;
	PlwInt i;
	PlwBoolean isEqual;
	if (recordRef1->totalSize != recordRef2->totalSize || recordRef1->refSize != recordRef2->refSize) {
		return PlwFalse;
	}
	for (i = 0; i < recordRef1->totalSize; i++) {
		if (i < recordRef1->refSize) {
			isEqual = PlwRefManager_CompareRefs(refMan, recordRef1->ptr[i], recordRef2->ptr[i], error);
			if (PlwIsError(error) || !isEqual) {
				return PlwFalse;
			}
		} else {
			if (recordRef1->ptr[i] != recordRef2->ptr[i]) {
				return PlwFalse;
			}
		}
	}
	return PlwTrue;
}

void PlwRecordRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwRecordRef *recordRef = ref;
	PlwInt i;
	for (i = 0; i < recordRef->refSize; i++) {
		PlwRefManager_DecRefCount(refMan, recordRef->ptr[i], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	PlwFree(recordRef->ptr);
	PlwFree(recordRef);
}

void PlwRecordRef_QuickDestroy(void *ref) {
	PlwRecordRef *recordRef = ref;
	PlwFree(recordRef->ptr);
	PlwFree(recordRef);
}

