#include "PlwStringRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwStringRef {
	PlwAbstractRef super;
	char *ptr;
};

const char * const PlwStringRefTagName = "PlwStringRef";

const PlwAbstractRefTag PlwStringRefTag = {
	PlwStringRefTagName,
	PlwStringRef_SetOffsetValue,
	PlwStringRef_GetOffsetValue,
	PlwStringRef_ShallowCopy,
	PlwStringRef_CompareTo,
	PlwStringRef_Destroy,
	PlwStringRef_QuickDestroy
};

PlwRefId PlwStringRef_Make(PlwRefManager *refMan, char *ptr, PlwError *error) {
	PlwStringRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwStringRef), error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->super.tag = &PlwStringRefTag;
	ref->super.refCount = 1;
	ref->ptr = ptr;
	refId = PlwRefManager_AddRef(refMan, ref, error);
	if (PlwIsError(error)) {
		PlwFree(ref);
		return -1;
	}
	return refId;
}

char *PlwStringRef_Ptr(PlwStringRef *ref) {
	return ref->ptr;
}

void PlwStringRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwStringRefTagName, "SetOffsetValue");
}

void PlwStringRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result) {
	PlwRefManError_InvalidOperation(error, PlwStringRefTagName, "GetOffsetValue");
}

PlwRefId PlwStringRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwStringRefTagName, "ShallowCopy");
	return -1;
}

PlwBoolean PlwStringRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwStringRef *stringRef1 = ref1;
	PlwStringRef *stringRef2 = ref2;
	return strcmp(stringRef1->ptr, stringRef2->ptr) == 0;
}

void PlwStringRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwStringRef *stringRef = ref;
	PlwFree(stringRef->ptr);
	PlwFree(stringRef);
}

void PlwStringRef_QuickDestroy(void *ref) {
	PlwStringRef *stringRef = ref;
	PlwFree(stringRef->ptr);
	PlwFree(stringRef);
}

