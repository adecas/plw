#include "PlwBasicArrayRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwBasicArrayRef {
	PlwAbstractRef super;
	PlwInt size;
	PlwInt *ptr;
};

const char * const PlwBasicArrayRefTagName = "PlwBasicArrayRef";

const PlwAbstractRefTag PlwBasicArrayRefTag = {
	PlwBasicArrayRefTagName,
	PlwBasicArrayRef_SetOffsetValue,
	PlwBasicArrayRef_GetOffsetValue,
	PlwBasicArrayRef_ShallowCopy,
	PlwBasicArrayRef_CompareTo,
	PlwBasicArrayRef_Destroy,
	PlwBasicArrayRef_QuickDestroy
};

PlwRefId PlwBasicArrayRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwError *error) {
	PlwBasicArrayRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwBasicArrayRef), error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->super.tag = &PlwBasicArrayRefTag;
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

PlwInt PlwBasicArrayRef_Size(PlwBasicArrayRef *ref) {
	return ref->size;
}

PlwInt *PlwBasicArrayRef_Ptr(PlwBasicArrayRef *ref) {
	return ref->ptr;
}

void PlwBasicArrayRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error) {
	PlwBasicArrayRef *basicArrayRef = ref;
	if (offset < 0 || offset >= basicArrayRef->size) {
		PlwRefManError_InvalidOffset(error, offset);
		return;
	}
	basicArrayRef->ptr[offset] = value;
}

void PlwBasicArrayRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result) {
	PlwBasicArrayRef *basicArrayRef = ref;
	if (offset < 0 || offset >= basicArrayRef->size) {
		PlwRefManError_InvalidOffset(error, offset);
		return;
	}
	result->value = basicArrayRef->ptr[offset];
	result->isRef = PlwFalse;	
}

PlwRefId PlwBasicArrayRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwBasicArrayRef *basicArrayRef = ref;
	PlwInt *newPtr;
	newPtr = PlwAlloc(basicArrayRef->size * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return -1;
	}
	memcpy(newPtr, basicArrayRef->ptr, basicArrayRef->size * sizeof(PlwInt));
	return PlwBasicArrayRef_Make(refMan, basicArrayRef->size, newPtr, error);
}

PlwBoolean PlwBasicArrayRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwBasicArrayRef *basicArrayRef1 = ref1;
	PlwBasicArrayRef *basicArrayRef2 = ref2;
	if (basicArrayRef1->size != basicArrayRef2->size) {
		return PlwFalse;
	}
	return memcmp(basicArrayRef1->ptr, basicArrayRef2->ptr, basicArrayRef1->size) == 0;
}

void PlwBasicArrayRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwBasicArrayRef *basicArrayRef = ref;
	PlwFree(basicArrayRef->ptr);
	PlwFree(basicArrayRef);
}

void PlwBasicArrayRef_QuickDestroy(void *ref) {
	PlwBasicArrayRef *basicArrayRef = ref;
	PlwFree(basicArrayRef->ptr);
	PlwFree(basicArrayRef);
}

