#include "PlwRefManager.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <stdio.h>
#include <string.h>

const char * const PlwRefManErrorInvalidRefId = "PlwRefManErrorInvalidRefId";

void PlwRefManError_InvalidRefId(PlwError *error, PlwRefId refId) {
	error->code = PlwRefManErrorInvalidRefId;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "RefId %ld is invalid", refId);
}

const char * const PlwRefManErrorInvalidRefType = "PlwRefManErrorInvalidRefType";

void PlwRefManError_InvalidRefType(PlwError *error, PlwRefId refId, const char *refType, const char *expectedRefType) {
	error->code = PlwRefManErrorInvalidRefType;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "RefId %ld is of type %s instead of %s", refId, refType, expectedRefType);
}

const char * const PlwRefManErrorInvalidOperation = "PlwRefManErrorInvalidOperation";

void PlwRefManError_InvalidOperation(PlwError *error, const char *refType, const char *operation) {
	error->code = PlwRefManErrorInvalidOperation;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Invalid operation %s for type %s", operation, refType);
}

struct PlwRefManagerStruct {
	PlwInt refCount;
	PlwInt refCapacity;
	PlwAbstractRef **refs;
	PlwInt freeRefIdCount;
	PlwInt freeRefIdCapacity;
	PlwInt *freeRefIds;
};

PlwRefManager *PlwRefManager_Create(PlwError *error) {
	PlwRefManager *refMan = PlwAlloc(sizeof(PlwRefManager), error);
	if (PlwIsError(error)) {
		return NULL;
	}
	refMan->refCount = 0;
	refMan->refCapacity = 0;
	refMan->refs = NULL;
	refMan->freeRefIdCount = 0;
	refMan->freeRefIdCapacity = 0;
	refMan->freeRefIds = NULL;
	return refMan;
}

void PlwRefManager_Destroy(PlwRefManager *refMan) {
	PlwInt i;
	for (i = 0; i < refMan->refCount; i++) {
		if (refMan->refs[i] != NULL) {
			PlwAbstractRef_QuickDestroy(refMan->refs[i]);
		}
	}
	PlwFree(refMan->refs);
	PlwFree(refMan->freeRefIds);
	PlwFree(refMan);
}

PlwInt PlwRefManager_RefCount(PlwRefManager *refMan) {
	PlwInt i;
	PlwInt count = 0;
	for (i = 0; i < refMan->refCount; i++) {
		if (refMan->refs[i] != NULL) {
			count++;
		}
	}
	return count;
}

PlwRefId PlwRefManager_AddRef(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwRefId refId = -1;
	if (refMan->freeRefIdCount > 0) {
		refId = refMan->freeRefIds[refMan->freeRefIdCount - 1];
		refMan->freeRefIdCount--;
		refMan->refs[refId] = ref;
	} else {
		refId = refMan->refCount;
		PlwGrowArray(1, sizeof(void *), &refMan->refs, &refMan->refCount, &refMan->refCapacity, error);
		if (PlwIsError(error)) {
			return -1;
		}
		refMan->refs[refId] = ref;
	}
	return refId;
}

static void PlwRefManager_CheckRefIdValid(PlwRefManager *refMan, PlwRefId refId, PlwError *error) {
	if (refId < 0 || refId >= refMan->refCount || refMan->refs[refId] == NULL) {
		PlwRefManError_InvalidRefId(error, refId);
	}
}

void *PlwRefManager_GetRef(PlwRefManager *refMan, PlwRefId refId, PlwError *error) {
	PlwRefManager_CheckRefIdValid(refMan, refId, error);
	if (PlwIsError(error)) {
		return NULL;
	}
	return refMan->refs[refId];	
}

void *PlwRefManager_GetRefOfType(PlwRefManager *refMan, PlwRefId refId, const char *refType, PlwError *error) {
	PlwAbstractRef *ref = PlwRefManager_GetRef(refMan, refId, error);
	if (PlwIsError(error)) {
		return NULL;
	}
	if (ref->tag->name != refType) {
		PlwRefManError_InvalidRefType(error, refId, ref->tag->name, refType);
		return NULL;
	}
	return ref;
}


void PlwRefManager_IncRefCount(PlwRefManager *refMan, PlwRefId refId, PlwError *error) {
	PlwAbstractRef *ref;
	PlwRefManager_CheckRefIdValid(refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	ref = refMan->refs[refId];
	ref->refCount++;	
}

void PlwRefManager_AddRefCount(PlwRefManager *refMan, PlwRefId refId, PlwInt count, PlwError *error) {
	PlwAbstractRef *ref;
	PlwRefManager_CheckRefIdValid(refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	ref = refMan->refs[refId];
	ref->refCount += count;	
}

void PlwRefManager_DecRefCount(PlwRefManager *refMan, PlwRefId refId, PlwError *error) {
	PlwAbstractRef *ref;
	PlwRefManager_CheckRefIdValid(refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	ref = refMan->refs[refId];
	ref->refCount--;
	if (ref->refCount == 0) {
		PlwAbstractRef_Destroy(refMan, ref, error);
		if (PlwIsError(error)) {
			return;
		}
		refMan->refs[refId] = NULL;
		PlwGrowArray(1, sizeof(PlwInt), &refMan->freeRefIds, &refMan->freeRefIdCount, &refMan->freeRefIdCapacity, error);
		if (PlwIsError(error)) {
			return;
		}
		refMan->freeRefIds[refMan->freeRefIdCount - 1] = refId;
	}	
}

PlwBoolean PlwRefManager_CompareRefs(PlwRefManager *refMan, PlwRefId refId1, PlwRefId refId2, PlwError *error) {
	PlwAbstractRef *ref1;
	PlwAbstractRef *ref2;	
	PlwRefManager_CheckRefIdValid(refMan, refId1, error);
	if (PlwIsError(error)) {
		return PlwFalse;
	}
	PlwRefManager_CheckRefIdValid(refMan, refId2, error);
	if (PlwIsError(error)) {
		return PlwFalse;
	}
	if (refId1 == refId2) {
		return PlwTrue;
	}
	ref1 = refMan->refs[refId1];
	ref2 = refMan->refs[refId2];
	if (ref1->tag->name != ref2->tag->name) {
		return PlwFalse;
	}
	return PlwAbstractRef_CompareTo(refMan, ref1, ref2, error);
}

PlwRefId PlwRefManager_MakeMutable(PlwRefManager *refMan, PlwRefId refId, PlwError *error) {
	PlwAbstractRef *ref;
	PlwRefId newRefId;
	PlwRefManager_CheckRefIdValid(refMan, refId, error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref = refMan->refs[refId];
	if (ref->refCount == 1) {
		return refId;
	}
	newRefId = PlwAbstractRef_ShallowCopy(refMan, ref, error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->refCount--;
	return newRefId;
}

