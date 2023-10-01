#include "PlwExceptionHandlerRef.h"
#include "PlwAbstractRef.h"
#include "PlwCommon.h"
#include <string.h>

struct PlwExceptionHandlerRef {
	PlwAbstractRef super;
	PlwInt codeBlockId;
	PlwInt ip;
	PlwInt bp;
};

const char * const PlwExceptionHandlerRefTagName = "PlwExceptionHandlerRef";

const PlwAbstractRefTag PlwExceptionHandlerRefTag = {
	PlwExceptionHandlerRefTagName,
	PlwExceptionHandlerRef_ShallowCopy,
	PlwExceptionHandlerRef_CompareTo,
	PlwExceptionHandlerRef_Destroy,
	PlwExceptionHandlerRef_QuickDestroy
};

PlwRefId PlwExceptionHandlerRef_Make(PlwRefManager *refMan, PlwInt codeBlockId, PlwInt ip, PlwInt bp, PlwError *error) {
	PlwExceptionHandlerRef *ref;
	PlwRefId refId;
	ref = PlwAlloc(sizeof(PlwExceptionHandlerRef), error);
	if (PlwIsError(error)) {
		return -1;
	}
	ref->super.tag = &PlwExceptionHandlerRefTag;
	ref->super.refCount = 1;
	ref->codeBlockId = codeBlockId;
	ref->ip = ip;
	ref->bp = bp;
	refId = PlwRefManager_AddRef(refMan, ref, error);
	if (PlwIsError(error)) {
		PlwFree(ref);
		return -1;
	}
	return refId;
}

PlwInt PlwExceptionHandlerRef_CodeBlockId(PlwExceptionHandlerRef *ref) {
	return ref->codeBlockId;
}

PlwInt PlwExceptionHandlerRef_Ip(PlwExceptionHandlerRef *ref) {
	return ref->ip;
}

PlwInt PlwExceptionHandlerRef_Bp(PlwExceptionHandlerRef *ref) {
	return ref->bp;
}

PlwRefId PlwExceptionHandlerRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwExceptionHandlerRefTagName, "ShallowCopy");
	return -1;
}

PlwBoolean PlwExceptionHandlerRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwRefManError_InvalidOperation(error, PlwExceptionHandlerRefTagName, "CompareRef");
	return -1;
}

void PlwExceptionHandlerRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwFree(ref);
}

void PlwExceptionHandlerRef_QuickDestroy(void *ref) {
	PlwFree(ref);
}

