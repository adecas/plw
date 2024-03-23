#include "PlwBlobRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwBlobRef {
	PlwAbstractRef super;
	PlwInt size;
	PlwInt capacity;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
};

const char * const PlwBlobRefTagName = "PlwBlobRef";

const PlwAbstractRefTag PlwBlobRefTag = {
	PlwBlobRefTagName,
	PlwBlobRef_ShallowCopy,
	PlwBlobRef_CompareTo,
	PlwBlobRef_Destroy,
	PlwBlobRef_QuickDestroy
};

PlwRefId PlwBlobRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwBoolean *mapPtr, PlwError *error) {
	PlwBlobRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwBlobRef), error);
	if (PlwIsError(error)) {
		PlwFree(mapPtr);
		PlwFree(ptr);
		return -1;
	}
	ref->super.tag = &PlwBlobRefTag;
	ref->super.refCount = 1;
	ref->size = size;
	ref->capacity = size;
	ref->ptr = ptr;
	ref->mapPtr = mapPtr;
	refId = PlwRefManager_AddRef(refMan, ref, error);
	if (PlwIsError(error)) {
		PlwFree(mapPtr);
		PlwFree(ptr);
		PlwFree(ref);
		return -1;
	}
	return refId;
}

void PlwBlobRef_Resize(PlwBlobRef *ref, PlwInt newSize, PlwError *error) {
	PlwInt newCapacity;
	if (newSize > ref->capacity) {
		newCapacity = ref->capacity * 2;
		if (newCapacity < newSize) {
			newCapacity = newSize;
		}
		ref->ptr = PlwRealloc(ref->ptr, newCapacity * sizeof(PlwInt), error);
		if (PlwIsError(error)) {
			return;
		}
		ref->mapPtr = PlwRealloc(ref->mapPtr, newCapacity * sizeof(PlwBoolean), error);
		if (PlwIsError(error)) {
			return;
		}
		ref->capacity = newCapacity;		
		memset(ref->ptr + ref->size, 0, (newSize - ref->size) * sizeof(PlwInt));
		memset(ref->mapPtr + ref->size, 0, (newSize - ref->size) * sizeof(PlwBoolean));
	}
	ref->size = newSize;
}

PlwInt PlwBlobRef_Size(PlwBlobRef *ref) {
	return ref->size;
}


PlwInt *PlwBlobRef_Ptr(PlwBlobRef *ref) {
	return ref->ptr;
}

PlwBoolean *PlwBlobRef_MapPtr(PlwBlobRef *ref) {
	return ref->mapPtr;
}

PlwRefId PlwBlobRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwBlobRef *blobRef = ref;
	PlwInt *newPtr;
	PlwBoolean *newMapPtr;
	PlwInt i;
	PlwRefId refId;
	newPtr = PlwAlloc(blobRef->size * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return -1;
	}
	newMapPtr = PlwAlloc(blobRef->size * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(newPtr);
		return -1;
	}
	memcpy(newPtr, blobRef->ptr, blobRef->size * sizeof(PlwInt));
	memcpy(newMapPtr, blobRef->mapPtr, blobRef->size * sizeof(PlwBoolean));
	for (i = 0; i < blobRef->size; i++) {
		if (newMapPtr[i]) {
			PlwRefManager_IncRefCount(refMan, newPtr[i], error);
			if (PlwIsError(error)) {
				PlwFree(newMapPtr);
				PlwFree(newPtr);
				return -1;
			}
		}
	}
	refId = PlwBlobRef_Make(refMan, blobRef->size, newPtr, newMapPtr, error);
	if (PlwIsError(error)) {
		PlwFree(newMapPtr);
		PlwFree(newPtr);
		return -1;
	}
	return refId;
}

PlwBoolean PlwBlobRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwBlobRef *blobRef1 = ref1;
	PlwBlobRef *blobRef2 = ref2;
	PlwInt i;
	if (blobRef1->size != blobRef2->size) {
		return PlwFalse;
	}
	for (i = 0; i < blobRef1->size; i++) {
		if (blobRef1->mapPtr[i] != blobRef2->mapPtr[i]) {
			return PlwFalse;
		}
	}
	for (i = 0; i < blobRef1->size; i++) {
		if (blobRef1->mapPtr[i]) {
			if (!PlwRefManager_CompareRefs(refMan, blobRef1->ptr[i], blobRef2->ptr[i], error)) {
				return PlwFalse;
			}
			if (PlwIsError(error)) {
				return PlwFalse;
			}
		} else {
			if (blobRef1->ptr[i] != blobRef2->ptr[i]) {
				return PlwFalse;
			}
		}
	}
	return PlwTrue;
}

void PlwBlobRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwBlobRef *blobRef = ref;
	PlwInt i;
	for (i = 0; i < blobRef->size; i++) {
		if (blobRef->mapPtr[i]) {
			PlwRefManager_DecRefCount(refMan, blobRef->ptr[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	PlwFree(blobRef->mapPtr);
	PlwFree(blobRef->ptr);
	PlwFree(blobRef);
}

void PlwBlobRef_QuickDestroy(void *ref) {
	PlwBlobRef *blobRef = ref;
	PlwFree(blobRef->mapPtr);
	PlwFree(blobRef->ptr);
	PlwFree(blobRef);
}

