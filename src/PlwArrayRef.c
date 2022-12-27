#include "PlwArrayRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwArrayRef {
	PlwAbstractRef super;
	PlwInt size;
	PlwRefId *ptr;
};

const char * const PlwArrayRefTagName = "PlwArrayRef";

const PlwAbstractRefTag PlwArrayRefTag = {
	PlwArrayRefTagName,
	PlwArrayRef_SetOffsetValue,
	PlwArrayRef_GetOffsetValue,
	PlwArrayRef_ShallowCopy,
	PlwArrayRef_CompareTo,
	PlwArrayRef_Destroy,
	PlwArrayRef_QuickDestroy
};

PlwRefId PlwArrayRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwError *error) {
	PlwArrayRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwArrayRef), error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->super.tag = &PlwArrayRefTag;
	ref->super.refCount = 1;
	ref->size = size;
	ref->ptr = ptr;
	refId = PlwRefManager_AddRef(refMan, ref, error);
	if (PlwIsError(error)) {
		PlwFree(ref);
		return -1;
	}
	return refId;
}

PlwInt PlwArrayRef_Size(PlwArrayRef *ref) {
	return ref->size;
}

PlwRefId *PlwArrayRef_Ptr(PlwArrayRef *ref) {
	return ref->ptr;
}

void PlwArrayRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error) {
	PlwArrayRef *arrayRef = ref;
	if (offset < 0 || offset >= arrayRef->size) {
		PlwRefManError_InvalidOffset(error, offset);
		return;
	}
	PlwRefManager_DecRefCount(refMan, arrayRef->ptr[offset], error);
	if (PlwIsError(error)) {
		return;
	}
	arrayRef->ptr[offset] = value;
}

void PlwArrayRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result) {
	PlwArrayRef *arrayRef = ref;
	if (offset < 0 || offset >= arrayRef->size) {
		PlwRefManError_InvalidOffset(error, offset);
		return;
	}
	if (isForMutate == PlwTrue) {
		arrayRef->ptr[offset] = PlwRefManager_MakeMutable(refMan, arrayRef->ptr[offset], error);
		if (PlwIsError(error)) {
			return;
		}				
	}
	result->value = arrayRef->ptr[offset];
	result->isRef = PlwTrue;	
}

PlwRefId PlwArrayRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwArrayRef *arrayRef = ref;
	PlwInt *newPtr;
	PlwInt i;
	newPtr = PlwAlloc(arrayRef->size * sizeof(PlwRefId), error);
	if (PlwIsError(error)) {
		return -1;
	}
	memcpy(newPtr, arrayRef->ptr, arrayRef->size * sizeof(PlwRefId));
	for (i = 0; i < arrayRef->size; i++) {
		PlwRefManager_IncRefCount(refMan, newPtr[i], error);
		if (PlwIsError(error)) {
			return -1;
		}
	}
	return PlwArrayRef_Make(refMan, arrayRef->size, newPtr, error);
}

PlwBoolean PlwArrayRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwArrayRef *arrayRef1 = ref1;
	PlwArrayRef *arrayRef2 = ref2;
	PlwInt i;
	PlwBoolean isEqual;
	if (arrayRef1->size != arrayRef2->size) {
		return PlwFalse;
	}
	for (i = 0; i < arrayRef1->size; i++) {
		isEqual = PlwRefManager_CompareRefs(refMan, arrayRef1->ptr[i], arrayRef2->ptr[i], error);
		if (PlwIsError(error) || !isEqual) {
			return PlwFalse;
		}
	}
	return PlwTrue;
}

void PlwArrayRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwArrayRef *arrayRef = ref;
	PlwInt i;
	for (i = 0; i < arrayRef->size; i++) {
		PlwRefManager_DecRefCount(refMan, arrayRef->ptr[i], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	PlwFree(arrayRef->ptr);
	PlwFree(arrayRef);
}

void PlwArrayRef_QuickDestroy(void *ref) {
	PlwArrayRef *arrayRef = ref;
	PlwFree(arrayRef->ptr);
	PlwFree(arrayRef);
}

