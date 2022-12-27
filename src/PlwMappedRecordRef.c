#include "PlwMappedRecordRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwMappedRecordRef {
	PlwAbstractRef super;
	PlwInt size;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
};

const char * const PlwMappedRecordRefTagName = "PlwMappedRecordRef";

const PlwAbstractRefTag PlwMappedRecordRefTag = {
	PlwMappedRecordRefTagName,
	PlwMappedRecordRef_SetOffsetValue,
	PlwMappedRecordRef_GetOffsetValue,
	PlwMappedRecordRef_ShallowCopy,
	PlwMappedRecordRef_CompareTo,
	PlwMappedRecordRef_Destroy,
	PlwMappedRecordRef_QuickDestroy
};

PlwRefId PlwMappedRecordRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwBoolean *mapPtr, PlwError *error) {
	PlwMappedRecordRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwMappedRecordRef), error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->super.tag = &PlwMappedRecordRefTag;
	ref->super.refCount = 1;
	ref->size = size;
	ref->ptr = ptr;
	ref->mapPtr = mapPtr;
	refId = PlwRefManager_AddRef(refMan, ref, error);
	if (PlwIsError(error)) {
		PlwFree(ref);
		return -1;
	}
	return refId;
}

void PlwMappedRecordRef_Resize(PlwMappedRecordRef *ref, PlwInt newSize, PlwError *error) {
	if (newSize > ref->size) {
		ref->ptr = PlwRealloc(ref->ptr, newSize * sizeof(PlwInt), error);
		if (PlwIsError(error)) {
			return;
		}
		ref->mapPtr = PlwRealloc(ref->mapPtr, newSize * sizeof(PlwBoolean), error);
		if (PlwIsError(error)) {
			return;
		}		
		memset(ref->ptr + ref->size, 0, (newSize - ref->size) * sizeof(PlwInt));
		memset(ref->mapPtr + ref->size, 0, (newSize - ref->size) * sizeof(PlwBoolean));
	}
	ref->size = newSize;
}

PlwInt PlwMappedRecordRef_Size(PlwMappedRecordRef *ref) {
	return ref->size;
}


PlwInt *PlwMappedRecordRef_Ptr(PlwMappedRecordRef *ref) {
	return ref->ptr;
}

PlwBoolean *PlwMappedRecordRef_MapPtr(PlwMappedRecordRef *ref) {
	return ref->mapPtr;
}

void PlwMappedRecordRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwMappedRecordRefTagName, "SetOffsetValue");
}

void PlwMappedRecordRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result) {
	PlwRefManError_InvalidOperation(error, PlwMappedRecordRefTagName, "GetOffsetValue");

}

PlwRefId PlwMappedRecordRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwMappedRecordRefTagName, "ShallowCopy");
	return -1;
}

PlwBoolean PlwMappedRecordRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwMappedRecordRefTagName, "CompareTo");
	return PlwFalse;
}

void PlwMappedRecordRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwMappedRecordRef *mappedRef = ref;
	PlwInt i;
	for (i = 0; i < mappedRef->size; i++) {
		if (mappedRef->mapPtr[i]) {
			PlwRefManager_DecRefCount(refMan, mappedRef->ptr[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	PlwFree(mappedRef->mapPtr);
	PlwFree(mappedRef->ptr);
	PlwFree(mappedRef);
}

void PlwMappedRecordRef_QuickDestroy(void *ref) {
	PlwMappedRecordRef *mappedRef = ref;
	PlwFree(mappedRef->mapPtr);
	PlwFree(mappedRef->ptr);
	PlwFree(mappedRef);
}

